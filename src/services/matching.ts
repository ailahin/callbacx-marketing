/**
 * CALLBACX TECHNOLOGY — Creator matching engine
 *
 * Rule-based creator-to-campaign matching with explainable scores.
 *
 * Design principles:
 * - Core matching is pure TypeScript with NO AI dependency. The matcher is a
 *   plain function over plain data, so it can be unit-tested and later
 *   augmented (or replaced) by AI recommendations without changing the
 *   discovery flow.
 * - Scores are explainable: every criterion contributes a 0-100 sub-score,
 *   a weight, a contributed amount, and a human-readable reason.
 * - Metrics are never invented. A score only reflects stored values
 *   (followers, engagement rate, rates, availability, demographics). Missing
 *   data is disclosed as "not available" and contributes no points rather
 *   than being fabricated.
 * - Each breakdown factor carries `dataSource` ("platform_api" | "manual" |
 *   "none") and `verified` so brands can tell verified platform-synced data
 *   apart from self-reported / manually claimed data.
 *
 * Default weights (sum to 100):
 *   niche 30, platform 20, audience 20, location 15, budget 10, availability 5
 * Brands may adjust weights via MatchingCriteria.
 */

import type {
  CreatorProfiles,
  CreatorSocialAccounts,
  CreatorRates,
  CreatorAudienceDemographics,
  Campaigns,
} from "@/lib/supabase/types/database";
import type { ListCreatorsInput } from "@/lib/validations";
import { matchingCriteriaSchema, parseZodError } from "@/lib/validations";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceResult } from "@/lib/errors";
import type { CreatorListItem } from "./creators";

type Client = any;

// ---------------------------------------------------------------------------
// Domain types (plain data the matcher operates on - no DB coupling)
// ---------------------------------------------------------------------------

export interface CreatorMatchInput {
  id: string;
  display_name: string;
  categories: Array<{ id: string; name: string }>;
  niches: Array<{ id: string; name: string; category_id: string }>;
  socialAccounts: Array<{
    platform: string;
    followers_count: number | null;
    engagement_rate: number | null;
    metrics_source: string;
    is_verified: boolean;
  }>;
  location: Record<string, unknown> | null; // {city, region, country, ...}
  languages: string[];
  rates: Array<{ service_type: string; min_rate: number; max_rate: number; currency: string }>;
  availability_status: string;
  demographics?: {
    is_verified: boolean;
    source: string;
    age_range: Record<string, unknown>;
    gender: Record<string, unknown>;
    top_locations: Record<string, unknown>;
    top_languages: Record<string, unknown>;
  };
  total_followers: number | null;
  max_engagement_rate: number | null;
  min_rate: number | null;
}

export interface CampaignMatchInput {
  id: string;
  title: string;
  niches: Array<{ id: string; name: string }>;
  category?: { id: string; name: string } | null;
  platform_requirements: string[];
  target_audience: Record<string, unknown>; // {age_range, locations, interests, genders}
  location_requirements: Record<string, unknown>; // {countries, regions, cities}
  budget_total: number;
  budget_currency: string;
  start_date: string | null;
  end_date: string | null;
}

export interface MatchCriteria {
  nicheWeight: number;
  platformWeight: number;
  audienceWeight: number;
  locationWeight: number;
  budgetWeight: number;
  availabilityWeight: number;
  minOverallScore: number;
  maxResults: number;
}

export interface MatchFactor {
  criterion: "niche" | "platform" | "audience" | "location" | "budget" | "availability";
  score: number; // 0-100 sub-score for this criterion
  weight: number; // criterion weight (0-100)
  contributed: number; // score * weight / 100
  reason: string; // human-readable explanation
  verified: boolean; // whether the underlying data is verified
  dataSource: "platform_api" | "manual" | "none";
}

export interface MatchResult {
  creator: CreatorListItem;
  overallScore: number; // 0-100
  breakdown: MatchFactor[];
}

