/**
 * CALLBACX TECHNOLOGY — Unit tests for payment math (src/lib/payments/stripe.ts)
 *
 * Pure logic tests: monetary computations, minor-unit conversion, live-mode detection.
 * No database, no Stripe API required.
 */

import {
  computeSplit,
  toMinorUnits,
  fromMinorUnits,
  getPlatformFeePercentFromEnv,
  isStripeLiveMode,
  DEFAULT_PLATFORM_FEE_PERCENT,
} from "@/lib/payments/stripe";

describe("payments — computeSplit", () => {
  it("splits 1000 at 10% rate -> fee 100, creator 900", () => {
    const result = computeSplit(1000, 0.10);
    expect(result.fee).toBe(100);
    expect(result.creatorAmount).toBe(900);
  });

  it("splits 100 at 0% rate -> fee 0, creator 100", () => {
    const result = computeSplit(100, 0);
    expect(result.fee).toBe(0);
    expect(result.creatorAmount).toBe(100);
  });

  it("splits 100 at 100% rate -> fee 100, creator 0", () => {
    const result = computeSplit(100, 1);
    expect(result.fee).toBe(100);
    expect(result.creatorAmount).toBe(0);
  });

  it("clamps rate below 0 to 0", () => {
    const result = computeSplit(100, -0.5);
    expect(result.fee).toBe(0);
    expect(result.creatorAmount).toBe(100);
  });

  it("clamps rate above 1 to 1", () => {
    const result = computeSplit(100, 1.5);
    expect(result.fee).toBe(100);
    expect(result.creatorAmount).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = computeSplit(100.005, 0.10);
    expect(result.fee).toBeCloseTo(10.0, 2);
    expect(result.creatorAmount).toBeCloseTo(90.0, 2);
  });

  it("handles zero amount", () => {
    const result = computeSplit(0, 0.10);
    expect(result.fee).toBe(0);
    expect(result.creatorAmount).toBe(0);
  });
});

describe("payments — toMinorUnits", () => {
  it("converts 10.00 USD to 1000 minor units", () => {
    expect(toMinorUnits(10, "USD")).toBe(1000);
  });

  it("converts 10.005 USD to 1000 (rounded)", () => {
    expect(toMinorUnits(10.005, "USD")).toBe(1001);
  });

  it("converts 0.01 USD to 1 minor unit", () => {
    expect(toMinorUnits(0.01, "USD")).toBe(1);
  });

  it("returns 0 for negative amounts", () => {
    expect(toMinorUnits(-100, "USD")).toBe(0);
  });

  it("returns 0 for non-finite amounts", () => {
    expect(toMinorUnits(NaN as unknown as number, "USD")).toBe(0);
    expect(toMinorUnits(Infinity as unknown as number, "USD")).toBe(0);
  });
});

describe("payments — fromMinorUnits", () => {
  it("converts 1000 minor units to 10.00 USD", () => {
    expect(fromMinorUnits(1000, "USD")).toBe(10);
  });

  it("converts JPY minor units 1:1 (no divisor)", () => {
    expect(fromMinorUnits(1000, "JPY")).toBe(1000);
  });

  it("converts 1 minor unit to 0.01 USD", () => {
    expect(fromMinorUnits(1, "USD")).toBe(0.01);
  });
});

describe("payments — getPlatformFeePercentFromEnv", () => {
  const origEnv = process.env.STRIPE_PLATFORM_FEE_PERCENT;

  afterEach(() => {
    if (origEnv === undefined) {
      delete process.env.STRIPE_PLATFORM_FEE_PERCENT;
    } else {
      process.env.STRIPE_PLATFORM_FEE_PERCENT = origEnv;
    }
  });

  it("returns default 10% when env not set", () => {
    delete process.env.STRIPE_PLATFORM_FEE_PERCENT;
    expect(getPlatformFeePercentFromEnv()).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
  });

  it("returns configured percent when valid", () => {
    process.env.STRIPE_PLATFORM_FEE_PERCENT = "20";
    expect(getPlatformFeePercentFromEnv()).toBe(20);
  });

  it("returns default for non-numeric env", () => {
    process.env.STRIPE_PLATFORM_FEE_PERCENT = "not-a-number";
    expect(getPlatformFeePercentFromEnv()).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
  });

  it("returns default for out-of-range (< 0)", () => {
    process.env.STRIPE_PLATFORM_FEE_PERCENT = "-5";
    expect(getPlatformFeePercentFromEnv()).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
  });

  it("returns default for out-of-range (> 100)", () => {
    process.env.STRIPE_PLATFORM_FEE_PERCENT = "150";
    expect(getPlatformFeePercentFromEnv()).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
  });

  it("returns default for empty string", () => {
    process.env.STRIPE_PLATFORM_FEE_PERCENT = "";
    expect(getPlatformFeePercentFromEnv()).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
  });
});

describe("payments — isStripeLiveMode", () => {
  const origKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (origKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = origKey;
    }
  });

  it("returns true for sk_live_ key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_1234567890abcdef";
    expect(isStripeLiveMode()).toBe(true);
  });

  it("returns false for sk_test_ key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_1234567890abcdef";
    expect(isStripeLiveMode()).toBe(false);
  });

  it("returns false when no key configured", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeLiveMode()).toBe(false);
  });

  it("returns false for empty key", () => {
    process.env.STRIPE_SECRET_KEY = "";
    expect(isStripeLiveMode()).toBe(false);
  });
});
