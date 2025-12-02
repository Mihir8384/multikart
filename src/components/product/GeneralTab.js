// import React, { useContext } from "react";
// import request from "../../utils/axiosUtils";
// import { tax } from "../../utils/axiosUtils/API";
// import { store } from "../../utils/axiosUtils/API";
// import SimpleInputField from "../inputFields/SimpleInputField";
// import SearchableSelectInput from "../inputFields/SearchableSelectInput";
// import DescriptionInput from "../widgets/DescriptionInput";
// import SettingContext from "../../helper/settingContext";
// import { useTranslation } from "react-i18next";
// import AccountContext from "@/helper/accountContext";
// import { useRouter } from "next/navigation";
// import useCustomQuery from "@/utils/hooks/useCustomQuery";

// const GeneralTab = ({ values, setFieldValue, updateId }) => {
//   const { t } = useTranslation("common");
//   const { state } = useContext(SettingContext);
//   const { role } = useContext(AccountContext);
//   const router = useRouter();
//   const { data: taxData } = useCustomQuery([tax], () => request({ url: tax, params: { status: 1 } }, router), { refetchOnWindowFocus: false, select: (data) => data.data.data });
//   const { data: StoreData } = useCustomQuery([store], () => request({ url: store, params: { status: 1 } }, router), { refetchOnWindowFocus: false, select: (data) => data.data.data.map((item) => ({ id: item.id, name: item.store_name })) });
//   return (
//     <>
//       {!updateId && (
//         <SearchableSelectInput
//           nameList={[
//             {
//               name: "product_type",
//               title: "Product Type",
//               require: "true",
//               inputprops: {
//                 name: "product_type",
//                 id: "product_type",
//                 options: [
//                   { id: "physical", name: "Physical Product" },
//                   { id: "digital", name: "Digital Product" },
//                   { id: "external", name: "External/Affiliate  Product" },
//                 ],
//                 close: false,
//               },
//             },
//           ]}
//         />
//       )}
//       {state?.isMultiVendor && role === "admin" && (
//         <SearchableSelectInput
//           nameList={[
//             {
//               name: "store_id",
//               title: "Store",
//               require: "true",
//               inputprops: {
//                 name: "store_id",
//                 id: "store_id",
//                 options: StoreData || [],
//                 close: false,
//               },
//             },
//           ]}
//         />
//       )}
//       <SimpleInputField
//         nameList={[
//           { name: "name", require: "true", placeholder: t("EnterName") },
//           { name: "short_description", require: "true", title: "ShortDescription", type: "textarea", rows: 3, placeholder: t("EnterShortDescription"), helpertext: "*Maximum length should be 300 characters." },
//         ]}
//       />
//       <DescriptionInput
//         values={values}
//         setFieldValue={setFieldValue}
//         title={t("Description")}
//         nameKey="description"
//         // errorMessage={"Descriptionisrequired"}
//       />
//       <SearchableSelectInput
//         nameList={[
//           {
//             name: "tax_id",
//             title: "Tax",
//             require: "true",
//             inputprops: {
//               name: "tax_id",
//               id: "tax_id",
//               options: taxData || [],
//             },
//           },
//         ]}
//       />
//     </>
//   );
// };

// export default GeneralTab;

//--------------------------------------

import React from "react";
import request from "../../utils/axiosUtils";
import { Category, BrandAPI } from "../../utils/axiosUtils/API";
import SimpleInputField from "../inputFields/SimpleInputField";
import SearchableSelectInput from "../inputFields/SearchableSelectInput";
import MultiSelectField from "../inputFields/MultiSelectField"; // Using this for category
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

/**
 * NEW GeneralTab for the Master Product (Deliverable 4)
 * This replaces the old vendor-centric tab.
 */
const GeneralTab = ({ values, setFieldValue, updateId }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  // Fetch LEAF categories (products can only be in leaf categories)
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
      // Map data to show the full category path (e.g., "Electronics > Phones")
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

      {/* New Category Selector (links to taxonomy) */}
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
    </>
  );
};

export default GeneralTab;
