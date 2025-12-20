import {
  descriptionSchema,
  dropDownScheme,
  nameSchema,
  optionalDropDownScheme, // This is Yup.array()
  testSchema,
} from "../../../utils/validation/ValidationSchemas";
import * as Yup from "yup"; // Import Yup

/**
 * New Validation Schema for the Master Product (Deliverable 4).
 */
export const ProductValidationSchema = {
  product_name: nameSchema,
  category_id: nameSchema, // This is correct (string().required())
  brand_id: optionalDropDownScheme, // This is correct (array().notRequired())
  status: nameSchema, // This is correct (string().required())

  // --- THIS IS THE FIX ---

  // 1. product_policies is an OBJECT, not an array.
  product_policies: Yup.object(),

  // 2. These are arrays, but they are not required.
  attribute_values: optionalDropDownScheme, // Use optional array schema
  variant_values: optionalDropDownScheme, // Use optional array schema

  // 3. SEO fields should NOT be required.
  seo_meta_title: Yup.string().notRequired(),
  seo_meta_description: Yup.string().notRequired(),
};

/**
 * New Initial Values function for the Master Product (Deliverable 4).
 * (This part is unchanged)
 */
export function ProductInitValues(oldData, updateId) {
  console.log("🚀 Master ProductInitValues called with:", {
    oldData,
    updateId,
    hasData: !!oldData,
  });

  // Extract the actual IDs from populated fields if they exist
  const getCategoryId = () => {
    if (!updateId || !oldData?.category_id) return "";
    // If category_id is already a string ID, use it directly
    if (typeof oldData.category_id === "string") return oldData.category_id;
    // If it's a populated object, extract the _id
    const catId = oldData.category_id?._id || "";
    console.log("📦 Category ID extracted:", catId);
    return catId;
  };

  const getBrandId = () => {
    if (!updateId || !oldData?.brand_id) return "";
    // If brand_id is already a string ID, use it directly
    if (typeof oldData.brand_id === "string") return oldData.brand_id;
    // If it's a populated object, extract the _id or id
    const brandId = oldData.brand_id?._id || oldData.brand_id?.id || "";
    console.log("🏷️ Brand ID extracted:", brandId);
    return brandId;
  };

  // Ensure product_policies has all required fields
  const defaultPolicies = {
    about_this_item: "",
    key_features: [],
    return_policy: "",
    refund_policy: "",
    warranty_info: "",
  };

  const productPolicies =
    updateId && oldData?.product_policies
      ? {
          about_this_item: oldData.product_policies.about_this_item || "",
          key_features: oldData.product_policies.key_features || [],
          return_policy: oldData.product_policies.return_policy || "",
          refund_policy: oldData.product_policies.refund_policy || "",
          warranty_info: oldData.product_policies.warranty_info || "",
        }
      : defaultPolicies;

  const finalValues = {
    // Core Details
    product_name: updateId ? oldData?.product_name || "" : "",
    category_id: getCategoryId(),
    brand_id: getBrandId(),
    status: updateId ? oldData?.status || "inactive" : "inactive",

    // Media
    media: updateId ? oldData?.media || [] : [],
    new_media_files: [],
    delete_media_urls: [],

    // Product Policies (Deliverable 4)
    product_policies: productPolicies,

    // Taxonomy Mappings (Deliverable 3 link)
    attribute_values: updateId ? oldData?.attribute_values || [] : [],
    variant_values: updateId ? oldData?.variant_values || [] : [],

    // SEO
    seo_meta_title: updateId ? oldData?.seo_meta_title || "" : "",
    seo_meta_description: updateId ? oldData?.seo_meta_description || "" : "",

    // Admin Notes
    internal_notes: updateId ? oldData?.internal_notes || "" : "",
  };

  console.log(
    "🎯 ============ FINAL MASTER PRODUCT INITIAL VALUES ============"
  );
  console.log(finalValues);

  return finalValues;
}
