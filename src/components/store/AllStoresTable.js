import { Approved, store } from "../../utils/axiosUtils/API";
import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";

const AllRoles = ({ data, ...props }) => {
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);
  
  // Handle both array and pagination object structures
  let dataArray = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
    // If data is a pagination object with data.data array
    dataArray = data.data;
  }
  
  // Map the data and add vendor name from populated owner_user_id
  const mappedData = dataArray.map(item => {
    return {
      ...item,
      _id: item._id?.toString() || item.id,
      id: item.id || item._id?.toString(),
      name: item?.owner_user_id?.name || item?.contacts?.primary?.name || ""
    };
  });
  
  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    optionHead: { title: "Action" ,show:"seller/store" },
    column: [
      { title: "Logo", apiKey: "store_logo", type: 'image',NameWithRound: true},
      { title: "VendorName", apiKey: "store_name", sorting: true, sortBy: "desc" },
      { title: "Name", apiKey: "name" },
      { title: "CreateAt", apiKey: "created_at", sorting: true, sortBy: "desc", type: "date" },
      { title: "Approved", apiKey: "is_approved", type: 'switch', url: `${store}${Approved}` }
    ],
    data: mappedData
  };

  return <>
    <ShowTable {...props} headerData={headerObj} editPermission={edit} destroyPermission={destroy} />
  </>
};

export default TableWrapper(AllRoles);
