import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RiPencilLine } from "react-icons/ri";
import NoSsr from "../../utils/hoc/NoSsr";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import AnswerModal from "../q&a/widgets/AnswerModal";
import DeleteButton from "./DeleteButton";
import ViewDetails from "./ViewDetails";

const Options = ({
  fullObj,
  mutate,
  type,
  moduleName,
  optionPermission,
  refetch,
  keyInPermission,
  edit: propEdit,
  destroy: propDestroy,
}) => {
  const pathname = usePathname();
  const [modal, setModal] = useState(false);
  const [defaultEdit, defaultDestroy] = usePermissionCheck(
    ["edit", "destroy"],
    keyInPermission ?? keyInPermission
  );

  // Use passed permissions if available, otherwise use default permissions
  const edit = propEdit !== undefined ? propEdit : defaultEdit;
  const destroy = propDestroy !== undefined ? propDestroy : defaultDestroy;

  // Debug logging
  console.log("Options Debug:", {
    fullObj,
    "fullObj.id": fullObj?.id,
    "fullObj._id": fullObj?._id,
    edit,
    destroy,
    propEdit,
    propDestroy,
    defaultEdit,
    defaultDestroy,
    noEdit: optionPermission?.noEdit,
    noDelete: optionPermission?.noDelete,
  });

  // Ensure we have an ID (either id or _id)
  const itemId = fullObj?.id || fullObj?._id;

  return (
    <div className="custom-ul">
      <NoSsr>
        {optionPermission?.optionHead.type == "View" ? (
          <ViewDetails
            fullObj={fullObj}
            tableData={optionPermission?.optionHead}
            refetch={refetch}
          />
        ) : (
          <>
            <div>
              {keyInPermission == "question_and_answer" && edit ? (
                <a onClick={() => setModal(true)}>
                  <RiPencilLine />
                </a>
              ) : (
                edit &&
                itemId &&
                !optionPermission?.noEdit && (
                  <>
                    {optionPermission?.editRedirect ? (
                      <Link
                        href={
                          `/` +
                          optionPermission?.editRedirect +
                          "/edit/" +
                          itemId
                        }
                      >
                        <RiPencilLine />
                      </Link>
                    ) : type == "post" && moduleName?.toLowerCase() == "tag" ? (
                      <Link
                        href={`/${pathname.split("/")[1]}/tag/edit/${itemId}`}
                      >
                        <RiPencilLine />
                      </Link>
                    ) : type == "post" ? (
                      <Link
                        href={`/${
                          pathname.split("/")[1]
                        }/category/edit/${itemId}`}
                      >
                        <RiPencilLine />
                      </Link>
                    ) : (
                      // Fix: If on vendor routes, use full path
                      <Link
                        href={
                          pathname.startsWith("/vendor/products")
                            ? `/vendor/products/edit/${itemId}`
                            : pathname.startsWith("/vendor/discounts")
                            ? `/vendor/discounts/edit/${itemId}`
                            : pathname.startsWith("/vendor/inventory")
                            ? `/vendor/inventory/edit/${itemId}`
                            : `/${pathname.split("/")[1]}/edit/${itemId}`
                        }
                      >
                        <RiPencilLine />
                      </Link>
                    )}
                  </>
                )
              )}
            </div>
            <div>
              {destroy && !optionPermission?.noDelete && (
                <DeleteButton id={itemId} mutate={mutate} />
              )}
            </div>
          </>
        )}
        {modal && (
          <AnswerModal fullObj={fullObj} modal={modal} setModal={setModal} />
        )}
      </NoSsr>
    </div>
  );
};

export default Options;
