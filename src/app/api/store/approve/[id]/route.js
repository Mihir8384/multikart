import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import { requireAdmin } from "@/utils/auth/serverAuth";

// PUT - Toggle store approval status
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    // Find the store
    const store = await Store.findById(id);
    
    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    // Toggle is_approved status (0 -> 1, 1 -> 0)
    store.is_approved = store.is_approved === 1 ? 0 : 1;
    
    // Update vendor_status accordingly
    if (store.is_approved === 1) {
      store.vendor_status = "Approved";
    } else {
      store.vendor_status = "Pending";
    }
    
    await store.save();

    return NextResponse.json({
      success: true,
      message: `Store ${store.is_approved === 1 ? 'approved' : 'unapproved'} successfully`,
      data: {
        id: store._id.toString(),
        is_approved: store.is_approved,
        vendor_status: store.vendor_status
      }
    });
  } catch (error) {
    console.error("Error toggling store approval:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
