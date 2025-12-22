'use client'
import { useState } from "react";
import { Col } from "reactstrap";
import AllStoresTable from "@/components/store/AllStoresTable";
import { store } from "@/utils/axiosUtils/API";

const AllVendors = () => {
  const [isCheck, setIsCheck] = useState([]);
  return (
    <Col sm="12">
      <AllStoresTable url={store} moduleName="Vendor" isCheck={isCheck} setIsCheck={setIsCheck} />
    </Col>
  );
};

export default AllVendors;
