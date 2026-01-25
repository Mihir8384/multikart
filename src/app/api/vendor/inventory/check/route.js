import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Inventory from "@/models/Inventory";
import { requireAuth } from "@/utils/auth/serverAuth";

/**
 * GET /api/vendor/inventory/check
 * Check if inventory exists for a specific product and warehouse combination
 */
export async function GET(request) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const vendorId = auth.authData.userId;
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get("product_id");
    const warehouseId = searchParams.get("warehouse_id");

    if (!productId || !warehouseId) {
      return NextResponse.json(
        { success: false, message: "Product ID and Warehouse ID are required" },
        { status: 400 }
      );
    }

    // Find existing inventory for this product and warehouse
    const existingInventory = await Inventory.findOne({
      vendor: vendorId,
      product: productId,
      warehouse: warehouseId,
    });

    if (existingInventory) {
      return NextResponse.json({
        success: true,
        data: {
          stock: existingInventory.stock,
          low_stock_threshold: existingInventory.low_stock_threshold,
          _id: existingInventory._id,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No existing inventory found",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
