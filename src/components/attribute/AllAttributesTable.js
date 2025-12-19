import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import Loader from "../commonComponent/Loader";
import { attribute } from "../../utils/axiosUtils/API";

const AllAttributesTable = ({ data, ...props }) => {
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);

  // --- Filter Configuration ---
  const filterHeader = {
    useSpecific: false,
    filter: [
      {
        name: "status",
        title: "Status",
        type: "select",
        // Hardcoded options for Status
        options: [
          { id: "1", name: "Active" },
          { id: "0", name: "Inactive" },
        ],
        key: "id",
        value: "name",
      },
      {
        name: "style",
        title: "Style",
        type: "select",
        // Hardcoded options for Style
        options: [
          { id: "dropdown", name: "Dropdown" },
          { id: "radio", name: "Radio" },
          { id: "color", name: "Color" },
          { id: "image", name: "Image" },
        ],
        key: "id",
        value: "name",
      },
    ],
  };

  const headerObj = {
    checkBox: true, // Enable Multi-Selection (Checkbox)
    isSerialNo: true,
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    optionHead: { title: "Action" },
    column: [
      { title: "Name", apiKey: "name", sorting: true, sortBy: "desc" },
      { title: "Style", apiKey: "style", sorting: false },
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
        filterHeader={filterHeader} // Pass Filter Config
        url={attribute} // Pass API URL for Delete/Status actions
        keyInPermission={"attribute"}
      />
    </>
  );
};

export default TableWrapper(AllAttributesTable);
