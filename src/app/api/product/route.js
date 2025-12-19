import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import { requireAdmin, requireAuth } from "@/utils/auth/serverAuth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";

/**
 * GET /api/product - Get all MASTER products
 * NOTE: Public access allowed for client-side product display
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Admin check (listing master products is an admin task)
    // const authCheck = await requireAdmin(request);
    // if (!authCheck.success) {
    //   return authCheck.errorResponse;
    // }

    // Allow public access for product listing (needed for client site)
    // const authCheck = await requireAuth(request);
    // if (!authCheck.success) {
    //   return authCheck.errorResponse;
    // }

    const searchParams = request?.nextUrl?.searchParams;
    const querySearch = searchParams.get("search");
    const queryCategory = searchParams.get("category_id"); // Get Category Filter
    const queryExport = searchParams.get("export"); // Get Export Flag

    const queryPage = parseInt(searchParams.get("page")) || 1;
    const queryLimit = parseInt(searchParams.get("paginate")) || 10;

    let query = {};

    // 1. Search by product name or master product code
    if (querySearch) {
      query.$or = [
        { product_name: { $regex: querySearch, $options: "i" } },
        { master_product_code: { $regex: querySearch, $options: "i" } },
      ];
    }

    // 2. Filter by Category
    if (queryCategory) {
      query.category_id = queryCategory;
    }

    // Default sort: newest first
    const sortOptions = { created_at: -1 };

    // 3. Handle Export (No Pagination)
    if (queryExport === "true") {
      const products = await Product.find(query)
        .populate("category_id", "name display_name path")
        .populate("brand_id", "name")
        .sort(sortOptions)
        .lean();

      return NextResponse.json({
        data: products, // Standard format for ShowTable export
        success: true,
      });
    }

    // 4. Standard Paginated Response
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category_id", "name display_name path")
      .populate("brand_id", "name")
      .sort(sortOptions)
      .skip((queryPage - 1) * queryLimit)
      .limit(queryLimit)
      .lean();

    const response = {
      current_page: queryPage,
      last_page: Math.ceil(totalProducts / queryLimit),
      total: totalProducts,
      per_page: queryLimit,
      data: products,
    };

    // Add CORS headers for client site access
    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set("Access-Control-Allow-Origin", "*");
    jsonResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    jsonResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return jsonResponse;
  } catch (error) {
    console.log("Master Product GET error:", error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: "Failed to fetch master products",
        error: error.message,
      },
      { status: 500 }
    );

    // Add CORS headers to error response too
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    errorResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return errorResponse;
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

/**
 * POST /api/product - Create new MASTER product
 */