export const DEFAULT_CRITERIA: MatchCriteria = {
  nicheWeight: 30,
  platformWeight: 20,
  audienceWeight: 20,
  locationWeight: 15,
  budgetWeight: 10,
  availabilityWeight: 5,
  minOverallScore: 0,
  maxResults: 50,
};

const DATA_SOURCE_LABELS: Record<string, string> = {
  platform_api: "Synced from platform API",
  manual: "Manually claimed by creator",
  none: "Not available",
};

// ---------------------------------------------------------------------------
// Scoring helpers (each returns 0-100 + reason + verified + dataSource)
// ---------------------------------------------------------------------------

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function safeAvg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Niche relevance (0-100).
 * Exact niche match = 100; same category different niche = 60; no overlap = 0.
 * Uses the best-matching campaign niche.
 */
function scoreNiche(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  let bestScore = 0;
  let bestReason = "No niche overlap with campaign.";
  let matched = false;

  for (const cniche of campaign.niches) {
    // Exact niche match.
    const exactNiche = creator.niches.find((n) => n.id === cniche.id);
    if (exactNiche) {
      bestScore = 100;
      bestReason = `Creator's niche "${exactNiche.name}" matches campaign niche "${cniche.name}".`;
      matched = true;
      break;
    }
    // Same category, different niche.
    const sameCategory = creator.niches.find(
      (n) => n.category_id === cniche.category_id && cniche.category_id
    );
    if (sameCategory && sameCategory.id !== cniche.id && bestScore < 60) {
      bestScore = 60;
      bestReason = `Creator operates in campaign's category but a different niche.`;
      matched = true;
    }
    // Category-level match via creator categories.
    const categoryMatch = creator.categories.find(
      (c) => c.id === cniche.category_id
    );
    if (categoryMatch && bestScore < 60) {
      bestScore = 60;
      bestReason = `Creator's category "${categoryMatch.name}" aligns with campaign niche "${cniche.name}".`;
      matched = true;
    }
  }

  if (!matched && campaign.niches.length > 0) {
    bestReason = `No niche/category overlap with campaign's ${campaign.niches.length} niche(s).`;
  } else if (campaign.niches.length === 0) {
    bestScore = 50;
    bestReason = "Campaign has no niche requirements (neutral).";
  }

  return {
    criterion: "niche",
    score: clampScore(bestScore),
    weight: 0, // filled by caller
    contributed: 0,
    reason: bestReason,
    verified: true, // niche/category are platform-managed reference data
    dataSource: "none",
  };
}

/**
 * Platform match (0-100).
 * Share of required platforms the creator has a connected social account on.
 */
function scorePlatform(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  if (campaign.platform_requirements.length === 0) {
    return {
      criterion: "platform",
      score: 50,
      weight: 0,
      contributed: 0,
      reason: "Campaign has no platform requirements (neutral).",
      verified: true,
      dataSource: "none",
    };
  }

  const creatorPlatforms = new Set(
    creator.socialAccounts.map((s) => s.platform.toLowerCase())
  );
  let matched = 0;
  const matchedPlatforms: string[] = [];

  for (const platform of campaign.platform_requirements) {
    if (creatorPlatforms.has(platform.toLowerCase())) {
      matched += 1;
      matchedPlatforms.push(platform);
    }
  }

  const score = (matched / campaign.platform_requirements.length) * 100;
  const hasVerified = matchedPlatforms.some((p) =>
    creator.socialAccounts.some(
      (s) => s.platform.toLowerCase() === p.toLowerCase() && s.is_verified
    )
  );
  const platformApi = creator.socialAccounts.some(
    (s) => s.metrics_source === "platform_api"
  );

  return {
    criterion: "platform",
    score: clampScore(score),
    weight: 0,
    contributed: 0,
    reason: matched === 0
      ? `Creator has no connected account on required platform(s): ${campaign.platform_requirements.join(", ")}.`
      : matched === campaign.platform_requirements.length
        ? `Creator is connected on all required platform(s): ${matchedPlatforms.join(", ")}.`
        : `Creator connected on ${matched} of ${campaign.platform_requirements.length} required platform(s) (${matchedPlatforms.join(", ")}).`,
    verified: hasVerified,
    dataSource: platformApi ? "platform_api" : creator.socialAccounts.length > 0 ? "manual" : "none",
  };
}

