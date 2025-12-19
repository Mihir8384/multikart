import React from "react";
import { Row, Col } from "reactstrap"; // Added for Grid layout
import request from "../../utils/axiosUtils";
import { Category, BrandAPI } from "../../utils/axiosUtils/API";
import SimpleInputField from "../inputFields/SimpleInputField";
import SearchableSelectInput from "../inputFields/SearchableSelectInput";
import MultiSelectField from "../inputFields/MultiSelectField";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

/**
 * NEW GeneralTab for the Master Product (Deliverable 4)
 * Updated to include Pricing, Conditions, and Global Identifiers
 */
const GeneralTab = ({ values, setFieldValue, updateId }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  // Fetch LEAF categories
  const { data: categoryData } = useCustomQuery(
    ["leafCategories"],
    () =>
      request(
        {
          url: Category,
          params: { status: 1, type: "product", is_leaf: true, limit: 1000 },
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

  // Fetch Brands
  const { data: brandData } = useCustomQuery(
    [BrandAPI],
    () => request({ url: BrandAPI, params: { status: 1 } }, router),
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.data.map((item) => ({ id: item.id, name: item.name })),
    }
  );

  // Status options for the Master Product
  const statusOptions = [
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "archived", name: "Archived" },
  ];

  // Condition Options (Hardcoded to match Backend Schema)
  const conditionOptions = [
    { id: "new", name: "New" },
    { id: "refurbished", name: "Refurbished" },
    { id: "used_like_new", name: "Used - Like New" },
    { id: "used_good", name: "Used - Good" },
    { id: "used_fair", name: "Used - Fair" },
  ];

  return (
    <>
      <SimpleInputField
        nameList={[
          {
            name: "product_name",
            title: "ProductName",
            require: "true",
            placeholder: t("EnterProductName"),
          },
        ]}
      />

      {/* Category Selector */}
      <SearchableSelectInput
        nameList={[
          {
            name: "category_id",
            title: "Category",
            require: "true",
            inputprops: {
              name: "category_id",
              id: "category_id",
              options: categoryData || [],
              initialTittle: "SelectCategory",
            },
          },
        ]}
      />

      {/* Brand Selector */}
      <SearchableSelectInput
        nameList={[
          {
            name: "brand_id",
            title: "Brand",
            inputprops: {
              name: "brand_id",
              id: "brand_id",
              options: brandData || [],
              initialTittle: "SelectBrand",
            },
          },
        ]}
      />

      {/* Master Product Status Selector */}
      <SearchableSelectInput
        nameList={[
          {
            name: "status",
            title: "Status",
            require: "true",
            inputprops: {
              name: "status",
              id: "status",
              options: statusOptions,
              initialTittle: "SelectStatus",
            },
          },
        ]}
      />

      {/* --- NEW SECTION: Pricing & Conditions --- */}
      <div className="mb-4 mt-4 border-top pt-4">
        <h5 className="fw-semibold mb-3">{t("Pricing & Conditions")}</h5>
        <Row>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "standard_price",
                  title: "Standard Price (MSRP)",
                  type: "number",
                  placeholder: "0.00",
                  helper: "Suggested price for vendors",
                },
              ]}
            />
          </Col>
          <Col sm="6">
            <MultiSelectField
              name="allowed_conditions"
              title="Allowed Conditions"
              data={conditionOptions}
              values={values}
              setFieldValue={setFieldValue}
              getValuesKey="id"
              helper="Select conditions allowed for listing (e.g. New only)"
            />
          </Col>
        </Row>
      </div>

      {/* --- NEW SECTION: Global Identifiers --- */}
      <div className="mb-4 border-top pt-4">
        <h5 className="fw-semibold mb-3">
          {t("Global Identifiers (Optional)")}
        </h5>
        <Row>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "upc",
                  title: "UPC",
                  placeholder: "Universal Product Code",
                },
              ]}
            />
          </Col>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "ean",
                  title: "EAN",
                  placeholder: "European Article Number",
                },
              ]}
            />
          </Col>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "gtin",
                  title: "GTIN",
                  placeholder: "Global Trade Item Number",
                },
              ]}
            />
          </Col>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "isbn",
                  title: "ISBN",
                  placeholder: "International Standard Book Number",
                },
              ]}
            />
          </Col>
          <Col sm="6">
            <SimpleInputField
              nameList={[
                {
                  name: "mpn",
                  title: "MPN",
                  placeholder: "Manufacturer Part Number",
                },
              ]}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default GeneralTab;
