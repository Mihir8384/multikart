import mongoose from "mongoose";

/**
 * Sub-schema for vendor-specific offerings linked to this master product.
 */
const vendorOfferingSchema = new mongoose.Schema(
  {
    vendor_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "MVR",
    },
    stock_quantity: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "refurbished", "used_like_new", "used_good", "used_fair"],
      default: "new",
    },
    shipping_info: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

/**
 * Sub-schema for standardized product policies.
 */
const productPolicySchema = new mongoose.Schema(
  {
    about_this_item: { type: String },
    key_features: { type: [String] },
    return_policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      default: null,
    },
    refund_policy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      default: null,
    },
    warranty_info: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
      default: null,
    },
  },
  { _id: false }
);

/**
 * Sub-schema for storing selected attribute values.
 */
const attributeValueSchema = new mongoose.Schema(
  {
    attribute_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute",
    },
    value: {
      type: String,
    },
  },
  { _id: false }
);

/**
 * Sub-schema for defined variant options.
 */
const variantValueSchema = new mongoose.Schema(
  {
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
    },
    options: {
      type: [String],
    },
  },
  { _id: false }
);

/**
 * Sub-schema for standardized media assets.
 */
const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    url: {
      type: String,
      required: true,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Main Master Product Schema.
 */
const masterProductSchema = new mongoose.Schema(
  {
    master_product_code: {
      type: String,
      required: true,
      unique: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    model_number: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "inactive",
    },

    // --- Global Product Identifiers ---
    upc: { type: String, default: null },
    ean: { type: String, default: null },
    gtin: { type: String, default: null },
    isbn: { type: String, default: null },
    mpn: { type: String, default: null },

    // --- Standard Pricing ---
    standard_price: { type: Number, default: 0 },

    // --- Allowed Conditions ---
    allowed_conditions: [{ type: String }],

    // --- RELATED PRODUCTS CONFIGURATION ---
    related_products: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ], // Manual Selection
    related_product_config: {
      is_manual: { type: Boolean, default: true }, // true = manual IDs, false = auto rules
      auto_rules: {
        by_tags: { type: Boolean, default: false },
        tag_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
        by_category: { type: Boolean, default: false },
        category_ids: [
          { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        ],
      },
    },

    // --- UPSELL/CROSS-SELL CONFIGURATION ---
    cross_sell_products: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ], // Manual Selection
    upsell_product_config: {
      is_manual: { type: Boolean, default: true },
      auto_rules: {
        by_tags: { type: Boolean, default: false },
        tag_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
        by_category: { type: Boolean, default: false },
        category_ids: [
          { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        ],
        by_collection: { type: Boolean, default: false },
        collection_ids: [
          { type: mongoose.Schema.Types.ObjectId, ref: "Attribute" },
        ], // Assuming Collections are Attributes or similar
      },
    },

    // Standardized Content
    product_policies: productPolicySchema,
    internal_notes: { type: String },

    // SEO Metadata
    seo_meta_title: { type: String },
    seo_meta_description: { type: String },

    // Taxonomy Links
    attribute_values: [attributeValueSchema],
    variant_values: [variantValueSchema],

    // Media Assets
    media: [mediaSchema],

    // Links to Vendor Offerings
    linked_vendor_offerings: [vendorOfferingSchema],

    // Audit Fields
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Virtuals
masterProductSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

masterProductSchema.set("toObject", { virtuals: true });
masterProductSchema.set("toJSON", { virtuals: true });

// Indexes
masterProductSchema.index({ category_id: 1 });
masterProductSchema.index({ brand_id: 1 });
masterProductSchema.index({ status: 1 });

const Product =
  mongoose.models.Product || mongoose.model("Product", masterProductSchema);
export default Product;
