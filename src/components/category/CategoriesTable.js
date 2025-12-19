import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import { useTranslation } from "react-i18next";

const AllCategoriesTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  // Admin permissions
  const [edit, destroy] = [true, true];

  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: true,
    noEdit: false,
    noDelete: false,
    optionHead: { title: "Action" },
    column: [
      { title: "Image", apiKey: "category_image", type: "image" },
      { title: "Icon", apiKey: "category_icon", type: "image" },
      {
        title: "Name",
        apiKey: "name",
        sorting: true,
        sortBy: "desc",
        style: { minWidth: "200px" },
      },
      { title: "Parent", apiKey: "parent_path" }, // Shows full path
      {
        title: "Items",
        apiKey: "product_count",
        style: { textAlign: "center" },
      }, // Requirement 3
      {
        title: "Subcategories",
        apiKey: "subcategories_count",
        style: { textAlign: "center" },
      },
      { title: "Status", apiKey: "status", type: "switch" },
    ],
    data:
      data?.map((item) => ({
        ...item,
        id: item._id || item.id,
        product_count: item.product_count || 0,
        subcategories_count: item.subcategories_count || 0,
        // Map the path array to a readable string for the "Parent" column
        parent_path: item.parent_category?.path
          ? item.parent_category.path.join(" > ")
          : item.parent_category?.name || "None",
      })) || [],
  };

  return (
    <ShowTable
      {...props}
      headerData={headerObj}
      editPermission={edit}
      destroyPermission={destroy}
    />
  );
};

export default TableWrapper(AllCategoriesTable);
