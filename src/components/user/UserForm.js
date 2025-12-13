import React, { useEffect, useState } from "react";
import { Form, Formik } from "formik";
import { Row } from "reactstrap";
import FormBtn from "../../elements/buttons/FormBtn";
import request from "../../utils/axiosUtils";
import {
  emailSchema,
  nameSchema,
  passwordConfirmationSchema,
  passwordSchema,
  phoneSchema,
  roleIdSchema,
  YupObject,
} from "../../utils/validation/ValidationSchemas";
import Loader from "../commonComponent/Loader";
import UserAddress from "./widgets/UserAddress";
import CreateUser from "./widgets/CreateUser";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";

const UserForm = ({
  updateId,
  fixedRole,
  noRoleField,
  addAddress,
  type,
  buttonName,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedCode, setDetectedCode] = useState("960");
  const {
    data: rolesData,
    isLoading: roleLoading,
    refetch: RoleRefetch,
  } = useCustomQuery(["/role"], () => request({ url: "/role" }, router), {
    refetchOnMount: false,
    enabled: false,
    select: (data) =>
      data?.data?.data?.filter((elem) => elem.id !== 1 && elem.id !== 3),
  });

  const {
    data: oldData,
    isLoading: oldDataLoading,
    refetch,
  } = useCustomQuery(
    [updateId],
    () => request({ url: `/user/${updateId}` }, router),
    { enabled: false, refetchOnMount: false }
  );

  useEffect(() => {
    if (updateId) {
      refetch();
    }
  }, [updateId]);

  useEffect(() => {
    !fixedRole && RoleRefetch();
    console.log("Roles Data:", rolesData);
  }, []);

  // 2. Add useEffect to fetch IP location
  useEffect(() => {
    // Only fetch if it's a new user (not updating)
    if (!updateId) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data.country_calling_code) {
            // Remove the '+' sign if present (e.g., "+960" -> "960")
            const code = data.country_calling_code.replace("+", "");
            setDetectedCode(code);
          }
        })
        .catch((error) => console.error("Error fetching IP location:", error));
    }
  }, [updateId]);

  console.log("Roles Data:", rolesData);

  if (roleLoading && updateId && oldDataLoading) return <Loader />;
  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: updateId ? oldData?.data?.data?.name || "" : "",
        email: updateId ? oldData?.data?.data?.email || "" : "",
        phone: updateId ? Number(oldData?.data?.data?.phone) || "" : "",
        password: "",
        password_confirmation: "",
        role: updateId
          ? oldData?.data?.data?.role?._id ||
            oldData?.data?.data?.role?.id ||
            oldData?.data?.data?.role ||
            ""
          : rolesData
          ? ""
          : "",
        status: updateId ? Boolean(Number(oldData?.data?.data?.status)) : true,
        address: [],
        country_code: updateId
          ? oldData?.data?.data?.country_code || ""
          : detectedCode,
      }}
      validationSchema={YupObject({
        name: nameSchema,
        email: emailSchema,
        phone: phoneSchema,
        password: !updateId && passwordSchema,
        password_confirmation: !updateId && passwordConfirmationSchema,
        role: noRoleField ? null : roleIdSchema,
      })}
      onSubmit={async (values) => {
        setIsSubmitting(true);
        try {
          const apiUrl = updateId ? `user/${updateId}` : "user";
          const method = updateId ? "PUT" : "POST";

          const response = await request({
            url: apiUrl,
            method: method,
            data: values,
          });

          if (response?.data?.success) {
            ToastNotification("success", response.data.message);
            router.push("/user");
          } else {
            ToastNotification(
              "error",
              response?.data?.message || "Operation failed"
            );
          }
        } catch (error) {
          console.error("Error submitting user:", error);
          ToastNotification(
            "error",
            error?.response?.data?.message || "Something went wrong"
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, isValid, dirty }) => {
        // Debug logging for form state

        console.log("Formik State:", values);
        return (
          <Form className="theme-form theme-form-2 mega-form">
            <Row>
              {!addAddress && (
                <>
                  <CreateUser
                    updateId={updateId}
                    rolesData={rolesData}
                    fixedRole={fixedRole}
                  />
                </>
              )}
              <UserAddress addAddress={addAddress} type={type} />
              <FormBtn loading={isSubmitting} buttonName={buttonName} />
            </Row>
          </Form>
        );
      }}
    </Formik>
  );
};

export default UserForm;
