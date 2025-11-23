// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/dbConnect";
// import Product from "@/models/Products";
// import Tag from "@/models/Tag";
// import Category from "@/models/Category";
// import Brand from "@/models/Brand";
// import Attribute from "@/models/Attributes";
// import { requireAdmin } from "@/utils/auth/serverAuth";
// import { uploadToCloudinary, deleteFromCloudinary } from "@/utils/cloudinary/cloudinaryService";
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";
// import { existsSync } from "fs";
// import path from "path";

// /**
//  * GET /api/product - Get all products with filtering, searching, sorting and pagination
//  */
// export async function GET(request) {
//   try {
//     await dbConnect();

//     const searchParams = request?.nextUrl?.searchParams;
//     const queryCategory = searchParams.get("category");
//     const querySortBy = searchParams.get("sortBy");
//     const querySearch = searchParams.get("search");
//     const queryTag = searchParams.get("tag");
//     const queryIds = searchParams.get("ids");
//     const queryBrandIds = searchParams.get("brand_ids");
//     const queryStoreIds = searchParams.get("store_ids");
//     const queryProductType = searchParams.get("product_type");
//     const queryCategoryIds = searchParams.get("category_ids");
//     const queryStatus = searchParams.get("status");

//     const queryPage = parseInt(searchParams.get("page")) || 1;
//     const queryLimit = parseInt(searchParams.get("paginate")) || 10;

//     // Build MongoDB query
//     let query = {};

//     // Filter by IDs
//     if (queryIds) {
//       query._id = { $in: queryIds.split(",") };
//     }

//     // Filter by category IDs
//     if (queryCategoryIds) {
//       query.categories = { $in: queryCategoryIds.split(",") };
//     }

//     // Filter by brand IDs
//     if (queryBrandIds) {
//       query.brand_id = { $in: queryBrandIds.split(",") };
//     }

//     // Filter by store IDs
//     if (queryStoreIds) {
//       query.store_id = { $in: queryStoreIds.split(",").map(id => parseInt(id)) };
//     }

//     // Filter by product type
//     if (queryProductType) {
//       query.product_type = queryProductType;
//     }

//     // Filter by status
//     if (queryStatus) {
//       query.status = parseInt(queryStatus);
//     }

//     // Search by name
//     if (querySearch) {
//       query.name = { $regex: querySearch, $options: 'i' };
//     }

//     // Build sort options
//     let sortOptions = {};
//     if (querySortBy === "asc") {
//       sortOptions = { _id: 1 };
//     } else if (querySortBy === "desc") {
//       sortOptions = { _id: -1 };
//     } else if (querySortBy === "a-z") {
//       sortOptions = { name: 1 };
//     } else if (querySortBy === "z-a") {
//       sortOptions = { name: -1 };
//     } else if (querySortBy === "newest") {
//       sortOptions = { created_at: -1 };
//     } else if (querySortBy === "oldest") {
//       sortOptions = { created_at: 1 };
//     } else {
//       sortOptions = { created_at: -1 }; // Default sort
//     }

//     // Execute query with pagination
//     const totalProducts = await Product.countDocuments(query);
//     const products = await Product.find(query)
//       .populate('categories', 'name slug')
//       .populate('tags', 'name slug')
//       .populate('brand_id', 'name slug')
//       .sort(sortOptions)
//       .skip((queryPage - 1) * queryLimit)
//       .limit(queryLimit)
//       .lean();

//     // Calculate pagination info
//     const response = {
//       current_page: queryPage,
//       last_page: Math.ceil(totalProducts / queryLimit),
//       total: totalProducts,
//       per_page: queryLimit,
//       data: products.map(product => ({
//         ...product,
//         id: product._id.toString() // Ensure ID is string
//       }))
//     };

//     return NextResponse.json(response);

//   } catch (error) {
//     console.log("Product GET error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch products", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * POST /api/product - Create new product
//  */
// export async function POST(request) {
//   console.log("=== PRODUCT POST API CALLED ===");
//   try {
//     await dbConnect();

