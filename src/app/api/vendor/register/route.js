import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Store from "@/models/Store";
import User from "@/models/User";
import Role from "@/models/Role";
import Counter, { getNextCounterValue } from "@/models/Counter";
import { sendVendorRegistrationEmail } from "@/utils/email/mailer";
import { extractAuthFromRequest } from "@/utils/auth/serverAuth";

// We no longer need the slugify helper function here,
// because the Store.js model's pre-validate hook now handles it.

// POST - Create/Update vendor registration
export async function POST(request) {
  try {
    await dbConnect();

    // Get authenticated user
    const authData = await extractAuthFromRequest(request);
    if (!authData.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = authData; // Fixed: authData directly contains userId
    const body = await request.json();
    const { step, data } = body;

    const existingStore = await Store.findOne({ owner_user_id: userId });

    if (existingStore && existingStore.vendor_status === "Approved") {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an approved vendor account",
        },
        { status: 400 }
      );
    }

    if (step === 1) {
      // Step 1: Business Details
      if (data.store_name) {
        const nameExists = await Store.findOne({
          store_name: data.store_name,
          _id: { $ne: existingStore?._id },
        });
        if (nameExists) {
          return NextResponse.json(
            { success: false, message: "Store name already exists" },
            { status: 400 }
          );
        }
      }

      if (existingStore) {
        // Update existing
        existingStore.business = data.business;
        existingStore.store_name = data.store_name;
        // The slug will be auto-updated by the pre-validate hook
        existingStore.registration_step = 1;
        existingStore.registration_data = {
          ...existingStore.registration_data,
          step1: data,
        };
        await existingStore.save();
        return NextResponse.json({ success: true, data: existingStore });
      } else {
        // Create new
        const vendorId = `V${String(
          await getNextCounterValue("vendor")
        ).padStart(5, "0")}`;
        const newStore = new Store({
          store_name: data.store_name,
          // SLUG is no longer needed here, the model will create it
          owner_user_id: userId,
          vendor_id: vendorId,
          vendor_status: "Pending",
          business: data.business,
          registration_step: 1,
          registration_data: { step1: data },
          // STATE and COUNTRY placeholders are no longer needed
        });
        await newStore.save();
        return NextResponse.json({ success: true, data: newStore });
      }
    }

    // ... (The rest of Step 2, 3, 4, 5 remains the same)

    if (step === 2) {
      if (!existingStore) {
        return NextResponse.json(
          { success: false, message: "Please complete step 1 first" },
          { status: 400 }
        );
      }
      existingStore.contacts = data.contacts;
      existingStore.registration_step = 2;
      existingStore.registration_data = {
        ...existingStore.registration_data,
        step2: data,
      };
      await existingStore.save();
      return NextResponse.json({ success: true, data: existingStore });
    }

    if (step === 3) {
      if (!existingStore) {
        return NextResponse.json(
          { success: false, message: "Please complete previous steps first" },
          { status: 400 }
        );
      }
      existingStore.warehouses = data.warehouses || [];
      existingStore.channels = data.channels || [];
      existingStore.registration_step = 3;
      existingStore.registration_data = {
        ...existingStore.registration_data,
        step3: data,
      };
      await existingStore.save();
      return NextResponse.json({ success: true, data: existingStore });
    }

    if (step === 4) {
      if (!existingStore) {
        return NextResponse.json(
          { success: false, message: "Please complete previous steps first" },
          { status: 400 }
        );
      }
      existingStore.payout = data.payout;
      existingStore.registration_step = 4;
      existingStore.registration_data = {
        ...existingStore.registration_data,
        step4: data,
      };
      await existingStore.save();
      return NextResponse.json({ success: true, data: existingStore });
    }

    if (step === 5) {
      if (!existingStore) {
        return NextResponse.json(
          { success: false, message: "Please complete previous steps first" },
          { status: 400 }
        );
      }
      existingStore.registration_step = 6;
      existingStore.vendor_status = "Pending";
      existingStore.registration_data = {
        ...existingStore.registration_data,
        step5: data,
        submitted_at: new Date(),
      };

      const vendorRole = await Role.findOne({ name: "vendor" });
      if (vendorRole) {
        const user = await User.findById(userId);
        if (user) {
          user.role = vendorRole._id;
          await user.save();
        }
      }
      await existingStore.save();

      const user = await User.findById(userId);
      if (user) {
        await sendVendorRegistrationEmail(
          user.email,
          user.name,
          existingStore.vendor_id
        );
      }

      return NextResponse.json({
        success: true,
        message: "Vendor registration submitted successfully",
        data: existingStore,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid step" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Vendor registration error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get current registration status
export async function GET(request) {
  try {
    await dbConnect();
    const authData = await extractAuthFromRequest(request);
    if (!authData.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = authData; // Fixed: authData directly contains userId
    const store = await Store.findOne({ owner_user_id: userId }).populate(
      "owner_user_id",
      "name email"
    );

    if (!store) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("Error fetching vendor registration:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
