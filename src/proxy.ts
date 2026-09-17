import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile =
    /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-device-type", isMobile ? "mobile" : "desktop");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/|.*\\..*).*)",
  ],
};
