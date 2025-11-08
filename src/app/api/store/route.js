// import store from './store.json'
// import { NextResponse } from "next/server";

// export async function GET() {
//   return NextResponse.json(store);
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import User from "@/models/User";
import { requireAdmin } from "@/utils/auth/serverAuth";

// GET - Get all stores with filtering
export async function GET(request) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("vendor_status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    let query = {};

    if (status) {
      query.vendor_status = status;
    }

    if (search) {
      query.$or = [
        { store_name: { $regex: search, $options: "i" } },
        { vendor_id: { $regex: search, $options: "i" } },
      ];
    }

    const stores = await Store.find(query)
      .populate("owner_user_id", "name email phone")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Store.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create store (admin only)
export async function POST(request) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    // Implementation for admin store creation
    // Similar to vendor registration but without status restrictions

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
