import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import Loader from "../commonComponent/Loader";

const AllAttributesTable = ({ data, ...props }) => {
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);
  console.log("Permissions in attributes - Edit:", edit, "Destroy:", destroy);
  console.log("Attributes Data:", data);

  const headerObj = {
    checkBox: false,
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
      />
    </>
  );
};

export default TableWrapper(AllAttributesTable);
