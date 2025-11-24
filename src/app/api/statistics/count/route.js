import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Store from "@/models/Store";
import User from "@/models/User";
import Order from "@/models/Order";
import { requireAdmin } from "@/utils/auth/serverAuth";

export async function GET(request) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    // compute totals in parallel
    const [
      total_products,
      total_stores,
      total_users,
      total_orders,
      pending_orders,
      processing_orders,
      shipped_orders,
      delivered_orders,
      cancelled_orders,
    ] = await Promise.all([
      Product.countDocuments({}),
      Store.countDocuments({}),
      User.countDocuments({}),
      Order.countDocuments({}),
      Order.countDocuments({ order_status: "pending", status: 1 }),
      Order.countDocuments({ order_status: "processing", status: 1 }),
      Order.countDocuments({ order_status: "shipped", status: 1 }),
      Order.countDocuments({ order_status: "delivered", status: 1 }),
      Order.countDocuments({ order_status: "cancelled", status: 1 }),
    ]);

    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const total_revenue =
      revenueAgg && revenueAgg.length ? revenueAgg[0].total : 0;

    const payload = {
      total_revenue,
      total_products,
      total_orders,
      total_stores,
      total_users,
      pending_orders,
      processing_orders,
      shipped_orders,
      delivered_orders,
      cancelled_orders,
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("/api/statistics/count error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
