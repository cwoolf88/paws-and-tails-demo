import { cookies } from "next/headers";

const COOKIE = "paws_user_id";

export async function getSessionUserId() {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function setSessionUserId(id: string) {
  const c = await cookies();
  c.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.set(COOKIE, "", { path: "/", maxAge: 0 });
}
