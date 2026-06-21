import { NextResponse } from "next/server";
import { clearSession, getSessionUserId } from "@/lib/auth/session";
import { deleteUserById } from "@/lib/db/users";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const trimmed = id?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const deleted = await deleteUserById(trimmed);
  if (!deleted) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const sessionId = await getSessionUserId();
  if (sessionId === trimmed) {
    await clearSession();
  }

  return NextResponse.json({ user: deleted });
}
