import { NextResponse } from "next/server";
import { setSessionUserId } from "@/lib/auth/session";
import {
  authenticateWithPassword,
  getUserById,
} from "@/lib/db/users";

export const runtime = "nodejs";

type Body = {
  userId?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (email || password) {
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required.", code: "invalid_credentials" },
        { status: 400 },
      );
    }
    const result = authenticateWithPassword(email, password);
    if (!result.ok) {
      const status = result.code === "password_not_set" ? 409 : 401;
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status },
      );
    }
    await setSessionUserId(result.user.id);
    return NextResponse.json({ user: result.user });
  }

  const id = body.userId?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "userId or email/password is required." },
      { status: 400 },
    );
  }

  const user = getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "Unknown demo user." }, { status: 404 });
  }

  await setSessionUserId(user.id);
  return NextResponse.json({ user });
}
