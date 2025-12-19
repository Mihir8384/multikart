import dbConnect from "@/lib/dbConnect";
import Tag from "@/models/Tag";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const paginate = parseInt(searchParams.get("paginate")) || 15;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * paginate;

    let query = { type: "product" };
    if (search) query.name = { $regex: search, $options: "i" };
    if (status !== null && status !== undefined && status !== "") {
      query.status = parseInt(status);
    }

    const total = await Tag.countDocuments(query);
    const tags = await Tag.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(paginate);

    return NextResponse.json(
      {
        data: tags,
        current_page: page,
        per_page: paginate,
        total: total,
        last_page: Math.ceil(total / paginate),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ message: "Database error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const reqData = await request.json();
    if (!reqData.name || !reqData.description) {
      return NextResponse.json(
        { message: "Name and Description are required" },
        { status: 400 }
      );
    }
    const slug = reqData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");
    const newTag = new Tag({ ...reqData, slug, type: "product" });
    await newTag.save();
    return NextResponse.json(
      { message: "Tag created successfully", data: newTag },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Bulk Delete Method
export async function DELETE(request) {
  try {
    await dbConnect();
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { message: "Invalid IDs provided" },
        { status: 400 }
      );
    }
    await Tag.deleteMany({ _id: { $in: ids } });
    return NextResponse.json(
      { message: "Tags deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
