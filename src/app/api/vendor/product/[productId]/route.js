import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import mongoose from "mongoose";
import { requireAuth } from "@/utils/auth/serverAuth";

// GET /api/vendor/product/[productId]
export async function GET(request, { params }) {
  try {
    // Connect to database
    await dbConnect();

    // Check authentication
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const vendorId = authCheck.authData.userId;

    // Get and validate productId - await params (Next.js 15+ requirement)
    const { productId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      );
    }

    // Convert to ObjectId if needed
    const objectId = new mongoose.Types.ObjectId(productId);

    // Fetch product
    const product = await Product.findById(objectId).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Find vendor's offering
    const myOffer = (product.linked_vendor_offerings || []).find(
      (offer) => offer.vendor_id.toString() === vendorId.toString()
    );

    return NextResponse.json({
      success: true,
      product,
      myOffer: myOffer || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/product/[productId]
export async function PATCH(request, { params }) {
  try {
    // Connect to database
    await dbConnect();

    // Check authentication
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const vendorId = authCheck.authData.userId;

    // Get and validate productId - await params (Next.js 15+ requirement)
    const { productId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(productId);
    const data = await request.json();

    // Build update fields
    const updateFields = {};
    if (data.vendor_sku !== undefined)
      updateFields["linked_vendor_offerings.$.vendor_sku"] = data.vendor_sku;
    if (data.base_price !== undefined)
      updateFields["linked_vendor_offerings.$.base_price"] = data.base_price;
    if (data.floor_price !== undefined)
      updateFields["linked_vendor_offerings.$.floor_price"] = data.floor_price;
    if (data.price !== undefined)
      updateFields["linked_vendor_offerings.$.price"] = data.price;
    if (data.condition !== undefined)
      updateFields["linked_vendor_offerings.$.condition"] = data.condition;
    if (data.shipping_info !== undefined)
      updateFields["linked_vendor_offerings.$.shipping_info"] =
        data.shipping_info;
    if (data.warehouse_stock !== undefined)
      updateFields["linked_vendor_offerings.$.warehouse_stock"] =
        data.warehouse_stock;
    if (data.selected_variants !== undefined)
      updateFields["linked_vendor_offerings.$.selected_variants"] =
        data.selected_variants;

    // Update product
    const updated = await Product.findOneAndUpdate(
      { _id: objectId, "linked_vendor_offerings.vendor_id": vendorId },
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product or vendor offering not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Product updated" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/vendor/product/[productId] - Alias for PATCH (same functionality)
export async function PUT(request, { params }) {
  return PATCH(request, { params });
}

// DELETE /api/vendor/product/[productId] - Vendor can delete their own offering
export async function DELETE(request, { params }) {
  try {
    // Connect to database
    await dbConnect();

    // Check authentication
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const vendorId = authCheck.authData.userId;

    // Get and validate productId - await params (Next.js 15+ requirement)
    const { productId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(productId);

    // Find the product and remove vendor's offering
    const updated = await Product.findByIdAndUpdate(
      objectId,
      {
        $pull: {
          linked_vendor_offerings: {
            vendor_id: vendorId,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check if vendor's offering was actually removed
    const hadOffering = updated.linked_vendor_offerings.some(
      (offer) => offer.vendor_id.toString() === vendorId.toString()
    );

    if (hadOffering) {
      return NextResponse.json(
        { success: false, message: "Vendor offering not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your product offering has been deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
