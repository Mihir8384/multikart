import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/utils/cloudinary/cloudinaryService";
import path from "path";
import { requireAdmin, requireAuth } from "@/utils/auth/serverAuth"; // 1. Import requireAuth

// GET - Fetch single category (Relaxed security: Allow Vendors/Admins)
export async function GET(request, { params }) {
  try {
    await dbConnect();

    // 2. CHANGE: Use requireAuth instead of requireAdmin for GET
    // This allows Vendors (and your current test account) to view details
    const authCheck = await requireAuth(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { updateId } = await params;

    if (!updateId) {
      return NextResponse.json(
        {
          success: false,
          message: "Category ID is required",
        },
        { status: 400 }
      );
    }

    // ... (rest of GET logic remains the same) ...
    const categoryPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(updateId) } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parent_id",
          as: "subcategories",
        },
      },
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
          from: "attributes",
          localField: "attribute_mapping.attribute_id",
          foreignField: "_id",
          as: "populated_attributes",
        },
      },
      {
        $lookup: {
          from: "variants",
          localField: "variant_mapping.variant_id",
          foreignField: "_id",
          as: "populated_variants",
        },
      },
      {
        $addFields: {
          attribute_mapping: {
            $map: {
              input: "$attribute_mapping",
              as: "mapping",
              in: {
                attribute_id: "$$mapping.attribute_id",
                is_mandatory: "$$mapping.is_mandatory",
                attribute: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$populated_attributes",
                        as: "attr",
                        cond: { $eq: ["$$attr._id", "$$mapping.attribute_id"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          variant_mapping: {
            $map: {
              input: "$variant_mapping",
              as: "mapping",
              in: {
                variant_id: "$$mapping.variant_id",
                is_mandatory: "$$mapping.is_mandatory",
                variant: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$populated_variants",
                        as: "vari",
                        cond: { $eq: ["$$vari._id", "$$mapping.variant_id"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          populated_attributes: 0,
          populated_variants: 0,
        },
      },
    ];

    const categoryResult = await Category.aggregate(categoryPipeline);
    const category = categoryResult[0];

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch category",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update category (STILL ADMIN ONLY)
export async function PUT(request, { params }) {
  console.log("=== CATEGORY PUT API CALLED ===");
  try {
    await dbConnect();

    // This remains strict
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { updateId } = await params;
    const formData = await request.formData();
    console.log("📥 Received FormData for update");

    const name = formData.get("name");
    const display_name = formData.get("display_name");
    const description = formData.get("description");
    const parent_id = formData.get("parent_id");
    const commission_rate = formData.get("commission_rate");
    const status = formData.get("status");
    const meta_title = formData.get("meta_title");
    const meta_description = formData.get("meta_description");

    const attributeMappingData = formData.get("attribute_mapping");
    const variantMappingData = formData.get("variant_mapping");

    const category_image_file = formData.get("category_image");
    const category_icon_file = formData.get("category_icon");
    const category_meta_image_file = formData.get("category_meta_image");

    const delete_category_image =
      formData.get("delete_category_image") === "true";
    const delete_category_icon =
      formData.get("delete_category_icon") === "true";
    const delete_category_meta_image =
      formData.get("delete_category_meta_image") === "true";

    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Category ID is required" },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findById(updateId);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    let slug = existingCategory.slug;
    if (name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .trim("-");
      const duplicateCategory = await Category.findOne({
        $or: [{ name }, { slug }],
        type: existingCategory.type,
        _id: { $ne: updateId },
      });
      if (duplicateCategory) {
        return NextResponse.json(
          {
            success: false,
            message: "Another category with this name already exists",
          },
          { status: 409 }
        );
      }
    }

    if (parent_id && parent_id !== existingCategory.parent_id?.toString()) {
      if (parent_id === "null" || parent_id === "") {
        // root
      } else {
        const parentCategory = await Category.findById(parent_id);
        if (!parentCategory) {
          return NextResponse.json(
            { success: false, message: "Parent category not found" },
            { status: 404 }
          );
        }
        if (parent_id === updateId) {
          return NextResponse.json(
            { success: false, message: "Category cannot be its own parent" },
            { status: 400 }
          );
        }
        const isDescendant = await checkIfDescendant(updateId, parent_id);
        if (isDescendant) {
          return NextResponse.json(
            {
              success: false,
              message: "Cannot set a descendant category as parent",
            },
            { status: 400 }
          );
        }
      }
    }

    let category_image_url = existingCategory.category_image;
    let category_icon_url = existingCategory.category_icon;
    let category_meta_image_url = existingCategory.category_meta_image;

    try {
      if (category_image_file && category_image_file.size > 0) {
        if (existingCategory.category_image) {
          await deleteFromCloudinary(existingCategory.category_image).catch(
            (err) => console.error("⚠️ Error deleting old category_image:", err)
          );
        }
        const bytes = await category_image_file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadToCloudinary(
          [{ buffer, originalname: category_image_file.name }],
          "categories"
        );
        category_image_url = uploadResult[0].secure_url;
      } else if (delete_category_image && existingCategory.category_image) {
        await deleteFromCloudinary(existingCategory.category_image).catch(
          (err) => console.error("⚠️ Error deleting category_image:", err)
        );
        category_image_url = null;
      }

      if (category_icon_file && category_icon_file.size > 0) {
        if (existingCategory.category_icon) {
          await deleteFromCloudinary(existingCategory.category_icon).catch(
            (err) => console.error("⚠️ Error deleting old category_icon:", err)
          );
        }
        const bytes = await category_icon_file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadToCloudinary(
          [{ buffer, originalname: category_icon_file.name }],
          "categories"
        );
        category_icon_url = uploadResult[0].secure_url;
      } else if (delete_category_icon && existingCategory.category_icon) {
        await deleteFromCloudinary(existingCategory.category_icon).catch(
          (err) => console.error("⚠️ Error deleting category_icon:", err)
        );
        category_icon_url = null;
      }

      if (category_meta_image_file && category_meta_image_file.size > 0) {
        if (existingCategory.category_meta_image) {
          await deleteFromCloudinary(
            existingCategory.category_meta_image
          ).catch((err) =>
            console.error("⚠️ Error deleting old category_meta_image:", err)
          );
        }
        const bytes = await category_meta_image_file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadResult = await uploadToCloudinary(
          [{ buffer, originalname: category_meta_image_file.name }],
          "categories"
        );
        category_meta_image_url = uploadResult[0].secure_url;
      } else if (
        delete_category_meta_image &&
        existingCategory.category_meta_image
      ) {
        await deleteFromCloudinary(existingCategory.category_meta_image).catch(
          (err) => console.error("⚠️ Error deleting category_meta_image:", err)
        );
        category_meta_image_url = null;
      }
    } catch (uploadError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to process images",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const updateData = {
      name,
      slug,
      description:
        description !== undefined && description !== null
          ? description
          : existingCategory.description,
      parent_id:
        parent_id === "null" || parent_id === ""
          ? null
          : parent_id || existingCategory.parent_id,
      commission_rate:
        commission_rate !== undefined && commission_rate !== null
          ? commission_rate
          : existingCategory.commission_rate,
      status:
        status !== undefined && status !== null
          ? status === "true"
            ? 1
            : 0
          : existingCategory.status,
      category_image: category_image_url,
      category_icon: category_icon_url,
      meta_title:
        meta_title !== undefined && meta_title !== null
          ? meta_title
          : existingCategory.meta_title,
      meta_description:
        meta_description !== undefined && meta_description !== null
          ? meta_description
          : existingCategory.meta_description,
      category_meta_image: category_meta_image_url,
      display_name: display_name || name,
    };

    if (attributeMappingData) {
      try {
        updateData.attribute_mapping = JSON.parse(attributeMappingData);
      } catch (e) {}
    }
    if (variantMappingData) {
      try {
        updateData.variant_mapping = JSON.parse(variantMappingData);
      } catch (e) {}
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      updateId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("parent_id");

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete category (STILL ADMIN ONLY)
export async function DELETE(request, { params }) {
  console.log("=== CATEGORY DELETE API CALLED ===");
  try {
    await dbConnect();
    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }
    const { updateId } = await params;
    if (!updateId) {
      return NextResponse.json(
        { success: false, message: "Category ID is required" },
        { status: 400 }
      );
    }
    const existingCategory = await Category.findById(updateId);
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    const subcategoriesCount = await Category.countDocuments({
      parent_id: updateId,
    });
    if (subcategoriesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete category that has subcategories. Please delete or move subcategories first.",
        },
        { status: 400 }
      );
    }
    if (existingCategory.product_count > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete category: It is linked to one or more products.",
        },
        { status: 400 }
      );
    }

    const imagesToDelete = [];
    if (existingCategory.category_image)
      imagesToDelete.push(existingCategory.category_image);
    if (existingCategory.category_icon)
      imagesToDelete.push(existingCategory.category_icon);
    if (existingCategory.category_meta_image)
      imagesToDelete.push(existingCategory.category_meta_image);

    if (imagesToDelete.length > 0) {
      for (const imageUrl of imagesToDelete) {
        await deleteFromCloudinary(imageUrl).catch((err) =>
          console.error("⚠️ Error deleting image from Cloudinary:", err)
        );
      }
    }
    await Category.findByIdAndDelete(updateId);
    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

async function checkIfDescendant(categoryId, potentialParentId) {
  const descendants = [];
  const getChildren = async (parentId) => {
    const children = await Category.find({ parent_id: parentId }).select("_id");
    for (const child of children) {
      descendants.push(child._id.toString());
      await getChildren(child._id);
    }
  };
  await getChildren(categoryId);
  return descendants.includes(potentialParentId);
}
