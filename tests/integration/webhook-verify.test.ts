import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

function verifyWebhookSignature(
  secret: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return expected === signature;
}

describe("anemone webhook verification", () => {
  it("accepts a valid hmac signature", () => {
    const secret = "demo-secret";
    const timestamp = "1700000000";
    const body = '{"ok":true}';
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    expect(verifyWebhookSignature(secret, timestamp, body, signature)).toBe(
      true,
    );
    expect(verifyWebhookSignature(secret, timestamp, body, "deadbeef")).toBe(
      false,
    );
  });
});
