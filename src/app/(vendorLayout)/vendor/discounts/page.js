"use client";
import React, { useState } from "react";
import {
  Col,
  Card,
  CardBody,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  Button,
} from "reactstrap";
import { Formik, Form, Field } from "formik";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import { RiPencilLine, RiDeleteBinLine } from "react-icons/ri";

import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import Loader from "@/components/commonComponent/Loader";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { toast } from "react-toastify";
import { dateFormat } from "@/utils/customFunctions/DateFormat";

const apiRoute = "/vendor/discount";

const DiscountTable = ({
  data,
  refetch,
  setEditingRule,
  setModal,
  ...props
}) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  if (data === null || data === undefined) {
    return <Loader />;
  }

  // TableWrapper passes the paginated response object
  // Extract the actual data array from data.data
  const tableData = Array.isArray(data) 
    ? data 
    : Array.isArray(data?.data) 
    ? data.data 
    : [];

  // Delete handler
  const handleDelete = async (id) => {
    if (confirm(t("Are you sure you want to delete this rule?"))) {
      try {
        const res = await request({
          url: `${apiRoute}/${id}`,
          method: "delete",
        });
        if (res?.status === 200) {
          toast.success(t("Deleted successfully"));
          refetch();
        }
      } catch (error) {
        toast.error(error?.message || t("Failed to delete"));
        console.error("Delete error:", error);
      }
    }
  };

  // Configure table header with actions
  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: true,
    noEdit: false,
    optionHead: {
      title: "Action",
      type: "edit",
      url: "/vendor/discounts/edit", // Base URL for edit route
    },
    column: [
      { title: "Rule Name", apiKey: "rule_name", sorting: true, sortBy: "desc" },
      { title: "Application Type", apiKey: "application_type", sorting: true },
      { title: "Start Date", apiKey: "start_date", type: "date" },
      { title: "End Date", apiKey: "end_date", type: "date" },
      {
        title: "Value",
        apiKey: "value",
        sorting: false,
      },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    data: tableData.map((item) => ({
      ...item,
      id: item._id || item.id,
      // Transform value to include percentage/amount suffix
      value: `${item.value}${item.discount_type === "Percentage" ? "%" : " Amt"}`,
    })),
  };

  return (
    <ShowTable
      {...props}
      headerData={headerObj}
      editPermission={true}
      destroyPermission={true}
      refetch={refetch}
      moduleName="discounts"
      type="discounts"
      url={apiRoute}
      link="discounts"
    />
  );
};

const DiscountTableWrapped = TableWrapper(DiscountTable);

