import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db/users";
import { getSessionUserId } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ user: null });
  const u = getUserById(id);
  return NextResponse.json({ user: u });
}
