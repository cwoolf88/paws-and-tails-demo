import { encodeExternalUserId } from "next-address-server-js";
import { getApiKeyPrefix } from "@/lib/integrations/nextAddressLinkToken";

export function buildPrimaryConnectPath(
  linkExternalUserId: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  const params = new URLSearchParams({
    external_user_id: linkExternalUserId,
    return_url: returnUrl,
  });
  const email = tenantUserEmail?.trim();
  if (email) params.set("tenant_user_email", email);
  return `/connect?${params.toString()}`;
}

export function buildPrimaryDisconnectPath(
  linkExternalUserId: string,
  returnUrl: string,
): string {
  const params = new URLSearchParams({
    external_user_id: linkExternalUserId,
    return_url: returnUrl,
  });
  return `/disconnect?${params.toString()}`;
}

export function buildPrimaryConnectSignInPath(
  linkExternalUserId: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  return `/sign-in?redirect_url=${encodeURIComponent(
    buildPrimaryConnectPath(linkExternalUserId, returnUrl, tenantUserEmail),
  )}`;
}

export function buildPrimaryDisconnectSignInPath(
  linkExternalUserId: string,
  returnUrl: string,
): string {
  return `/sign-in?redirect_url=${encodeURIComponent(
    buildPrimaryDisconnectPath(linkExternalUserId, returnUrl),
  )}`;
}

export function buildPrimaryConnectUrlFromToken(
  primaryBaseUrl: string,
  linkExternalUserId: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryConnectPath(linkExternalUserId, returnUrl, tenantUserEmail)}`;
}

export function buildPrimaryDisconnectUrlFromToken(
  primaryBaseUrl: string,
  linkExternalUserId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryDisconnectPath(linkExternalUserId, returnUrl)}`;
}

export function buildPrimaryConnectSignInUrlFromToken(
  primaryBaseUrl: string,
  linkExternalUserId: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryConnectSignInPath(linkExternalUserId, returnUrl, tenantUserEmail)}`;
}

export function buildPrimaryDisconnectSignInUrlFromToken(
  primaryBaseUrl: string,
  linkExternalUserId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryDisconnectSignInPath(linkExternalUserId, returnUrl)}`;
}

export function buildPrimaryConnectSignInUrl(
  primaryBaseUrl: string,
  userId: string,
  signingSecret: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const linkExternalUserId = encodeExternalUserId(
    { apiKeyPrefix: getApiKeyPrefix(), userId },
    signingSecret,
  );
  return `${base}${buildPrimaryConnectSignInPath(linkExternalUserId, returnUrl, tenantUserEmail)}`;
}

export function buildPrimaryDisconnectSignInUrl(
  primaryBaseUrl: string,
  userId: string,
  signingSecret: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const linkExternalUserId = encodeExternalUserId(
    { apiKeyPrefix: getApiKeyPrefix(), userId },
    signingSecret,
  );
  return `${base}${buildPrimaryDisconnectSignInPath(linkExternalUserId, returnUrl)}`;
}

export function buildPrimaryConnectUrl(
  primaryBaseUrl: string,
  userId: string,
  signingSecret: string,
  returnUrl: string,
  tenantUserEmail?: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const linkExternalUserId = encodeExternalUserId(
    { apiKeyPrefix: getApiKeyPrefix(), userId },
    signingSecret,
  );
  return `${base}${buildPrimaryConnectPath(linkExternalUserId, returnUrl, tenantUserEmail)}`;
}

export function buildPrimaryDisconnectUrl(
  primaryBaseUrl: string,
  userId: string,
  signingSecret: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  const linkExternalUserId = encodeExternalUserId(
    { apiKeyPrefix: getApiKeyPrefix(), userId },
    signingSecret,
  );
  return `${base}${buildPrimaryDisconnectPath(linkExternalUserId, returnUrl)}`;
}

export function buildConnectExternalUserIdForUser(
  userId: string,
  signingSecret: string,
): string {
  return encodeExternalUserId(
    { apiKeyPrefix: getApiKeyPrefix(), userId },
    signingSecret,
  );
}
