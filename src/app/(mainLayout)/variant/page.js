"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Col } from "reactstrap";
import { useTranslation } from "react-i18next";
import { FiPlus } from "react-icons/fi";
import Btn from "@/elements/buttons/Btn";
import { VariantAPI } from "@/utils/axiosUtils/API";
import AllVariantsTable from "@/components/variant/AllVariantsTable";
import { Form, Formik } from "formik";
import MultiSelectField from "@/components/inputFields/MultiSelectField";

const AllVariants = () => {
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
                type={"product"}
                paramsProps={paramsProps}
                showFilterDifferentPlace
                filterHeader={{
                  customFilter: (
                    <Btn
                      className="align-items-center btn-theme add-button"
                      title={t("Add") + " " + t("Variant")}
                      onClick={() => router.push("/variant/create")}
                    >
                      <FiPlus />
                    </Btn>
                  ),
                }}
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

export default AllVariants;
