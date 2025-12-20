import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import Loader from "../commonComponent/Loader";
import { useTranslation } from "react-i18next";
import { VariantAPI } from "../../utils/axiosUtils/API"; // Ensure this import is correct

const AllVariantsTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);

  const headerObj = {
    checkBox: true, // Enable Bulk Selection
    isSerialNo: true,
    isOption: true,
    noEdit: true,
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
        status: item.status !== undefined ? item.status : item.active ? 1 : 0,
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
