import React from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { VendorProductAPI } from "@/utils/axiosUtils/API";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import SimpleInputField from "@/components/inputFields/SimpleInputField";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput";

const VendorOfferingForm = ({ product, isOpen, toggle }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  // 1. Validation Schema (Defined here or outside component)
  const OfferingSchema = Yup.object().shape({
    price: Yup.number().required("Price is required").min(1),
    stock_quantity: Yup.number().required("Stock is required").min(0),
    condition: Yup.string().required("Condition is required"),
    shipping_info: Yup.string().required("Shipping info is required"),
  });

  // 2. Submit Mutation (HOOK - Must be called unconditionally)
  const submitMutation = useMutation({
    mutationFn: (data) =>
      request({ url: VendorProductAPI, method: "POST", data }),
    onSuccess: () => {
      ToastNotification("success", "Product listed successfully!");
      toggle(); // Close modal
      router.push("/vendor/products"); // Redirect to My Products
    },
    onError: (error) => {
      ToastNotification(
        "error",
        error.response?.data?.message || "Failed to list product"
      );
    },
  });

  // 3. NOW we can safely return null if no product is selected
  if (!product) return null;

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg" centered>
      <ModalHeader toggle={toggle}>
        {t("Sell Product")}: {product.product_name}
      </ModalHeader>
      <ModalBody>
        <div className="mb-4 d-flex gap-3 align-items-center p-3 bg-light rounded">
          <div className="flex-grow-1">
            <h6 className="mb-1">{product.product_name}</h6>
            <small className="text-muted">
              UPID: {product.master_product_code}
            </small>
          </div>
        </div>

        <Formik
          initialValues={{
            master_product_id: product._id,
            price: "",
            currency: "MVR",
            stock_quantity: "",
            condition: "new",
            shipping_info: "",
            status: "active",
          }}
          validationSchema={OfferingSchema}
          onSubmit={(values) => {
            const formData = new FormData();

            const payload = {
              master_product_id: values.master_product_id,
              price: values.price,
              stock_quantity: values.stock_quantity,
              condition: values.condition,
              shipping_info: values.shipping_info,
            };

            formData.append("data", JSON.stringify(payload));

            submitMutation.mutate(formData);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="theme-form">
              <SimpleInputField
                nameList={[
                  {
                    name: "price",
                    title: "Your Price (MVR)",
                    type: "number",
                    placeholder: "e.g. 1200",
                    require: "true",
                  },
                  {
                    name: "stock_quantity",
                    title: "Stock Quantity",
                    type: "number",
                    placeholder: "e.g. 50",
                    require: "true",
                  },
                  {
                    name: "shipping_info",
                    title: "Shipping Information",
                    type: "text",
                    placeholder: "e.g. Ships in 2 days",
                    require: "true",
                  },
                ]}
              />

              <SearchableSelectInput
                nameList={[
                  {
                    name: "condition",
                    title: "Condition",
                    require: "true",
                    inputprops: {
                      name: "condition",
                      id: "condition",
                      options: [
                        { id: "new", name: "New" },
                        { id: "refurbished", name: "Refurbished" },
                      ],
                    },
                  },
                ]}
              />

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Btn className="btn-secondary" onClick={toggle} type="button">
                  {t("Cancel")}
                </Btn>
                <Btn
                  className="btn-primary"
                  type="submit"
                  loading={isSubmitting || submitMutation.isLoading}
                >
                  {t("List Product")}
                </Btn>
              </div>
            </Form>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default VendorOfferingForm;
