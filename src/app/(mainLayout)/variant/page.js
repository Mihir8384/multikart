"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Col, Row, Button } from "reactstrap";
import { FiPlus } from "react-icons/fi";
import { VariantAPI } from "@/utils/axiosUtils/API";
import AllVariantsTable from "@/components/variant/AllVariantsTable"; // Correct import

const VariantList = () => {
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();

  const handleCreateVariant = () => {
    router.push("/variant/create");
  };

  return (
    <Col sm="12">
      <Row className="mb-3">
        <Col className="d-flex justify-content-end">
          <Button
            className="align-items-center btn-theme add-button"
            color="primary"
            onClick={handleCreateVariant}
          >
            <FiPlus className="me-2" />
            Add Variant
          </Button>
        </Col>
      </Row>
      <AllVariantsTable
        url={VariantAPI} // Pass the API URL
        moduleName="Variant"
        isCheck={isCheck}
        setIsCheck={setIsCheck}
        type={"product"}
        // Add any other props your TableWrapper expects, like import/export
        // exportButton={true}
        // importExport={{ ... }}
      />
    </Col>
  );
};

export default VariantList;
