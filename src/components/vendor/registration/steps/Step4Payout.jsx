"use client";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const schema = Yup.object({
  payout: Yup.object({
    bank_name: Yup.string().required("Required"),
    account_number: Yup.string().required("Required"),
    account_holder_name: Yup.string().required("Required"),
    country: Yup.string().required("Required"),
    maldives_bank_code: Yup.string(),
    swift_code: Yup.string(),
  }),
});

export default function Step4Payout({ onSubmit, initialData }) {
  const initialValues = {
    payout: {
      bank_name: initialData?.payout?.bank_name || "",
      account_number: initialData?.payout?.account_number || "",
      account_holder_name: initialData?.payout?.account_holder_name || "",
      country: initialData?.payout?.country || "",
      maldives_bank_code: initialData?.payout?.maldives_bank_code || "",
      swift_code: initialData?.payout?.swift_code || "",
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      <Form className="row g-3">
        <div className="col-md-4">
          <label className="form-label">Bank Name</label>
          <Field name="payout.bank_name" className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Account Number</label>
          <Field name="payout.account_number" className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Account Holder Name</label>
          <Field name="payout.account_holder_name" className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Country</label>
          <Field name="payout.country" className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Maldives Bank Code</label>
          <Field
            name="payout.maldives_bank_code"
            className="form-control"
            placeholder="If applicable"
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">SWIFT Code</label>
          <Field name="payout.swift_code" className="form-control" />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-primary">
            Save & Continue
          </button>
        </div>
      </Form>
    </Formik>
  );
}