//     // Check admin authentication
//     const authCheck = await requireAdmin(request);
//     if (!authCheck.success) {
//       return authCheck.errorResponse;
//     }

//     // Parse FormData
//     const formData = await request.formData();
//     console.log("📥 Received FormData");

//     // Extract JSON data (sent as a string in 'data' field)
//     const productDataString = formData.get('data');
//     const productData = productDataString ? JSON.parse(productDataString) : {};

//     // Extract files
//     const product_thumbnail_file = formData.get('product_thumbnail');
//     const product_galleries_files = formData.getAll('product_galleries');
//     const size_chart_image_file = formData.get('size_chart_image');
//     const watermark_image_file = formData.get('watermark_image');
//     const product_meta_image_file = formData.get('product_meta_image');

//     console.log("📝 Product data:", { name: productData.name, sku: productData.sku });
//     console.log("📎 Files:", {
//       product_thumbnail: product_thumbnail_file ? product_thumbnail_file.name : 'none',
//       product_galleries: product_galleries_files.length,
//       size_chart_image: size_chart_image_file ? size_chart_image_file.name : 'none',
//       watermark_image: watermark_image_file ? watermark_image_file.name : 'none',
//       product_meta_image: product_meta_image_file ? product_meta_image_file.name : 'none'
//     });

//     // Generate unique SKU if not provided
//     if (!productData.sku) {
//       productData.sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//     }

//     // Generate slug from name if not provided
//     if (!productData.slug && productData.name) {
//       productData.slug = productData.name
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, '-')
//         .replace(/(^-|-$)/g, '');

//       // Ensure slug uniqueness
//       const existingSlug = await Product.findOne({ slug: productData.slug });
//       if (existingSlug) {
//         productData.slug = `${productData.slug}-${Date.now()}`;
//       }
//     }

//     // Set default values
//     productData.status = productData.status || 1;
//     productData.created_by_id = authCheck.authData.userId || "admin";

//     // Auto-increment ID for compatibility
//     const lastProduct = await Product.findOne().sort({ id: -1 }).select('id');
//     productData.id = lastProduct ? lastProduct.id + 1 : 1;

//     // Process file uploads
//     let product_thumbnail_url = null;
//     let product_galleries_urls = [];
//     let size_chart_image_url = null;
//     let watermark_image = null;
//     let product_meta_image_url = null;

//     // Create temp directory if it doesn't exist
//     const uploadDir = join(process.cwd(), 'uploads', 'temp');
//     if (!existsSync(uploadDir)) {
//       await mkdir(uploadDir, { recursive: true });
//     }

//     try {
//       // Upload product_thumbnail
//       if (product_thumbnail_file && product_thumbnail_file.size > 0) {
//         console.log("☁️ Uploading product_thumbnail to Cloudinary...");
//         const bytes = await product_thumbnail_file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const tempPath = join(uploadDir, `product-thumb-${Date.now()}${path.extname(product_thumbnail_file.name)}`);
//         await writeFile(tempPath, buffer);

//         const uploadResult = await uploadToCloudinary([{
//           path: tempPath,
//           originalname: product_thumbnail_file.name
//         }], 'products');

//         product_thumbnail_url = uploadResult[0].secure_url;
//         console.log("✅ Product thumbnail uploaded:", product_thumbnail_url);
//       }

//       // Upload size_chart_image
//       if (size_chart_image_file && size_chart_image_file.size > 0) {
//         console.log("☁️ Uploading size_chart_image to Cloudinary...");
//         const bytes = await size_chart_image_file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const tempPath = join(uploadDir, `size-chart-${Date.now()}${path.extname(size_chart_image_file.name)}`);
//         await writeFile(tempPath, buffer);

//         const uploadResult = await uploadToCloudinary([{
//           path: tempPath,
//           originalname: size_chart_image_file.name
//         }], 'products');

//         size_chart_image_url = uploadResult[0].secure_url;
//         console.log("✅ Size chart image uploaded:", size_chart_image_url);
//       }

