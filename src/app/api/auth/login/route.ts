import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/users";
import { setSessionUserId } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const id = body?.userId?.trim();
  if (!id) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const u = getUserById(id);
  if (!u) {
    return NextResponse.json({ error: "Unknown user" }, { status: 404 });
  }
  await setSessionUserId(u.id);
  return NextResponse.json({ user: u });
}
