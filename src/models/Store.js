import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    store_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    //----new fields added ---//
    // Add after line 16 (after slug field):
    vendor_id: {
      type: String,
      unique: true,
      sparse: true, // Allows null values but enforces uniqueness when present
    },
    vendor_status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resubmission"],
      default: "Pending",
    },
    owner_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    business: {
      type: {
        type: String,
        enum: [
          "Sole Proprietorship",
          "Partnership",
          "Private Limited",
          "Public Limited",
          "LLC",
          "Other",
        ],
        required: false,
      },
      name: String,
      registration_number: String,
      registration_date: Date,
      tax_id: String,
    },
    contacts: {
      primary: {
        name: String,
        email: String,
        phone: String,
        designation: String,
      },
      orders: {
        name: String,
        email: String,
        phone: String,
        reuse_primary: { type: Boolean, default: false },
      },
      payout: {
        name: String,
        email: String,
        phone: String,
        reuse_primary: { type: Boolean, default: false },
      },
    },
    warehouses: [
      {
        name: String,
        address: String,
        city: String,
        state: String,
        country: String,
        zip: String,
        phone: String,
        is_active: { type: Boolean, default: true },
      },
    ],
    channels: [
      {
        type: {
          type: String,
          enum: [
            "Storefront",
            "Facebook",
            "Instagram",
            "WhatsApp",
            "Website",
            "Other",
          ],
        },
        handle: String,
        url: String,
        is_active: { type: Boolean, default: true },
      },
    ],
    payout: {
      bank_name: String,
      account_number: String,
      account_holder_name: String,
      country: String,
      maldives_bank_code: String, // For Maldives-specific banks
      swift_code: String,
    },
    registration_step: {
      type: Number,
      default: 0, // 0 = not started, 1-5 = current step, 6 = completed
      enum: [0, 1, 2, 3, 4, 5, 6],
    },
    registration_data: {
      type: mongoose.Schema.Types.Mixed, // Store draft data
      default: {},
    },

    //------------------------//
    store_logo: {
      type: String,
      default: null,
    },
    store_cover: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    city: String,
    address: String,
    pincode: String,

    facebook: { type: String, default: null },
    twitter: { type: String, default: null },
    instagram: { type: String, default: null },
    youtube: { type: String, default: null },
    pinterest: { type: String, default: null },

    hide_vendor_email: {
      type: Number,
      default: 0,
    },
    hide_vendor_phone: {
      type: Number,
      default: 0,
    },

    status: {
      type: Number,
      default: 1,
    },
    is_approved: {
      type: Number,
      default: 0,
    },
    orders_count: {
      type: Number,
      default: 0,
    },
    reviews_count: {
      type: Number,
      default: 0,
    },
    products_count: {
      type: Number,
      default: 0,
    },
    product_images: [
      {
        type: String,
      },
    ],
    order_amount: {
      type: Number,
      default: 0,
    },
    rating_count: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual for ID (to match frontend expectations)
storeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Add indexes for better query performance
storeSchema.index({ vendor_id: 1 });
storeSchema.index({ vendor_status: 1 });

function toSlug(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ensure slug exists and is unique for drafts too
storeSchema.pre("validate", async function (next) {
  if (!this.slug && this.store_name) {
    let base = toSlug(this.store_name);
    if (!base) base = `store-${Date.now()}`;
    let candidate = base;
    let i = 1;
    // ensure uniqueness
    // NOTE: this.constructor is the Model
    while (
      await this.constructor.findOne({
        slug: candidate,
        _id: { $ne: this._id },
      })
    ) {
      candidate = `${base}-${i++}`;
    }
    this.slug = candidate;
  }
  next();
});

const Store = mongoose.models.Store || mongoose.model("Store", storeSchema);
export default Store;
