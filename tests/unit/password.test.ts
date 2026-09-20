import { describe, expect, it } from "vitest";
import {
  hashPassword,
  isPasswordSet,
  verifyPassword,
} from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies a password", () => {
    const stored = hashPassword("demo-password-1");
    expect(isPasswordSet(stored)).toBe(true);
    expect(verifyPassword("demo-password-1", stored)).toBe(true);
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("treats empty and legacy hashes as unset", () => {
    expect(isPasswordSet("")).toBe(false);
    expect(isPasswordSet("not-a-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});
