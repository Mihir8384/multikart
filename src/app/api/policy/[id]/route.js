import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Policy from "@/models/Policy";
import { requireAuth } from "@/utils/auth/serverAuth";

/**
 * GET /api/policy/[id]
 * Retrieves a single policy by its ID
 */
export async function GET(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();

    const policy = await Policy.findById(id);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    console.error(`❌ GET /api/policy/${id} Error:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch policy", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/policy/[id]
 * Updates a single policy
 */
export async function PUT(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const body = await request.json();
    const { name, type, description, content, status } = body;

    const policy = await Policy.findById(id);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: "Policy not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name) policy.name = name;
    if (type) policy.type = type;
    if (description !== undefined) policy.description = description;
    if (content !== undefined) policy.content = content;
    if (status !== undefined) policy.status = status;

    await policy.save();

    return NextResponse.json(
      { success: true, message: "Policy updated successfully", data: policy }
    );
  } catch (error) {
    console.error(`❌ PUT /api/policy/${id} Error:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to update policy", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/policy/[id]
 * Deletes a single policy
 */
export async function DELETE(request, { params }) {
  const { id } = await params; // Await params for Next.js 13+
  try {
    await dbConnect();
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const deletedPolicy = await Policy.findByIdAndDelete(id);
    if (!deletedPolicy) {
      return NextResponse.json(
        { success: false, message: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Policy deleted successfully" }
    );
  } catch (error) {
    console.error(`❌ DELETE /api/policy/${id} Error:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to delete policy", error: error.message },
      { status: 500 }
    );
  }
}
