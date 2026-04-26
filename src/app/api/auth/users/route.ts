import { NextResponse } from "next/server";
import { listUsers } from "@/lib/db/users";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ users: listUsers() });
}
