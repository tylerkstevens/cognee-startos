import { NextResponse, type NextRequest } from "next/server";

const localApiUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://cognee.embassy:8000";
const ONBOARDING_COOKIE = "cognee-onboarding-complete";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy backend API calls through the same-origin UI server.
  // This is required when the UI is served from a public hostname but the
  // backend is only reachable on the internal StartOS container network.
  if (pathname === "/health" || pathname.startsWith("/api/v1/")) {
    const target = new URL(pathname + request.nextUrl.search, localApiUrl);
    const rewritten = NextResponse.rewrite(target);
    // Forward the original Host header so cookies/origin checks stay correct.
    rewritten.headers.set("host", request.headers.get("host") || target.host);
    return rewritten;
  }

  if (pathname === "/" && !request.cookies.has(ONBOARDING_COOKIE)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
