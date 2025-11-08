"use client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const schema = Yup.object({
  store_name: Yup.string().min(2).max(120).required("Required"),
  business: Yup.object({
    type: Yup.string()
      .oneOf([
        "Sole Proprietorship",
        "Partnership",
        "Private Limited",
        "Public Limited",
        "LLC",
        "Other",
      ])
      .required("Required"),
    name: Yup.string().min(2).max(120).required("Required"),
    registration_number: Yup.string().max(60),
    registration_date: Yup.date().nullable(),
    tax_id: Yup.string().max(60),
  }),
});

export default function Step1BusinessDetails({ onSubmit, initialData }) {
  const initialValues = {
    store_name: initialData?.store_name || "",
    business: {
      type: initialData?.business?.type || "",
      name: initialData?.business?.name || "",
      registration_number: initialData?.business?.registration_number || "",
      registration_date: initialData?.business?.registration_date
        ? initialData.business.registration_date.substring(0, 10)
        : "",
      tax_id: initialData?.business?.tax_id || "",
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
        <div className="col-md-6">
          <label className="form-label">Store Name</label>
          <Field name="store_name" className="form-control" />
          <div className="text-danger">
            <ErrorMessage name="store_name" />
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Business Type</label>
          <Field as="select" name="business.type" className="form-select">
            <option value="">Select</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Private Limited">Private Limited</option>
            <option value="Public Limited">Public Limited</option>
            <option value="LLC">LLC</option>
            <option value="Other">Other</option>
          </Field>
          <div className="text-danger">
            <ErrorMessage name="business.type" />
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Legal Business Name</label>
          <Field name="business.name" className="form-control" />
          <div className="text-danger">
            <ErrorMessage name="business.name" />
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Registration Number</label>
          <Field name="business.registration_number" className="form-control" />
        </div>

        <div className="col-md-6">
          <label className="form-label">Registration Date</label>
          <Field
            type="date"
            name="business.registration_date"
            className="form-control"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Tax ID</label>
          <Field name="business.tax_id" className="form-control" />
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
