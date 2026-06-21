import { NextResponse } from "next/server";
import { setSessionUserId } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const id = body?.userId?.trim();
  if (!id) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const user = getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "Unknown demo user." }, { status: 404 });
  }

  await setSessionUserId(user.id);
  return NextResponse.json({ user });
}