//       // Upload watermark_image
//       if (watermark_image_file && watermark_image_file.size > 0) {
//         console.log("☁️ Uploading watermark_image to Cloudinary...");
//         const bytes = await watermark_image_file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const tempPath = join(uploadDir, `watermark-${Date.now()}${path.extname(watermark_image_file.name)}`);
//         await writeFile(tempPath, buffer);

//         const uploadResult = await uploadToCloudinary([{
//           path: tempPath,
//           originalname: watermark_image_file.name
//         }], 'products');

//         watermark_image = uploadResult[0].secure_url;
//         console.log("✅ Watermark image uploaded:", watermark_image);
//       }

//       // Upload product_meta_image
//       if (product_meta_image_file && product_meta_image_file.size > 0) {
//         console.log("☁️ Uploading product_meta_image to Cloudinary...");
//         const bytes = await product_meta_image_file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const tempPath = join(uploadDir, `meta-image-${Date.now()}${path.extname(product_meta_image_file.name)}`);
//         await writeFile(tempPath, buffer);

//         const uploadResult = await uploadToCloudinary([{
//           path: tempPath,
//           originalname: product_meta_image_file.name
//         }], 'products');

//         product_meta_image_url = uploadResult[0].secure_url;
//         console.log("✅ Product meta image uploaded:", product_meta_image_url);
//       }

//       // Upload product_galleries
//       if (product_galleries_files && product_galleries_files.length > 0) {
//         console.log(`☁️ Uploading ${product_galleries_files.length} gallery images to Cloudinary...`);

//         for (const galleryFile of product_galleries_files) {
//           if (galleryFile && galleryFile.size > 0) {
//             const bytes = await galleryFile.arrayBuffer();
//             const buffer = Buffer.from(bytes);
//             const tempPath = join(uploadDir, `product-gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(galleryFile.name)}`);
//             await writeFile(tempPath, buffer);

//             const uploadResult = await uploadToCloudinary([{
//               path: tempPath,
//               originalname: galleryFile.name
//             }], 'products');

//             product_galleries_urls.push(uploadResult[0].secure_url);
//           }
//         }
//         console.log(`✅ Uploaded ${product_galleries_urls.length} gallery images`);
//       }

//       // Upload variation images if present
//       if (productData.variations && Array.isArray(productData.variations)) {
//         for (let i = 0; i < productData.variations.length; i++) {
//           const variationImageFile = formData.get(`variation_image_${i}`);

//           if (variationImageFile && variationImageFile.size > 0) {
//             console.log(`☁️ Uploading variation ${i} image to Cloudinary...`);
//             const bytes = await variationImageFile.arrayBuffer();
//             const buffer = Buffer.from(bytes);
//             const tempPath = join(uploadDir, `variation-${Date.now()}-${i}${path.extname(variationImageFile.name)}`);
//             await writeFile(tempPath, buffer);

//             const uploadResult = await uploadToCloudinary([{
//               path: tempPath,
//               originalname: variationImageFile.name
//             }], 'products/variations');

//             productData.variations[i].variation_image = uploadResult[0].secure_url;
//             console.log(`✅ Variation ${i} image uploaded`);
//           }
//         }
//       }
//     } catch (uploadError) {
//       console.error("❌ Upload error:", uploadError);
//       return NextResponse.json({
//         success: false,
//         message: "Failed to upload images",
//         error: uploadError.message
//       }, { status: 500 });
//     }

//     // Set uploaded URLs in product data
//     productData.product_thumbnail = product_thumbnail_url;
//     productData.product_galleries = product_galleries_urls;
//     productData.size_chart_image = size_chart_image_url;
//     productData.watermark_image = watermark_image;
//     productData.product_meta_image = product_meta_image_url;

//     // Create the product
//     const newProduct = new Product(productData);
//     await newProduct.save();
//     console.log("✅ Product created successfully");

//     // Populate relations for response
//     const populatedProduct = await Product.findById(newProduct._id)
//       .populate('categories', 'name slug')
//       .populate('tags', 'name slug')
//       .populate('brand_id', 'name slug');

