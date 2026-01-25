"use client";
import TabForProduct from "@/components/product/widgets/TabForProduct";
import Btn from "@/elements/buttons/Btn";
import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
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
    ["admin", "product", updateId],
    () =>
      request(
        {
          url: `${product}/${updateId}`,
          headers: { "Cache-Control": "no-cache" }, // Force fresh data from server
        },
        router
      ),
    {
      enabled: !!updateId,
      staleTime: 5000, // Data is considered "fresh" for 5 seconds
      cacheTime: 0, // Still ensure we don't use old data on re-entry
      select: (data) => data?.data?.data,
    }
  );

  // useEffect(() => {
  //   if (updateId && !saveButton) {
  //     refetch();
  //   }
  // }, [updateId, saveButton, refetch]);

  const getInitialValues = () => {
    if (!updateId || !oldData) {
      return ProductInitValues(null, null);
    }

    const values = ProductInitValues(oldData, updateId);

    // General & Pricing
    values.standard_price = oldData.standard_price ?? "";
    values.allowed_conditions = oldData.allowed_conditions ?? [];

    // Global Identifiers
    values.upc = oldData.upc ?? "";
    values.ean = oldData.ean ?? "";
    values.gtin = oldData.gtin ?? "";
    values.isbn = oldData.isbn ?? "";
    values.mpn = oldData.mpn ?? "";

    // Related Products Config
    values.related_product_config = {
      is_manual: oldData.related_product_config?.is_manual ?? true,
      auto_rules: {
        by_tags: oldData.related_product_config?.auto_rules?.by_tags ?? false,
        tag_ids: oldData.related_product_config?.auto_rules?.tag_ids ?? [],
        by_category:
          oldData.related_product_config?.auto_rules?.by_category ?? false,
        category_ids:
          oldData.related_product_config?.auto_rules?.category_ids ?? [],
      },
    };

    // Upsell Config
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

    // Policies
    if (oldData.product_policies) {
      values.product_policies = {
        ...values.product_policies,
        return_policy: oldData.product_policies.return_policy ?? "",
        refund_policy: oldData.product_policies.refund_policy ?? "",
        warranty_info: oldData.product_policies.warranty_info ?? "",
        about_this_item: oldData.product_policies.about_this_item ?? "",
        key_features: oldData.product_policies.key_features ?? [],
      };
    }
    return values;
  };

  if (updateId && oldDataLoading) return <Loader />;

  return (
    <Formik
      key={updateId || "new-product"}
      enableReinitialize={true} // FIX: Allows form to update when oldData changes
      initialValues={getInitialValues()}
      validationSchema={YupObject({
        ...ProductValidationSchema,
        standard_price: Yup.number().min(0).nullable(),
        allowed_conditions: Yup.array().notRequired(),
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

          // Force a server refresh and clear cache for the updated ID
          router.refresh();
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
      }) => (
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

                  {/* Form Actions - Full width after sidebar */}
                  <Col xl={{ size: 7, offset: 3 }} lg={{ size: 8, offset: 4 }} className="mt-4">
                    <div className="save-back-button">
                      <Btn
                        className="btn-outline"
                        title="Back"
                        onClick={() => router.back()}
                      />
                      {updateId && (
                        <Btn
                          className="btn-outline"
                          type="submit"
                          title="save&Continue"
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
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </Formik>
  );
};

export default ProductForm;
