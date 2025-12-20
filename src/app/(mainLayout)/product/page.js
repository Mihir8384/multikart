"use client";
import AllProductTable from "@/components/product/AllProductTable";
import {
  Category,
  ProductExportAPI,
  ProductImportAPI,
  product,
} from "@/utils/axiosUtils/API";
import { Form, Formik } from "formik";
import { useState } from "react";
import { Col } from "reactstrap";
import request from "@/utils/axiosUtils";
import MultiSelectField from "@/components/inputFields/MultiSelectField";

import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

const AllProductsList = () => {
  // Renamed component for clarity
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();

  // Category data for filter - Get ALL categories without pagination
  const { data: categoryData, isLoading: categoryLoader } = useCustomQuery(
    [Category],
    () =>
      request(
        { 
          url: Category, 
          params: { 
            status: 1, 
            type: "product",
            limit: 1000  // Get all categories by setting a high limit
          } 
        },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (res) =>
        res?.data?.data.map((elem) => {
          return {
            id: elem.id || elem._id,
            name: elem.name,
            image:
              elem?.category_icon?.original_url ||
              "/assets/images/placeholder.png",
            slug: elem?.slug,
            subcategories: elem?.subcategories,
          };
        }),
    }
  );

  // Removed 'productTypes' array

  return (
    <Col sm="12">
      <Formik
        // Only category filter needed
        initialValues={{ category_ids: [] }}
      >
        {({ values, setFieldValue }) => {
          // Debug logging to see filter values
          console.log("🔍 Product Page - Current filter values:", values);
          console.log("🔍 Product Page - category_ids:", values.category_ids);
          console.log("🔍 Product Page - Params being sent:", {
            category_ids:
              values["category_ids"].length > 0
                ? values.category_ids.join(",")
                : null,
          });
          
          return (
          <Form>
            <AllProductTable
              url={product}
              moduleName="Product" // This will now list Master Products
              isCheck={isCheck}
              setIsCheck={setIsCheck}
              isReplicate={{ title: "Duplicate", replicateAPI: "replicate" }}
              exportButton={true}
              importExport={{
                importUrl: ProductImportAPI,
                exportUrl: ProductExportAPI,
                sampleFile: "product.csv",
                instructionsAndSampleFile: true,
                instructions: "product-bulk-upload-instructions.txt",
                // Only category filter
                paramsProps: {
                  category_ids:
                    values["category_ids"].length > 0
                      ? values.category_ids.join(",")
                      : null,
                },
              }}
              // Only category filter
              paramsProps={{
                category_ids:
                  values["category_ids"].length > 0
                    ? values.category_ids.join(",")
                    : null,
              }}
              showFilterDifferentPlace
              // Only category filter in advanced filters
              advanceFilter={{
                category_ids: (
                  <MultiSelectField
                    notitle="true"
                    values={values}
                    setFieldValue={setFieldValue}
                    name="category_ids"
                    title="Category"
                    data={categoryData}
                    initialTittle="SelectCategories"
                  />
                ),
              }}
            />
          </Form>
          );
        }}
      </Formik>
    </Col>
  );
};

export default AllProductsList;