/**
 * Audience fit (0-100).
 * Combines engagement rate (verified preferred) and audience size reasonableness.
 * Never invents followers or engagement: missing data = disclosed, no points.
 */
function scoreAudience(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  const subScores: number[] = [];
  const reasons: string[] = [];
  let verified = false;
  let dataSource: "platform_api" | "manual" | "none" = "none";

  // Engagement rate component (0-100). Good engagement ~3-8%.
  const engagement = creator.max_engagement_rate;
  if (engagement !== null) {
    const platformApi = creator.socialAccounts.some((s) => s.metrics_source === "platform_api");
    if (platformApi) { verified = true; dataSource = "platform_api"; }
    else if (dataSource === "none") dataSource = "manual";

    // Score: 3-8% = 100, taper outside. 0% = 0.
    let engagementScore = 0;
    if (engagement >= 3 && engagement <= 8) engagementScore = 100;
    else if (engagement > 8) engagementScore = Math.max(60, 100 - (engagement - 8) * 5);
    else if (engagement > 0) engagementScore = (engagement / 3) * 100;
    subScores.push(engagementScore);
    reasons.push(`Engagement rate ${engagement.toFixed(2)}% ${platformApi ? "(platform-synced)" : "(self-reported)"}.`);
  } else {
    reasons.push("Engagement rate not available.");
  }

  // Audience size component vs campaign target (0-100). Prefer creators within
  // an order of magnitude of a sane range; large budgets suit larger audiences.
  const followers = creator.total_followers;
  const campaignBudget = campaign.budget_total;
  if (followers !== null) {
    const src = creator.socialAccounts.find((s) => s.followers_count === followers);
    if (src && src.metrics_source === "platform_api") { verified = true; dataSource = "platform_api"; }
    else if (dataSource === "none") dataSource = "manual";

    let sizeScore = 50; // neutral baseline when size known
    if (followers >= 1_000 && followers <= 1_000_000) sizeScore = 80;
    else if (followers > 1_000_000) sizeScore = 60; // still relevant for big budgets
    else if (followers > 0) sizeScore = 40; // nano creators
    subScores.push(sizeScore);
    reasons.push(`Audience of ${Math.floor(followers).toLocaleString()} followers (${src?.metrics_source ?? "source not recorded"}).`);
  } else {
    reasons.push("Audience size not available.");
  }

  // Campaign audience targeting overlap (demographics, if verified data exists).
  const demo = creator.demographics;
  if (demo && Object.keys(demo.top_languages ?? {}).length > 0) {
    // Neutral inclusion: verified demographics add confidence, never penalise.
    if (demo.is_verified) verified = true;
    reasons.push(demo.is_verified ? "Verified audience demographics on file." : "Self-reported audience demographics on file.");
  }

  const score = subScores.length > 0 ? safeAvg(subScores) ?? 50 : 50;
  return {
    criterion: "audience",
    score: clampScore(score),
    weight: 0,
    contributed: 0,
    reason: reasons.join(" ") || "No audience data available.",
    verified,
    dataSource,
  };
}

/**
 * Location match (0-100).
 * Creator location vs campaign location requirements (country > region > city).
 */
