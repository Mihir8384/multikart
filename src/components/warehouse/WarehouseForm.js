"use client";

import React, { useEffect, useState } from "react";
import { Form, Formik } from "formik";
import { Row, Col, Card, CardBody } from "reactstrap";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import SimpleInputField from "../inputFields/SimpleInputField";
import FormBtn from "@/elements/buttons/FormBtn";
import request from "@/utils/axiosUtils";
import Loader from "../commonComponent/Loader";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { YupObject } from "@/utils/validation/ValidationSchemas";

const WarehouseForm = ({ updateId, isVendor = false }) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    name: "",
    building_name: "",
    floor: "",
    unit: "",
    island: "",
    atoll: "",
    contact_no: "",
    country: "Maldives",
  });
  
  // Use prop if provided, otherwise detect from pathname
  const isVendorLayout = React.useMemo(() => {
    if (isVendor) return true;
    if (pathname?.includes('/vendor/')) return true;
    if (typeof window !== 'undefined' && window.location.pathname.includes('/vendor/')) return true;
    return false;
  }, [isVendor, pathname]);
  
  // Determine API endpoint and navigation paths
  const apiEndpoint = isVendorLayout ? "vendor/warehouse" : "warehouse";
  const listPath = isVendorLayout ? "/vendor/warehouses" : "/warehouse";

  // Fetch existing data if in Edit Mode
  useEffect(() => {
    if (updateId) {
      setLoading(true);
      request({ url: `${apiEndpoint}/${updateId}` }, router)
        .then((res) => {
          if (res?.data?.success) {
            setInitialValues(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Error loading warehouse:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [updateId, router, apiEndpoint]);

  // Validation Schema
  const validationSchema = YupObject({
    name: Yup.string().required(t("Name is required")),
    building_name: Yup.string().required(t("Building name is required")),
    island: Yup.string().required(t("Island is required")),
    atoll: Yup.string().required(t("Atoll is required")),
    contact_no: Yup.string().required(t("Contact number is required")),
  });

  const onSubmit = async (values) => {
    try {
      const url = updateId ? `${apiEndpoint}/${updateId}` : apiEndpoint;
      const method = updateId ? "PUT" : "POST";
      const response = await request({ url, method, data: values }, router);

      if (response?.data?.success) {
        ToastNotification(
          "success",
          updateId ? t("Updated successfully") : t("Created successfully")
        );
        router.push(listPath);
      }
    } catch (error) {
      ToastNotification("error", t("Failed to save fulfillment center"));
    }
  };

  if (loading) return <Loader />;

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {() => (
        <Form className="theme-form theme-form-2 mega-form">
          <Row>
            <Col xl="12">
              <Card>
                <CardBody>
                  <SimpleInputField
                    nameList={[
                      {
                        name: "name",
                        title: "Center Name",
                        placeholder: t("e.g. Fulfillment Hulhumale 1"),
                        require: "true",
                      },
                      {
                        name: "building_name",
                        title: "Building Name",
                        placeholder: t("Enter Building Name"),
                        require: "true",
                      },
                    ]}
                  />
                  <Row>
                    <Col md="6">
                      <SimpleInputField
                        nameList={[
                          {
                            name: "floor",
                            title: "Floor",
                            placeholder: t("Enter Floor"),
                          },
                        ]}
                      />
                    </Col>
                    <Col md="6">
                      <SimpleInputField
                        nameList={[
                          {
                            name: "unit",
                            title: "Unit",
                            placeholder: t("Enter Unit"),
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md="6">
                      <SimpleInputField
                        nameList={[
                          {
                            name: "island",
                            title: "Island/City",
                            placeholder: t("Enter Island"),
                            require: "true",
                          },
                        ]}
                      />
                    </Col>
                    <Col md="6">
                      <SimpleInputField
                        nameList={[
                          {
                            name: "atoll",
                            title: "Atoll",
                            placeholder: t("Enter Atoll"),
                            require: "true",
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                  <SimpleInputField
                    nameList={[
                      {
                        name: "contact_no",
                        title: "Contact Number",
                        placeholder: t("Enter Contact Number"),
                        require: "true",
                      },
                      { name: "country", title: "Country", disabled: true },
                    ]}
                  />
                  <FormBtn />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </Formik>
  );
};

export default WarehouseForm;
