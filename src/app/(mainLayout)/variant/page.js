"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Col } from "reactstrap";
import { useTranslation } from "react-i18next";
import Btn from "@/elements/buttons/Btn";
import { VariantAPI } from "@/utils/axiosUtils/API"; // Using the correct Uppercase export
import AllVariantsTable from "@/components/variant/AllVariantsTable";
import { Form, Formik } from "formik";
import MultiSelectField from "@/components/inputFields/MultiSelectField";

const VariantList = () => {
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();
  const { t } = useTranslation("common");

  // Status options for filter
  const statusOptions = [
    { id: "1", name: "Active" },
    { id: "0", name: "Inactive" },
  ];

  // Input Type options for filter (matching Variant model enum)
  const inputTypeOptions = [
    { id: "dropdown", name: "Dropdown" },
    { id: "text", name: "Text" },
    { id: "swatch", name: "Swatch" },
    { id: "pattern", name: "Pattern" },
  ];

  return (
    <Col sm="12">
      <div className="title-header option-title">
        <h5>{t("Variants")}</h5>
        <div className="right-options">
          <ul>
            <li>
              <Btn
                className="btn-primary"
                onClick={() => router.push("/variant/create")}
              >
                <i className="ri-add-line"></i> {t("AddVariant")}
              </Btn>
            </li>
          </ul>
        </div>
      </div>

      <Formik initialValues={{ status: "", input_type: "" }}>
        {({ values, setFieldValue }) => {
          // Build params object, excluding empty filters
          const paramsProps = {};
          if (values.status !== "") paramsProps.status = values.status;
          if (values.input_type !== "") paramsProps.input_type = values.input_type;

          return (
            <Form>
              <AllVariantsTable
                url={VariantAPI}
                moduleName="Variant"
                isCheck={isCheck}
                setIsCheck={setIsCheck}
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
                  input_type: (
                    <MultiSelectField
                      notitle="true"
                      values={values}
                      setFieldValue={setFieldValue}
                      name="input_type"
                      title="Input Type"
                      data={inputTypeOptions}
                      initialTittle="SelectInputType"
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

export default VariantList;