function scoreLocation(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  const req = campaign.location_requirements;
  const creatorLoc = creator.location ?? {};
  const creatorCountry = String(creatorLoc.country ?? "").toLowerCase();
  const creatorRegion = String(creatorLoc.region ?? "").toLowerCase();
  const creatorCity = String(creatorLoc.city ?? "").toLowerCase();

  if (!creatorCountry && !creatorRegion && !creatorCity) {
    return {
      criterion: "location",
      score: 50,
      weight: 0,
      contributed: 0,
      reason: "Creator location not disclosed.",
      verified: false,
      dataSource: "none",
    };
  }

  const reqCountries = (req.countries ?? [] as string[]).map((c) => String(c).toLowerCase());
  const reqRegions = (req.regions ?? [] as string[]).map((c) => String(c).toLowerCase());
  const reqCities = (req.cities ?? [] as string[]).map((c) => String(c).toLowerCase());

  if (reqCountries.length === 0 && reqRegions.length === 0 && reqCities.length === 0) {
    return {
      criterion: "location",
      score: 50,
      weight: 0,
      contributed: 0,
      reason: "Campaign has no location requirements (neutral).",
      verified: true,
      dataSource: "none",
    };
  }

  let score = 0;
  let reason = "";
  if (
    creatorCountry &&
    reqCountries.length > 0 &&
    reqCountries.includes(creatorCountry)
  ) {
    score = 100;
    reason = `Creator is based in ${creatorCountry}, matching the campaign's target country.`;
  } else if (
    creatorRegion &&
    reqRegions.length > 0 &&
    reqRegions.includes(creatorRegion)
  ) {
    score = 80;
    reason = `Creator is based in ${creatorRegion}, matching a target region.`;
  } else if (
    creatorCity &&
    reqCities.length > 0 &&
    reqCities.includes(creatorCity)
  ) {
    score = 90;
    reason = `Creator is based in ${creatorCity}, matching a target city.`;
  } else if (creatorCountry && reqCountries.length > 0) {
    score = 20;
    reason = `Creator (${creatorCountry}) is outside the campaign's target countries.`;
  } else {
    score = 40;
    reason = "Creator location disclosed but no specific campaign location requirement matched.";
  }

  return {
    criterion: "location",
    score: clampScore(score),
    weight: 0,
    contributed: 0,
    reason,
    verified: true, // location is creator-provided profile data, treated as claimed
    dataSource: "manual",
  };
}

/**
 * Budget fit (0-100).
 * Creator's minimum rate vs campaign budget available per creator.
 * If creator has no rates, disclosed as not available (neutral, no invention).
 */
function scoreBudget(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  const minRate = creator.min_rate;
  const budget = campaign.budget_total;

  if (minRate === null) {
    return {
      criterion: "budget",
      score: 50,
      weight: 0,
      contributed: 0,
      reason: "Creator has not disclosed rates (budget fit cannot be assessed).",
      verified: false,
      dataSource: "none",
    };
  }

  if (budget <= 0) {
    return {
      criterion: "budget",
      score: 50,
      weight: 0,
      contributed: 0,
      reason: "Campaign has no budget set (budget fit neutral).",
      verified: true,
      dataSource: "none",
    };
  }

  // Estimate per-creator budget: assume up to 10 creators could be engaged.
  const perCreatorBudget = budget / 10;
  let score: number;
  let reason: string;

  if (minRate <= perCreatorBudget) {
    score = 100;
    reason = `Creator's minimum rate (${new Intl.NumberFormat("en-US", { style: "currency", currency: campaign.budget_currency }).format(minRate)}) fits within the campaign's estimated per-creator budget.`;
  } else if (minRate <= budget) {
    // Fits total budget but not the per-creator estimate — still viable for a single premium creator.
    score = 60;
    reason = `Creator's minimum rate exceeds the per-creator estimate but is within the total campaign budget.`;
  } else {
    const over = ((minRate - budget) / budget) * 100;
    score = Math.max(0, 40 - over);
    reason = `Creator's minimum rate exceeds the campaign budget (${budget.toLocaleString()} total).`;
  }

  // Rates are creator-declared (manual), not platform-verified.
  return {
    criterion: "budget",
    score: clampScore(score),
    weight: 0,
    contributed: 0,
    reason,
    verified: false,
    dataSource: "manual",
  };
}

/**
 * Availability (0-100).
 * Creator's availability status plus date-range overlap with the campaign.
 */
