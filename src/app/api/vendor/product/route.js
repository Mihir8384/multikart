import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Category from "@/models/Category";
import mongoose from "mongoose";
import { requireAuth } from "@/utils/auth/serverAuth";
import { uploadToCloudinary } from "@/utils/cloudinary/cloudinaryService";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/vendor/product
 * Lists all Master Products that this vendor is selling.
 */
export async function GET(request) {
  try {
    await dbConnect();

    // 1. Verify Vendor Auth
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const vendorId = authCheck.authData.userId;

    // 2. Find Master Products
    const products = await Product.find({
      "linked_vendor_offerings.vendor_id": vendorId,
    })
      .populate("category_id", "name")
      .select(
        "product_name slug product_thumbnail linked_vendor_offerings status"
      )
      .lean();

    // 3. Transform data
    const vendorProducts = products.map((p) => {
      const myOffer = p.linked_vendor_offerings.find(
        (offer) => offer.vendor_id.toString() === vendorId.toString()
      );

      return {
        id: p._id,
        name: p.product_name,
        slug: p.slug,
        image: p.product_thumbnail,
        price: myOffer?.price || 0,
        stock: myOffer?.stock_quantity || 0,
        status: myOffer?.is_active ? 1 : 0,
      };
    });

    // --- FIX: Return data in Pagination format for the Table ---
    return NextResponse.json({
      success: true,
      data: {
        data: vendorProducts,
        total: vendorProducts.length,
        current_page: 1,
        per_page: vendorProducts.length > 0 ? vendorProducts.length : 10,
        last_page: 1,
      },
    });
  } catch (error) {
    console.error("Vendor Product GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/product
 * 1. Link to existing Master Product ("Sell This Product")
 * 2. OR Submit new product for approval
 */
export async function POST(request) {
  console.log("=== VENDOR PRODUCT SUBMISSION API ===");
  try {
    await dbConnect();

    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const formData = await request.formData();
    const productDataString = formData.get("data");
    const productData = productDataString ? JSON.parse(productDataString) : {};

    // SCENARIO 1: Link to Existing Master Product
    if (productData.master_product_id) {
      console.log(
        "🔗 Linking vendor to existing Master Product:",
        productData.master_product_id
      );

      // Create the offering object
      const vendorOffering = {
        vendor_product_id: new mongoose.Types.ObjectId(),
        vendor_id: authCheck.authData.userId,
        price: Number(productData.price),
        stock_quantity: Number(productData.stock_quantity),
        condition: productData.condition || "new",
        shipping_info: productData.shipping_info,
        is_active: true,
      };

      // Find master product and push the new offering
      const updatedProduct = await Product.findByIdAndUpdate(
        productData.master_product_id,
        {
          $push: { linked_vendor_offerings: vendorOffering },
        },
        { new: true }
      );

      if (!updatedProduct) {
        return NextResponse.json(
          { success: false, message: "Master Product not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Product listed successfully.",
          data: updatedProduct,
        },
        { status: 200 }
      );
    }

    // SCENARIO 2: Request New Product (Fallback for full submission)
    const {
      product_name,
      category_id,
      brand_id,
      product_policies,
      attribute_values,
      variant_values,
      price,
      stock_quantity,
    } = productData;

    if (!product_name || !category_id) {
      return NextResponse.json(
        { success: false, message: "Product Name and Category are required." },
        { status: 400 }
      );
    }

    // Generate UPID
    const lastProduct = await Product.findOne().sort({ created_at: -1 });
    let nextId = 1;
    if (lastProduct && lastProduct.master_product_code) {
      try {
        const lastIdNum = parseInt(
          lastProduct.master_product_code.split("UPID-")[1]
        );
        if (!isNaN(lastIdNum)) nextId = lastIdNum + 1;
        else nextId = (await Product.countDocuments()) + 1;
      } catch (e) {
        nextId = (await Product.countDocuments()) + 1;
      }
    }
    const master_product_code = `UPID-${nextId.toString().padStart(6, "0")}`;

    // Generate Slug
    let slug = product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    // Handle Files
    const media = [];
    const product_thumbnail_file = formData.get("product_thumbnail");

    if (product_thumbnail_file && product_thumbnail_file.size > 0) {
      const uploadDir = join(process.cwd(), "uploads", "temp");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

      const bytes = await product_thumbnail_file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = join(
        uploadDir,
        `vendor-thumb-${Date.now()}${path.extname(product_thumbnail_file.name)}`
      );
      await writeFile(tempPath, buffer);

      const uploadResult = await uploadToCloudinary(
        [{ path: tempPath, originalname: product_thumbnail_file.name }],
        "products"
      );
      media.push({
        url: uploadResult[0].secure_url,
        is_primary: true,
        type: "image",
      });
    }

    // Create Vendor Offering
    const vendorOffering = {
      vendor_product_id: new mongoose.Types.ObjectId(),
      vendor_id: authCheck.authData.userId,
      price: Number(price) || 0,
      stock_quantity: Number(stock_quantity) || 0,
      is_active: true,
    };

    // Save New Product (Inactive/Pending)
    const newProduct = new Product({
      master_product_code,
      product_name,
      slug,
      category_id,
      brand_id: brand_id || null,
      status: "inactive", // Forces Admin Approval
      product_policies: product_policies || {},
      attribute_values: attribute_values || [],
      variant_values: variant_values || [],
      media: media,
      linked_vendor_offerings: [vendorOffering],
      created_by: authCheck.authData.userId,
      updated_by: authCheck.authData.userId,
    });

    await newProduct.save();

    return NextResponse.json(
      {
        success: true,
        message: "Product submitted successfully. Waiting for Admin approval.",
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Vendor Product Submit Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit product",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
