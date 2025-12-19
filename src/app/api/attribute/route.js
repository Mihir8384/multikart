import dbConnect from "@/lib/dbConnect";
import Attribute from "@/models/Attributes";
import { NextResponse } from "next/server";

// GET - Fetch all attributes with pagination and filtering
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const paginate = parseInt(searchParams.get("paginate")) || 15;
    const search = searchParams.get("search") || "";

    // Get Filter Params
    const status = searchParams.get("status");
    const style = searchParams.get("style");

    const skip = (page - 1) * paginate;

    // Build query
    let query = {};

    // 1. Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // 2. Filter by Status (Convert to number if present)
    if (status !== null && status !== undefined && status !== "") {
      query.status = parseInt(status);
    }

    // 3. Filter by Style
    if (style && style !== "") {
      query.style = style;
    }

    // Get total count for pagination
    const total = await Attribute.countDocuments(query);

    // Fetch attributes with pagination
    const attributes = await Attribute.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(paginate);

    return NextResponse.json({
      success: true,
      message: "Attributes fetched successfully",
      data: {
        data: attributes,
        current_page: page,
        per_page: paginate,
        total: total,
        last_page: Math.ceil(total / paginate),
      },
    });
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attributes",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new attribute
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, style, attribute_values = [] } = body;

    // Validation
    if (!name || !style) {
      return NextResponse.json(
        { success: false, message: "Name and style are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    // Check if attribute with same name exists
    const existingAttribute = await Attribute.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingAttribute) {
      return NextResponse.json(
        { success: false, message: "Attribute with this name already exists" },
        { status: 409 }
      );
    }

    // Process attribute values
    const processedValues = attribute_values.map((value, index) => ({
      value: value.value || "",
      hex_color: value.hex_color || null,
      slug: value.value
        ? value.value
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .trim("-")
        : `value-${index}`,
    }));

    // Create new attribute
    const newAttribute = new Attribute({
      name,
      style,
      slug,
      status: body.status !== undefined ? body.status : 1,
      attribute_values: processedValues,
    });

    const savedAttribute = await newAttribute.save();

    return NextResponse.json(
      {
        success: true,
        message: "Attribute created successfully",
        data: savedAttribute,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating attribute:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create attribute",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Bulk Delete Attributes
export async function DELETE(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { ids } = body; // Expecting { ids: ["id1", "id2"] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "No attribute IDs provided" },
        { status: 400 }
      );
    }

    // Delete multiple attributes
    const result = await Attribute.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} attributes deleted successfully`,
    });
  } catch (error) {
    console.error("Error bulk deleting attributes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete attributes",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
