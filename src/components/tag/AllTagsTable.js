import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import Loader from "../commonComponent/Loader";
import { tag } from "../../utils/axiosUtils/API"; // Ensure this import exists

const AllTagsTable = ({ data, ...props }) => {
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);

  const rows = (data?.data ?? data ?? []).map((item) => ({
    ...item,
    id: item.id || item._id,
  }));

  // --- Filter Configuration ---
  const filterHeader = {
    useSpecific: false,
    filter: [
      {
        name: "status",
        title: "Status",
        type: "select",
        options: [
          { id: "1", name: "Active" },
          { id: "0", name: "Inactive" },
        ],
        key: "id",
        value: "name",
      },
    ],
  };

  const headerObj = {
    checkBox: true, // Enabled for bulk actions
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    isSerialNo: true,
    optionHead: { title: "Action" },
    column: [
      { title: "Name", apiKey: "name", sorting: true, sortBy: "desc" },
      {
        title: "CreateAt",
        apiKey: "created_at",
        sorting: true,
        sortBy: "desc",
        type: "date",
      },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    data: rows,
  };

  if (!data) return <Loader />;

  return (
    <>
      <ShowTable
        {...props}
        headerData={headerObj}
        editPermission={edit}
        destroyPermission={destroy}
        filterHeader={filterHeader}
        url={tag} // API URL for bulk actions
        keyInPermission={"tag"}
      />
    </>
  );
};

export default TableWrapper(AllTagsTable);
