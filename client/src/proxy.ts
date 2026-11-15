import { NextResponse, type NextRequest } from "next/server";

// Signed-out visitors are sent to /login. Admin role is checked in the admin layout from GET /auth/me.
const PROTECTED = ["/report", "/claim", "/claims", "/items/mine", "/activity", "/matches", "/notifications", "/thanks", "/me", "/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hit = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!hit) return NextResponse.next();
  const signedIn = req.cookies.has("tt_token");
  if (signedIn) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon-192|icon-512|opengraph-image|manifest.webmanifest).*)"],
};
