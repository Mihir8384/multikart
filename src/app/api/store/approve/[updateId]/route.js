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

    const { updateId } = await params;

    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    const store = await Store.findById(updateId);

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    // Toggle approval status
    store.is_approved = store.is_approved === 1 ? 0 : 1;
    store.vendor_status = store.is_approved === 1 ? "Approved" : "Pending";

    await store.save();

    return NextResponse.json({
      success: true,
      message: `Vendor ${store.is_approved === 1 ? "approved" : "unapproved"} successfully`,
      data: {
        ...store.toObject(),
        id: store._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error toggling store approval:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
