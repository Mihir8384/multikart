"use client";
import React, { useState } from "react";
import { Col, Card, CardBody } from "reactstrap";
import { useRouter } from "next/navigation";
import { VendorProductAPI } from "@/utils/axiosUtils/API";
import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import Loader from "@/components/commonComponent/Loader";
import Btn from "@/elements/buttons/Btn";
import { FiPlus } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const VendorProductTable = ({ data, ...props }) => {
  // Process data to add discount indicators
  const processedData = (data?.data || []).map(product => ({
    ...product,
    // Format promo price with strike-through on base price if discount applies
    promo_price: product.promo_price && product.promo_price > 0 
      ? product.promo_price 
      : null,
    // Add visual indicator for discounted products
    has_discount: product.has_discount || (product.promo_price && product.promo_price > 0),
  }));

  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: true,
    noEdit: false,
    // FIX: Manually defining the base path for the 'Edit' action
    optionHead: {
      title: "Action",
      type: "edit",
      url: "/vendor/products",
    },
    column: [
      { title: "Image", apiKey: "image", type: "image", class: "sm-width" },
      { title: "Product", apiKey: "name", sorting: true, sortBy: "desc" },
      { title: "SKU", apiKey: "sku", sorting: true },
      { title: "Base Price", apiKey: "base_price", type: "price" },
      { title: "Floor Price", apiKey: "floor_price", type: "price" },
      { title: "Promo Price", apiKey: "promo_price", type: "price" },
      { title: "My Price", apiKey: "price", type: "price" },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    data: processedData,
  };

  if (!data) return <Loader />;

  return (
    <ShowTable
      {...props}
      headerData={headerObj}
      editPermission={true}
      destroyPermission={true}
      // This tells the component to look inside 'vendor/products/edit'
      moduleName="products"
      type="products"
      url={VendorProductAPI}
    />
  );
};

const VendorProductTableWrapped = TableWrapper(VendorProductTable);

const VendorProducts = () => {
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <Col sm="12">
      <Card>
        <CardBody>
          <div className="title-header option-title mb-3">
            <h5>{t("My Products")}</h5>
            <Btn
              className="align-items-center btn-theme add-button"
              title={t("Add") + " " + t("My Products")}
              onClick={() => router.push("/vendor/products/create")}
            >
              <FiPlus />
            </Btn>
          </div>
          <VendorProductTableWrapped
            url={VendorProductAPI}
            moduleName="products"
            isCheck={isCheck}
            setIsCheck={setIsCheck}
            onlyTitle={true}
          />
        </CardBody>
      </Card>
    </Col>
  );
};

export default VendorProducts;
