import { handleAutoConnectMatchRequest } from "next-address-server-js";
import { getWebhookSecret } from "@/lib/config";
import { getUserByEmail } from "@/lib/db/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleAutoConnectMatchRequest(request, {
    webhookSecret: getWebhookSecret(),
    findExternalUserIdByEmail: (email) => getUserByEmail(email)?.id ?? null,
  });
}
