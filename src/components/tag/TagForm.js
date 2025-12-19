import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Row } from "reactstrap";
import FormBtn from "../../elements/buttons/FormBtn";
import request from "../../utils/axiosUtils";
import {
  YupObject,
  nameSchema,
} from "../../utils/validation/ValidationSchemas";
import * as Yup from "yup"; // Added for description validation
import Loader from "../commonComponent/Loader";
import CheckBoxField from "../inputFields/CheckBoxField";
import SimpleInputField from "../inputFields/SimpleInputField";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { ToastNotification } from "../../utils/customFunctions/ToastNotification";

const TagForm = ({ updateId, type, buttonName }) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: oldData,
    isLoading,
    refetch,
  } = useCustomQuery(
    ["tag", updateId],
    () => request({ url: `tag/${updateId}` }, router),
    { refetchOnMount: false, enabled: false }
  );

  useEffect(() => {
    updateId && refetch();
  }, [updateId]);

  if (updateId && isLoading) return <Loader />;

  return (
    <Formik
      enableReinitialize
      initialValues={{
        name: updateId ? oldData?.data?.data?.name || "" : "",
        type: type || "product",
        description: updateId ? oldData?.data?.data?.description || "" : "",
        status: updateId ? Boolean(Number(oldData?.data?.data?.status)) : true,
      }}
      validationSchema={YupObject({
        name: nameSchema,
        description: Yup.string().required("Description is required"), // Mandatory Requirement
      })}
      onSubmit={async (values) => {
        setIsSubmitting(true);
        try {
          const apiUrl = updateId ? `tag/${updateId}` : "tag";
          const method = updateId ? "PUT" : "POST";
          const response = await request(
            {
              url: apiUrl,
              method: method,
              data: { ...values, status: values.status ? 1 : 0 },
            },
            router
          );

          if (response?.status === 200 || response?.status === 201) {
            ToastNotification(
              "success",
              updateId ? "Tag Updated Successfully" : "Tag Created Successfully"
            );
            router.push("/tag");
          }
        } catch (error) {
          ToastNotification(
            "error",
            error?.response?.data?.message || "Something went wrong"
          );
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      {() => (
        <Form className="theme-form theme-form-2 mega-form">
          <Row>
            <SimpleInputField
              nameList={[
                {
                  name: "name",
                  placeholder: t("EnterTagName"),
                  require: "true",
                },
                {
                  name: "description",
                  type: "textarea",
                  title: "Description",
                  placeholder: t("EnterDescription"),
                  require: "true", // Shows the asterisk (*)
                },
              ]}
            />
            <CheckBoxField name="status" />
            <FormBtn
              loading={isSubmitting}
              buttonName={isSubmitting ? "Submitting..." : buttonName}
            />
          </Row>
        </Form>
      )}
    </Formik>
  );
};

export default TagForm;
