"use client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const person = Yup.object({
  name: Yup.string().min(2).max(120).required("Required"),
  email: Yup.string().email("Invalid").required("Required"),
  phone: Yup.string().min(5).max(20).required("Required"),
  designation: Yup.string().max(80),
});

const schema = Yup.object({
  contacts: Yup.object({
    primary: person.required(),
    orders: person.shape({ reuse_primary: Yup.boolean() }),
    payout: person.shape({ reuse_primary: Yup.boolean() }),
  }),
});

export default function Step2ContactInfo({ onSubmit, initialData }) {
  const initialValues = {
    contacts: {
      primary: {
        name: initialData?.contacts?.primary?.name || "",
        email: initialData?.contacts?.primary?.email || "",
        phone: initialData?.contacts?.primary?.phone || "",
        designation: initialData?.contacts?.primary?.designation || "",
      },
      orders: {
        name: initialData?.contacts?.orders?.name || "",
        email: initialData?.contacts?.orders?.email || "",
        phone: initialData?.contacts?.orders?.phone || "",
        reuse_primary:
          Boolean(initialData?.contacts?.orders?.reuse_primary) || false,
      },
      payout: {
        name: initialData?.contacts?.payout?.name || "",
        email: initialData?.contacts?.payout?.email || "",
        phone: initialData?.contacts?.payout?.phone || "",
        reuse_primary:
          Boolean(initialData?.contacts?.payout?.reuse_primary) || false,
      },
    },
  };

  const handleReuse = (values, setFieldValue, key) => {
    const reuse = values.contacts[key].reuse_primary;
    if (reuse) {
      setFieldValue(`contacts.${key}.name`, values.contacts.primary.name);
      setFieldValue(`contacts.${key}.email`, values.contacts.primary.email);
      setFieldValue(`contacts.${key}.phone`, values.contacts.primary.phone);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ values, setFieldValue }) => (
        <Form className="row g-3">
          <div className="col-12">
            <h5>Primary Contact</h5>
          </div>
          <div className="col-md-3">
            <label className="form-label">Name</label>
            <Field name="contacts.primary.name" className="form-control" />
            <div className="text-danger">
              <ErrorMessage name="contacts.primary.name" />
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <Field name="contacts.primary.email" className="form-control" />
            <div className="text-danger">
              <ErrorMessage name="contacts.primary.email" />
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Phone</label>
            <Field name="contacts.primary.phone" className="form-control" />
            <div className="text-danger">
              <ErrorMessage name="contacts.primary.phone" />
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Designation</label>
            <Field
              name="contacts.primary.designation"
              className="form-control"
            />
          </div>

          <div className="col-12 mt-3">
            <h5>Orders Contact</h5>
          </div>
          <div className="col-md-3">
            <label className="form-label">Name</label>
            <Field name="contacts.orders.name" className="form-control" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <Field name="contacts.orders.email" className="form-control" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Phone</label>
            <Field name="contacts.orders.phone" className="form-control" />
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <label className="form-check ms-2">
              <Field
                type="checkbox"
                name="contacts.orders.reuse_primary"
                className="form-check-input"
                onChange={() => {
                  setFieldValue(
                    "contacts.orders.reuse_primary",
                    !values.contacts.orders.reuse_primary
                  );
                  setTimeout(
                    () => handleReuse(values, setFieldValue, "orders"),
                    0
                  );
                }}
              />
              <span className="ms-2">Reuse Primary</span>
            </label>
          </div>

          <div className="col-12 mt-3">
            <h5>Payout Contact</h5>
          </div>
          <div className="col-md-3">
            <label className="form-label">Name</label>
            <Field name="contacts.payout.name" className="form-control" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Email</label>
            <Field name="contacts.payout.email" className="form-control" />
          </div>
          <div className="col-md-3">
            <label className="form-label">Phone</label>
            <Field name="contacts.payout.phone" className="form-control" />
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <label className="form-check ms-2">
              <Field
                type="checkbox"
                name="contacts.payout.reuse_primary"
                className="form-check-input"
                onChange={() => {
                  setFieldValue(
                    "contacts.payout.reuse_primary",
                    !values.contacts.payout.reuse_primary
                  );
                  setTimeout(
                    () => handleReuse(values, setFieldValue, "payout"),
                    0
                  );
                }}
              />
              <span className="ms-2">Reuse Primary</span>
            </label>
          </div>

          <div className="col-12">
            <button type="submit" className="btn btn-primary">
              Save & Continue
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
