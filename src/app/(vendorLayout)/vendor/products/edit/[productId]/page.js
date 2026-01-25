"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import request from "@/utils/axiosUtils";
import Btn from "@/elements/buttons/Btn";
import SimpleInputField from "@/components/inputFields/SimpleInputField";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput";
import SmartVariantInput from "@/components/vendor/SmartVariantInput";

export default function VendorProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId;
  const [product, setProduct] = useState(null);
  const [myOffer, setMyOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch product details with populated variants
        const res = await request({
          url: `/vendor/product/${productId}`,
          method: "GET",
        });

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to fetch product");
        }

        const fetchedProduct = res.data?.product || null;
        
        // If product has variants, fetch full variant details
        if (fetchedProduct && fetchedProduct.variant_values && fetchedProduct.variant_values.length > 0) {
          // Fetch full variant details from master product API
          const masterProductRes = await request({
            url: `/product/${productId}`,
            method: "GET",
          });
          
          if (masterProductRes.data?.success && masterProductRes.data?.data) {
            // Replace variant_values with populated data from master product
            fetchedProduct.variant_values = masterProductRes.data.data.variant_values || [];
          }
        }

        setProduct(fetchedProduct);
        setMyOffer(res.data?.myOffer || null);
      } catch (err) {
        setError(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  // Deduplicate and prepare variants
  const hasVariants = product && Array.isArray(product.variant_values) && product.variant_values.length > 0;
  
  const uniqueVariants = useMemo(() => {
    if (!product || !hasVariants) return [];
    
    const variantMap = new Map();
    product.variant_values.forEach((variant) => {
      const variantId = typeof variant.variant_id === 'object' 
        ? variant.variant_id._id?.toString() 
        : variant.variant_id?.toString();
      
      if (variantId && !variantMap.has(variantId)) {
        variantMap.set(variantId, variant);
      }
    });
    
    return Array.from(variantMap.values());
  }, [product, hasVariants]);

  if (loading)
    return (
      <div className="container py-4">
        <div className="alert alert-info">Loading product details...</div>
      </div>
    );
  if (error)
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  if (!product || !myOffer)
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          Product or vendor offer not found.
        </div>
      </div>
    );

  const EditSchema = Yup.object().shape({
    vendor_sku: Yup.string().required("Vendor SKU is required"),
    base_price: Yup.number().required("Base Price is required").min(0),
    floor_price: Yup.number().required("Floor Price is required").min(0),
    price: Yup.number().required("Price is required").min(1),
    condition: Yup.string().required("Condition is required"),
    shipping_info: Yup.string().required("Shipping info is required"),
    selected_variants: hasVariants
      ? Yup.object().test(
          "all-variants-selected",
          "Please select at least one option for each variant",
          function (value) {
            if (!hasVariants) return true;
            return uniqueVariants.every((variant) => {
              const variantId = typeof variant.variant_id === 'object' 
                ? variant.variant_id._id 
                : variant.variant_id;
              const selected = value?.[variantId];
              return selected && (Array.isArray(selected) ? selected.length > 0 : selected);
            });
          }
        )
      : Yup.object(),
  });

  return (
    <div className="container py-4">
      <div
        className="bg-white rounded shadow-sm p-4 mx-auto"
        style={{ maxWidth: 700 }}
      >
        <h2 className="mb-4 fw-bold text-primary">
          Edit Vendor Product:{" "}
          <span className="text-dark">{product.product_name}</span>
        </h2>
        <Formik
          initialValues={{
            vendor_sku: myOffer.vendor_sku || "",
            base_price: myOffer.base_price || 0,
            floor_price: myOffer.floor_price || 0,
            price: myOffer.price || 0,
            condition: myOffer.condition || "new",
            shipping_info: myOffer.shipping_info || "",
            selected_variants: myOffer.selected_variants || {},
          }}
          validationSchema={EditSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await request({
                url: `/vendor/product/${productId}`,
                method: "PATCH",
                data: values,
              });
              alert("Product updated successfully!");
              router.push("/vendor/products");
            } catch (e) {
              alert(e.response?.data?.message || "Failed to update product");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, values, setFieldValue, touched, errors }) => (
            <Form className="theme-form">
              <div className="row g-3">
                <div className="col-12">
                  <SimpleInputField
                    nameList={[
                      {
                        name: "vendor_sku",
                        title: "Vendor SKU",
                        type: "text",
                        require: "true",
                      },
                      {
                        name: "base_price",
                        title: "Base Price (MVR)",
                        type: "number",
                        require: "true",
                      },
                      {
                        name: "floor_price",
                        title: "Floor Price (MVR)",
                        type: "number",
                        require: "true",
                      },
                      {
                        name: "price",
                        title: "Your Price (MVR)",
                        type: "number",
                        require: "true",
                      },
                      {
                        name: "shipping_info",
                        title: "Shipping Information",
                        type: "text",
                        require: "true",
                      },
                    ]}
                  />
                </div>

                {/* Variant Selection */}
                {hasVariants && uniqueVariants.length > 0 && (
                  <div className="col-12">
                    <div className="alert alert-info">
                      <strong>Product Variants:</strong> Select the variant options you want to offer for this product.
                    </div>
                    {uniqueVariants.map((variant) => {
                      const variantId = typeof variant.variant_id === 'object' 
                        ? variant.variant_id._id 
                        : variant.variant_id;
                      
                      const selectedValues = values.selected_variants?.[variantId] || [];
                      
                      return (
                        <div key={variantId} className="mb-3">
                          <SmartVariantInput
                            variant={variant}
                            variantId={variantId}
                            selectedValues={selectedValues}
                            onChange={(newValues) => {
                              setFieldValue(`selected_variants.${variantId}`, newValues);
                            }}
                          />
                          {touched.selected_variants && errors.selected_variants && (
                            <div className="text-danger small mt-1">
                              {errors.selected_variants}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="col-12">
                  <SearchableSelectInput
                    nameList={[
                      {
                        name: "condition",
                        title: "Condition",
                        require: "true",
                        inputprops: {
                          name: "condition",
                          id: "condition",
                          options: [
                            { id: "new", name: "New" },
                            { id: "refurbished", name: "Refurbished" },
                          ],
                        },
                      },
                    ]}
                  />
                </div>
                <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                  <Btn
                    className="btn-secondary"
                    onClick={() => router.push("/vendor/products")}
                    type="button"
                  >
                    Cancel
                  </Btn>
                  <Btn
                    className="btn-primary"
                    type="submit"
                    loading={isSubmitting}
                  >
                    Update
                  </Btn>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
