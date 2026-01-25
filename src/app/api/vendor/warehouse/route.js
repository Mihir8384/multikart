import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Warehouse from "@/models/Warehouse";
import { requireVendor } from "@/utils/auth/serverAuth";

/**
 * GET /api/vendor/warehouse - Vendor: Fetch their own fulfillment centers
 */
export async function GET(request) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const { userId } = authCheck.authData;

    const centers = await Warehouse.find({ 
      is_fulfillment_center: true,
      created_by: userId 
    }).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: centers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/warehouse - Vendor: Create a new fulfillment center
 */
export async function POST(request) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const body = await request.json();

    const newCenter = new Warehouse({
      ...body,
      is_fulfillment_center: true,
      created_by: authCheck.authData.userId,
    });

    await newCenter.save();

    return NextResponse.json(
      {
        success: true,
        message: "Fulfillment Center created successfully",
        data: newCenter,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/warehouse - Vendor: Bulk delete (only their own)
 */
export async function DELETE(request) {
  try {
    await dbConnect();
    const authCheck = await requireVendor(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const { userId } = authCheck.authData;
    const { ids } = await request.json();

    const result = await Warehouse.deleteMany({ 
      _id: { $in: ids },
      created_by: userId 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No warehouses found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} warehouse(s) successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
