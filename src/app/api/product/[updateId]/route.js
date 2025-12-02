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
//  * GET /api/product/[id] - Get single product by ID
//  */
// export async function GET(request, { params }) {
//   try {
//     await dbConnect();

//     const { updateId } = await params;

//     if (!updateId) {
//       return NextResponse.json(
//         { success: false, message: "Product ID is required" },
//         { status: 400 }
//       );
//     }

//     const product = await Product.findOne({
//       _id: updateId // Exclude soft-deleted products
//     })
//       .populate('categories', 'name slug')
//       .populate('tags', 'name slug')
//       .populate('brand_id', 'name slug')
//       .populate('related_products', 'name slug price product_thumbnail')
//       .populate('cross_sell_products', 'name slug price product_thumbnail')
//       .populate('attributes');

//     if (!product) {
//       return NextResponse.json(
//         { success: false, message: "Product not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       data: product
//     });

//   } catch (error) {
//     console.error("Product GET single error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch product", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * PUT /api/product/[id] - Update product by ID
//  */
// export async function PUT(request, { params }) {
//   console.log("=== PRODUCT PUT API CALLED ===");
//   try {
//     await dbConnect();

//     // Check admin authentication
//     const authCheck = await requireAdmin(request);
//     if (!authCheck.success) {
//       return authCheck.errorResponse;
//     }

//     const { updateId } = await params;

//     if (!updateId) {
//       return NextResponse.json(
//         { success: false, message: "Product ID is required" },
//         { status: 400 }
//       );
//     }

//     // Find existing product
//     const existingProduct = await Product.findById(updateId);
//     if (!existingProduct) {
//       return NextResponse.json(
//         { success: false, message: "Product not found" },
//         { status: 404 }
//       );
//     }

//     // Parse FormData
//     const formData = await request.formData();
//     console.log("📥 Received FormData for update");

//     // Extract JSON data
//     const productDataString = formData.get('data');
//     const updateData = productDataString ? JSON.parse(productDataString) : {};

//     // Extract files
//     const product_thumbnail_file = formData.get('product_thumbnail');
//     const product_galleries_files = formData.getAll('product_galleries');
//     const size_chart_image_file = formData.get('size_chart_image');
//     const watermark_image_file = formData.get('watermark_image');
//     const product_meta_image_file = formData.get('product_meta_image');
//     const delete_product_thumbnail = formData.get('delete_product_thumbnail') === 'true';
//     const delete_size_chart_image = formData.get('delete_size_chart_image') === 'true';
//     const delete_watermark_image = formData.get('delete_watermark_image') === 'true';
//     const delete_product_meta_image = formData.get('delete_product_meta_image') === 'true';
//     const delete_gallery_urls = formData.get('delete_galleries');

//     console.log("📝 Update data:", { name: updateData.name, sku: updateData.sku });
//     console.log("📎 Files:", {
//       product_thumbnail: product_thumbnail_file ? product_thumbnail_file.name : 'none',
//       product_galleries: product_galleries_files.length,
//       size_chart_image: size_chart_image_file ? size_chart_image_file.name : 'none',
//       watermark_image: watermark_image_file ? watermark_image_file.name : 'none',
//       product_meta_image: product_meta_image_file ? product_meta_image_file.name : 'none',
//       delete_thumbnail: delete_product_thumbnail
//     });

//     // Remove _method if present (from frontend form handling)
//     delete updateData._method;

//     // If updating slug, ensure uniqueness
//     if (updateData.slug) {
//       const existingSlug = await Product.findOne({
//         slug: updateData.slug,
//         _id: { $ne: updateId }
//       });
//       if (existingSlug) {
//         updateData.slug = `${updateData.slug}-${Date.now()}`;
//       }
//     }

//     // If updating SKU, ensure uniqueness
//     if (updateData.sku) {
//       const existingSku = await Product.findOne({
//         sku: updateData.sku,
//         _id: { $ne: updateId }
//       });
//       if (existingSku) {
//         return NextResponse.json(
//           { success: false, message: "SKU already exists" },
//           { status: 409 }
//         );
//       }
//     }

