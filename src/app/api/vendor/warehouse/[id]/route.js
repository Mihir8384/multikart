import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Warehouse from "@/models/Warehouse";
import { requireVendor } from "@/utils/auth/serverAuth";

/**
 * GET /api/vendor/warehouse/[id] - Vendor: Get their own fulfillment center
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    // --- FIX FOR NEXT.JS 15 ---
    const { id } = await params;
    const { userId } = authCheck.authData;

    const center = await Warehouse.findOne({
      _id: id,
      created_by: userId
    });

    if (!center) {
      return NextResponse.json(
        { success: false, message: "Fulfillment Center not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: center,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor/warehouse/[id] - Vendor: Update their own fulfillment center
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    // --- FIX FOR NEXT.JS 15 ---
    const { id } = await params;
    const { userId } = authCheck.authData;
    const body = await request.json();

    const updatedCenter = await Warehouse.findOneAndUpdate(
      { _id: id, created_by: userId },
      { $set: { ...body, is_fulfillment_center: true } },
      { new: true, runValidators: true }
    );

    if (!updatedCenter) {
      return NextResponse.json(
        { success: false, message: "Fulfillment Center not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Updated successfully",
      data: updatedCenter,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/warehouse/[id] - Vendor: Delete their own fulfillment center
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    // --- FIX FOR NEXT.JS 15 ---
    const { id } = await params;
    const { userId } = authCheck.authData;

    const deletedCenter = await Warehouse.findOneAndDelete({
      _id: id,
      created_by: userId
    });

    if (!deletedCenter) {
      return NextResponse.json(
        { success: false, message: "Fulfillment Center not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fulfillment center:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
