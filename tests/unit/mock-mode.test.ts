import { describe, expect, it } from "vitest";

function isMockMode(env: {
  ANEMONE_USE_MOCK?: string;
  ANEMONE_PRIMARY_BASE_URL?: string;
  ANEMONE_API_KEY?: string;
}): boolean {
  if (env.ANEMONE_USE_MOCK === "1") return true;
  return !env.ANEMONE_PRIMARY_BASE_URL?.trim() || !env.ANEMONE_API_KEY?.trim();
}

describe("demo integration mode", () => {
  it("defaults to mock when primary URL/key missing", () => {
    expect(isMockMode({})).toBe(true);
    expect(
      isMockMode({
        ANEMONE_PRIMARY_BASE_URL: "https://example.com",
        ANEMONE_API_KEY: "key",
      }),
    ).toBe(false);
    expect(
      isMockMode({
        ANEMONE_USE_MOCK: "1",
        ANEMONE_PRIMARY_BASE_URL: "https://example.com",
        ANEMONE_API_KEY: "key",
      }),
    ).toBe(true);
  });
});
