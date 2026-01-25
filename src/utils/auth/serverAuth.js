import jwt from "jsonwebtoken";

/**
 * Extract user authentication data from request
 * @param {Request} request - The Next.js request object
 * @returns {Object} - { isAdmin: boolean, userId: string|null, email: string|null }
 */
export async function extractAuthFromRequest(request) {
  let isAdmin = false;
  let userId = null;
  let email = null;
  let role = null;

  // Try to get token from authorization header or cookies
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : request.cookies?.get("uat")?.value;

  if (token) {
    try {
      // Use environment variable - MUST be set in Vercel
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }

      const decoded = jwt.verify(token, secret);

      isAdmin = decoded.isAdmin === true;
      userId = decoded.userId;
      email = decoded.email;
      role = decoded.role || null;

      return { isAdmin, userId, email, role };
    } catch (jwtError) {
      // Fallback to cookie data
      const accountCookie = request.cookies?.get("account")?.value;
      if (accountCookie) {
        try {
          const accountData = JSON.parse(decodeURIComponent(accountCookie));
          isAdmin = accountData.isAdmin === true;
          userId = accountData._id;
          email = accountData.email;
          role = accountData.role || null;

          return { isAdmin, userId, email, role };
        } catch (cookieError) {
          // Continue to return empty auth
        }
      }
    }
  }

  return { isAdmin: false, userId: null, email: null, role: null };
}

/**
 * Check if request has admin privileges
 * @param {Request} request - The Next.js request object
 * @returns {Promise<{isAdmin: boolean, userId: string|null, authData: Object}>}
 */
export async function checkAdminAuth(request) {
  const authData = await extractAuthFromRequest(request);

  return {
    isAdmin: authData.isAdmin,
    userId: authData.userId,
    authData,
    role: authData.role,
  };
}

/**
 * Middleware function to require admin access for API routes
 * @param {Request} request - The Next.js request object
 * @returns {Promise<{success: boolean, authData?: Object, errorResponse?: Response}>}
 */
export async function requireAdmin(request) {
  const { isAdmin, userId, authData, role } = await checkAdminAuth(request);

  if (!isAdmin && role !== "admin") {
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        message: "Access denied. Only administrators can perform this action.",
        data: null,
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );

    return { success: false, errorResponse };
  }

  return { success: true, authData: { ...authData, userId } };
}

// =================================================================
// ==  NEW FUNCTION TO ADD  =========================================
// =================================================================

/**
 * Middleware function to require standard user access for API routes
 * @param {Request} request - The Next.js request object
 * @returns {Promise<{success: boolean, authData?: Object, errorResponse?: Response}>}
 */
export async function requireAuth(request) {
  // Use your existing function to get auth data
  const authData = await extractAuthFromRequest(request);

  // Fail if no userId is found
  if (!authData.userId) {
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        message: "Authentication required. Please log in.",
        data: null,
      }),
      {
        status: 401, // 401 Unauthorized
        headers: { "Content-Type": "application/json" },
      }
    );

    return { success: false, errorResponse };
  }

  // Pass along the authData (which includes userId, email, isAdmin)
  return { success: true, authData: authData };
}

/**
 * Middleware function to require vendor access for API routes
 * @param {Request} request - The Next.js request object
 * @returns {Promise<{success: boolean, authData?: Object, errorResponse?: Response}>}
 */
export async function requireVendor(request) {
  const authData = await extractAuthFromRequest(request);

  // Fail if no userId is found
  if (!authData.userId) {
    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        message: "Authentication required. Please log in.",
        data: null,
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );

    return { success: false, errorResponse };
  }

  // Vendors should not be admins (optional: can be removed if vendors can also be admins)
  // For now, we just ensure they are authenticated
  return { success: true, authData: authData };
}
