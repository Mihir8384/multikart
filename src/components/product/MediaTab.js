import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";
import { Col, Card, CardBody, Label, Alert } from "reactstrap"; // Added Alert
import {
  RiDeleteBinLine,
  RiStarFill,
  RiStarLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import Image from "next/image";
import Btn from "@/elements/buttons/Btn";
import { placeHolderImage } from "@/data/CommonPath";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification"; // Import Toast for errors

const MediaTab = ({ values, setFieldValue, errors, updateId }) => {
  const { t } = useTranslation("common");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // This combines existing media (from oldData) with newly uploaded files for display
  const allMedia = [
    ...(values.media || []),
    ...uploadedFiles.map((file) => ({
      url: file.preview,
      is_primary: false,
      file, // Keep a reference to the File object
    })),
  ];

  // Helper function to validate image dimensions
  const validateImage = (file) => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        let isValid = true;
        let errorMessage = "";

        // 1. Check 1:1 Aspect Ratio
        if (width !== height) {
          isValid = false;
          errorMessage = `Image must be a square (1:1 ratio). Your image is ${width}x${height}px.`;
        }
        // 2. Check Resolution Range (1000px - 2000px)
        else if (width < 1000 || width > 2000) {
          isValid = false;
          errorMessage = `Resolution must be between 1000x1000px and 2000x2000px. Your image is ${width}x${height}px.`;
        }

        resolve({ isValid, errorMessage });
      };
      img.onerror = () => {
        resolve({ isValid: false, errorMessage: "Invalid image file." });
      };
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    onDrop: async (acceptedFiles) => {
      const validFiles = [];

      // Validate each file before adding
      for (const file of acceptedFiles) {
        const validation = await validateImage(file);
        if (validation.isValid) {
          // Add preview URL if valid
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          });
          validFiles.push(file);
        } else {
          // Show error if invalid
          ToastNotification("error", validation.errorMessage);
        }
      }

      if (validFiles.length > 0) {
        // Add new files to Formik state for submission
        setFieldValue("new_media_files", [
          ...(values.new_media_files || []),
          ...validFiles,
        ]);

        // Add to local state for display
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
    },
  });

  // Set an image as primary
  const setAsPrimary = (index) => {
    const updatedMedia = allMedia.map((media, i) => ({
      ...media,
      // 'url' is the unique key for existing media
      // 'preview' is the unique key for new files
      is_primary: i === index,
    }));

    // Update the main 'media' array in Formik
    // We only save existing media here to update their primary status
    // New files are handled separately via 'new_media_files'
    setFieldValue(
      "media",
      updatedMedia.filter((m) => !m.file)
    );
  };

  // Remove an image
  const removeImage = (index, mediaItem) => {
    if (mediaItem.file) {
      // 1. It's a NEW file (not yet saved)
      // Remove from local preview state
      setUploadedFiles((prev) =>
        prev.filter((file) => file.preview !== mediaItem.url)
      );
      // Remove from Formik 'new_media_files'
      setFieldValue(
        "new_media_files",
        values.new_media_files.filter((file) => file.preview !== mediaItem.url)
      );
    } else {
      // 2. It's an EXISTING file (already saved)
      // Add its URL to the delete list for the API
      setFieldValue("delete_media_urls", [
        ...(values.delete_media_urls || []),
        mediaItem.url,
      ]);
      // Remove it from the main 'media' array in Formik
      setFieldValue(
        "media",
        values.media.filter((m) => m.url !== mediaItem.url)
      );
    }
  };

  return (
    <Col>
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

      <div className="title-header option-title">
        <h5>{t("Media")}</h5>
      </div>

      {/* Dropzone Uploader */}
      <div {...getRootProps({ className: "dropzone-wrapper" })}>
        <input {...getInputProps()} />
        <div className="dropzone-box">
          <RiUploadCloud2Line className="fs-1" />
          <p>{t("Dropfileshereorclicktoupload")}</p>
        </div>
      </div>

      {/* Image Preview Grid */}
      <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
        {allMedia.map((mediaItem, index) => (
          <Card key={index} className="media-preview-card">
            <Image
              src={mediaItem.url || placeHolderImage}
              alt="Product Image"
              width={150}
              height={150}
              className="card-img-top"
              style={{ objectFit: "cover" }} // Ensure aspect ratio visual correctness
            />
            <CardBody className="p-2">
              <div className="d-flex justify-content-between align-items-center">
                <Btn
                  type="button"
                  className={`btn-icon ${
                    mediaItem.is_primary ? "btn-warning" : "btn-outline-warning"
                  }`}
                  onClick={() => setAsPrimary(index)}
                  title={
                    mediaItem.is_primary ? t("Primary") : t("SetAsPrimary")
                  }
                >
                  {mediaItem.is_primary ? <RiStarFill /> : <RiStarLine />}
                </Btn>
                <Btn
                  type="button"
                  className="btn-icon btn-outline-danger"
                  onClick={() => removeImage(index, mediaItem)}
                  title={t("Delete")}
                >
                  <RiDeleteBinLine />
                </Btn>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </Col>
  );
};

export default MediaTab;
