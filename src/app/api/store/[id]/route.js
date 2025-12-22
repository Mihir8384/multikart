import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import Role from "@/models/Role";
import User from "@/models/User";
import { requireAdmin } from "@/utils/auth/serverAuth";

// GET - Get single store by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    const store = await Store.findById(id)
      .populate("owner_user_id", "name email phone country_code")
      .lean();

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    // Add id field
    const storeWithId = {
      ...store,
      id: store._id.toString(),
      _id: store._id.toString(),
      // Extract vendor information for the form
      vendor: store.owner_user_id ? {
        name: store.owner_user_id.name,
        email: store.owner_user_id.email,
        phone: store.owner_user_id.phone,
        country_code: store.owner_user_id.country_code
      } : null
    };

    return NextResponse.json({
      success: true,
      data: storeWithId,
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update store by ID
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    const store = await Store.findById(id);

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    // Update store fields
    if (body.store_name !== undefined) store.store_name = body.store_name;
    if (body.description !== undefined) store.description = body.description;
    if (body.store_logo !== undefined) store.store_logo = body.store_logo;
    if (body.store_logo_id !== undefined) store.store_logo = body.store_logo_id;
    if (body.city !== undefined) store.city = body.city;
    if (body.address !== undefined) store.address = body.address;
    if (body.pincode !== undefined) store.pincode = body.pincode;
    if (body.facebook !== undefined) store.facebook = body.facebook;
    if (body.pinterest !== undefined) store.pinterest = body.pinterest;
    if (body.instagram !== undefined) store.instagram = body.instagram;
    if (body.twitter !== undefined) store.twitter = body.twitter;
    if (body.youtube !== undefined) store.youtube = body.youtube;
    if (body.hide_vendor_email !== undefined) store.hide_vendor_email = body.hide_vendor_email ? 1 : 0;
    if (body.hide_vendor_phone !== undefined) store.hide_vendor_phone = body.hide_vendor_phone ? 1 : 0;
    if (body.status !== undefined) store.status = body.status ? 1 : 0;

    await store.save();

    // Update vendor user information if provided
    if (store.owner_user_id && (body.name || body.email || body.phone || body.country_code)) {
      const updateData = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email;
      if (body.phone) updateData.phone = body.phone;
      if (body.country_code) updateData.country_code = body.country_code;

      await User.findByIdAndUpdate(store.owner_user_id, updateData);
    }

    // Populate and return updated store
    await store.populate("owner_user_id", "name email phone country_code");

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      data: {
        ...store.toObject(),
        id: store._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete store by ID
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const authCheck = await requireAdmin(request);
    if (!authCheck.success) {
      return authCheck.errorResponse;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    const store = await Store.findByIdAndDelete(id);

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    // Optionally, you might want to delete or deactivate the associated user
    // For now, we'll just delete the store

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
