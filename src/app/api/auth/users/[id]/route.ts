import { NextResponse } from "next/server";
import { clearSession, getSessionUserId } from "@/lib/auth/session";
import { requireStaffSession } from "@/lib/auth/staff-session";
import { deleteUserById, getUserById, userOwnedBy } from "@/lib/db/users";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const authz = await requireStaffSession();
  if (!authz.ok) return authz.response;

  const { id } = await params;
  const trimmed = id?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const existing = await getUserById(trimmed);
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (!userOwnedBy(existing, authz.staff.anemoneUserId)) {
    return NextResponse.json(
      { error: "That demo user is not associated with your Anemone account.", code: "forbidden" },
      { status: 403 },
    );
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
