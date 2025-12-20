import React, { useState } from "react";
import { Form, Formik } from "formik";
import { Row, Col, Card, CardBody } from "reactstrap";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import SimpleInputField from "@/components/inputFields/SimpleInputField";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { toast } from "react-toastify";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import Loader from "@/components/commonComponent/Loader";

const PolicyForm = ({ updateId, oldData, title, buttonName }) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch policy data if in edit mode
  const { data: policyResponse, isLoading: isPolicyLoading } = useCustomQuery(
    [`/policy/${updateId}`],
    () => request({ url: `/policy/${updateId}` }, router),
    {
      enabled: !!updateId,
      refetchOnWindowFocus: false,
    }
  );

  // Get policy data from API response or fallback to oldData
  // API response structure: { data: { success: true, data: {...} } }
  // So we need policyResponse.data.data
  const existingPolicy = updateId 
    ? policyResponse?.data?.data 
    : oldData;

  // Debug logging
  console.log("🔍 PolicyForm - updateId:", updateId);
  console.log("🔍 PolicyForm - policyResponse:", policyResponse);
  console.log("🔍 PolicyForm - existingPolicy:", existingPolicy);

  // Validation Schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    type: Yup.string().required("Policy Type is required"),
    description: Yup.string().required("Description is required"),
    status: Yup.boolean(),
  });

  // Function to get initial values
  const getInitialValues = () => ({
    name: existingPolicy?.name || "",
    type: existingPolicy?.type || "return",
    description: existingPolicy?.description || "",
    status: existingPolicy?.status !== undefined ? existingPolicy.status : true,
  });

  // Type Options
  const typeOptions = [
    { id: "warranty", name: "Warranty" },
    { id: "return", name: "Return Policy" },
    { id: "refund", name: "Refund Policy" },
  ];

  // Show loader while fetching data in edit mode
  if (updateId && isPolicyLoading) {
    return <Loader />;
  }

  return (
    <Card>
      <CardBody>
        <div className="title-header option-title">
          <h5>{t(title || "PolicyForm")}</h5>
        </div>
        <Formik
          enableReinitialize
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
      onSubmit={async (values) => {
        setIsLoading(true);
        try {
          const url = updateId ? `/policy/${updateId}` : "/policy";
          const method = updateId ? "put" : "post";

          const response = await request(
            {
              url,
              method,
              data: values,
            },
            router
          );

          if (response.status === 200 || response.status === 201) {
            toast.success(
              t(
                updateId
                  ? "Policy Updated Successfully"
                  : "Policy Created Successfully"
              )
            );
            router.push("/policy");
          } else {
            toast.error(t("Something went wrong"));
          }
        } catch (error) {
          console.error(error);
          toast.error(t("Error submitting form"));
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {({ values, errors, touched, setFieldValue }) => (
        <Form className="theme-form theme-form-2 mega-form">
          <Row>
            <Col sm="12">
              <SimpleInputField
                nameList={[
                  {
                    name: "name",
                    title: "Policy Name",
                    placeholder: "e.g. Standard 30-Day Return",
                    require: "true",
                  },
                ]}
              />
            </Col>

            <Col sm="12">
              <SearchableSelectInput
                nameList={[
                  {
                    name: "type",
                    title: "Policy Type",
                    require: "true",
                    inputprops: {
                      name: "type",
                      id: "type",
                      options: typeOptions,
                      initialTittle: "Select Type",
                    },
                  },
                ]}
              />
            </Col>

            <Col sm="12">
              <SimpleInputField
                nameList={[
                  {
                    name: "description",
                    title: "Description (Text)",
                    type: "textarea",
                    rows: 6,
                    placeholder: "Enter the full text of the policy here...",
                    require: "true",
                  },
                ]}
              />
            </Col>

            <Col sm="12">
              <div className="mb-4">
                <label className="form-label">{t("Status")}</label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="status"
                    checked={values.status}
                    onChange={(e) => setFieldValue("status", e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="status">
                    {values.status ? t("Active") : t("Inactive")}
                  </label>
                </div>
              </div>
            </Col>

            <Col sm="12">
              <Btn
                className="btn-primary"
                type="submit"
                title={buttonName || "Save Policy"}
                loading={isLoading}
              />
            </Col>
          </Row>
        </Form>
      )}
    </Formik>
      </CardBody>
    </Card>
  );
};

export default PolicyForm;
