import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import {
  Card,
  Col,
  Row,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import { useTranslation } from "react-i18next";
import {
  RiSettingsLine,
  RiFileList2Line,
  RiImageLine,
  RiDatabaseLine,
} from "react-icons/ri";

// Reusable Components
import SimpleInputField from "@/components/inputFields/SimpleInputField";
import MultiSelectField from "@/components/inputFields/MultiSelectField";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput";
import Btn from "@/elements/buttons/Btn";
import Loader from "@/components/commonComponent/Loader";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";

// Tabs
import ContentPoliciesTab from "@/components/product/ContentPoliciesTab";
import MediaTab from "@/components/product/MediaTab";
import TaxonomyTab from "@/components/product/TaxonomyTab";

// API & Utils
import request from "@/utils/axiosUtils";
import { VendorProductAPI, Category, BrandAPI } from "@/utils/axiosUtils/API";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import {
  YupObject,
  nameSchema,
  optionalDropDownScheme,
  testSchema,
} from "@/utils/validation/ValidationSchemas";
import * as Yup from "yup";

const VendorRequestForm = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("1");

  // 1. Fetch Data for Dropdowns
  const { data: categoryData } = useCustomQuery(
    ["leafCategories"],
    () =>
      request(
        {
          url: Category,
          params: { status: 1, type: "product", is_leaf: true, limit: 10000 },
        },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.data.map((item) => ({
          id: item._id,
          name: item.path ? item.path.join(" > ") : item.name,
        })),
    }
  );

  const { data: brandData } = useCustomQuery(
    [BrandAPI],
    () => request({ url: BrandAPI, params: { status: 1 } }, router),
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.data.map((item) => ({ id: item.id, name: item.name })),
    }
  );

  // 2. Validation Schema
  const ValidationSchema = YupObject({
    product_name: nameSchema,
    category_id: nameSchema,
    brand_id: optionalDropDownScheme,
    // Note: We don't validate "status" because it's forced to inactive in backend
    product_policies: Yup.object(),
    attribute_values: optionalDropDownScheme,
    variant_values: optionalDropDownScheme,
  });

  // 3. Initial Values
  const initialValues = {
    product_name: "",
    category_id: "",
    brand_id: "",
    // Vendor Specific Fields for Offering (Optional at this stage, but good to have)
    price: "",
    stock_quantity: "",

    media: [],
    new_media_files: [],

    product_policies: {
      about_this_item: "",
      key_features: [],
      return_policy: "",
      refund_policy: "",
      warranty_info: "",
    },

    attribute_values: [],
    variant_values: [],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ValidationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
          const formData = new FormData();

          // Prepare JSON data
          const dataToSubmit = { ...values };
          delete dataToSubmit.new_media_files;
          formData.append("data", JSON.stringify(dataToSubmit));

          // Append Files
          if (values.new_media_files?.length > 0) {
            values.new_media_files.forEach((file) => {
              if (file instanceof File) {
                formData.append("product_thumbnail", file); // Taking first as thumbnail logic for now
                // Ideally backend handles galleries, but let's stick to the working thumbnail logic
              }
            });
          }

          // Submit to VENDOR API
          await request(
            {
              url: VendorProductAPI,
              method: "POST",
              data: formData,
            },
            router
          );

          ToastNotification(
            "success",
            "Product request submitted! Waiting for approval."
          );
          router.push("/vendor/products");
        } catch (error) {
          console.error(error);
          ToastNotification(
            "error",
            error.response?.data?.message || "Submission failed"
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        values,
        setFieldValue,
        errors,
        isSubmitting,
        setTouched,
        touched,
      }) => (
        <Form className="theme-form theme-form-2 mega-form vertical-tabs">
          <Row>
            <Col>
              <Card>
                <div className="title-header option-title">
                  <h5>{t("Request New Product")}</h5>
                </div>
                <Row>
                  {/* TABS NAVIGATION */}
                  <Col xl="3" lg="4">
                    <Nav tabs className="nav-pills mb-3 sticky-position">
                      <NavItem>
                        <NavLink
                          className={activeTab === "1" ? "active" : ""}
                          onClick={() => setActiveTab("1")}
                        >
                          <RiSettingsLine /> {t("General")}
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === "2" ? "active" : ""}
                          onClick={() => setActiveTab("2")}
                        >
                          <RiFileList2Line /> {t("Content & Policies")}
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === "3" ? "active" : ""}
                          onClick={() => setActiveTab("3")}
                        >
                          <RiImageLine /> {t("Media")}
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={activeTab === "4" ? "active" : ""}
                          onClick={() => setActiveTab("4")}
                        >
                          <RiDatabaseLine /> {t("Taxonomy")}
                        </NavLink>
                      </NavItem>
                    </Nav>
                  </Col>

                  {/* TAB CONTENT */}
                  <Col xl="7" lg="8">
                    <TabContent activeTab={activeTab}>
                      {/* 1. General Tab */}
                      <TabPane tabId="1">
                        <SimpleInputField
                          nameList={[
                            {
                              name: "product_name",
                              title: "Product Name",
                              require: "true",
                              placeholder: t("Enter Product Name"),
                            },
                          ]}
                        />
                        <MultiSelectField
                          name="category_id"
                          title="Category"
                          require="true"
                          values={values}
                          setFieldValue={setFieldValue}
                          data={categoryData || []}
                          getValuesKey="id"
                        />
                        <SearchableSelectInput
                          nameList={[
                            {
                              name: "brand_id",
                              title: "Brand",
                              inputprops: {
                                name: "brand_id",
                                id: "brand_id",
                                options: brandData || [],
                                initialTittle: "Select Brand",
                              },
                            },
                          ]}
                        />
                        {/* Vendor Offering Details (Initial) */}
                        <div className="mt-4 border-top pt-3">
                          <h6>Your Initial Offering</h6>
                          <SimpleInputField
                            nameList={[
                              {
                                name: "price",
                                title: "Price",
                                type: "number",
                                placeholder: "Your Price",
                              },
                              {
                                name: "stock_quantity",
                                title: "Stock",
                                type: "number",
                                placeholder: "Initial Stock",
                              },
                            ]}
                          />
                        </div>
                      </TabPane>

                      {/* 2. Content Tab */}
                      <TabPane tabId="2">
                        <ContentPoliciesTab
                          values={values}
                          setFieldValue={setFieldValue}
                        />
                      </TabPane>

                      {/* 3. Media Tab */}
                      <TabPane tabId="3">
                        <MediaTab
                          values={values}
                          setFieldValue={setFieldValue}
                          errors={errors}
                        />
                      </TabPane>

                      {/* 4. Taxonomy Tab (Reuse the smart component!) */}
                      <TabPane tabId="4">
                        <TaxonomyTab
                          values={values}
                          setFieldValue={setFieldValue}
                          errors={errors}
                        />
                      </TabPane>
                    </TabContent>

                    {/* Form Actions */}
                    <div className="ms-auto justify-content-end dflex-wgap mt-sm-4 mt-2 save-back-button">
                      <Btn
                        className="btn-outline"
                        title="Back"
                        type="button"
                        onClick={() => router.back()}
                      />
                      <Btn
                        className="btn-primary"
                        type="submit"
                        title="Submit Request"
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

export default VendorRequestForm;