//     // Create temp directory if it doesn't exist
//     const uploadDir = join(process.cwd(), 'uploads', 'temp');
//     if (!existsSync(uploadDir)) {
//       await mkdir(uploadDir, { recursive: true });
//     }

//     // Handle image updates
//     let product_thumbnail_url = existingProduct.product_thumbnail;
//     let product_galleries_urls = existingProduct.product_galleries || [];
//     let size_chart_image_url = existingProduct.size_chart_image;
//     let watermark_image_url = existingProduct.watermark_image;
//     let product_meta_image_url = existingProduct.product_meta_image;

//     try {
//       // Handle product_thumbnail update
//       if (product_thumbnail_file && product_thumbnail_file.size > 0) {
//         console.log("☁️ Uploading new product_thumbnail...");
//         // Delete old thumbnail if exists
//         if (existingProduct.product_thumbnail) {
//           console.log("🗑️ Deleting old product_thumbnail from Cloudinary");
//           await deleteFromCloudinary(existingProduct.product_thumbnail).catch(err =>
//             console.error("⚠️ Error deleting old thumbnail:", err)
//           );
//         }
//         // Upload new thumbnail
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
//       } else if (delete_product_thumbnail && existingProduct.product_thumbnail) {
//         console.log("🗑️ Deleting product_thumbnail from Cloudinary");
//         await deleteFromCloudinary(existingProduct.product_thumbnail).catch(err =>
//           console.error("⚠️ Error deleting thumbnail:", err)
//         );
//         product_thumbnail_url = null;
//       }

//       // Handle size_chart_image update
//       if (size_chart_image_file && size_chart_image_file.size > 0) {
//         console.log("☁️ Uploading new size_chart_image...");
//         if (existingProduct.size_chart_image) {
//           console.log("🗑️ Deleting old size_chart_image from Cloudinary");
//           await deleteFromCloudinary(existingProduct.size_chart_image).catch(err =>
//             console.error("⚠️ Error deleting old size chart:", err)
//           );
//         }
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
//       } else if (delete_size_chart_image && existingProduct.size_chart_image) {
//         console.log("🗑️ Deleting size_chart_image from Cloudinary");
//         await deleteFromCloudinary(existingProduct.size_chart_image).catch(err =>
//           console.error("⚠️ Error deleting size chart:", err)
//         );
//         size_chart_image_url = null;
//       }

//       // Handle watermark_image update
//       if (watermark_image_file && watermark_image_file.size > 0) {
//         console.log("☁️ Uploading new watermark_image...");
//         if (existingProduct.watermark_image) {
//           console.log("🗑️ Deleting old watermark_image from Cloudinary");
//           await deleteFromCloudinary(existingProduct.watermark_image).catch(err =>
//             console.error("⚠️ Error deleting old watermark:", err)
//           );
//         }
//         const bytes = await watermark_image_file.arrayBuffer();
//         const buffer = Buffer.from(bytes);
//         const tempPath = join(uploadDir, `watermark-${Date.now()}${path.extname(watermark_image_file.name)}`);
//         await writeFile(tempPath, buffer);

//         const uploadResult = await uploadToCloudinary([{
//           path: tempPath,
//           originalname: watermark_image_file.name
//         }], 'products');

//         watermark_image_url = uploadResult[0].secure_url;
//         console.log("✅ Watermark image uploaded:", watermark_image_url);
//       } else if (delete_watermark_image && existingProduct.watermark_image) {
//         console.log("🗑️ Deleting watermark_image from Cloudinary");
//         await deleteFromCloudinary(existingProduct.watermark_image).catch(err =>
//           console.error("⚠️ Error deleting watermark:", err)
//         );
//         watermark_image_url = null;
//       }

