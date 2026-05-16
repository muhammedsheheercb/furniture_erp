import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // skip check for static assets
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
  });

  // not logged in → redirect to login (if not already on login or api/auth)
  if (!token) {
    if (pathname === "/login" || pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // LOGGED IN → Check RBAC for API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    // Admin has full access
    if (token.role === "admin") return NextResponse.next();

    // Determine module from path
    const segments = pathname.split("/");
    const module = segments[2]; 

    // Mapping of API segments to permission keys
    const moduleMap: Record<string, string> = {
      "items": "items",
      "customers": "customers",
      "suppliers": "suppliers",
      "quotations": "quotations",
      "sales": "sales",
      "production": "production",
      "deliveries": "deliveries",
      "purchases": "purchases",
      "expenses": "expenses",
      "materials": "items",
      "damaged-items": "damaged_items",
      "sales-returns": "sales_returns",
      "dashboard": "dashboard",
      "users": "users",
      "settings": "settings",
    };

    const permissionKey = moduleMap[module];

    if (permissionKey) {
      const permissions = (token.permissions as any)?.[permissionKey] || {};
      
      let action = "";
      if (method === "GET") action = "view";
      else if (method === "POST") action = "create";
      else if (method === "PUT" || method === "PATCH") action = "edit";
      else if (method === "DELETE") action = "delete";

      if (action && !permissions[action]) {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Forbidden: Missing " + action + " permission for " + permissionKey }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};