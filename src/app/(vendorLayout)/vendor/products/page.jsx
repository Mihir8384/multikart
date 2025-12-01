"use client";
import React, { useState } from "react";
import { Col, Card, CardBody } from "reactstrap";
import { VendorProductAPI } from "@/utils/axiosUtils/API";
import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import Loader from "@/components/commonComponent/Loader";
import TitleWithDropDown from "@/components/common/TitleWithDropDown";

const VendorProductTable = ({ data, ...props }) => {
  const headerObj = {
    checkBox: false,
    isSerialNo: true,
    isOption: true,
    noEdit: false,
    optionHead: { title: "Action" },
    column: [
      { title: "Image", apiKey: "image", type: "image", class: "sm-width" },
      { title: "Name", apiKey: "name", sorting: true, sortBy: "desc" },
      { title: "My Price", apiKey: "price", type: "price" },
      { title: "My Stock", apiKey: "stock" },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    // --- THIS IS THE FIX ---
    // Extract the array from the pagination object (data.data)
    data: data?.data || [],
  };

  if (!data) return <Loader />;

  return (
    <ShowTable
      {...props}
      headerData={headerObj}
      editPermission={true}
      destroyPermission={true}
    />
  );
};

const VendorProductTableWrapped = TableWrapper(VendorProductTable);

const VendorProducts = () => {
  const [isCheck, setIsCheck] = useState([]);

  return (
    <Col sm="12">
      <Card>
        <CardBody>
          <TitleWithDropDown
            moduleName="My Products"
            pathName="/vendor/products/create"
          />
          <VendorProductTableWrapped
            url={VendorProductAPI}
            moduleName="My Products"
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
