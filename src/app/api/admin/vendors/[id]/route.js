import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import User from "@/models/User";
import { requireAdmin } from "@/utils/auth/serverAuth";
import { sendVendorApprovalEmail } from "@/utils/email/mailer";

// PATCH - Update vendor status (Approve/Reject/Request Resubmission)
export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: 'approve', 'reject', 'resubmission'

    const store = await Store.findById(id).populate("owner_user_id");
    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    let newStatus;
    switch (action) {
      case "approve":
        newStatus = "Approved";
        break;
      case "reject":
        newStatus = "Rejected";
        break;
      case "resubmission":
        newStatus = "Resubmission";
        break;
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }

    store.vendor_status = newStatus;
    if (reason) {
      store.rejection_reason = reason;
    }
    await store.save();

    // Send email notification
    if (store.owner_user_id) {
      await sendVendorApprovalEmail(
        store.owner_user_id.email,
        store.owner_user_id.name,
        newStatus,
        store.vendor_id
      );
    }

    return NextResponse.json({
      success: true,
      message: `Vendor ${action}ed successfully`,
      data: store,
    });
  } catch (error) {
    console.error("Error updating vendor status:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get single vendor details
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const store = await Store.findById(id).populate(
      "owner_user_id",
      "name email phone created_at"
    );

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
