import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Category from "@/models/Category";
import Attribute from "@/models/Attributes";
import Variant from "@/models/Variant";
import Brand from "@/models/Brand";
import { requireAdmin } from "@/utils/auth/serverAuth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/product/[id] - Get single MASTER product by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { updateId } = await params;

    console.log("🔍 GET Product - updateId:", updateId);

    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await Product.findById(updateId)
      .populate("category_id", "name display_name path")
      .populate("brand_id", "name")
      .populate("attribute_values.attribute_id", "name")
      .populate("variant_values.variant_id", "variant_name input_type");

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Master Product not found" },
        { status: 404 }
      );
    }

    console.log("✅ Product found:", product._id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("❌ Master Product GET single error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch master product",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product/[id] - Update MASTER product by ID
 */
export async function PUT(request, { params }) {
  console.log("=== MASTER PRODUCT PUT API CALLED ===");
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { updateId } = await params;
    console.log("🔍 PUT Product - updateId:", updateId);
    
    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const existingProduct = await Product.findById(updateId);
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Master Product not found" },
        { status: 404 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    const isSimpleUpdate = contentType.includes("application/json");

    let updateData = {};
    let isFormDataUpdate = false;

    if (isSimpleUpdate) {
      // Simple JSON update (e.g., status toggle)
      console.log("📥 Received JSON update");
      updateData = await request.json();

      if (updateData.status !== undefined) {
        if (typeof updateData.status === "number") {
          updateData.status = updateData.status === 1 ? "active" : "inactive";
        }
      }
    } else {
      // Full FormData update
      console.log("📥 Received FormData for Master Product update");
      isFormDataUpdate = true;
      const formData = await request.formData();
      const productDataString = formData.get("data");
      const rawData = productDataString ? JSON.parse(productDataString) : {};

      // Store formData for file processing
      updateData = { ...rawData };
      updateData._formData = formData;

      // --- 1. SANITIZE DATA (Critical for saving) ---

      // Fix Price
      if (updateData.standard_price) {
        updateData.standard_price = Number(updateData.standard_price);
      }

      // Fix Policies (Convert empty strings to null for ObjectIds)
      if (updateData.product_policies) {
        const pol = updateData.product_policies;
        if (!pol.return_policy) pol.return_policy = null;
        if (!pol.refund_policy) pol.refund_policy = null;
        if (!pol.warranty_info) pol.warranty_info = null;
        updateData.product_policies = pol;
      }

      // Ensure Config Objects exist
      if (!updateData.related_product_config)
        updateData.related_product_config = {};
      if (!updateData.upsell_product_config)
        updateData.upsell_product_config = {};

      // Handle nulls for optional IDs
      if (updateData.brand_id === "") updateData.brand_id = null;
      if (updateData.upc === "") updateData.upc = null;
      if (updateData.ean === "") updateData.ean = null;
      if (updateData.gtin === "") updateData.gtin = null;
      if (updateData.isbn === "") updateData.isbn = null;
      if (updateData.mpn === "") updateData.mpn = null;

      console.log("📝 Sanitized Update Data:", {
        name: updateData.product_name,
        price: updateData.standard_price,
        policies: updateData.product_policies,
      });
    }

    // --- Validation (Category change) ---
    if (
      isFormDataUpdate &&
      updateData.category_id &&
      updateData.category_id !== existingProduct.category_id.toString()
    ) {
      const category = await Category.findById(updateData.category_id).lean();
      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found." },
          { status: 404 }
        );
      }
      if (!category.is_leaf) {
        return NextResponse.json(
          {
            success: false,
            message: "Products can only be assigned to leaf categories.",
          },
          { status: 400 }
        );
      }
    }

    // --- Slug Update ---
    if (
      isFormDataUpdate &&
      updateData.product_name &&
      updateData.product_name !== existingProduct.product_name
    ) {
      let slug = updateData.product_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const existingSlug = await Product.findOne({
        slug,
        _id: { $ne: updateId },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      updateData.slug = slug;
    }

    // --- File Uploads ---
    if (isFormDataUpdate) {
      const formData = updateData._formData;
      delete updateData._formData; // Cleanup

      const uploadDir = join(process.cwd(), "uploads", "temp");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      let currentMedia = updateData.media || existingProduct.media || [];

      try {
        // Delete images
        const deleteMediaUrls = JSON.parse(
          formData.get("delete_media_urls") || "[]"
        );
        if (deleteMediaUrls.length > 0) {
          for (const url of deleteMediaUrls) {
            await deleteFromCloudinary(url).catch((err) =>
              console.error("⚠️ Error deleting image:", err)
            );
          }
          currentMedia = currentMedia.filter(
            (asset) => !deleteMediaUrls.includes(asset.url)
          );
        }

        // Upload new files
        const newMediaFiles = formData.getAll("new_media_files");
        if (newMediaFiles && newMediaFiles.length > 0) {
          for (const file of newMediaFiles) {
            if (file && file.size > 0) {
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              // Use uploadToCloudinary directly with buffer if supported, or temp file
              // Here using buffer approach supported by your service usually
              const uploadResult = await uploadToCloudinary(
                [{ buffer, originalname: file.name }],
                "products"
              );
              currentMedia.push({
                url: uploadResult[0].secure_url,
                is_primary: false,
                type: "image",
              });
            }
          }
        }

        // Ensure primary image
        if (
          currentMedia.length > 0 &&
          !currentMedia.some((m) => m.is_primary)
        ) {
          currentMedia[0].is_primary = true;
        }

        updateData.media = currentMedia;
      } catch (uploadError) {
        console.error("❌ Upload error:", uploadError);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to process images",
            error: uploadError.message,
          },
          { status: 500 }
        );
      }
    }

    // --- Final Save ---
    updateData.updated_by = authCheck.authData.userId;

    const updatedProduct = await Product.findByIdAndUpdate(
      updateId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("category_id", "name display_name")
      .populate("brand_id", "name");

    console.log("✅ Master Product updated successfully");

    return NextResponse.json({
      success: true,
      message: "Master Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("❌ Master Product PUT error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update master product",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  // ... (Keep existing DELETE logic)
  console.log("=== MASTER PRODUCT DELETE API CALLED ===");
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }
    const { updateId } = await params;
    console.log("🔍 DELETE Product - updateId:", updateId);
    
    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }
    const productToDelete = await Product.findById(updateId);
    if (!productToDelete) {
      return NextResponse.json(
        { success: false, message: "Master Product not found" },
        { status: 404 }
      );
    }
    const imagesToDelete = [];
    if (productToDelete.media && Array.isArray(productToDelete.media)) {
      productToDelete.media.forEach((asset) => {
        if (asset.url) imagesToDelete.push(asset.url);
      });
    }
    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        await deleteFromCloudinary(imageUrl).catch((err) =>
          console.error("⚠️ Error deleting image from Cloudinary:", err)
        );
      }
    }
    await Product.findByIdAndDelete(updateId);
    return NextResponse.json({
      success: true,
      message: "Master Product deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete master product",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
