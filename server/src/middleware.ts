import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
  const publicPaths = [
    "/login",
    "/agent-programs",
    "/api/auth",
    "/api/agent",
    "/api/server-messages",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next();
  }

  // Static files & _next — skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "it-monitor-default-secret-change-me",
  });

  // Not logged in → redirect to login (for pages) or 401 (for API)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
