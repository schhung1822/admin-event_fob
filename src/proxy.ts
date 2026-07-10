import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const LOGIN_PATH = "/auth/v1/login";
const STAFF_HOME_PATH = "/dashboard/checkin";
const ADMIN_HOME_PATH = "/dashboard/default";

function isPublicPath(pathname: string) {
  return (
    pathname === LOGIN_PATH ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(AUTH_COOKIE_NAME)?.value);
  const homePath = session?.role === "staff" ? STAFF_HOME_PATH : ADMIN_HOME_PATH;

  if (session && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL(homePath, req.url));
  }

  if (isPublicPath(pathname)) {
    return nextWithPathname(req);
  }

  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL(homePath, req.url));
  }

  if (session.role === "staff" && pathname.startsWith("/dashboard") && pathname !== STAFF_HOME_PATH) {
    return NextResponse.redirect(new URL(STAFF_HOME_PATH, req.url));
  }

  return nextWithPathname(req);
}

export const config = {
  matcher: "/:path*",
};
