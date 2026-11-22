"use client";

import * as React from "react";
import { Card, Badge, Button } from "@/components";
import { ChevronRightIcon, LockIcon, SparklesIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { MatchFactor } from "@/services/matching";

interface MatchScoreBadgeProps {
  score: number;
  breakdown: MatchFactor[];
  className?: string;
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
}

const scoreColor = (score: number) => {
  if (score >= 75) return "text-success-600 dark:text-success-400";
  if (score >= 50) return "text-warning-600 dark:text-warning-400";
  return "text-error-600 dark:text-error-400";
};

const scoreBg = (score: number) => {
  if (score >= 75) return "bg-success-50 dark:bg-success-950/20";
  if (score >= 50) return "bg-warning-50 dark:bg-warning-950/20";
  return "bg-error-50 dark:bg-error-950/20";
};

const criterionLabel: Record<string, string> = {
  niche: "Niche relevance",
  platform: "Platform match",
  audience: "Audience & engagement",
  location: "Location fit",
  budget: "Budget fit",
  availability: "Availability",
};

const sourceLabel: Record<string, string> = {
  platform_api: "Synced from platform API",
  manual: "Self-reported",
  none: "No data",
};

interface BreakdownRowProps {
  factor: MatchFactor;
}

function BreakdownRow({ factor }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs mb-2">
      <div className="flex-1 min-w-0">
        <span className="block text-text-secondary">{criterionLabel[factor.criterion]}</span>
        <span className="block text-text-tertiary">{factor.reason}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-nums text-text-primary">{factor.score}</span>
        <Badge
          variant={factor.verified ? "success" : "default"}
          size="xs"
          title={sourceLabel[factor.dataSource]}
        >
          {factor.verified ? "Verified" : factor.dataSource === "manual" ? "Self-reported" : "No data"}
        </Badge>
      </div>
    </div>
  );
}

export function MatchScoreBadge({
  score,
  breakdown,
  className,
  size = "md",
  showBreakdown = false,
}: MatchScoreBadgeProps) {
  const [expanded, setExpanded] = React.useState(showBreakdown);

  const sizeConfig = {
    sm: { text: "text-2xl", label: "text-xs", padding: "px-3 py-1.5" },
    md: { text: "text-3xl", label: "text-sm", padding: "px-4 py-2" },
    lg: { text: "text-4xl", label: "text-base", padding: "px-5 py-2.5" },
  }[size];

  return (
    <Card
      variant="filled"
      padding="none"
      className={cn(
        "overflow-hidden border-none",
        scoreBg(score),
        className
      )}
    >
      <div className={`flex items-center justify-between gap-4 ${sizeConfig.padding}`}>
        <div className="flex flex-col">
          <span className={`font-bold ${sizeConfig.text} ${scoreColor(score)}`}>
            {score}
          </span>
          <span className={cn(sizeConfig.label, "text-text-secondary uppercase tracking-wider")}>
            Match score
          </span>
        </div>
        <Badge
          variant={
            score >= 75 ? "success" : score >= 50 ? "warning" : "error"
          }
          size="sm"
        >
          {score >= 75 ? "Strong match" : score >= 50 ? "Potential match" : "Weak match"}
        </Badge>
      </div>

      {breakdown.length > 0 && (
        <div className="border-t border-border-subtle">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? "Hide breakdown" : "Show breakdown"}
              <ChevronRightIcon className={cn("h-4 w-4", !expanded && "rotate-90")} />
            </Button>
            <Badge variant="ghost" size="xs" className="text-text-tertiary">
              Verified = platform-synced data
            </Badge>
          </div>
          {expanded && (
            <div className="px-4 pb-4 space-y-1">
              {breakdown.map((factor) => (
                <BreakdownRow key={factor.criterion} factor={factor} />
              ))}
              <div className="border-t border-border-subtle mt-3 pt-2 flex items-center justify-between text-xs font-medium text-text-primary">
                <span>Overall score</span>
                <span className={scoreColor(score)}>{score}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
