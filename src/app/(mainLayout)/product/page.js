"use client";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput";
import AllProductTable from "@/components/product/AllProductTable";
import {
  BrandAPI,
  Category,
  ProductExportAPI,
  ProductImportAPI,
  product,
} from "@/utils/axiosUtils/API"; // Removed 'store'
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { Col } from "reactstrap";
import request from "@/utils/axiosUtils";
import MultiSelectField from "@/components/inputFields/MultiSelectField";

import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

const AllProductsList = () => {
  // Renamed component for clarity
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();

  // Brand data for filter
  const {
    data: brandData,
    isLoading: brandLoading,
    refetch: brandRefetch,
  } = useCustomQuery(
    [BrandAPI],
    () => request({ url: BrandAPI, params: { status: 1 } }, router),
    {
      enabled: false,
      refetchOnWindowFocus: false,
      select: (res) =>
        res?.data?.data?.map((elem) => {
          return { id: elem.id, name: elem?.name, slug: elem?.slug };
        }),
    }
  );
  useEffect(() => {
    brandLoading && brandRefetch();
  }, [brandLoading]);

  // Removed the 'storeData' query as it's no longer needed

  // Category data for filter
  const { data: categoryData, isLoading: categoryLoader } = useCustomQuery(
    [Category],
    () =>
      request(
        { url: Category, params: { status: 1, type: "product" } },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (res) =>
        res?.data?.data.map((elem) => {
          return {
            id: elem.id,
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
        // Simplified initialValues
        initialValues={{ category_ids: [], brand_ids: [] }}
      >
        {({ values, setFieldValue }) => (
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
                // Simplified paramsProps
                paramsProps: {
                  category_ids:
                    values["category_ids"].length > 0
                      ? values.category_ids.join(",")
                      : null,
                  brand_ids:
                    values["brand_ids"].length > 0
                      ? values.brand_ids.join(",")
                      : null,
                },
              }}
              // Simplified paramsProps
              paramsProps={{
                category_ids:
                  values["category_ids"].length > 0
                    ? values.category_ids.join(",")
                    : null,
                brand_ids:
                  values["brand_ids"].length > 0
                    ? values.brand_ids.join(",")
                    : null,
              }}
              showFilterDifferentPlace
              // Simplified advanceFilter
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
                brand: (
                  <SearchableSelectInput
                    nameList={[
                      {
                        name: "brand_ids",
                        notitle: "true",
                        inputprops: {
                          name: "brand_ids",
                          id: "brand_ids",
                          initialTittle: "SelectBrand",
                          options: brandData || [],
                        },
                      },
                    ]}
                  />
                ),
                // Removed 'store_ids' filter
                // Removed 'productType' filter
              }}
            />
          </Form>
        )}
      </Formik>
    </Col>
  );
};

export default AllProductsList;