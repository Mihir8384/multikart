"use client";
import React, { useState } from "react";
import { Col } from "reactstrap";
import { AttributeExportAPI, AttributeImportAPI, attribute } from "@/utils/axiosUtils/API";
import AllAttributesTable from "@/components/attribute/AllAttributesTable";
import { Form, Formik } from "formik";
import MultiSelectField from "@/components/inputFields/MultiSelectField";

const AllAttributes = () => {
  const [isCheck, setIsCheck] = useState([]);
  
  // Status options for filter
  const statusOptions = [
    { id: "1", name: "Active" },
    { id: "0", name: "Inactive" },
  ];

  // Style options for filter
  const styleOptions = [
    { id: "rectangle", name: "Rectangle" },
    { id: "circle", name: "Circle" },
    { id: "image", name: "Image" },
    { id: "radio", name: "Radio" },
    { id: "dropdown", name: "Dropdown" },
    { id: "color", name: "Color" },
  ];

  return (
    <Col sm="12">
      <Formik initialValues={{ status: "", style: "" }}>
        {({ values, setFieldValue }) => {
          // Build params object, excluding empty filters
          const paramsProps = {};
          if (values.status !== "") paramsProps.status = values.status;
          if (values.style !== "") paramsProps.style = values.style;

          return (
            <Form>
              <AllAttributesTable
                url={attribute}
                moduleName="Attribute"
                isCheck={isCheck}
                setIsCheck={setIsCheck}
                type={"product"}
                exportButton={true}
                importExport={{ 
                  importUrl: AttributeImportAPI, 
                  exportUrl: AttributeExportAPI,
                  sampleFile: "attributes.csv",
                  instructionsAndSampleFile: true,
                  instructions: "attributes-bulk-import-instructions.txt",
                  paramsProps: paramsProps,
                }}
                paramsProps={paramsProps}
                showFilterDifferentPlace
                advanceFilter={{
                  status: (
                    <MultiSelectField
                      notitle="true"
                      values={values}
                      setFieldValue={setFieldValue}
                      name="status"
                      title="Status"
                      data={statusOptions}
                      initialTittle="SelectStatus"
                      isMulti={false}
                    />
                  ),
                  style: (
                    <MultiSelectField
                      notitle="true"
                      values={values}
                      setFieldValue={setFieldValue}
                      name="style"
                      title="Style"
                      data={styleOptions}
                      initialTittle="SelectStyle"
                      isMulti={false}
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

export default AllAttributes;
