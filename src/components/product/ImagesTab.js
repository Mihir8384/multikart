import React from "react";
import { Alert, Col, Row } from "reactstrap";
import FileUploadField from "../inputFields/FileUploadField";

const ImagesTab = ({ values, setFieldValue, errors, updateId }) => {
  return (
    <>
      {/* --- Media Quality Standards Notice --- */}
      <Alert color="info" className="mb-4 d-flex flex-column align-items-start">
        <h5 className="alert-heading fw-bold mb-2">Media Quality Standards</h5>
        <div style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
          Use clear, well-lit photos with a clean background. Blurry or
          low-resolution images reduce customer trust and can hurt sales. <br />
          <strong>Recommended size:</strong> 1000×1000 px or higher, JPG/PNG.{" "}
          <br />
          You can upload up to 6 pictures and 1 video. For more information
          please visit the
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="fw-bold text-decoration-underline ms-1"
          >
            Product Image Quality Standard page
          </a>
          .
        </div>
      </Alert>

      {/* --- Upload Fields --- */}
      <Row>
        <Col sm="12" className="mb-4">
          <h5 className="mb-2">
            Product Thumbnail <span className="text-danger">*</span>
          </h5>
          <FileUploadField
            errors={errors}
            name="product_thumbnail_id"
            id="product_thumbnail_id"
            type="file"
            values={values}
            setFieldValue={setFieldValue}
            updateId={updateId}
          />
        </Col>

        <Col sm="12" className="mb-4">
          <h5 className="mb-2">Product Gallery Images</h5>
          <FileUploadField
            errors={errors}
            name="product_galleries_id"
            id="product_galleries_id"
            type="file"
            multiple={true}
            values={values}
            setFieldValue={setFieldValue}
            updateId={updateId}
          />
        </Col>

        <Col sm="12" className="mb-4">
          <h5 className="mb-2">Size Chart</h5>
          <FileUploadField
            errors={errors}
            name="size_chart_image_id"
            id="size_chart_image_id"
            type="file"
            values={values}
            setFieldValue={setFieldValue}
            updateId={updateId}
            helpertext="*Upload an image showcasing the size chart tailored for fashion products. A table format image is suggested for easy reference."
          />
        </Col>
      </Row>
    </>
  );
};

export default ImagesTab;