export async function POST(request) {
  console.log("=== MASTER PRODUCT POST API CALLED ===");
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const formData = await request.formData();
    console.log("📥 Received FormData for Master Product");

    const productDataString = formData.get("data");
    const productData = productDataString ? JSON.parse(productDataString) : {};

    const {
      product_name,
      category_id,
      brand_id,
      product_policies,
      attribute_values,
      variant_values,
      seo_meta_title,
      seo_meta_description,
      // New Fields
      upc,
      ean,
      gtin,
      isbn,
      mpn,
      standard_price,
      allowed_conditions,
      // Related & Upsell
      related_products,
      related_product_config,
      cross_sell_products,
      upsell_product_config,
    } = productData;

    // --- 1. Validation ---
    if (!product_name || !category_id) {
      return NextResponse.json(
        { success: false, message: "Product Name and Category are required." },
        { status: 400 }
      );
    }

    const category = await Category.findById(category_id).lean();
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

    // --- 2. Sanitize Policies (Convert empty strings to null for ObjectIds) ---
    let sanitizedPolicies = { ...product_policies };
    if (sanitizedPolicies) {
      if (!sanitizedPolicies.return_policy)
        sanitizedPolicies.return_policy = null;
      if (!sanitizedPolicies.refund_policy)
        sanitizedPolicies.refund_policy = null;
      if (!sanitizedPolicies.warranty_info)
        sanitizedPolicies.warranty_info = null;
    }

    // --- 3. Validate Mandatory Attributes/Variants ---
    for (const mapping of category.attribute_mapping) {
      if (
        mapping.is_mandatory &&
        !attribute_values?.some((a) => a.attribute_id == mapping.attribute_id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Mandatory attribute for this category is missing.`,
          },
          { status: 400 }
        );
      }
    }
    for (const mapping of category.variant_mapping) {
      if (
        mapping.is_mandatory &&
        !variant_values?.some((v) => v.variant_id == mapping.variant_id)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Mandatory variant for this category is missing.`,
          },
          { status: 400 }
        );
      }
    }

    // --- 4. Generate UPID ---
    const lastProduct = await Product.findOne().sort({ created_at: -1 });
    let nextId = 1;
    if (lastProduct && lastProduct.master_product_code) {
      try {
        const lastIdNum = parseInt(
          lastProduct.master_product_code.split("UPID-")[1]
        );
        if (!isNaN(lastIdNum)) {
          nextId = lastIdNum + 1;
        } else {
          nextId = (await Product.countDocuments()) + 1;
        }
      } catch (e) {
        nextId = (await Product.countDocuments()) + 1;
      }
    }
    const master_product_code = `UPID-${nextId.toString().padStart(6, "0")}`;

    // --- 5. Slug Generation ---
    let slug = product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // --- 6. File Uploads ---
    const media = [];
    const product_thumbnail_file = formData.get("product_thumbnail");
    const product_galleries_files = formData.getAll("product_galleries");
    const new_media_files = formData.getAll("new_media_files");

    try {
      if (product_thumbnail_file && product_thumbnail_file.size > 0) {
        const bytes = await product_thumbnail_file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadToCloudinary(
          [{ buffer, originalname: product_thumbnail_file.name }],
          "products"
        );
        media.push({
          url: uploadResult[0].secure_url,
          is_primary: true,
          type: "image",
        });
      }

      if (product_galleries_files && product_galleries_files.length > 0) {
        for (const galleryFile of product_galleries_files) {
          if (galleryFile && galleryFile.size > 0) {
            const bytes = await galleryFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadResult = await uploadToCloudinary(
              [{ buffer, originalname: galleryFile.name }],
              "products"
            );
            media.push({
              url: uploadResult[0].secure_url,
              is_primary: false,
              type: "image",
            });
          }
        }
      }

      if (new_media_files && new_media_files.length > 0) {
        for (const fileItem of new_media_files) {
          if (fileItem && fileItem.size > 0) {
            const bytes = await fileItem.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uploadResult = await uploadToCloudinary(
              [{ buffer, originalname: fileItem.name }],
              "products"
            );
            media.push({
              url: uploadResult[0].secure_url,
              is_primary: false,
              type: "image",
            });
          }
        }
      }
    } catch (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload images",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    if (media.length > 0 && !media.some((m) => m.is_primary)) {
      media[0].is_primary = true;
    }

    // --- 7. Save New Master Product ---
    const newProduct = new Product({
      master_product_code,
      product_name,
      slug,
      category_id,
      brand_id: brand_id || null,
      status: productData.status || "inactive",

      // New Fields
      upc: upc || null,
      ean: ean || null,
      gtin: gtin || null,
      isbn: isbn || null,
      mpn: mpn || null,
      standard_price: Number(standard_price) || 0,
      allowed_conditions: Array.isArray(allowed_conditions)
        ? allowed_conditions
        : [],

      // Related & Upsell Configuration
      related_products: related_products || [],
      related_product_config: related_product_config || {},
      cross_sell_products: cross_sell_products || [],
      upsell_product_config: upsell_product_config || {},

      // Content & Policies (Sanitized)
      product_policies: sanitizedPolicies,

      internal_notes: productData.internal_notes || "",

      attribute_values: attribute_values || [],
      variant_values: variant_values || [],
      media: media,
      seo_meta_title: seo_meta_title || null,
      seo_meta_description: seo_meta_description || null,
      created_by: authCheck.authData.userId,
      updated_by: authCheck.authData.userId,
    });

    await newProduct.save();
    console.log("✅ Master Product created successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Master Product created successfully",
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Master Product POST error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create master product",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE remains unchanged...
export async function DELETE(request) {
  // ... (Keep existing delete logic)
  console.log("=== MASTER PRODUCT BULK DELETE API CALLED ===");
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product IDs are required" },
        { status: 400 }
      );
    }
    const productsToDelete = await Product.find({ _id: { $in: ids } });
    const imagesToDelete = [];
    productsToDelete.forEach((product) => {
      if (product.media && Array.isArray(product.media)) {
        product.media.forEach((asset) => {
          if (asset.url) imagesToDelete.push(asset.url);
        });
      }
    });
    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        await deleteFromCloudinary(imageUrl).catch((err) =>
          console.error("⚠️ Error deleting image from Cloudinary:", err)
        );
      }
    }
    const result = await Product.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      deleted_count: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete products",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
