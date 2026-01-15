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
} from "reactstrap";
import { Formik, Form, Field } from "formik";
import { useTranslation } from "react-i18next";
import { FiPlus } from "react-icons/fi";
import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import { toast } from "react-toastify";

const supportApi = "/vendor/support/tickets";

const SupportTable = ({ data, refetch, ...props }) => {
  const { t } = useTranslation("common");
  
  // Extract and process data
  const processedData = (data?.data?.data || data?.data || []).map((item) => ({
    ...item,
    id: item._id, // Ensure id property exists
    status_display: item.status,
    status_color: item.status === "Open" ? "primary" : "success",
  }));

  const headerObj = {
    checkBox: false,
    isSerialNo: false,
    isOption: true,
    noEdit: true,
    optionHead: { title: "Action", type: "view" },
    column: [
      { title: "Ticket ID", apiKey: "ticket_id", sorting: true },
      { title: "Subject", apiKey: "subject", sorting: true },
      { title: "Category", apiKey: "category", sorting: true },
      { title: "Status", apiKey: "status_display", type: "badge" },
      { title: "Date", apiKey: "createdAt", type: "date", sorting: true },
    ],
    data: processedData,
  };

  return <ShowTable {...props} headerData={headerObj} refetch={refetch} />;
};

const SupportTableWrapped = TableWrapper(SupportTable);

const VendorSupport = () => {
  const { t } = useTranslation("common");
  const [modal, setModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const res = await request({
        url: supportApi,
        method: "post",
        data: values,
      });
      if (res.status === 200 || res.status === 201) {
        toast.success(t("Ticket raised successfully"));
        setModal(false);
        resetForm();
        setRefreshTrigger((prev) => prev + 1); // Trigger table refresh
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Col sm="12">
      <Card>
        <CardBody>
          <div className="title-header option-title mb-4">
            <h5>{t("Support Tickets")}</h5>
            <Btn
              className="btn-theme add-button"
              onClick={() => setModal(true)}
            >
              <FiPlus /> {t("New Ticket")}
            </Btn>
          </div>

          <SupportTableWrapped
            url={supportApi}
            moduleName="support"
            onlyTitle={true}
            key={refreshTrigger}
          />

          <Modal isOpen={modal} toggle={() => setModal(false)} centered>
            <ModalHeader toggle={() => setModal(false)}>
              {t("Raise New Ticket")}
            </ModalHeader>
            <ModalBody>
              <Formik
                initialValues={{ subject: "", category: "Payout", message: "" }}
                onSubmit={handleSubmit}
              >
                <Form className="theme-form">
                  <FormGroup>
                    <Label>{t("Subject")}</Label>
                    <Field name="subject" className="form-control" required />
                  </FormGroup>
                  <FormGroup>
                    <Label>{t("Category")}</Label>
                    <Field as="select" name="category" className="form-control">
                      <option value="Payout">{t("Payout Issue")}</option>
                      <option value="Technical">{t("Technical Error")}</option>
                      <option value="Account">{t("Account Issue")}</option>
                    </Field>
                  </FormGroup>
                  <FormGroup>
                    <Label>{t("Message")}</Label>
                    <Field
                      as="textarea"
                      name="message"
                      className="form-control"
                      rows="4"
                      required
                    />
                  </FormGroup>
                  <div className="text-end">
                    <Btn
                      type="submit"
                      title={t("Submit")}
                      className="btn-primary"
                    />
                  </div>
                </Form>
              </Formik>
            </ModalBody>
          </Modal>
        </CardBody>
      </Card>
    </Col>
  );
};

export default VendorSupport;