//       // Handle product_meta_image update
//       if (product_meta_image_file && product_meta_image_file.size > 0) {
//         console.log("☁️ Uploading new product_meta_image...");
//         if (existingProduct.product_meta_image) {
//           console.log("🗑️ Deleting old product_meta_image from Cloudinary");
//           await deleteFromCloudinary(existingProduct.product_meta_image).catch(err =>
//             console.error("⚠️ Error deleting old meta image:", err)
//           );
//         }
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
//       } else if (delete_product_meta_image && existingProduct.product_meta_image) {
//         console.log("🗑️ Deleting product_meta_image from Cloudinary");
//         await deleteFromCloudinary(existingProduct.product_meta_image).catch(err =>
//           console.error("⚠️ Error deleting meta image:", err)
//         );
//         product_meta_image_url = null;
//       }

//       // Handle galleries deletion
//       if (delete_gallery_urls) {
//         const urlsToDelete = JSON.parse(delete_gallery_urls);
//         console.log(`🗑️ Deleting ${urlsToDelete.length} gallery images from Cloudinary`);
//         for (const url of urlsToDelete) {
//           await deleteFromCloudinary(url).catch(err =>
//             console.error("⚠️ Error deleting gallery image:", err)
//           );
//           product_galleries_urls = product_galleries_urls.filter(gUrl => gUrl !== url);
//         }
//       }

//       // Handle new gallery images
//       if (product_galleries_files && product_galleries_files.length > 0) {
//         console.log(`☁️ Uploading ${product_galleries_files.length} new gallery images...`);

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
//         console.log(`✅ Uploaded ${product_galleries_files.length} gallery images`);
//       }

//       // Handle variation images
//       if (updateData.variations && Array.isArray(updateData.variations)) {
//         for (let i = 0; i < updateData.variations.length; i++) {
//           const variationImageFile = formData.get(`variation_image_${i}`);
//           const deleteVariationImage = formData.get(`delete_variation_image_${i}`) === 'true';

//           if (variationImageFile && variationImageFile.size > 0) {
//             console.log(`☁️ Uploading variation ${i} image...`);

//             // Delete old variation image if exists
//             if (existingProduct.variations[i]?.variation_image) {
//               await deleteFromCloudinary(existingProduct.variations[i].variation_image).catch(err =>
//                 console.error("⚠️ Error deleting old variation image:", err)
//               );
//             }

//             const bytes = await variationImageFile.arrayBuffer();
//             const buffer = Buffer.from(bytes);
//             const tempPath = join(uploadDir, `variation-${Date.now()}-${i}${path.extname(variationImageFile.name)}`);
//             await writeFile(tempPath, buffer);

//             const uploadResult = await uploadToCloudinary([{
//               path: tempPath,
//               originalname: variationImageFile.name
//             }], 'products/variations');

//             updateData.variations[i].variation_image = uploadResult[0].secure_url;
//             console.log(`✅ Variation ${i} image uploaded`);
//           } else if (deleteVariationImage && existingProduct.variations[i]?.variation_image) {
//             console.log(`🗑️ Deleting variation ${i} image from Cloudinary`);
//             await deleteFromCloudinary(existingProduct.variations[i].variation_image).catch(err =>
//               console.error("⚠️ Error deleting variation image:", err)
//             );
//             updateData.variations[i].variation_image = null;
//           }
//         }
//       }
//     } catch (uploadError) {
//       console.error("❌ Upload error:", uploadError);
//       return NextResponse.json({
//         success: false,
//         message: "Failed to process images",
//         error: uploadError.message
//       }, { status: 500 });
//     }

//     // Set uploaded URLs in update data
//     updateData.product_thumbnail = product_thumbnail_url;
//     updateData.product_galleries = product_galleries_urls;
//     updateData.size_chart_image = size_chart_image_url;
//     updateData.watermark_image = watermark_image_url;
//     updateData.product_meta_image = product_meta_image_url;

//     // Update the product
//     const updatedProduct = await Product.findByIdAndUpdate(
//       updateId,
//       {
//         ...updateData,
//         updated_at: new Date()
//       },
//       {
//         new: true,
//         runValidators: true
//       }
//     ).populate('categories', 'name slug')
//      .populate('tags', 'name slug');

//     if (!updatedProduct) {
//       return NextResponse.json(
//         { success: false, message: "Product not found" },
//         { status: 404 }
//       );
//     }

//     console.log("✅ Product updated successfully");

