import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import Product from "@/models/Products";
import { extractAuthFromRequest } from "@/utils/auth/serverAuth";

export async function GET(request) {
  try {
    await dbConnect();

    // Get authenticated user
    const authData = await extractAuthFromRequest(request);
    if (!authData.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = authData;

    // Get vendor's store
    const store = await Store.findOne({ owner_user_id: userId }).populate(
      "owner_user_id",
      "name email"
    );

    if (!store) {
      return NextResponse.json({
        success: true,
        data: {
          store: null,
          stats: {
            total_products: 0,
            total_orders: 0,
            total_revenue: 0,
            pending_orders: 0,
            approved_products: 0,
            pending_products: 0,
          },
          recent_orders: [],
        },
      });
    }

    // Query products by created_by (user ObjectId) since store_id is Number and doesn't match Store._id
    // This assumes vendors create their own products
    const [totalProducts, approvedProducts, pendingProducts] =
      await Promise.all([
        Product.countDocuments({ created_by: userId }),
        Product.countDocuments({ created_by: userId, is_approved: 1 }),
        Product.countDocuments({ created_by: userId, is_approved: 0 }),
      ]);

    // Orders data not available yet (Order model doesn't exist)
    // Using store's orders_count from Store model if available
    const totalOrders = store.orders_count || 0;
    const pendingOrders = 0; // Will be updated when Order model is implemented
    const totalRevenue = store.order_amount || 0; // Using store's order_amount if available
    const recentOrders = []; // Empty until Order model is implemented

    return NextResponse.json({
      success: true,
      data: {
        store: {
          store_name: store.store_name,
          vendor_id: store.vendor_id,
          vendor_status: store.vendor_status,
          registration_step: store.registration_step,
          products_count: store.products_count || totalProducts,
          orders_count: store.orders_count || totalOrders,
        },
        stats: {
          total_products: totalProducts,
          approved_products: approvedProducts,
          pending_products: pendingProducts,
          total_orders: totalOrders,
          pending_orders: pendingOrders,
          total_revenue: totalRevenue,
        },
        recent_orders: recentOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor dashboard:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
