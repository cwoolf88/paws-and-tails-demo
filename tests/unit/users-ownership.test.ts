import { describe, expect, it } from "vitest";
import { userOwnedBy, type PublicUser } from "@/lib/db/users";

function user(partial: Partial<PublicUser> & Pick<PublicUser, "id" | "ownerAnemoneUserId">): PublicUser {
  return {
    email: "demo@example.com",
    fullName: "Demo User",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      countryCode: "US",
    },
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("demo user ownership", () => {
  it("matches only the owning anemone staff user id", () => {
    const owned = user({ id: "u1", ownerAnemoneUserId: "staff-a" });
    expect(userOwnedBy(owned, "staff-a")).toBe(true);
    expect(userOwnedBy(owned, "staff-b")).toBe(false);
    expect(userOwnedBy(owned, " staff-a ")).toBe(true);
  });
});
