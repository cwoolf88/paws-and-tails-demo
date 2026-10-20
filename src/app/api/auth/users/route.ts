import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth/staff-session";
import { listUsersOwnedBy } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET() {
  const authz = await requireStaffSession();
  if (!authz.ok) return authz.response;
  return NextResponse.json({ users: await listUsersOwnedBy(authz.staff.anemoneUserId) });
}