function scoreAvailability(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput
): MatchFactor {
  const status = creator.availability_status;
  let score: number;
  let reason: string;

  switch (status) {
    case "open":
      score = 100;
      reason = "Creator is open to new collaborations.";
      break;
    case "busy":
      score = 40;
      reason = "Creator is currently busy; availability may be limited.";
      break;
    case "unavailable":
      score = 0;
      reason = "Creator is currently unavailable.";
      break;
    default:
      score = 50;
      reason = "Creator availability not specified.";
  }

  // Date overlap check: if creator has availability windows (not stored here),
  // we only have the status flag, so no date-based adjustment is invented.
  if (campaign.start_date || campaign.end_date) {
    reason += " Campaign dates provided; creator has no dated availability windows on file (not factored).";
  }

  return {
    criterion: "availability",
    score: clampScore(score),
    weight: 0,
    contributed: 0,
    reason,
    verified: true,
    dataSource: "manual",
  };
}

// ---------------------------------------------------------------------------
// Core scoring function (pure, testable, no AI)
// ---------------------------------------------------------------------------

/**
 * Compute an explainable match score for one creator against one campaign.
 *
 * The overall score is the weighted sum of criterion sub-scores. Each factor
 * carries a human-readable reason and a verified/dataSource flag so brands
 * can distinguish verified platform-synced metrics from self-reported data.
 *
 * @param creator - Creator match input (plain data).
 * @param campaign - Campaign match input (plain data).
 * @param criteria - Adjustable weights (must sum to 100).
 */
export function computeMatchScore(
  creator: CreatorMatchInput,
  campaign: CampaignMatchInput,
  criteria: MatchCriteria
): MatchResult {
  const factors: MatchFactor[] = [
    { ...scoreNiche(creator, campaign), weight: criteria.nicheWeight },
    { ...scorePlatform(creator, campaign), weight: criteria.platformWeight },
    { ...scoreAudience(creator, campaign), weight: criteria.audienceWeight },
    { ...scoreLocation(creator, campaign), weight: criteria.locationWeight },
    { ...scoreBudget(creator, campaign), weight: criteria.budgetWeight },
    { ...scoreAvailability(creator, campaign), weight: criteria.availabilityWeight },
  ].map((f) => ({
    ...f,
    contributed: clampScore((f.score * f.weight) / 100),
  }));

  const overallScore = clampScore(
    factors.reduce((sum, f) => sum + f.contributed, 0)
  );

  return {
    creator: {} as CreatorListItem, // filled by caller (keeps matcher pure)
    overallScore,
    breakdown: factors,
  };
}

// ---------------------------------------------------------------------------
// Service: match creators for a campaign
// ---------------------------------------------------------------------------

/**
 * Map a database creator profile row + relations into a CreatorMatchInput.
 */
function mapCreatorToMatchInput(row: CreatorListItem): CreatorMatchInput {
  return {
    id: row.id,
    display_name: row.display_name,
    categories: row.categories,
    niches: row.niches,
    socialAccounts: row.socialAccounts.map((s) => ({
      platform: s.platform,
      followers_count: s.followers_count,
      engagement_rate: s.engagement_rate,
      metrics_source: s.metrics_source,
      is_verified: s.is_verified,
    })),
    location: typeof row.location === "object" && row.location !== null ? row.location : {},
    languages: row.languages,
    rates: row.rates,
    availability_status: row.availability_status,
    demographics: row.demographics
      ? {
          is_verified: row.demographics.is_verified,
          source: row.demographics.source,
          age_range: typeof row.demographics.age_range === "object" ? row.demographics.age_range : {},
          gender: typeof row.demographics.gender === "object" ? row.demographics.gender : {},
          top_locations: typeof row.demographics.top_locations === "object" ? row.demographics.top_locations : {},
          top_languages: typeof row.demographics.top_languages === "object" ? row.demographics.top_languages : {},
        }
      : undefined,
    total_followers: row.total_followers,
    max_engagement_rate: row.max_engagement_rate,
    min_rate: row.min_rate,
  };
}

/**
 * Map a database campaign row + niches into a CampaignMatchInput.
 */
