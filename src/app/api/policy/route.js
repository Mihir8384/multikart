import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Policy from "@/models/Policy";
import { requireAuth } from "@/utils/auth/serverAuth";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // Optional: filter by type (warranty/return/refund)
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("paginate")) || 15;

    let query = {};
    if (type) query.type = type;
    if (status !== null && status !== undefined && status !== "") {
      query.status = status === "1" || status === "true";
    }

    const total = await Policy.countDocuments(query);
    const policies = await Policy.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const transformedPolicies = policies.map((policy) => ({
      ...policy,
      status: policy.status ? 1 : 0,
      id: policy._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      message: "Policies fetched successfully",
      data: {
        data: transformedPolicies,
        current_page: page,
        per_page: limit,
        total: total,
        last_page: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const authCheck = await requireAuth(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const body = await request.json();
    const newPolicy = await Policy.create(body);

    return NextResponse.json({
      success: true,
      message: "Policy created successfully",
      data: newPolicy,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