//     return NextResponse.json({
//       success: true,
//       message: "Product updated successfully",
//       data: updatedProduct
//     });

//   } catch (error) {
//     console.error("❌ Product PUT error:", error);

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
//       { success: false, message: "Failed to update product", error: error.message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * DELETE /api/product/[id] - Delete single product by ID
//  */
// export async function DELETE(request, { params }) {
//   console.log("=== PRODUCT DELETE API CALLED ===");
//   try {
//     await dbConnect();

//     // Check admin authentication
//     const authCheck = await requireAdmin(request);
//     if (!authCheck.success) {
//       return authCheck.errorResponse;
//     }

//     const { updateId } = await params;

//     if (!updateId) {
//       return NextResponse.json(
//         { success: false, message: "Product ID is required" },
//         { status: 400 }
//       );
//     }

//     // Find the product to delete
//     const productToDelete = await Product.findById(updateId);

//     if (!productToDelete) {
//       return NextResponse.json(
//         { success: false, message: "Product not found" },
//         { status: 404 }
//       );
//     }

//     // Delete images from Cloudinary before deleting product
//     const imagesToDelete = [];

//     // Add product thumbnail
//     if (productToDelete.product_thumbnail) {
//       imagesToDelete.push(productToDelete.product_thumbnail);
//     }

//     // Add product galleries
//     if (productToDelete.product_galleries && Array.isArray(productToDelete.product_galleries)) {
//       imagesToDelete.push(...productToDelete.product_galleries);
//     }

//     // Add size chart image
//     if (productToDelete.size_chart_image) {
//       imagesToDelete.push(productToDelete.size_chart_image);
//     }

//     // Add watermark image
//     if (productToDelete.watermark_image) {
//       imagesToDelete.push(productToDelete.watermark_image);
//     }

//     // Add product meta image
//     if (productToDelete.product_meta_image) {
//       imagesToDelete.push(productToDelete.product_meta_image);
//     }

//     // Add variation images
//     if (productToDelete.variations && Array.isArray(productToDelete.variations)) {
//       productToDelete.variations.forEach(variation => {
//         if (variation.variation_image) {
//           imagesToDelete.push(variation.variation_image);
//         }
//         // Add variation galleries if they exist
//         if (variation.variation_galleries && Array.isArray(variation.variation_galleries)) {
//           imagesToDelete.push(...variation.variation_galleries);
//         }
//       });
//     }

//     if (imagesToDelete.length > 0) {
//       console.log(`🗑️ Deleting ${imagesToDelete.length} images from Cloudinary`);
//       for (const imageUrl of imagesToDelete) {
//         await deleteFromCloudinary(imageUrl).catch(err =>
//           console.error("⚠️ Error deleting image from Cloudinary:", err)
//         );
//       }
//       console.log("✅ All images deleted from Cloudinary");
//     }

//     // Delete the product
//     const deletedProduct = await Product.findOneAndDelete({ _id: updateId });

//     if (!deletedProduct) {
//       return NextResponse.json(
//         { success: false, message: "Product not found" },
//         { status: 404 }
//       );
//     }

//     console.log("✅ Product deleted from database");

//     return NextResponse.json({
//       success: true,
//       message: "Product deleted successfully",
//       data: { id: deletedProduct._id }
//     });

//   } catch (error) {
//     console.error("❌ Product DELETE single error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to delete product", error: error.message },
//       { status: 500 }
//     );
//   }
// }

