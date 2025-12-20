import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Variant from "@/models/Variant";
import Category from "@/models/Category";
import { requireAdmin } from "@/utils/auth/serverAuth";

/**
 * GET /api/variant/[id]
 * Retrieves a single variant by its ID
 */
export async function GET(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const variant = await Variant.findById(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    console.error(`❌ GET /api/variant/${id} Error:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch variant", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/variant/[id]
 * Updates a single variant (name, description, options, etc.)
 */
export async function PUT(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { variant_name, description, input_type, options, active } = body;

    const variant = await Variant.findById(id);
    if (!variant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (variant_name) variant.variant_name = variant_name;
    if (description !== undefined) variant.description = description;
    if (input_type) variant.input_type = input_type;
    if (active !== undefined) variant.active = active;
    
    // Replace options array completely
    if (options) {
        variant.options = options;
    }

    await variant.save();

    return NextResponse.json(
      { success: true, message: "Variant updated successfully", data: variant }
    );
  } catch (error) {
    console.error(`❌ PUT /api/variant/${id} Error:`, error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A variant with this name already exists" },
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update variant", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/variant/[id]
 * Deletes a single variant
 */
export async function DELETE(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    // Check if variant is in use by any category
    const categoryInUse = await Category.findOne({ "variant_mapping.variant_id": id });
    if (categoryInUse) {
      return NextResponse.json(
        { success: false, message: "Cannot delete variant: It is linked to one or more categories." },
        { status: 400 }
      );
    }

    const deletedVariant = await Variant.findByIdAndDelete(id);
    if (!deletedVariant) {
      return NextResponse.json(
        { success: false, message: "Variant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Variant deleted successfully" }
    );
  } catch (error) {
    console.error(`❌ DELETE /api/variant/${id} Error:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to delete variant", error: error.message },
      { status: 500 }
    );
  }
}