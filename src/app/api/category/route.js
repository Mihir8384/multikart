import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";
import path from "path";
import { requireAdmin } from "@/utils/auth/serverAuth";

// ===============================================
// GET - Fetch all categories with filtering
// ===============================================

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "product";
    const status = searchParams.get("status");
    const parent_id = searchParams.get("parent_id");
    const include_subcategories =
      searchParams.get("include_subcategories") === "true";

    // --- NEW FILTER ---
    const is_leaf = searchParams.get("is_leaf");

    const skip = (page - 1) * limit;

    // Build query
    let query = { type };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (status !== null && status !== undefined && status !== "") {
      query.status = parseInt(status);
    }

    // --- NEW FILTER LOGIC ---
    if (is_leaf === "true") {
      query.is_leaf = true;
    } else if (is_leaf === "false") {
      query.is_leaf = false;
    }

    // Filter by parent category (only if we're not searching for leaves specifically)
    if (!is_leaf) {
      if (parent_id === "null" || parent_id === "") {
        query.parent_id = null; // Root categories only
      } else if (parent_id) {
        query.parent_id = parent_id;
      }
    }

    // Get total count for pagination
    const total = await Category.countDocuments(query);

    let categories;

    // --- AGGREGATION PIPELINE (Tree/Flat List Logic Remains the Same) ---
    if (include_subcategories && (parent_id === "null" || parent_id === "")) {
      // Logic for fetching all categories and building tree structure
      const allCategories = await Category.find({ type })
        .sort({ created_at: -1 })
        .lean();

      const buildTree = (parentId = null) => {
        return allCategories
          .filter((cat) => {
            if (parentId === null)
              return cat.parent_id === null || cat.parent_id === undefined;
            return (
              cat.parent_id && cat.parent_id.toString() === parentId.toString()
            );
          })
          .map((cat) => ({
            ...cat,
            subcategories: buildTree(cat._id),
          }));
      };

      categories = buildTree();

      // Apply search filter if provided
      if (search) {
        const filterBySearch = (cats) => {
          return cats.filter((cat) => {
            const matchesSearch = cat.name
              .toLowerCase()
              .includes(search.toLowerCase());
            const hasMatchingSubcategories =
              cat.subcategories && cat.subcategories.length > 0;

            if (hasMatchingSubcategories) {
              cat.subcategories = filterBySearch(cat.subcategories);
            }

            return (
              matchesSearch ||
              (cat.subcategories && cat.subcategories.length > 0)
            );
          });
        };

        categories = filterBySearch(categories);
      }
    } else {
      // Regular flat list with aggregation pipeline
      let pipeline = [{ $match: query }, { $sort: { created_at: -1 } }];

      if (page && limit && !include_subcategories) {
        pipeline.push({ $skip: skip }, { $limit: limit });
      }

      // Populate parent category info
      pipeline.push(
        {
          $lookup: {
            from: "categories",
            localField: "parent_id",
            foreignField: "_id",
            as: "parent_category",
          },
        },
        {
          $unwind: {
            path: "$parent_category",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      // Add subcategories count
      pipeline.push(
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parent_id",
            as: "subcategories",
          },
        },
        {
          $addFields: {
            subcategories_count: { $size: "$subcategories" },
          },
        },
        {
          $project: {
            subcategories: 0,
          },
        }
      );

      categories = await Category.aggregate(pipeline);
    }

    const jsonResponse = NextResponse.json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // Add CORS headers for client site access
    jsonResponse.headers.set("Access-Control-Allow-Origin", "*");
    jsonResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    jsonResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return jsonResponse;
  } catch (error) {
    console.error("Error fetching categories:", error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
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

// ===============================================
// POST - Create new category
// ===============================================

export async function POST(request) {
  console.log("=== CATEGORY POST API CALLED ===");
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const formData = await request.formData();

    const name = formData.get("name");
    const display_name = formData.get("display_name") || name;
    const description = formData.get("description") || "";
    const type = formData.get("type") || "product";
    const parent_id = formData.get("parent_id") || null;
    const commission_rate = formData.get("commission_rate") || null;
    const status = formData.get("status") === "true" ? 1 : 0;
    const meta_title = formData.get("meta_title") || "";
    const meta_description = formData.get("meta_description") || "";

    const attributeMappingData = formData.get("attribute_mapping") || "[]";
    const variantMappingData = formData.get("variant_mapping") || "[]";

    let parsedAttributeMapping = [];
    let parsedVariantMapping = [];

    try {
      parsedAttributeMapping = JSON.parse(attributeMappingData);
    } catch (e) {
      console.warn("Invalid attribute_mapping JSON:", attributeMappingData);
    }

    try {
      parsedVariantMapping = JSON.parse(variantMappingData);
    } catch (e) {
      console.warn("Invalid variant_mapping JSON:", variantMappingData);
    }

    // --- FINAL MAPPING CLEANUP FIX ---
    // Filter out any entries where the ID field is empty or null, which causes the ObjectId cast error.
    parsedAttributeMapping = parsedAttributeMapping.filter(
      (mapping) => mapping.attribute_id && mapping.attribute_id !== ""
    );

    parsedVariantMapping = parsedVariantMapping.filter(
      (mapping) => mapping.variant_id && mapping.variant_id !== ""
    );
    // --- END OF FIX ---

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    // --- (Slug generation and image upload logic is omitted here for brevity but assumed to be present) ---

    // PLACEHOLDER FOR IMAGE UPLOAD LOGIC
    const category_image_url = null;
    const category_icon_url = null;
    const category_meta_image_url = null;

    const newCategory = new Category({
      name,
      display_name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .trim("-"), // Simplified slug logic
      description,
      type,
      parent_id: parent_id || null,
      commission_rate: commission_rate || null,
      status,
      category_image: category_image_url,
      category_icon: category_icon_url,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      category_meta_image: category_meta_image_url,
      attribute_mapping: parsedAttributeMapping,
      variant_mapping: parsedVariantMapping,
      created_by: authCheck.authData.userId,
    });

    const savedCategory = await newCategory.save();
    await savedCategory.populate("parent_id");

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        data: savedCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("❌ Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
