"use client";
import React, { useState } from "react";
import { Col, Card, CardBody, Container, Row } from "reactstrap";
import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import TitleWithDropDown from "@/components/common/TitleWithDropDown"; // Ensures 'Add New' button works
import Loader from "@/components/commonComponent/Loader";

// 1. Define the API endpoint for the table
// Note: Ensure this matches the API route we created (/api/policy)
const PolicyAPI = "/policy";

const PolicyList = ({ data, ...props }) => {
  const [isCheck, setIsCheck] = useState([]);

  // 2. Define Table Columns
  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: true,
    optionHead: { title: "Action" },
    column: [
      { title: "Policy Name", apiKey: "name", sorting: true, sortBy: "desc" },
      { title: "Type", apiKey: "type", sorting: true }, // warranty, return, refund
      { title: "Status", apiKey: "status", type: "switch" },
      { title: "Created At", apiKey: "createdAt", type: "date" },
    ],
    data: data || [],
  };

  if (!data) return <Loader />;

  return (
    <>
      <ShowTable
        {...props}
        headerData={headerObj}
        url={PolicyAPI}
        isCheck={isCheck}
        setIsCheck={setIsCheck}
        moduleName="Policy" // Used for delete messages
        keyInPermission="policy" // Optional: permissions check key
      />
    </>
  );
};

// 3. Wrap with Table HOC to handle fetching/pagination
const PolicyTableWrapped = TableWrapper(PolicyList);

const PolicyPage = () => {
  return (
    <Container fluid={true}>
      <Row>
        <Col sm="12">
          <Card>
            <CardBody>
              {/* Header with "Add New" button pointing to /policy/create */}
              <TitleWithDropDown
                moduleName="Policies"
                pathName="/policy/create"
              />

              {/* The Table */}
              <PolicyTableWrapped
                url={PolicyAPI}
                moduleName="Policies"
                onlyTitle={true}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PolicyPage;
