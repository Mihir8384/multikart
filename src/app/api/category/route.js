import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/utils/auth/serverAuth";

// ===============================================
// GET - Fetch all categories with optimized tree logic
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
    const include_subcategories =
      searchParams.get("include_subcategories") === "true";
    const is_leaf = searchParams.get("is_leaf");

    let categories;
    let total;

    // --- REQUIREMENT 5: Optimized Tree View Logic ---
    if (include_subcategories) {
      // Fetch all categories for this type in one go (fastest)
      const allCategories = await Category.find({ type })
        .sort({ level: 1 })
        .lean();

      // Recursive function to build tree
      const buildTree = (parentId = null) => {
        return allCategories
          .filter((cat) => {
            const catParentId = cat.parent_id ? cat.parent_id.toString() : null;
            const targetParentId = parentId ? parentId.toString() : null;
            return catParentId === targetParentId;
          })
          .map((cat) => ({
            ...cat,
            id: cat._id.toString(),
            // REQUIREMENT 3: Return item counts
            product_count: cat.product_count || 0,
            subcategories: buildTree(cat._id),
          }));
      };

      categories = buildTree();

      // REQUIREMENT 1: Search and auto-expand logic
      if (search) {
        const filterBySearch = (cats) => {
          return cats.filter((cat) => {
            const matchesSearch = cat.name
              .toLowerCase()
              .includes(search.toLowerCase());
            const filteredSub = filterBySearch(cat.subcategories || []);

            // If a child matches, we keep the parent (this causes auto-expansion in frontend)
            if (filteredSub.length > 0) {
              cat.subcategories = filteredSub;
              return true;
            }
            return matchesSearch;
          });
        };
        categories = filterBySearch(categories);
      }
      total = categories.length;
    } else {
      // --- Standard Flat List Logic for Table View ---
      let query = { type };
      if (search) query.name = { $regex: search, $options: "i" };
      if (status !== null && status !== undefined && status !== "") {
        query.status = parseInt(status);
      }
      if (is_leaf === "true") query.is_leaf = true;
      else if (is_leaf === "false") query.is_leaf = false;

      total = await Category.countDocuments(query);
      const skip = (page - 1) * limit;

      // Use Aggregation for flat list to get subcategory counts efficiently
      categories = await Category.aggregate([
        { $match: query },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit },
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
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parent_id",
            as: "subs",
          },
        },
        {
          $addFields: {
            subcategories_count: { $size: "$subs" },
            id: "$_id",
          },
        },
        { $project: { subs: 0 } },
      ]);
    }

    const jsonResponse = NextResponse.json({
      success: true,
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
      { success: false, message: error.message },
      { status: 500 }
    );

    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
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
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) return authCheck.errorResponse;

    const formData = await request.formData();
    const name = formData.get("name");
    const display_name = formData.get("display_name") || name;
    const type = formData.get("type") || "product";
    const parent_id = formData.get("parent_id") || null;
    const status = formData.get("status") === "true" ? 1 : 0;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    const attributeMappingData = JSON.parse(
      formData.get("attribute_mapping") || "[]"
    );
    const variantMappingData = JSON.parse(
      formData.get("variant_mapping") || "[]"
    );

    const parsedAttributeMapping = attributeMappingData.filter(
      (m) => m.attribute_id && m.attribute_id !== ""
    );
    const parsedVariantMapping = variantMappingData.filter(
      (m) => m.variant_id && m.variant_id !== ""
    );

    const newCategory = new Category({
      name,
      display_name,
      slug: `${slug}-${Date.now()}`,
      description: formData.get("description") || "",
      type,
      parent_id: parent_id || null,
      commission_rate: formData.get("commission_rate") || null,
      status,
      meta_title: formData.get("meta_title") || "",
      meta_description: formData.get("meta_description") || "",
      attribute_mapping: parsedAttributeMapping,
      variant_mapping: parsedVariantMapping,
      created_by: authCheck.authData.userId,
    });

    const savedCategory = await newCategory.save();
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
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
