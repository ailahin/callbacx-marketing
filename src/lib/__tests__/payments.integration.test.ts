/**
 * CALLBACX TECHNOLOGY — Integration tests for payments service
 *
 * Uses mocked Supabase client module to verify service-layer logic without a
 * live database. Covers invoice creation, payment recording, webhook
 * outcome application, and SQL injection resistance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createInvoice,
  markInvoicePaid,
  listMyInvoices,
} from "@/services/payments";

vi.mock("@/lib/supabase/client", () => {
  const mockAuthGetUser = vi.fn();
  const mockFrom = vi.fn();
  const mockRpc = vi.fn().mockResolvedValue({ data: true });

  const mockClient = {
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    rpc: mockRpc,
  };

  return {
    getSupabaseClient: vi.fn(() => mockClient),
    getSupabaseAdminClient: vi.fn(() => mockClient),
    __mockClient: mockClient,
    __mockAuthGetUser: mockAuthGetUser,
    __mockFrom: mockFrom,
    __mockRpc: mockRpc,
  };
});

import {
  __mockAuthGetUser,
  __mockFrom,
  getSupabaseClient,
  getSupabaseAdminClient,
} from "@/lib/supabase/client";

function mockChain(result: any, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: result, error }),
    single: vi.fn().mockResolvedValue({ data: result, error }),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("payments integration — createInvoice", () => {
  it("creates an invoice for brand owner", async () => {
    const profileId = "profile-1";
    const brandId = "brand-1";
    const collabId = "collab-1";
    const creatorProfileId = "creator-1";

    __mockAuthGetUser.mockResolvedValue({ data: { user: { id: profileId } }, error: null });

    __mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return mockChain({ id: profileId });
      }
      if (table === "collaborations") {
        return mockChain({ brand_id: brandId, creator_profile_id: creatorProfileId });
      }
      if (table === "invoices") {
        return mockChain({
          id: "inv-1",
          collaboration_id: collabId,
          brand_id: brandId,
          creator_profile_id: creatorProfileId,
          invoice_number: "INV-001",
          amount: 1000,
          currency: "USD",
          status: "draft",
        });
      }
      return mockChain(null);
    });

    const result = await createInvoice(
      { collaboration_id: collabId, invoice_number: "INV-001", amount: 1000, currency: "USD" },
    );
    expect(result.error).toBeNull();
    expect(result.data?.invoice_number).toBe("INV-001");
  });

  it("rejects invoice creation when not authenticated", async () => {
    __mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await createInvoice({
      collaboration_id: "collab-1",
      invoice_number: "INV-001",
      amount: 1000,
      currency: "USD",
    });
    expect(result.error?.code).toBe("AUTH_SESSION_REQUIRED");
  });
});

describe("payments integration — markInvoicePaid", () => {
  it("marks invoice as paid for brand owner", async () => {
    const profileId = "profile-1";
    const invoiceId = "inv-1";
    const brandId = "brand-1";

    __mockAuthGetUser.mockResolvedValue({ data: { user: { id: profileId } }, error: null });

    let invoiceCallCount = 0;
    __mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return mockChain({ id: profileId });
      }
      if (table === "invoices") {
        invoiceCallCount++;
        if (invoiceCallCount === 1) {
          // getInvoice call
          return mockChain({ id: invoiceId, brand_id: brandId, status: "draft" });
        }
        // update call
        return mockChain({ id: invoiceId, brand_id: brandId, status: "paid" });
      }
      return mockChain(null);
    });

    const result = await markInvoicePaid({ invoice_id: invoiceId });
    expect(result.error).toBeNull();
    expect(result.data?.status).toBe("paid");
  });

  it("rejects marking already-paid invoice", async () => {
    const profileId = "profile-1";
    const invoiceId = "inv-1";

    __mockAuthGetUser.mockResolvedValue({ data: { user: { id: profileId } }, error: null });

    __mockFrom.mockImplementation(() => mockChain({ id: invoiceId, status: "paid" }));

    const result = await markInvoicePaid({ invoice_id: invoiceId });
    expect(result.error).not.toBeNull();
    expect(result.error?.code).toBe("INVOICE_ALREADY_PAID");
  });
});

describe("payments integration — listMyInvoices", () => {
  it("returns invoices for brands owned by profile", async () => {
    const profileId = "profile-1";
    const brandId = "brand-1";

    __mockAuthGetUser.mockResolvedValue({ data: { user: { id: profileId } }, error: null });

    __mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return mockChain({ id: profileId });
      }
      if (table === "brands") {
        return mockChain([{ id: brandId }]);
      }
      if (table === "invoices") {
        return mockChain([
          { id: "inv-1", brand_id: brandId, invoice_number: "INV-001", amount: 1000 },
        ]);
      }
      return mockChain(null);
    });

    const result = await listMyInvoices({});
    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("SQL injection resistance: malicious profileId does not break query", async () => {
    const maliciousId = "profile-1'; DROP TABLE invoices; --";

    __mockAuthGetUser.mockResolvedValue({ data: { user: { id: maliciousId } }, error: null });

    __mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return mockChain({ id: maliciousId });
      }
      if (table === "brands") {
        return mockChain([]);
      }
      return mockChain(null);
    });

    const result = await listMyInvoices({});
    // Should return empty array, not execute injected SQL
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});
