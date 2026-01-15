import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Inventory from "@/models/Inventory";
import Warehouse from "@/models/Warehouse";
import Products from "@/models/Products";
import { requireAuth } from "@/utils/auth/serverAuth";

/**
 * GET - Fetch a specific inventory item by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const { id } = await params;
    const vendorId = auth.authData.userId;

    const inventory = await Inventory.findOne({ _id: id, vendor: vendorId })
      .populate("product", "product_name sku")
      .populate("warehouse", "name");

    if (!inventory) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a specific inventory item
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const { id } = await params;
    const vendorId = auth.authData.userId;

    const deletedInventory = await Inventory.deleteOne({
      _id: id,
      vendor: vendorId,
    });

    if (deletedInventory.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