const VendorDiscounts = () => {
  const { t } = useTranslation("common");
  const [isCheck, setIsCheck] = useState([]);
  const [modal, setModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Categories & Products for the modal dropdowns
  const { data: categoryData } = useCustomQuery(["categories"], () =>
    request({ url: "/category" })
  );
  const { data: productData } = useCustomQuery(["vendorProducts"], () =>
    request({ url: "/vendor/product" })
  );

  // Extract products array from paginated structure
  const products = React.useMemo(() => {
    if (Array.isArray(productData?.data?.data?.data)) {
      return productData.data.data.data;
    }
    if (Array.isArray(productData?.data?.data)) {
      return productData.data.data;
    }
    if (Array.isArray(productData?.data)) {
      return productData.data;
    }
    return [];
  }, [productData]);

  const closeModal = () => {
    setModal(false);
    setEditingRule(null);
  };

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      const method = editingRule ? "put" : "post";
      const url = editingRule ? `${apiRoute}/${editingRule._id}` : apiRoute;

      const res = await request({
        url,
        method,
        data: values,
      });

      if (res?.status === 200 || res?.status === 201) {
        closeModal();
        toast.success(
          editingRule ? t("Updated successfully") : t("Created successfully")
        );
        resetForm();
        // Trigger table refresh
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error?.message || t("Something went wrong"));
      console.error("API Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Col sm="12">
      <Card className="card-no-border">
        <CardBody>
          <div className="title-header option-title d-flex align-items-center justify-content-between mb-4">
            <h5 className="mb-0 fw-bold">{t("Discount Rules")}</h5>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => {
                setEditingRule(null);
                setModal(true);
              }}
            >
              <FiPlus size={18} />
              <span>{t("Add New Rule")}</span>
            </button>
          </div>

          <DiscountTableWrapped
            url={apiRoute}
            moduleName="discounts"
            isCheck={isCheck}
            setIsCheck={setIsCheck}
            setEditingRule={setEditingRule}
            setModal={setModal}
            onlyTitle={true}
            key={refreshTrigger}
          />

          {/* Add / Edit Modal */}
          <Modal isOpen={modal} toggle={closeModal} centered size="lg" className="theme-modal">
            <ModalHeader toggle={closeModal} className="bg-light">
              <h5 className="modal-title fw-bold mb-0">
                {editingRule ? t("Edit Discount Rule") : t("Add New Discount Rule")}
              </h5>
            </ModalHeader>
            <ModalBody className="p-4">
              <Formik
                enableReinitialize
                initialValues={{
                  rule_name: editingRule?.rule_name || "",
                  application_type: editingRule?.application_type || "All",
                  apply_on: editingRule?.apply_on || "",
                  discount_type: editingRule?.discount_type || "Percentage",
                  value: editingRule?.value || "",
                  start_date: editingRule?.start_date
                    ? new Date(editingRule.start_date)
                        .toISOString()
                        .slice(0, 16)
                    : "",
                  end_date: editingRule?.end_date
                    ? new Date(editingRule.end_date).toISOString().slice(0, 16)
                    : "",
                  status: editingRule ? editingRule.status : true,
                }}
                onSubmit={handleSubmit}
              >
                {({ values, setFieldValue }) => (
                  <Form className="theme-form">
                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Rule Name")} <span className="text-danger">*</span></Label>
                      <Field
                        name="rule_name"
                        className="form-control"
                        placeholder="Enter discount rule name"
                        required
                      />
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Application Type")} <span className="text-danger">*</span></Label>
                      <div className="d-flex gap-4 mt-2">
                        {["All", "Category", "Product"].map((type) => (
                          <div key={type} className="form-check">
                            <Field
                              type="radio"
                              name="application_type"
                              value={type}
                              className="form-check-input"
                              id={`type-${type}`}
                              onChange={(e) => {
                                setFieldValue(
                                  "application_type",
                                  e.target.value
                                );
                                setFieldValue("apply_on", "");
                              }}
                            />
                            <label className="form-check-label" htmlFor={`type-${type}`}>
                              {t(type)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormGroup>

                    {values.application_type === "Category" && (
                      <FormGroup className="mb-3">
                        <Label className="fw-semibold">{t("Apply on Category")} <span className="text-danger">*</span></Label>
                        <Field
                          as="select"
                          name="apply_on"
                          className="form-select"
                          required
                        >
                          <option value="">{t("Select Category")}</option>
                          {Array.isArray(categoryData?.data?.data) &&
                            categoryData.data.data.map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </Field>
                      </FormGroup>
                    )}

                    {values.application_type === "Product" && (
                      <FormGroup className="mb-3">
                        <Label className="fw-semibold">{t("Apply on Product")} <span className="text-danger">*</span></Label>
                        <Field
                          as="select"
                          name="apply_on"
                          className="form-select"
                          required
                        >
                          <option value="">{t("Select Product")}</option>
                          {products.length > 0 ? (
                            products.map((prod) => (
                              <option key={prod.id || prod._id} value={prod.id || prod._id}>
                                {prod.name || prod.product_name}
                              </option>
                            ))
                          ) : (
                            <option disabled>No products available</option>
                          )}
                        </Field>
                      </FormGroup>
                    )}

                    <div className="row">
                      <div className="col-md-6">
                        <FormGroup className="mb-3">
                          <Label className="fw-semibold">{t("Discount Type")} <span className="text-danger">*</span></Label>
                          <Field
                            as="select"
                            name="discount_type"
                            className="form-select"
                          >
                            <option value="Percentage">
                              {t("Percentage (%)")}
                            </option>
                            <option value="Amount">{t("Fixed Amount")}</option>
                          </Field>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup className="mb-3">
                          <Label className="fw-semibold">{t("Value")} <span className="text-danger">*</span></Label>
                          <Field
                            name="value"
                            type="number"
                            className="form-control"
                            placeholder="Enter discount value"
                            min="0"
                            step="0.01"
                            required
                          />
                        </FormGroup>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <FormGroup className="mb-3">
                          <Label className="fw-semibold">{t("Start Date")} <span className="text-danger">*</span></Label>
                          <Field
                            name="start_date"
                            type="datetime-local"
                            className="form-control"
                            required
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup className="mb-3">
                          <Label className="fw-semibold">{t("End Date")} <span className="text-danger">*</span></Label>
                          <Field
                            name="end_date"
                            type="datetime-local"
                            className="form-control"
                            required
                          />
                        </FormGroup>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                      <Button
                        type="button"
                        color="light"
                        onClick={closeModal}
                        className="px-4"
                      >
                        {t("Cancel")}
                      </Button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {editingRule ? t("Updating...") : t("Saving...")}
                          </>
                        ) : (
                          editingRule ? t("Update Rule") : t("Save Rule")
                        )}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </ModalBody>
          </Modal>
        </CardBody>
      </Card>
    </Col>
  );
};

export default VendorDiscounts;
