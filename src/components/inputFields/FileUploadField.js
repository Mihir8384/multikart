import { mimeImageMapping } from "@/data/MimeImageType";
import { ErrorMessage } from "formik";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine } from "react-icons/ri";
import { Input } from "reactstrap";
import InputWrapper from "../../utils/hoc/InputWrapper";
import { handleModifier } from "../../utils/validation/ModifiedErrorMessage";
import AttachmentModal from "../attachment/widgets/attachmentModal";
import request from "../../utils/axiosUtils";
import { useRouter } from "next/navigation";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";

const FileUploadField = ({
  values,
  updateId,
  setFieldValue,
  errors,
  multiple,
  loading,
  showImage,
  paramsProps,
  ...props
}) => {
  const storeImageObject = props.name.split("_id")[0];
  const { t } = useTranslation("common");
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (values) {
      multiple
        ? setSelectedImage(values[storeImageObject])
        : values[storeImageObject]
        ? setSelectedImage(loading ? null : [values[storeImageObject]])
        : values[props.name]
        ? setSelectedImage([values[props.name]])
        : setSelectedImage([]);
    }
  }, [values[storeImageObject], loading]);

  useEffect(() => {
    if (props?.uniquename) {
      if (Array.isArray(props?.uniquename)) {
        const onlyIds = props?.uniquename?.map((data) => data.id);
        setSelectedImage(loading ? null : props?.uniquename);
        setFieldValue(props?.name, onlyIds);
      } else {
        setSelectedImage(loading ? null : [props?.uniquename]);
        setFieldValue(props?.name, props?.uniquename?.id);
      }
    }
  }, [props?.uniquename, loading, showImage]);

  const removeImage = async (result) => {
    if (props.name) {
      setIsDeleting(true);
      try {
        const attachmentId = result.id || result._id;
        if (attachmentId) {
          const response = await request(
            {
              url: `/attachment/${attachmentId}`,
              method: "DELETE",
            },
            router
          );
          if (response?.data?.success) {
            ToastNotification("success", "Image deleted successfully");
          }
        }

        if (multiple) {
          let updatedImage = selectedImage.filter(
            (elem) => (elem.id || elem._id) !== (result.id || result._id)
          );
          setSelectedImage(updatedImage);
          setFieldValue(storeImageObject, updatedImage);
          setFieldValue(
            props?.name,
            updatedImage.map((img) => img.id || img._id)
          );
        } else {
          setFieldValue(props?.name, null);
          setSelectedImage([]);
          setFieldValue(storeImageObject, "");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        ToastNotification("error", "Failed to delete image");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getMimeTypeImage = (result) => {
    return mimeImageMapping[result?.mime_type] ??
      result?.original_url?.split("/")[1] == "storage"
      ? result?.original_url
      : result?.original_url;
  };

  const ImageShow = () => {
    return (
      <>
        {selectedImage?.length > 0 &&
          selectedImage?.map((result, i) => (
            <li key={i}>
              <div className="media-img-box">
                {/* Fixed Styling for 1:1 Aspect Ratio Display */}
                <div
                  style={{
                    width: "130px",
                    height: "130px",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "4px",
                  }}
                >
                  <Image
                    src={getMimeTypeImage(result)}
                    className="img-fluid"
                    alt="product image"
                    fill // Next.js Image fill prop
                    style={{ objectFit: "cover" }} // Ensures image covers the box without stretching
                  />
                </div>
                <p className="remove-icon">
                  <RiCloseLine
                    onClick={() => !isDeleting && removeImage(result)}
                    style={{
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  />
                </p>
              </div>
              <h6>{result?.file_name}</h6>
            </li>
          ))}
      </>
    );
  };

  return (
    <>
      <ul className={`image-select-list`}>
        <li className="choosefile-input">
          <Input
            {...props}
            onClick={(event) => {
              event.preventDefault();
              setModal(props.id);
            }}
          />
          <label htmlFor={props.id}>
            <Image
              height={40}
              width={40}
              src={"/assets/images/add-image.png"}
              className="img-fluid"
              alt=""
            />
          </label>
        </li>

        <ImageShow />

        <AttachmentModal
          paramsProps={paramsProps}
          modal={modal == props.id}
          name={props.name}
          multiple={multiple}
          values={values}
          setModal={setModal}
          setFieldValue={setFieldValue}
          setSelectedImage={setSelectedImage}
          selectedImage={selectedImage}
          showImage={showImage}
          redirectToTabs={true}
          uploadOnly={true}
          // --- VALIDATION RULES SENT TO MODAL ---
          validateImage={(file) => {
            return new Promise((resolve, reject) => {
              const img = document.createElement("img");
              img.src = URL.createObjectURL(file);
              img.onload = () => {
                const width = img.width;
                const height = img.height;

                // 1. Check 1:1 Aspect Ratio
                if (width !== height) {
                  ToastNotification(
                    "error",
                    `Image must be a square (1:1 ratio). Your image is ${width}x${height}px.`
                  );
                  resolve(false);
                  return;
                }

                // 2. Check Resolution Range (1000px - 2000px)
                if (width < 1000 || width > 2000) {
                  ToastNotification(
                    "error",
                    `Resolution must be between 1000x1000px and 2000x2000px. Your image is ${width}x${height}px.`
                  );
                  resolve(false);
                  return;
                }

                resolve(true); // Valid
              };
              img.onerror = () => {
                ToastNotification("error", "Invalid image file.");
                resolve(false);
              };
            });
          }}
          // --------------------------------------
        />
      </ul>

      {/* Render helper text ONLY if explicit props passed */}
      {props?.helpertext && (
        <p
          className="help-text text-muted mt-2"
          style={{ fontSize: "0.85rem", lineHeight: "1.4" }}
        >
          {props.helpertext}
        </p>
      )}

      {errors?.[props?.name] ? (
        <ErrorMessage
          name={props.name}
          render={(msg) => (
            <div className="invalid-feedback d-block">
              {t(handleModifier(storeImageObject).split(" ").join(""))}{" "}
              {t("IsRequired")}
            </div>
          )}
        />
      ) : null}
    </>
  );
};

export default InputWrapper(FileUploadField);