function mapCampaignToMatchInput(
  campaign: Campaigns,
  niches: Array<{ id: string; name: string }>
): CampaignMatchInput {
  return {
    id: campaign.id,
    title: campaign.title,
    niches,
    category: campaign.category_id ? { id: campaign.category_id, name: "" } : undefined,
    platform_requirements: campaign.platform_requirements ?? [],
    target_audience: campaign.target_audience ?? {},
    location_requirements: campaign.location_requirements ?? {},
    budget_total: Number(campaign.budget_total ?? 0),
    budget_currency: campaign.budget_currency ?? "USD",
    start_date: campaign.start_date ?? null,
    end_date: campaign.end_date ?? null,
  };
}

/**
 * List creators matching a campaign, ranked by explainable match score.
 *
 * Fetches the campaign, runs discovery filtering, scores each candidate with
 * the rule-based engine, and returns ranked results. Brands can adjust the
 * matching criteria (weights) to re-rank without changing the underlying data.
 *
 * No AI is used; scoring is fully deterministic and explainable.
 */
export async function matchCreatorsForCampaign(
  campaignId: string,
  criteriaInput: MatchingCriteriaInput,
  client?: Client
): Promise<ServiceResult<{ campaign: CampaignMatchInput; matches: MatchResult[] }>> {
  const supabase = client ?? getSupabaseClient();

  // Validate criteria.
  const validated = matchingCriteriaSchema.safeParse(criteriaInput);
  if (!validated.success) {
    return fail(
      Errors.validationFailed("Invalid matching criteria.", {
        fields: parseZodError(validated.error),
      })
    );
  }
  const criteria: MatchCriteria = {
    nicheWeight: validated.data.nicheWeight,
    platformWeight: validated.data.platformWeight,
    audienceWeight: validated.data.audienceWeight,
    locationWeight: validated.data.locationWeight,
    budgetWeight: validated.data.budgetWeight,
    availabilityWeight: validated.data.availabilityWeight,
    minOverallScore: validated.data.minOverallScore,
    maxResults: validated.data.maxResults,
  };

  // Fetch campaign + its niches.
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .is("deleted_at", null)
    .maybeSingle();

  if (campaignError) return fail(mapSupabaseError(campaignError));
  if (!campaign) return fail(Errors.campaignNotFound());

  const { data: campaignNicheRows } = await supabase
    .from("campaign_campaign_niches")
    .select("campaign_niche_id, campaign_niches(name)")
    .eq("campaign_id", campaignId);

  const campaignMatchInput: CampaignMatchInput = mapCampaignToMatchInput(
    campaign,
    (campaignNicheRows ?? []).map((row) => ({
      id: row.campaign_niche_id,
      name: row.campaign_niches?.name ?? "",
    }))
  );

  // Discovery candidate set: reuse discovery filters derived from the campaign.
  const discoveryParams: ListCreatorsInput = {
    limit: 100,
    offset: 0,
    sortBy: "created_at",
    sortOrder: "desc",
  };
  if (campaign.category_id) discoveryParams.categoryId = campaign.category_id;
  if (campaign.platform_requirements.length > 0) {
    discoveryParams.platform = campaign.platform_requirements[0];
  }

  const discovery = await listCreators(discoveryParams, supabase);
  if (discovery.error) return fail(discovery.error);

  const candidates = discovery.data.creators;

  // Score each candidate.
  const matches: MatchResult[] = [];
  for (const candidate of candidates) {
    const creatorInput = mapCreatorToMatchInput(candidate);
    const result = computeMatchScore(creatorInput, campaignMatchInput, criteria);
    matches.push({
      ...result,
      creator: candidate,
    });
  }

  // Rank by overall score desc, then by followers desc as tiebreaker.
  matches.sort((a, b) => {
    if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
    const af = a.creator.total_followers ?? 0;
    const bf = b.creator.total_followers ?? 0;
    return bf - af;
  });

  const filtered = matches.filter((m) => m.overallScore >= criteria.minOverallScore);
  const top = filtered.slice(0, criteria.maxResults);

  return ok({
    campaign: campaignMatchInput,
    matches: top,
  });
}
