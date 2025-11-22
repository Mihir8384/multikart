import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import { requireAdmin } from "@/utils/auth/serverAuth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";
import path from "path";

// GET single brand by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { updateId } = await params;

    if (!updateId) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID is required",
          data: null,
        },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(updateId);

    if (!brand || brand.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Brand retrieved successfully",
      data: brand,
    });
  } catch (error) {
    console.log("Error fetching brand:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        data: null,
      },
      { status: 500 }
    );
  }
}

// UPDATE brand by ID
export async function PUT(request, { params }) {
  console.log("=== BRAND PUT API CALLED ===");
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { updateId } = await params;

    if (!updateId) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID is required",
          data: null,
        },
        { status: 400 }
      );
    }

    // Find existing brand
    const brand = await Brand.findById(updateId);
    if (!brand || brand.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
          data: null,
        },
        { status: 404 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    console.log("📥 Received FormData for update");

    // Extract text fields
    const name = formData.get("name");
    const meta_title = formData.get("meta_title");
    const meta_description = formData.get("meta_description");
    const status = formData.get("status");

    // Extract files
    const brand_image_file = formData.get("brand_image");
    const brand_banner_file = formData.get("brand_banner");
    const brand_meta_image_file = formData.get("brand_meta_image");

    // Extract delete flags (for removing images without uploading new ones)
    const delete_brand_image = formData.get("delete_brand_image") === "true";
    const delete_brand_banner = formData.get("delete_brand_banner") === "true";
    const delete_brand_meta_image =
      formData.get("delete_brand_meta_image") === "true";

    console.log("📝 Fields:", { name, meta_title, meta_description, status });
    console.log("📎 Files:", {
      brand_image: brand_image_file ? brand_image_file.name : "none",
      brand_banner: brand_banner_file ? brand_banner_file.name : "none",
      brand_meta_image: brand_meta_image_file
        ? brand_meta_image_file.name
        : "none",
    });
    console.log("🗑️ Delete flags:", {
      delete_brand_image,
      delete_brand_banner,
      delete_brand_meta_image,
    });

    // Check if name is taken by another brand
    if (name && name !== brand.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const existingBrand = await Brand.findOne({
        $or: [{ name: name }, { slug: slug }],
        _id: { $ne: updateId },
        deleted_at: null,
      });
      if (existingBrand) {
        return NextResponse.json(
          {
            success: false,
            message: "Brand name is already taken by another brand",
            data: null,
          },
          { status: 400 }
        );
      }
    }

    // Handle image updates
    let brand_image_url = brand.brand_image;
    let brand_banner_url = brand.brand_banner;
    let brand_meta_image_url = brand.brand_meta_image;

    try {
      // Handle brand_image update
      if (brand_image_file && brand_image_file.size > 0) {
        console.log("☁️ Uploading new brand_image...");
        // Delete old image if exists
        if (brand.brand_image) {
          console.log("🗑️ Deleting old brand_image from Cloudinary");
          await deleteFromCloudinary(brand.brand_image).catch((err) =>
            console.error("⚠️ Error deleting old brand_image:", err)
          );
        }
        // Upload new image
        const bytes = await brand_image_file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToCloudinary(
          [
            {
              buffer,
              originalname: brand_image_file.name,
            },
          ],
          "brands"
        );

        brand_image_url = uploadResult[0].secure_url;
        console.log("✅ Brand image uploaded:", brand_image_url);
      } else if (delete_brand_image && brand.brand_image) {
        // Delete without uploading new one
        console.log("🗑️ Deleting brand_image from Cloudinary");
        await deleteFromCloudinary(brand.brand_image).catch((err) =>
          console.error("⚠️ Error deleting brand_image:", err)
        );
        brand_image_url = null;
      }

      // Handle brand_banner update
      if (brand_banner_file && brand_banner_file.size > 0) {
        console.log("☁️ Uploading new brand_banner...");
        // Delete old banner if exists
        if (brand.brand_banner) {
          console.log("🗑️ Deleting old brand_banner from Cloudinary");
          await deleteFromCloudinary(brand.brand_banner).catch((err) =>
            console.error("⚠️ Error deleting old brand_banner:", err)
          );
        }
        // Upload new banner
        const bytes = await brand_banner_file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToCloudinary(
          [
            {
              buffer,
              originalname: brand_banner_file.name,
            },
          ],
          "brands"
        );

        brand_banner_url = uploadResult[0].secure_url;
        console.log("✅ Brand banner uploaded:", brand_banner_url);
      } else if (delete_brand_banner && brand.brand_banner) {
        // Delete without uploading new one
        console.log("🗑️ Deleting brand_banner from Cloudinary");
        await deleteFromCloudinary(brand.brand_banner).catch((err) =>
          console.error("⚠️ Error deleting brand_banner:", err)
        );
        brand_banner_url = null;
      }

      // Handle brand_meta_image update
      if (brand_meta_image_file && brand_meta_image_file.size > 0) {
        console.log("☁️ Uploading new brand_meta_image...");
        // Delete old meta image if exists
        if (brand.brand_meta_image) {
          console.log("🗑️ Deleting old brand_meta_image from Cloudinary");
          await deleteFromCloudinary(brand.brand_meta_image).catch((err) =>
            console.error("⚠️ Error deleting old brand_meta_image:", err)
          );
        }
        // Upload new meta image
        const bytes = await brand_meta_image_file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResult = await uploadToCloudinary(
          [
            {
              buffer,
              originalname: brand_meta_image_file.name,
            },
          ],
          "brands"
        );

        brand_meta_image_url = uploadResult[0].secure_url;
        console.log("✅ Brand meta image uploaded:", brand_meta_image_url);
      } else if (delete_brand_meta_image && brand.brand_meta_image) {
        // Delete without uploading new one
        console.log("🗑️ Deleting brand_meta_image from Cloudinary");
        await deleteFromCloudinary(brand.brand_meta_image).catch((err) =>
          console.error("⚠️ Error deleting brand_meta_image:", err)
        );
        brand_meta_image_url = null;
      }
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

    // Prepare update data
    const updateData = {
      ...(name && {
        name,
        slug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      }),
      brand_image: brand_image_url,
      brand_banner: brand_banner_url,
      brand_meta_image: brand_meta_image_url,
      ...(meta_title !== undefined && meta_title !== null && { meta_title }),
      ...(meta_description !== undefined &&
        meta_description !== null && { meta_description }),
      ...(status !== undefined &&
        status !== null && { status: Number(status) }),
      updated_at: new Date(),
    };

    const updatedBrand = await Brand.findByIdAndUpdate(updateId, updateData, {
      new: true,
    });
    console.log("✅ Brand updated successfully");

    return NextResponse.json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error) {
    console.log("❌ Error updating brand:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}

// DELETE brand by ID
export async function DELETE(request, { params }) {
  console.log("=== BRAND DELETE API CALLED ===");
  try {
    await dbConnect();

    // Get user info from middleware headers
    const isAdmin = request.headers.get("x-is-admin") === "true";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Only administrators can delete brands.",
          data: null,
        },
        { status: 403 }
      );
    }

    const { updateId } = await params;

    if (!updateId) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand ID is required",
          data: null,
        },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(updateId);

    if (!brand || brand.deleted_at) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand not found",
          data: null,
        },
        { status: 404 }
      );
    }

    // Delete images from Cloudinary before deleting brand
    const imagesToDelete = [];
    if (brand.brand_image) imagesToDelete.push(brand.brand_image);
    if (brand.brand_banner) imagesToDelete.push(brand.brand_banner);
    if (brand.brand_meta_image) imagesToDelete.push(brand.brand_meta_image);

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

    // Hard delete - remove from database permanently
    await Brand.findByIdAndDelete(updateId);
    console.log("✅ Brand deleted from database");

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
      data: null,
    });
  } catch (error) {
    console.log("❌ Error deleting brand:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}
