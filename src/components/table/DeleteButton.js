import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RiDeleteBinLine } from "react-icons/ri";
import ShowModal from "../../elements/alerts&Modals/Modal";
import Btn from "../../elements/buttons/Btn";
import { ToastNotification } from "../../utils/customFunctions/ToastNotification";

const DeleteButton = ({ id, mutate, noImage }) => {
  const { t } = useTranslation("common");
  const [modal, setModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double-clicks

    setIsDeleting(true);
    try {
      // Get the current URL to determine the API endpoint
      const currentPath = window.location.pathname;
      let apiUrl = "";
      let entityName = "";

      if (currentPath.includes("/product")) {
        apiUrl = `/api/product/${id}`;
        entityName = "Product";
      } else if (currentPath.includes("/category")) {
        apiUrl = `/api/category/${id}`;
        entityName = "Category";
      } else if (currentPath.includes("/brand")) {
        apiUrl = `/api/brand/${id}`;
        entityName = "Brand";
      } else if (currentPath.includes("/store")) {
        apiUrl = `/api/store/${id}`;
        entityName = "Store";
      } else if (currentPath.includes("/tag")) {
        apiUrl = `/api/tag/${id}`;
        entityName = "Tag";
      } else if (currentPath.includes("/user")) {
        apiUrl = `/api/user/${id}`;
        entityName = "User";
      } else if (currentPath.includes("/attribute")) {
        apiUrl = `/api/attribute/${id}`;
        entityName = "Attribute";
      } else if (currentPath.includes("/role")) {
        apiUrl = `/api/role/${id}`;
        entityName = "Role";
      } else if (currentPath.includes("/variant")) {
        apiUrl = `/api/variant/${id}`;
        entityName = "Variant";
      }

      if (!apiUrl) {
        ToastNotification("error", "Unable to determine delete endpoint");
        setIsDeleting(false);
        setModal(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        ToastNotification(
          "success",
          result.message || `${entityName} deleted successfully`
        );

        // Refresh the data if mutate function is provided
        if (mutate) {
          // Small delay to ensure the UI updates smoothly
          setTimeout(() => {
            mutate();
          }, 300);
        }
      } else {
        ToastNotification(
          "error",
          result.message || `Failed to delete ${entityName}`
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      ToastNotification(
        "error",
        error.message || "An error occurred while deleting"
      );
    } finally {
      setIsDeleting(false);
      setModal(false);
    }
  };

  return (
    <>
      {id && (
        <>
          {noImage ? (
            <Btn
              className="btn-outline"
              title="Delete"
              onClick={() => {
                setModal(true);
              }}
            />
          ) : (
            <a>
              <RiDeleteBinLine
                className="text-danger"
                onClick={() => {
                  setModal(true);
                }}
              />
            </a>
          )}
        </>
      )}
      <ShowModal
        open={modal}
        close={false}
        setModal={setModal}
        buttons={
          <>
            <Btn
              title="No"
              onClick={() => {
                setModal(false);
              }}
              className="btn-md btn-outline fw-bold"
            />
            <Btn
              title={isDeleting ? "Deleting..." : "Yes"}
              onClick={handleDelete}
              className="btn-theme btn-md fw-bold"
              loading={isDeleting}
              disabled={isDeleting}
            />
          </>
        }
      >
        <div className="remove-box">
          <div className="remove-icon">
            <RiDeleteBinLine className="icon-box" />
          </div>
          <h2>{t("DeleteItem")}?</h2>
          <p>
            {t("ThisItemWillBeDeletedPermanently") +
              " " +
              t("YouCan'tUndoThisAction!!")}{" "}
          </p>
        </div>
      </ShowModal>
    </>
  );
};

export default DeleteButton;
