import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/account")) {
    if (!request.cookies.get("paws_user_id")?.value) {
      return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(request.nextUrl.pathname), request.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*"] };