//     return NextResponse.json({
//       success: true,
//       message: "Product created successfully",
//       data: populatedProduct
//     }, { status: 201 });

//   } catch (error) {
//     console.error("❌ Product POST error:", error);

//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return NextResponse.json(
//         { success: false, message: "Validation failed", errors: validationErrors },
//         { status: 400 }
//       );
//     }

//     // Handle duplicate key errors
//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyPattern)[0];
//       return NextResponse.json(
//         { success: false, message: `${duplicateField} already exists` },
//         { status: 409 }
//       );
//     }

//     return NextResponse.json(
//       { success: false, message: "Failed to create product", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * DELETE /api/product - Bulk delete products
//  */
// export async function DELETE(request) {
//   console.log("=== PRODUCT BULK DELETE API CALLED ===");
//   try {
//     await dbConnect();

//     // Check admin authentication
//     const authCheck = await requireAdmin(request);
//     if (!authCheck.success) {
//       return authCheck.errorResponse;
//     }

//     const { ids } = await request.json();

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return NextResponse.json(
//         { success: false, message: "Product IDs are required" },
//         { status: 400 }
//       );
//     }

//     // Find all products to delete
//     const productsToDelete = await Product.find({ _id: { $in: ids } });

//     // Collect all images to delete from Cloudinary
//     const imagesToDelete = [];

//     productsToDelete.forEach(product => {
//       // Add product thumbnail
//       if (product.product_thumbnail) {
//         imagesToDelete.push(product.product_thumbnail);
//       }

//       // Add product galleries
//       if (product.product_galleries && Array.isArray(product.product_galleries)) {
//         imagesToDelete.push(...product.product_galleries);
//       }

//       // Add size chart image
//       if (product.size_chart_image) {
//         imagesToDelete.push(product.size_chart_image);
//       }

//       // Add watermark image
//       if (product.watermark_image) {
//         imagesToDelete.push(product.watermark_image);
//       }

//       // Add product meta image
//       if (product.product_meta_image) {
//         imagesToDelete.push(product.product_meta_image);
//       }

//       // Add variation images
//       if (product.variations && Array.isArray(product.variations)) {
//         product.variations.forEach(variation => {
//           if (variation.variation_image) {
//             imagesToDelete.push(variation.variation_image);
//           }
//           if (variation.variation_galleries && Array.isArray(variation.variation_galleries)) {
//             imagesToDelete.push(...variation.variation_galleries);
//           }
//         });
//       }
//     });

//     // Delete all images from Cloudinary
//     if (imagesToDelete.length > 0) {
//       console.log(`🗑️ Deleting ${imagesToDelete.length} images from Cloudinary`);
//       for (const imageUrl of imagesToDelete) {
//         await deleteFromCloudinary(imageUrl).catch(err =>
//           console.error("⚠️ Error deleting image from Cloudinary:", err)
//         );
//       }
//       console.log("✅ All images deleted from Cloudinary");
//     }

//     // Hard delete - permanently remove from database
//     const result = await Product.deleteMany(
//       { _id: { $in: ids } }
//     );

//     console.log(`✅ Deleted ${result.deletedCount} products from database`);

//     return NextResponse.json({
//       success: true,
//       message: `${result.deletedCount} products deleted successfully`,
//       deleted_count: result.deletedCount
//     });

//   } catch (error) {
//     console.error("❌ Product DELETE error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to delete products", error: error.message },
//       { status: 500 }
//     );
//   }
// }

//---------------------------------------------//  ABOVE IS THE PREVIOUS CODE  /---------------------------------------------//

import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products"; // Now references the Master Product Schema
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import { requireAdmin } from "@/utils/auth/serverAuth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";

/**
 * GET /api/product - Get all MASTER products
 */
export async function GET(request) {
  try {
    await dbConnect();

    // Admin check (listing master products is an admin task)
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const searchParams = request?.nextUrl?.searchParams;
    const querySearch = searchParams.get("search");
    const queryPage = parseInt(searchParams.get("page")) || 1;
    const queryLimit = parseInt(searchParams.get("paginate")) || 10;

    let query = {};

    // Search by product name or master product code
    if (querySearch) {
      query.$or = [
        { product_name: { $regex: querySearch, $options: "i" } },
        { master_product_code: { $regex: querySearch, $options: "i" } },
      ];
    }

    // Default sort: newest first
    const sortOptions = { created_at: -1 };

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

    return NextResponse.json(response);
  } catch (error) {
    console.log("Master Product GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch master products",
        error: error.message,
      },
      { status: 500 }
    );
  }
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
    } = productData;

    // --- 1. Validation (Deliverable 4 Workflow) ---
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

    // --- 2. Validate Mandatory Attributes/Variants (Deliverable 3 Requirement) ---
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

    // --- 3. Generate UPID (master_product_code) (Deliverable 4 Requirement) ---
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
    console.log(`Generated new UPID: ${master_product_code}`);

    // --- 4. Slug Generation ---
    let slug = product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // --- 5. File Uploads (Mapping to 'media' array) ---
    const media = [];
    const product_thumbnail_file = formData.get("product_thumbnail");
    const product_galleries_files = formData.getAll("product_galleries");
    // Support new front-end field `new_media_files` (multiple files appended as same key)
    const new_media_files = formData.getAll("new_media_files");

    try {
      // Upload Thumbnail using Buffer (Vercel compatible)
      if (product_thumbnail_file && product_thumbnail_file.size > 0) {
        console.log("☁️ Uploading thumbnail...");
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
        console.log("✅ Thumbnail uploaded");
      }

      // Upload Galleries using Buffer (Vercel compatible)
      if (product_galleries_files && product_galleries_files.length > 0) {
        console.log(
          `☁️ Uploading ${product_galleries_files.length} gallery images...`
        );
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
        console.log(`✅ Uploaded ${media.length - 1} gallery images`);
      }

      // Upload any `new_media_files` sent by the front-end (master product form)
      if (new_media_files && new_media_files.length > 0) {
        console.log(
          `☁️ Uploading ${new_media_files.length} new_media_files...`
        );
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
        console.log(`✅ Uploaded ${new_media_files.length} new media files`);
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

    // If no explicit primary image was set but we have uploaded media,
    // mark the first media item as primary so front-end components show an image.
    if (media.length > 0 && !media.some((m) => m.is_primary)) {
      media[0].is_primary = true;
    }

    // --- 6. Save New Master Product ---
    const newProduct = new Product({
      master_product_code,
      product_name,
      slug,
      category_id,
      brand_id: brand_id || null,
      status: productData.status || "inactive",
      product_policies: product_policies || {},
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
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: `A product with this ${
            Object.keys(error.keyPattern)[0]
          } already exists`,
        },
        { status: 409 }
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

/**
 * DELETE /api/product - Bulk delete MASTER products
 */
export async function DELETE(request) {
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

    // Find products to get image URLs
    const productsToDelete = await Product.find({ _id: { $in: ids } });

    // Collect images from the 'media' array
    const imagesToDelete = [];
    productsToDelete.forEach((product) => {
      if (product.media && Array.isArray(product.media)) {
        product.media.forEach((asset) => {
          if (asset.url) imagesToDelete.push(asset.url);
        });
      }
    });

    // Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      console.log(
        `🗑️ Deleting ${imagesToDelete.length} images from Cloudinary`
      );
      for (const imageUrl of imagesToDelete) {
        await deleteFromCloudinary(imageUrl).catch((err) =>
          console.error("⚠️ Error deleting image from Cloudinary:", err)
        );
      }
      console.log("✅ All images deleted from Cloudinary");
    }

    // Delete products from database
    const result = await Product.deleteMany({ _id: { $in: ids } });
    console.log(`✅ Deleted ${result.deletedCount} products from database`);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      deleted_count: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Product DELETE error:", error);
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
