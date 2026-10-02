import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ms_session";

/** First line of defence for /admin. Every page and action re-checks the session against the database as well. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPublicAdminPage = pathname === "/admin/login" || pathname === "/admin/unauthorized";
  if (isAdminArea && !isPublicAdminPage) {
    let valid = false;
    try {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (token && process.env.AUTH_SECRET) {
        await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), { algorithms: ["HS256"] });
        valid = true;
      }
    } catch {
      valid = false;
    }
    if (!valid) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  const res = req.method === "GET" ? NextResponse.next({ request: { headers } }) : NextResponse.next();
  if (isAdminArea) {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|placeholders|uploads).*)"] };
