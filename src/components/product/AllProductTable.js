// import { useContext,useEffect } from "react";
// import { Approved, product } from "../../utils/axiosUtils/API";
// import TableWrapper from "../../utils/hoc/TableWrapper";
// import ShowTable from "../table/ShowTable";
// import Loader from "../commonComponent/Loader";
// import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
// import AccountContext from "../../helper/accountContext";
// import { useTranslation } from "react-i18next";
// import { placeHolderImage } from "@/data/CommonPath";

// const AllProductTable = ({ data, ...props }) => {

//   const { t } = useTranslation( 'common');
//   const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);
//   console.log('Permission Check - Edit:', edit, 'Destroy:', destroy);
//   const { role, setRole } = useContext(AccountContext)
//   useEffect(() => {
//     const storedRole = localStorage.getItem("role");
//     if (storedRole) {
//       const parsedRole = JSON.parse(storedRole);
//       setRole(parsedRole.name);
//     }
//   }, [])
//   const headerObj = {
//     checkBox: false,
//     isOption: edit == false && destroy == false ? false : true,
//     noEdit: edit ? false : true,
//     isSerialNo:true,
//     optionHead: { title: "Action",show:"product",  type: 'download',modalTitle: t("Download") },
//     column: [
//       { title: "Image", apiKey: "product_thumbnail", type: 'image', placeHolderImage: placeHolderImage },
//       { title: "Name", apiKey: "name", sorting: true, sortBy: "desc" },
//       { title: "SKU", apiKey: "sku", sorting: true, sortBy: "desc" },
//       { title: "Price", apiKey: "sale_price", sorting: true, sortBy: "desc", type: 'price' },
//       { title: "Stock", apiKey: "stock_status", type: 'stock_status' },
//       { title: "Store", apiKey: "store", subKey: ["store_name"] },
//       { title: "Approve", apiKey: "is_approved", type: 'switch', url: `${product}${Approved}` },
//       { title: "Status", apiKey: "status", type: 'switch' }
//     ],
//     data: data?.map(item => ({
//       ...item,
//       id: item.id || item._id
//     })) || []
//   };
//   headerObj.data.map((element) => element.sale_price = element?.sale_price)

//   let pro = headerObj?.column?.filter((elem) => {
//     return role == 'vendor' ? elem.title !== 'Approved' : elem;
//   });
//   headerObj.column = headerObj ? pro : [];
//   if (!data) return <Loader />;
//   return <>
//     <ShowTable {...props} headerData={headerObj} editPermission={edit} destroyPermission={destroy} />
//   </>
// };

// export default TableWrapper(AllProductTable);

//--------------------------------------

import { product } from "../../utils/axiosUtils/API";
import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import Loader from "../commonComponent/Loader";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import { useTranslation } from "react-i18next";
import { placeHolderImage } from "@/data/CommonPath";

const AllProductTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);
  console.log("Permission Check - Edit:", edit, "Destroy:", destroy);

  // Removed the vendor-specific role checking logic

  const headerObj = {
    checkBox: false,
    isOption: edit == false && destroy == false ? false : true,
    noEdit: edit ? false : true,
    isSerialNo: true,
    optionHead: { title: "Action" }, // Simplified options
    column: [
      {
        title: "Image",
        apiKey: "product_thumbnail",
        type: "image",
        placeHolderImage: placeHolderImage,
      },
      { title: "Name", apiKey: "product_name", sorting: true, sortBy: "desc" },
      {
        title: "UPID",
        apiKey: "master_product_code",
        sorting: true,
        sortBy: "desc",
      },
      { title: "Category", apiKey: "category_name" },
      { title: "Vendors", apiKey: "vendor_count", type: "string" }, // Shows count of linked vendors
      { title: "Status", apiKey: "status", type: "switch" }, // Now points to the pre-processed numeric status
    ],
    // Pre-process data to fit the new ShowTable columns
    data:
      data?.map((item) => {
        // Find the primary image from the new 'media' array
        const primaryImage =
          item.media?.find((m) => m.is_primary)?.url ||
          item.media?.[0]?.url ||
          null;

        return {
          ...item,
          id: item.id || item._id,
          product_thumbnail: primaryImage
            ? { original_url: primaryImage }
            : null, // Avatar expects an object with original_url
          product_name: item.product_name, // Ensure new key is passed
          category_name: item.category_id?.name || "N/A", // Get populated category name
          vendor_count: item.linked_vendor_offerings?.length || 0, // Get vendor count
          status: item.status === "active" ? 1 : 0, // Convert string 'active'/'inactive' to number for the switch
        };
      }) || [],
  };

  // Removed the vendor-specific column filter

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

export default TableWrapper(AllProductTable);
