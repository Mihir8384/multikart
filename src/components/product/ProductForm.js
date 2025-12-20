import TabForProduct from "@/components/product/widgets/TabForProduct";
import Btn from "@/elements/buttons/Btn";
import AccountContext from "@/helper/accountContext";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Col, Row } from "reactstrap";
import SettingContext from "../../helper/settingContext";
import request from "../../utils/axiosUtils";
import { product } from "../../utils/axiosUtils/API";
import { YupObject } from "../../utils/validation/ValidationSchemas";
import * as Yup from "yup";
import Loader from "../commonComponent/Loader";
import AllProductTabs from "./widgets/AllProductTabs";
import {
  ProductInitValues,
  ProductValidationSchema,
} from "./widgets/ProductObjects";
import ProductSubmitFunction from "./widgets/ProductSubmitFunction";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

const ProductForm = ({
  updateId,
  title,
  buttonName,
  saveButton,
  setSaveButton,
}) => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("1");
  const { state } = useContext(SettingContext);

  const {
    data: oldData,
    isLoading: oldDataLoading,
    refetch,
  } = useCustomQuery(
    [updateId],
    () => request({ url: `${product}/${updateId}` }, router),
    {
      refetchOnWindowFocus: false,
      enabled: !!updateId,
      select: (data) => {
        console.log("🔍 API Response received:", data);
        console.log("🔍 Extracted data:", data?.data?.data);
        return data?.data?.data;
      },
    }
  );

  console.log("📊 Current state:", {
    updateId,
    hasOldData: !!oldData,
    isLoading: oldDataLoading,
    oldData,
  });

  useEffect(() => {
    if (updateId && !saveButton) {
      refetch();
    }
  }, [updateId, saveButton, refetch]);

  // --- MODIFIED: Generate initial values based on oldData ---
  const getInitialValues = () => {
    if (!updateId) {
      // For new products, return empty initial values
      return ProductInitValues(null, null);
    }

    if (!oldData) {
      // Data is still loading, return empty values
      return ProductInitValues(null, null);
    }

    // Data has loaded, populate all fields
    const values = ProductInitValues(oldData, updateId);

    // 1. General & Pricing
    values.standard_price = oldData.standard_price || "";
    values.allowed_conditions = oldData.allowed_conditions || [];

    // 2. Global Identifiers
    values.upc = oldData.upc || "";
    values.ean = oldData.ean || "";
    values.gtin = oldData.gtin || "";
    values.isbn = oldData.isbn || "";
    values.mpn = oldData.mpn || "";

    // 3. Related Products Config (Nested)
    values.related_product_config = {
      is_manual: oldData.related_product_config?.is_manual ?? true,
      auto_rules: {
        by_tags:
          oldData.related_product_config?.auto_rules?.by_tags ?? false,
        tag_ids: oldData.related_product_config?.auto_rules?.tag_ids ?? [],
        by_category:
          oldData.related_product_config?.auto_rules?.by_category ?? false,
        category_ids:
          oldData.related_product_config?.auto_rules?.category_ids ?? [],
      },
    };

    // 4. Upsell Config (Nested)
    values.upsell_product_config = {
      is_manual: oldData.upsell_product_config?.is_manual ?? true,
      auto_rules: {
        by_tags: oldData.upsell_product_config?.auto_rules?.by_tags ?? false,
        tag_ids: oldData.upsell_product_config?.auto_rules?.tag_ids ?? [],
        by_category:
          oldData.upsell_product_config?.auto_rules?.by_category ?? false,
        category_ids:
          oldData.upsell_product_config?.auto_rules?.category_ids ?? [],
        by_collection:
          oldData.upsell_product_config?.auto_rules?.by_collection ?? false,
        collection_ids:
          oldData.upsell_product_config?.auto_rules?.collection_ids ?? [],
      },
    };

    // 5. Policies (Sanitize nulls to empty string for Formik control)
    if (oldData.product_policies) {
      values.product_policies = {
        ...values.product_policies,
        return_policy: oldData.product_policies.return_policy || "",
        refund_policy: oldData.product_policies.refund_policy || "",
        warranty_info: oldData.product_policies.warranty_info || "",
        about_this_item: oldData.product_policies.about_this_item || "",
        key_features: oldData.product_policies.key_features || [],
      };
    }

    console.log("✅ Generated initial values for product:", values);
    return values;
  };

  if (updateId && oldDataLoading) return <Loader />;

  return (
    <Formik
      enableReinitialize={true}
      initialValues={getInitialValues()}
      validationSchema={YupObject({
        ...ProductValidationSchema,
        standard_price: Yup.number().min(0).nullable(),
        allowed_conditions: Yup.array(),
        upc: Yup.string().nullable(),
        ean: Yup.string().nullable(),
        gtin: Yup.string().nullable(),
        isbn: Yup.string().nullable(),
        mpn: Yup.string().nullable(),
      })}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          setSubmitting(true);
          if (updateId) {
            values["_method"] = "put";
          }
          await ProductSubmitFunction(null, values, updateId);
          console.log("✅ Product saved successfully");
          router.push(`/product`);
        } catch (error) {
          console.error("❌ Failed to save product:", error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        values,
        setFieldValue,
        errors,
        touched,
        isSubmitting,
        setErrors,
        setTouched,
      }) => {
        return (
          <Form className="theme-form theme-form-2 mega-form vertical-tabs">
            <Row>
              <Col>
                <Card>
                  <div className="title-header option-title">
                    <h5>{t(title)}</h5>
                  </div>
                  <Row>
                    <Col xl="3" lg="4">
                      <TabForProduct
                        values={values}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        errors={errors}
                        touched={touched}
                      />
                    </Col>
                    <AllProductTabs
                      setErrors={setErrors}
                      setTouched={setTouched}
                      touched={touched}
                      values={values}
                      activeTab={activeTab}
                      isSubmitting={isSubmitting}
                      setFieldValue={setFieldValue}
                      errors={errors}
                      updateId={updateId}
                      setActiveTab={setActiveTab}
                    />
                    <div className="ms-auto justify-content-end dflex-wgap mt-sm-4 mt-2 save-back-button">
                      <Btn
                        className="btn-outline"
                        title="Back"
                        onClick={() => router.back()}
                      />
                      {updateId && (
                        <Btn
                          className="btn-outline"
                          type="submit"
                          title={`save&Continue`}
                          onClick={() => setSaveButton(true)}
                        />
                      )}
                      <Btn
                        className="btn-primary"
                        type="submit"
                        title={buttonName}
                        disabled={isSubmitting}
                      />
                    </div>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ProductForm;
