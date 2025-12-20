import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import Loader from "../commonComponent/Loader";
import { useTranslation } from "react-i18next";

const AllPoliciesTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  // Temporarily hardcode permissions to true until policy permissions are added to the role
  // TODO: Add "policy" module with edit/destroy permissions to your admin role in the database
  const [edit, destroy] = [true, true];

  const headerObj = {
    checkBox: true,
    isSerialNo: true,
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    optionHead: { title: "Action" },
    column: [
      {
        title: "Policy Name",
        apiKey: "name",
        sorting: true,
        sortBy: "desc",
      },
      { title: "Type", apiKey: "type", sorting: true },
      {
        title: "Created At",
        apiKey: "createdAt",
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
        // Ensure status is properly converted to 0/1
        status: item.status !== undefined ? Number(item.status) : (item.active ? 1 : 0),
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
        url={"/policy"}
        keyInPermission={"policy"}
      />
    </>
  );
};

export default TableWrapper(AllPoliciesTable);
