import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Variant from "@/models/Variant";
import { requireAdmin } from "@/utils/auth/serverAuth";

/**
 * GET /api/variant
 * Retrieves all variants with pagination and filtering
 */
export async function GET(request) {
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("paginate")) || 10;
    const searchQuery = searchParams.get("search") || "";

    // Get Filter Params
    const status = searchParams.get("status");
    const input_type = searchParams.get("input_type");

    let query = {};

    // 1. Search Logic
    if (searchQuery) {
      query.variant_name = { $regex: searchQuery, $options: "i" };
    }

    // 2. Status Filter (Converts 1/0 to true/false for internal 'active' field)
    if (status !== null && status !== undefined && status !== "") {
      query.active = parseInt(status) === 1;
    }

    // 3. Input Type Filter
    if (input_type && input_type !== "") {
      query.input_type = input_type;
    }

    const total = await Variant.countDocuments(query);
    const variants = await Variant.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const transformedVariants = variants.map((variant) => ({
      ...variant,
      status: variant.active ? 1 : 0,
      id: variant._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      message: "Variants fetched successfully",
      data: {
        data: transformedVariants,
        current_page: page,
        per_page: limit,
        total: total,
        last_page: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /api/variant Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch variants",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/variant
 */
export async function POST(request) {
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { variant_name, description, input_type, options } = body;

    if (!variant_name || !input_type) {
      return NextResponse.json(
        { success: false, message: "Variant name and input type are required" },
        { status: 400 }
      );
    }

    const newVariant = new Variant({
      variant_name,
      description,
      input_type,
      options: options || [],
      created_by: authCheck?.authData?.userId || null,
    });

    await newVariant.save();

    return NextResponse.json(
      {
        success: true,
        message: "Variant created successfully",
        data: newVariant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/variant Error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A variant with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create variant",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/variant
 * Handles bulk deletion
 */
export async function DELETE(request) {
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No variant IDs provided" },
        { status: 400 }
      );
    }

    const result = await Variant.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} variants deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Bulk DELETE /api/variant Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete variants",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
