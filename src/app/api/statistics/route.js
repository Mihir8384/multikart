import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Store from "@/models/Store";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    await dbConnect();

    const searchParams = request?.nextUrl?.searchParams;
    // Optional filter param supported by frontend, currently ignored but kept for future use
    const filterBy = searchParams?.get("filter_by") || null;

    // Compute totals
    const [total_products, total_stores, total_users, total_orders] =
      await Promise.all([
        Product.countDocuments({}),
        Store.countDocuments({}),
        User.countDocuments({}),
        Order.countDocuments({}),
      ]);

    // Sum order totals as total revenue
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const total_revenue =
      revenueAgg && revenueAgg.length ? revenueAgg[0].total : 0;

    return NextResponse.json({
      success: true,
      data: {
        total_revenue,
        total_products,
        total_orders,
        total_stores,
        total_users,
      },
    });
  } catch (error) {
    console.error("/api/statistics/count error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
