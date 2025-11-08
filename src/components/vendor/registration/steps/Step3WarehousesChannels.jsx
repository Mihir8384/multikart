"use client";
import { Formik, Form, Field, FieldArray } from "formik";

export default function Step3WarehousesChannels({ onSubmit, initialData }) {
  const initialValues = {
    warehouses: initialData?.warehouses?.length
      ? initialData.warehouses
      : [
          {
            name: "",
            address: "",
            city: "",
            state: "",
            country: "",
            zip: "",
            phone: "",
            is_active: true,
          },
        ],
    channels: initialData?.channels?.length
      ? initialData.channels
      : [{ type: "Storefront", handle: "", url: "", is_active: true }],
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ values }) => (
        <Form className="row g-3">
          <div className="col-12">
            <h5>Warehouses</h5>
          </div>
          <FieldArray name="warehouses">
            {({ push, remove }) => (
              <>
                {values.warehouses.map((w, idx) => (
                  <div key={idx} className="row g-2 align-items-end mb-2">
                    <div className="col-md-3">
                      <label className="form-label">Name</label>
                      <Field
                        name={`warehouses.${idx}.name`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Address</label>
                      <Field
                        name={`warehouses.${idx}.address`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">City</label>
                      <Field
                        name={`warehouses.${idx}.city`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">State</label>
                      <Field
                        name={`warehouses.${idx}.state`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Country</label>
                      <Field
                        name={`warehouses.${idx}.country`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">ZIP</label>
                      <Field
                        name={`warehouses.${idx}.zip`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Phone</label>
                      <Field
                        name={`warehouses.${idx}.phone`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2 d-flex">
                      <label className="form-check">
                        <Field
                          type="checkbox"
                          name={`warehouses.${idx}.is_active`}
                          className="form-check-input"
                        />
                        <span className="ms-2">Active</span>
                      </label>
                    </div>
                    <div className="col-md-2">
                      {values.warehouses.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => remove(idx)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="col-12">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      push({
                        name: "",
                        address: "",
                        city: "",
                        state: "",
                        country: "",
                        zip: "",
                        phone: "",
                        is_active: true,
                      })
                    }
                  >
                    + Add Warehouse
                  </button>
                </div>
              </>
            )}
          </FieldArray>

          <div className="col-12 mt-4">
            <h5>Sales Channels</h5>
          </div>
          <FieldArray name="channels">
            {({ push, remove }) => (
              <>
                {values.channels.map((c, idx) => (
                  <div key={idx} className="row g-2 align-items-end mb-2">
                    <div className="col-md-3">
                      <label className="form-label">Type</label>
                      <Field
                        as="select"
                        name={`channels.${idx}.type`}
                        className="form-select"
                      >
                        <option value="Storefront">Storefront</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Handle</label>
                      <Field
                        name={`channels.${idx}.handle`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">URL</label>
                      <Field
                        name={`channels.${idx}.url`}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-2 d-flex">
                      <label className="form-check">
                        <Field
                          type="checkbox"
                          name={`channels.${idx}.is_active`}
                          className="form-check-input"
                        />
                        <span className="ms-2">Active</span>
                      </label>
                    </div>
                    <div className="col-md-2">
                      {values.channels.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => remove(idx)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="col-12">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() =>
                      push({
                        type: "Storefront",
                        handle: "",
                        url: "",
                        is_active: true,
                      })
                    }
                  >
                    + Add Channel
                  </button>
                </div>
              </>
            )}
          </FieldArray>

          <div className="col-12">
            <button type="submit" className="btn btn-primary mt-2">
              Save & Continue
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
