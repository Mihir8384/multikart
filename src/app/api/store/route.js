// import store from './store.json'
// import { NextResponse } from "next/server";

// export async function GET() {
//   return NextResponse.json(store);
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import User from "@/models/User";
import Role from "@/models/Role";
import { requireAdmin } from "@/utils/auth/serverAuth";

// GET - Get all stores with filtering
export async function GET(request) {
  try {
    // Add admin authentication check
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }
    // --- END OF FIX ---
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("vendor_status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("paginate") || searchParams.get("limit")) || 10;
    const topVendor = searchParams.get("top_vendor");
    const filterBy = searchParams.get("filter_by");

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

    // Determine sort order
    let sortOrder = { created_at: -1 }; // Default sort by creation date
    if (topVendor === "1") {
      // Sort by order amount (highest earning vendors first)
      sortOrder = { order_amount: -1, orders_count: -1 };
    }

    const stores = await Store.find(query)
      .populate("owner_user_id", "name email phone")
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for better performance and then add id manually

    const total = await Store.countDocuments(query);

    // Map stores to ensure id field exists
    const storesWithId = stores.map(store => ({
      ...store,
      id: store._id.toString(),
      _id: store._id.toString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: storesWithId,
        current_page: page,
        per_page: limit,
        total: total,
        last_page: Math.ceil(total / limit),
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
    
    // Find the vendor role
    const vendorRole = await Role.findOne({ name: "vendor" });
    if (!vendorRole) {
      return NextResponse.json(
        { success: false, message: "Vendor role not found in the system" },
        { status: 400 }
      );
    }
    
    // Check if vendor user already exists by email
    let vendorUser = null;
    if (body.email) {
      vendorUser = await User.findOne({ email: body.email });
    }
    
    // If vendor user doesn't exist, create one
    if (!vendorUser) {
      if (!body.password || !body.email) {
        return NextResponse.json(
          { success: false, message: "Email and password are required for new vendor" },
          { status: 400 }
        );
      }
      
      vendorUser = await User.create({
        name: body.name || body.store_name,
        email: body.email,
        password: body.password, // Make sure to hash this in User model pre-save hook
        phone: body.phone,
        country_code: body.country_code || "91",
        role: vendorRole._id, // Use the vendor role ObjectId
        status: body.status !== undefined ? body.status : 1,
      });
    }
    
    // Create the store
    const newStore = await Store.create({
      store_name: body.store_name,
      description: body.description,
      store_logo: body.store_logo || body.store_logo_id, // Use store_logo, not store_logo_id
      owner_user_id: vendorUser._id,
      vendor_id: vendorUser._id.toString(), // Convert to string as vendor_id is a String field
      country: body.country || body.country_id,
      state: body.state || body.state_id,
      city: body.city,
      address: body.address,
      pincode: body.pincode,
      facebook: body.facebook,
      pinterest: body.pinterest,
      instagram: body.instagram,
      twitter: body.twitter,
      youtube: body.youtube,
      hide_vendor_email: body.hide_vendor_email || false,
      hide_vendor_phone: body.hide_vendor_phone || false,
      status: body.status !== undefined ? body.status : 1,
      is_approved: 1, // Admin-created stores are auto-approved
      vendor_status: "Approved",
    });

    // Populate vendor info before returning
    await newStore.populate("owner_user_id", "name email phone");

    return NextResponse.json({ 
      success: true, 
      message: "Vendor created successfully",
      data: newStore 
    });
  } catch (error) {
    console.error("Error creating store:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
