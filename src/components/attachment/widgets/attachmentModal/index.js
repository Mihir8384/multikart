import { Form, Formik } from "formik";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiUploadCloud2Line } from "react-icons/ri";
import { Row, TabContent, TabPane } from "reactstrap";
import ShowModal from "../../../../elements/alerts&Modals/Modal";
import Btn from "../../../../elements/buttons/Btn";
import { selectImageReducer } from "../../../../utils/allReducers";
import request from "../../../../utils/axiosUtils";
import { attachment, createAttachment } from "../../../../utils/axiosUtils/API";
import useCreate from "../../../../utils/hooks/useCreate";
import usePermissionCheck from "../../../../utils/hooks/usePermissionCheck";
import {
  YupObject,
  requiredSchema,
} from "../../../../utils/validation/ValidationSchemas";
import FileUploadBrowser from "../../../inputFields/FileUploadBrowser";
import TableBottom from "../../../table/TableBottom";
import AttachmentFilter from "../AttachmentFilter";
import ModalButton from "./ModalButton";
import ModalData from "./ModalData";
import ModalNav from "./ModalNav";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

const AttachmentModal = (props) => {
  // Destructure validateImage from props
  const {
    modal,
    setModal,
    setFieldValue,
    name,
    setSelectedImage,
    isAttachment,
    multiple,
    values,
    showImage,
    redirectToTabs,
    noAPICall,
    selectedImage,
    paramsProps,
    uploadOnly,
    validateImage,
  } = props;
  const [create] = usePermissionCheck(["create"], "attachment");
  const { t } = useTranslation("common");
  const [tabNav, setTabNav] = useState(uploadOnly ? 2 : 1);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [paginate, setPaginate] = useState(50);
  const [sorting, setSorting] = useState("");
  const router = useRouter();
  const [state, dispatch] = useReducer(selectImageReducer, {
    selectedImage: [],
    isModalOpen: "",
    setBrowserImage: "",
  });
  const { data: attachmentsData, refetch } = useCustomQuery(
    [attachment],
    () =>
      request(
        {
          url: attachment,
          params: {
            search,
            sort: sorting,
            paginate: paginate,
            page,
            ...paramsProps,
          },
        },
        router
      ),
    {
      enabled: false,
      refetchOnWindowFocus: false,
      select: (data) => data?.data,
    }
  );

  const { mutate, isLoading } = useCreate(
    createAttachment,
    false,
    !redirectToTabs && "/attachment",
    redirectToTabs ? "No" : false,
    (responseData) => {
      refetch();

      if (uploadOnly && responseData?.data) {
        const uploadedFiles = responseData.data;
        if (multiple) {
          const existingImages = values?.[name.split("_id")[0]] || [];
          const newImages = Array.isArray(uploadedFiles)
            ? uploadedFiles
            : [uploadedFiles];
          const updatedImages = [...existingImages, ...newImages];

          setFieldValue(name.split("_id")[0], updatedImages);
          setFieldValue(
            name,
            updatedImages.map((img) => img.id || img._id)
          );
          setSelectedImage(updatedImages);
        } else {
          const uploadedFile = Array.isArray(uploadedFiles)
            ? uploadedFiles[0]
            : uploadedFiles;
          setFieldValue(name.split("_id")[0], uploadedFile);
          setFieldValue(name, uploadedFile.id || uploadedFile._id);
          setSelectedImage([uploadedFile]);
        }
        setModal(false);
      } else {
        !redirectToTabs && setModal(false);
        redirectToTabs && setTabNav(uploadOnly ? 2 : 1);
      }
    }
  );

  useEffect(() => {
    modal && !noAPICall && refetch();
    isAttachment && setTabNav(2);
  }, [search, sorting, page, paginate, modal]);
  useEffect(() => {
    dispatch({ type: "SELECTEDIMAGE", payload: selectedImage });
  }, [modal]);

  return (
    <ShowModal
      open={modal}
      setModal={setModal}
      modalAttr={{
        className: "media-modal modal-dialog modal-dialog-centered modal-xl",
      }}
      close={true}
      title={uploadOnly ? "UploadMedia" : "InsertMedia"}
      noClass={true}
      buttons={
        tabNav === 1 &&
        !uploadOnly && (
          <ModalButton
            setModal={setModal}
            dispatch={dispatch}
            state={state}
            name={name}
            setSelectedImage={setSelectedImage}
            attachmentsData={attachmentsData?.data}
            setFieldValue={setFieldValue}
            tabNav={tabNav}
            multiple={multiple}
            mutate={mutate}
            isLoading={isLoading}
            values={values}
            showImage={showImage}
          />
        )
      }
    >
      {!uploadOnly && (
        <ModalNav
          tabNav={tabNav}
          setTabNav={setTabNav}
          isAttachment={isAttachment}
        />
      )}
      <TabContent activeTab={tabNav}>
        {!isAttachment && !uploadOnly && (
          <TabPane
            className={tabNav == 1 ? "fade active show" : ""}
            id="upload"
          >
            <AttachmentFilter setSearch={setSearch} setSorting={setSorting} />
            {
              <div className="content-section select-file-section py-0 ratio2_3">
                {
                  <Row
                    xxl={6}
                    xl={5}
                    lg={4}
                    sm={3}
                    xs={2}
                    className="g-sm-3 g-2 py-0 media-library-sec ratio_square"
                  >
                    <ModalData
                      isModal={true}
                      attachmentsData={attachmentsData?.data}
                      state={state}
                      refetch={refetch}
                      dispatch={dispatch}
                      multiple={multiple}
                      redirectToTabs={redirectToTabs}
                    />
                  </Row>
                }
                {attachmentsData?.data?.length > 0 && (
                  <TableBottom
                    current_page={attachmentsData?.current_page}
                    total={attachmentsData?.total}
                    per_page={attachmentsData?.per_page}
                    setPage={setPage}
                  />
                )}
              </div>
            }
          </TabPane>
        )}
        {create && (
          <TabPane
            className={tabNav == 2 ? "fade active show" : ""}
            id="select"
          >
            {
              <div className="content-section drop-files-sec">
                <div>
                  <RiUploadCloud2Line />
                  <Formik
                    initialValues={{ attachments: "" }}
                    validationSchema={YupObject({
                      attachments: requiredSchema,
                    })}
                    onSubmit={async (values, { resetForm }) => {
                      // Made onSubmit async
                      console.log("📤 Upload form submitted");

                      let formData = new FormData();

                      if (values.attachments) {
                        const files = values.attachments;
                        const fileArray = files.length
                          ? Array.from(files)
                          : [files];

                        // --- NEW VALIDATION LOGIC ---
                        if (validateImage) {
                          for (const file of fileArray) {
                            // Only validate standard image types to avoid issues with other files
                            if (file.type && file.type.startsWith("image/")) {
                              const isValid = await validateImage(file);
                              if (!isValid) {
                                console.log(
                                  "❌ Image validation failed for:",
                                  file.name
                                );
                                return; // Stop execution, do not upload
                              }
                            }
                          }
                        }
                        // ---------------------------

                        fileArray.forEach((file) => {
                          console.log("📎 Appending file:", file.name);
                          formData.append("attachments", file);
                        });
                      }

                      mutate(formData);
                      resetForm();
                    }}
                  >
                    {({ values, setFieldValue, errors }) => (
                      <Form className="theme-form theme-form-2 mega-form">
                        <div>
                          <div className="dflex-wgap justify-content-center ms-auto save-back-button">
                            <h2>
                              {t("Dropfilesherepaste")} <span>{t("or")}</span>
                              <FileUploadBrowser
                                errors={errors}
                                id="attachments"
                                name="attachments"
                                type="file"
                                multiple={true}
                                values={values}
                                setFieldValue={setFieldValue}
                                dispatch={dispatch}
                                accept="*/*"
                              />
                            </h2>
                          </div>
                        </div>
                        <div className="modal-footer">
                          {values?.attachments?.length > 0 && (
                            <a
                              href="#javascript"
                              onClick={() => setFieldValue("attachments", "")}
                            >
                              {t("Clear")}
                            </a>
                          )}
                          <Btn
                            type="submit"
                            className="ms-auto"
                            title={uploadOnly ? "Upload" : "Insert Media"}
                            loading={Number(isLoading)}
                          />
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            }
          </TabPane>
        )}
      </TabContent>
    </ShowModal>
  );
};
export default AttachmentModal;
