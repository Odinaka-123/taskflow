import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session")?.value;
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
