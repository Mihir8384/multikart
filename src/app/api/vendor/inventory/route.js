import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Inventory from "@/models/Inventory";
import Warehouse from "@/models/Warehouse";
import Products from "@/models/Products";
import { requireAuth } from "@/utils/auth/serverAuth";

export async function GET(request) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const vendorId = auth.authData.userId;
    const { searchParams } = new URL(request.url);

    const stockStatus = searchParams.get("stock"); // 'all', 'low', 'out'
    const warehouseId = searchParams.get("warehouse_id");

    let query = { vendor: vendorId };

    if (warehouseId && warehouseId !== "all") {
      query.warehouse = warehouseId;
    }

    // filtering logic from Wireframe Page 19
    if (stockStatus === "out") {
      query.stock = 0;
    } else if (stockStatus === "low") {
      query.$expr = { $lt: ["$stock", "$low_stock_threshold"] };
      query.stock = { $gt: 0 };
    }

    const inventoryData = await Inventory.find(query)
      .populate("product", "product_name media master_product_code")
      .populate("warehouse", "name")
      .sort({ updatedAt: -1 });

    const formattedData = inventoryData.map((item) => ({
      _id: item._id,
      image: item.product?.media?.[0]?.url || null,
      name: item.product?.product_name || "N/A",
      sku: item.product?.master_product_code || "N/A",
      warehouse_name: item.warehouse?.name || "Main Warehouse",
      stock: item.stock,
      // Dynamic status badges for the UI
      stock_status:
        item.stock === 0
          ? { name: "Out of Stock", color: "danger" }
          : item.stock < item.low_stock_threshold
          ? { name: "Low Stock", color: "warning" }
          : { name: "In Stock", color: "success" },
    }));

    return NextResponse.json({
      success: true,
      data: { data: formattedData, total: formattedData.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Add this POST function to your existing src/app/api/vendor/inventory/route.js

export async function POST(request) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const vendorId = auth.authData.userId;
    const body = await request.json();
    const { product_id, warehouse_id, stock, low_stock_threshold } = body;

    if (!product_id || !warehouse_id) {
      return NextResponse.json(
        { success: false, message: "Product and Warehouse are required" },
        { status: 400 }
      );
    }

    // Find and update, or create if it doesn't exist
    const updatedInventory = await Inventory.findOneAndUpdate(
      { vendor: vendorId, product: product_id, warehouse: warehouse_id },
      {
        $set: {
          stock: Number(stock),
          low_stock_threshold: Number(low_stock_threshold || 10),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      data: updatedInventory,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Bulk delete inventory items
 */
export async function DELETE(request) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const vendorId = auth.authData.userId;
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Inventory IDs are required" },
        { status: 400 }
      );
    }

    // Delete inventory items that belong to this vendor
    const result = await Inventory.deleteMany({
      _id: { $in: ids },
      vendor: vendorId,
    });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} inventory item(s) deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Bulk update stock of inventory items
 */
export async function PATCH(request) {
  try {
    await dbConnect();
    const auth = await requireAuth(request);
    if (!auth.success) return auth.errorResponse;

    const vendorId = auth.authData.userId;
    const { ids, stock } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Inventory IDs are required" },
        { status: 400 }
      );
    }

    if (typeof stock !== "number" || stock < 0) {
      return NextResponse.json(
        { success: false, message: "Stock must be a valid number" },
        { status: 400 }
      );
    }

    // Update inventory items that belong to this vendor
    const result = await Inventory.updateMany(
      {
        _id: { $in: ids },
        vendor: vendorId,
      },
      { $set: { stock } }
    );

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} inventory item(s) updated successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

