import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log("Middleware executing for path:", pathname);

  // Skip authentication for auth routes
  if (pathname.startsWith("/auth/") || pathname === "/auth") {
    console.log("Skipping auth for auth route:", pathname);
    return NextResponse.next();
  }

  // Skip authentication for API auth routes
  if (pathname.startsWith("/api/auth/")) {
    console.log("Skipping auth for API auth route:", pathname);
    return NextResponse.next();
  }

  // Skip authentication for public product API (GET requests only for client site)
  if (pathname === "/api/product" && request.method === "GET") {
    console.log("Skipping auth for public product listing (GET):", pathname);
    return NextResponse.next();
  }

  // Skip authentication for public category API (GET requests only for client site)
  if (pathname === "/api/category" && request.method === "GET") {
    console.log("Skipping auth for public category listing (GET):", pathname);
    return NextResponse.next();
  }

  // Skip authentication for static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/assets/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : request.cookies.get("uat")?.value;

    console.log("Token found:", !!token);

    if (!token) {
      console.log("No token found, redirecting to login");
      // Redirect to login for protected routes
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Access denied. No token provided." },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Verify JWT token properly
    console.log("Verifying JWT token...");
    let decoded;

    try {
      const secret = process.env.JWT_SECRET || "your_jwt_secret";
      decoded = jwt.verify(token, secret);
      console.log("JWT verified successfully:", {
        userId: decoded.userId,
        email: decoded.email,
        isAdmin: decoded.isAdmin,
      });
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.message);

      // Fallback: try to get user data from cookies
      console.log("Falling back to cookie-based auth...");
      const userDataCookie = request.cookies.get("account")?.value;
      if (userDataCookie) {
        try {
          const userData = JSON.parse(userDataCookie);
          decoded = {
            userId: userData._id || userData.id,
            email: userData.email,
            isAdmin: userData.isAdmin === true,
          };
          console.log("Using cookie data:", decoded);
        } catch (e) {
          console.error("Error parsing user data from cookies:", e);
          throw new Error("Authentication failed");
        }
      } else {
        throw new Error("No valid authentication found");
      }
    }

    const isUserAdmin = decoded.isAdmin;
    const userEmail = decoded.email;
    const userId = decoded.userId;

    // Add user data to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", String(userId || ""));
    requestHeaders.set("x-user-email", String(userEmail || ""));
    requestHeaders.set("x-is-admin", String(isUserAdmin));

    console.log("Setting headers:", { userId, userEmail, isUserAdmin });
    console.log("Headers set successfully");

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Check admin access for user management routes
    if (pathname.startsWith("/user") || pathname.startsWith("/api/user")) {
      console.log("Checking admin access for user management route");
      if (!isUserAdmin) {
        console.log("Access denied - user is not admin");
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            {
              success: false,
              message: "Access denied. Admin privileges required.",
            },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    console.log("Middleware allowing access to:", pathname);
    return response;
  } catch (error) {
    console.error("Middleware JWT Error:", error.message);
    console.error("Error details:", error);
    console.log(
      "Token that failed verification:",
      request.cookies.get("uat")?.value?.substring(0, 20) + "..."
    );

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Invalid token." },
        { status: 401 }
      );
    }

    // Redirect to login for invalid token
    console.log("Redirecting to login due to JWT error");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    "/",
    "/account",
    "/attachment/:path*",
    "/attribute/:path*",
    "/blog/:path*",
    "/category/:path*",
    "/checkout",
    "/commission_history",
    "/coupon/:path*",
    "/currency/:path*",
    "/dashboard/:path*",
    "/faq/:path*",
    "/notification/:path*",
    "/order/:path*",
    "/page/:path*",
    "/payment_account/:path*",
    "/point/:path*",
    "/product/:path*",
    "/refund",
    "/review/:path*",
    "/role/:path*",
    "/setting/:path*",
    "/shipping/:path*",
    "/store/:path*",
    "/tag/:path*",
    "/tax/:path*",
    "/theme/:path*",
    "/theme_option/:path*",
    "/user/:path*",
    "/vendore_wallet/:path*",
    "/wallet/:path*",
    "/withdraw_request/:path*",
    "/vendor_wallet/:path*",
    "/theme/denver",
    "/notifications",
    "/qna",
    // API routes that need authentication
    "/api/user/:path*",
    "/api/product/:path*",
    "/api/order/:path*",
  ],
};
