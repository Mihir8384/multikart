import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import Loader from "../commonComponent/Loader";
import { useTranslation } from "react-i18next";
import { VariantAPI } from "../../utils/axiosUtils/API"; // Ensure this import is correct

const AllVariantsTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  // Temporarily hardcode permissions to true until variant permissions are added to the role
  // TODO: Add "variant" module with create/edit/destroy permissions to your admin role in the database
  const [create, edit, destroy] = [true, true, true]; // usePermissionCheck(["create", "edit", "destroy"]);

  const headerObj = {
    checkBox: true, // Enable Bulk Selection
    isSerialNo: true,
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    optionHead: { title: "Action" },
    column: [
      {
        title: "Name",
        apiKey: "variant_name",
        sorting: true,
        sortBy: "desc",
      },
      { title: "Input Type", apiKey: "input_type", sorting: false },
      {
        title: "Options",
        apiKey: "options_count", // Changed to match mapping below
        type: "custom",
        render: (record) => (
          <span>
            {record.options_count} {t("options")}
          </span>
        ),
      },
      {
        title: "CreateAt",
        apiKey: "created_at",
        sorting: true,
        sortBy: "desc",
        type: "date",
      },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    data:
      data?.data?.map((item) => ({
        ...item,
        id: item.id || item._id,
        // Ensure status is properly converted from active boolean to 0/1
        status: item.status !== undefined ? Number(item.status) : (item.active ? 1 : 0),
        options_count: item.options ? item.options.length : 0,
      })) || [],
  };

  if (!data) return <Loader />;

  return (
    <>
      <ShowTable
        {...props}
        headerData={headerObj}
        editPermission={edit}
        destroyPermission={destroy}
        url={VariantAPI} // Connects the table to the Variant API
        keyInPermission={"variant"}
      />
    </>
  );
};

export default TableWrapper(AllVariantsTable);
