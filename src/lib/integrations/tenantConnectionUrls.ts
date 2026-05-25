export function buildPrimaryConnectPath(
  tenantId: string,
  externalUserId: string,
  returnUrl: string,
): string {
  const params = new URLSearchParams({
    external_user_id: externalUserId,
    return_url: returnUrl,
  });
  return `/connect/${encodeURIComponent(tenantId)}?${params.toString()}`;
}

export function buildPrimaryDisconnectPath(tenantId: string, returnUrl: string): string {
  const params = new URLSearchParams({ return_url: returnUrl });
  return `/disconnect/${encodeURIComponent(tenantId)}?${params.toString()}`;
}

export function buildPrimaryConnectSignInPath(
  tenantId: string,
  externalUserId: string,
  returnUrl: string,
): string {
  return `/sign-in?redirect_url=${encodeURIComponent(
    buildPrimaryConnectPath(tenantId, externalUserId, returnUrl),
  )}`;
}

export function buildPrimaryDisconnectSignInPath(tenantId: string, returnUrl: string): string {
  return `/sign-in?redirect_url=${encodeURIComponent(
    buildPrimaryDisconnectPath(tenantId, returnUrl),
  )}`;
}

export function buildPrimaryConnectSignInUrl(
  primaryBaseUrl: string,
  tenantId: string,
  externalUserId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryConnectSignInPath(tenantId, externalUserId, returnUrl)}`;
}

export function buildPrimaryDisconnectSignInUrl(
  primaryBaseUrl: string,
  tenantId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryDisconnectSignInPath(tenantId, returnUrl)}`;
}

export function buildPrimaryConnectUrl(
  primaryBaseUrl: string,
  tenantId: string,
  externalUserId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryConnectPath(tenantId, externalUserId, returnUrl)}`;
}

export function buildPrimaryDisconnectUrl(
  primaryBaseUrl: string,
  tenantId: string,
  returnUrl: string,
): string {
  const base = primaryBaseUrl.replace(/\/$/, "");
  return `${base}${buildPrimaryDisconnectPath(tenantId, returnUrl)}`;
}
