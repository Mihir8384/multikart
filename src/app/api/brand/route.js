import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Brand from "@/models/Brand";
import { requireAdmin } from "@/utils/auth/serverAuth";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";
import path from "path";

export async function GET(request) {
  console.log("=== BRAND GET API CALLED ===");
  try {
    await dbConnect();
    const searchParams = request?.nextUrl?.searchParams;
    const queryCategory = searchParams.get("category");
    const querySortBy = searchParams.get("sortBy");
    const querySearch = searchParams.get("search");
    const queryTag = searchParams.get("tag");
    const queryIds = searchParams.get("ids");

    const queryPage = parseInt(searchParams.get("page")) || 1; // default to page 1
    const queryLimit = parseInt(searchParams.get("paginate")) || 10; // default to 10 items per page

    let brands = await Brand.find({ deleted_at: null }).lean();

    // Filtering logic
    if (querySortBy || querySearch || queryIds) {
      if (queryIds) {
        brands = brands.filter((brand) =>
          queryIds.split(",").includes(brand?._id?.toString())
        );
      }

      // Search filter by name
      if (querySearch) {
        brands = brands.filter((brand) =>
          brand.name.toLowerCase().includes(querySearch.toLowerCase())
        );
      }

      // Sort logic
      if (querySortBy === "asc") {
        brands = brands.sort((a, b) => a.name.localeCompare(b.name));
      } else if (querySortBy === "desc") {
        brands = brands.sort((a, b) => b.name.localeCompare(a.name));
      } else if (querySortBy === "a-z") {
        brands = brands.sort((a, b) => a.name.localeCompare(b.name));
      } else if (querySortBy === "z-a") {
        brands = brands.sort((a, b) => b.name.localeCompare(a.name));
      } else if (querySortBy === "newest") {
        brands = brands.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      } else if (querySortBy === "oldest") {
        brands = brands.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      }
    }

    // Implementing pagination
    const totalBrands = brands.length;
    const startIndex = (queryPage - 1) * queryLimit;
    const endIndex = startIndex + queryLimit;
    const paginatedBrands = brands.slice(startIndex, endIndex);

    const response = {
      current_page: queryPage,
      last_page: Math.ceil(totalBrands / queryLimit),
      total: totalBrands,
      per_page: queryLimit,
      data: paginatedBrands, // the brands for the current page
    };

    return NextResponse.json(response);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log("=== BRAND POST API CALLED ===");
  try {
    await dbConnect();

    // Check admin authentication
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    // Parse FormData
    const formData = await request.formData();
    console.log("📥 Received FormData");

    // Extract text fields
    const name = formData.get("name");
    const meta_title = formData.get("meta_title") || "";
    const meta_description = formData.get("meta_description") || "";
    const status = formData.get("status");

    // Extract files
    const brand_image_file = formData.get("brand_image");
    const brand_banner_file = formData.get("brand_banner");
    const brand_meta_image_file = formData.get("brand_meta_image");

    console.log("📝 Fields:", { name, meta_title, meta_description, status });
    console.log("📎 Files:", {
      brand_image: brand_image_file ? brand_image_file.name : "none",
      brand_banner: brand_banner_file ? brand_banner_file.name : "none",
      brand_meta_image: brand_meta_image_file
        ? brand_meta_image_file.name
        : "none",
    });

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand name is required",
          data: null,
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if brand already exists
    const existingBrand = await Brand.findOne({
      $or: [{ name: name }, { slug: slug }],
      deleted_at: null,
    });
    if (existingBrand) {
      return NextResponse.json(
        {
          success: false,
          message: "Brand with this name already exists",
          data: null,
        },
        { status: 400 }
      );
    }

    // Process file uploads
    let brand_image_url = null;
    let brand_banner_url = null;
    let brand_meta_image_url = null;

    try {
      // Upload brand_image
      if (brand_image_file && brand_image_file.size > 0) {
        console.log("☁️ Uploading brand_image to Cloudinary...");
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
      }

      // Upload brand_banner
      if (brand_banner_file && brand_banner_file.size > 0) {
        console.log("☁️ Uploading brand_banner to Cloudinary...");
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
      }

      // Upload brand_meta_image
      if (brand_meta_image_file && brand_meta_image_file.size > 0) {
        console.log("☁️ Uploading brand_meta_image to Cloudinary...");
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

    // Create new brand
    const newBrand = new Brand({
      name,
      slug,
      brand_image: brand_image_url,
      brand_banner: brand_banner_url,
      meta_title,
      meta_description,
      brand_meta_image: brand_meta_image_url,
      status: status !== undefined ? Number(status) : 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedBrand = await newBrand.save();
    console.log("✅ Brand created successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Brand created successfully",
        data: savedBrand,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("❌ Error creating brand:", error);
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

export async function DELETE(request) {
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

    const reqData = await request.json();
    const { ids } = reqData;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide brand IDs to delete",
          data: null,
        },
        { status: 400 }
      );
    }

    // Soft delete brands by setting deleted_at timestamp
    const result = await Brand.updateMany(
      { _id: { $in: ids }, deleted_at: null },
      { deleted_at: new Date(), updated_at: new Date() }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.modifiedCount} brand(s)`,
      data: { deletedCount: result.modifiedCount },
    });
  } catch (error) {
    console.log("Error deleting brands:", error);
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