//----------------- NEW CODE BELOW THIS LINE ------------------
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Products";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import Attribute from "@/models/Attributes"; // Corrected import (plural)
import Variant from "@/models/Variant";
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
    const { updateId } = params;

    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Find the Master Product and populate its new relational fields
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

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Master Product GET single error:", error);
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

    const { updateId } = params;
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

    // Check Content-Type to determine if it's a simple status toggle or full form update
    const contentType = request.headers.get("content-type") || "";
    const isSimpleUpdate = contentType.includes("application/json");

    let updateData = {};
    let isFormDataUpdate = false;

    if (isSimpleUpdate) {
      // Simple JSON update (e.g., status toggle from table)
      console.log("📥 Received JSON update (status toggle)");
      updateData = await request.json();
      console.log("📝 Status update data:", updateData);

      // Convert numeric status (0/1) to string status (inactive/active) if needed
      if (updateData.status !== undefined) {
        if (typeof updateData.status === "number") {
          const newStatus = updateData.status === 1 ? "active" : "inactive";
          console.log(
            `🔄 Converting numeric status ${updateData.status} to string '${newStatus}'`
          );
          updateData.status = newStatus;
        }
      }
    } else {
      // Full FormData update (from product form)
      console.log("📥 Received FormData for Master Product update");
      isFormDataUpdate = true;
      const formData = await request.formData();
      const productDataString = formData.get("data");
      updateData = productDataString ? JSON.parse(productDataString) : {};
      // Store formData for later file processing
      updateData._formData = formData;

      console.log("📝 Form update data:", {
        product_name: updateData.product_name,
        category_id: updateData.category_id,
        brand_id: updateData.brand_id,
        status: updateData.status,
        media_count: updateData.media?.length || 0,
        has_policies: !!updateData.product_policies,
        seo_title: updateData.seo_meta_title,
      });
    }

    // --- FIX: Handle empty brand_id (only for form updates) ---
    if (isFormDataUpdate && updateData.brand_id === "") {
      updateData.brand_id = null;
    }

    // --- 1. Validation (only for form updates with category changes) ---
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

    // --- 2. Slug Update (only for form updates with name changes) ---
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

    // --- 3. File Uploads & Management (only for FormData updates) ---
    if (isFormDataUpdate) {
      const formData = updateData._formData;
      delete updateData._formData; // Remove temporary reference

      const uploadDir = join(process.cwd(), "uploads", "temp");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Start with the media array sent from frontend (what user wants to keep)
      let currentMedia = updateData.media || existingProduct.media || [];

      try {
        // 3a. Delete marked images from Cloudinary
        const deleteMediaUrls = JSON.parse(
          formData.get("delete_media_urls") || "[]"
        );
        if (deleteMediaUrls.length > 0) {
          console.log(
            `🗑️ Deleting ${deleteMediaUrls.length} images from Cloudinary...`
          );
          for (const url of deleteMediaUrls) {
            await deleteFromCloudinary(url).catch((err) =>
              console.error("⚠️ Error deleting image:", err)
            );
          }
          // Remove deleted images from current media array
          currentMedia = currentMedia.filter(
            (asset) => !deleteMediaUrls.includes(asset.url)
          );
        }

        // 3b. Upload new files
        const newMediaFiles = formData.getAll("new_media_files");
        if (newMediaFiles && newMediaFiles.length > 0) {
          console.log(
            `☁️ Uploading ${newMediaFiles.length} new media files...`
          );
          for (const file of newMediaFiles) {
            if (file && file.size > 0) {
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const tempPath = join(
                uploadDir,
                `master-media-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}${path.extname(file.name)}`
              );
              await writeFile(tempPath, buffer);

              const uploadResult = await uploadToCloudinary(
                [{ path: tempPath, originalname: file.name }],
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

        // 3c. Ensure one image is primary
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

    // --- 4. Save Update ---
    updateData.updated_by = authCheck.authData.userId;

    const updatedProduct = await Product.findByIdAndUpdate(
      updateId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("category_id", "name display_name")
      .populate("brand_id", "name");

    console.log("✅ Master Product updated successfully");
    console.log("📊 Updated product details:", {
      id: updatedProduct._id,
      product_name: updatedProduct.product_name,
      category: updatedProduct.category_id?.name,
      brand: updatedProduct.brand_id?.name,
      status: updatedProduct.status,
      media_count: updatedProduct.media?.length || 0,
    });

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

// DELETE handler remains unchanged
export async function DELETE(request, { params }) {
  // ... (Same as before)
  console.log("=== MASTER PRODUCT DELETE API CALLED ===");
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }
    const { updateId } = params;
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
      console.log(
        `🗑️ Deleting ${imagesToDelete.length} images from Cloudinary...`
      );
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
    console.error("❌ Master Product DELETE single error:", error);
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
