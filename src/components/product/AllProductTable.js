import { product, Category } from "../../utils/axiosUtils/API";
import TableWrapper from "../../utils/hoc/TableWrapper";
import ShowTable from "../table/ShowTable";
import Loader from "../commonComponent/Loader";
import usePermissionCheck from "../../utils/hooks/usePermissionCheck";
import { useTranslation } from "react-i18next";
import { placeHolderImage } from "@/data/CommonPath";
import request from "../../utils/axiosUtils";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";

const AllProductTable = ({ data, ...props }) => {
  const { t } = useTranslation("common");
  const [edit, destroy] = usePermissionCheck(["edit", "destroy"]);
  const router = useRouter();

  // --- 1. FETCH CATEGORIES MANUALLY (Reliable Method) ---
  const { data: categoryOptions } = useCustomQuery(
    ["categoryFilter"],
    () =>
      request(
        {
          url: Category,
          // Use 'active' string matching your DB, and is_leaf to only show relevant categories
          params: { status: 1, type: "product", is_leaf: true },
        },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (res) => {
        // Handle different response structures safely
        const list = res?.data?.data || res?.data || [];
        return list.map((item) => ({
          // Map to the format ShowTable expects
          id: item.id || item._id,
          name: item.name,
        }));
      },
    }
  );

  // --- 2. Filter Configuration ---
  const filterHeader = {
    useSpecific: false,
    filter: [
      {
        name: "category_id",
        title: "Category",
        type: "select",
        // PASS DATA DIRECTLY instead of URL
        options: categoryOptions || [],
        key: "id",
        value: "name",
      },
    ],
  };

  const headerObj = {
    checkBox: true,
    isOption: true,
    noEdit: edit ? false : true,
    isSerialNo: true,

    // --- 3. Export Configuration ---
    optionHead: {
      title: "Action",
      type: "download",
      show: "product",
      modalTitle: t("Download"),
    },

    column: [
      {
        title: "Image",
        apiKey: "product_thumbnail",
        type: "image",
        placeHolderImage: placeHolderImage,
        style: { width: "70px", textAlign: "center" },
      },
      {
        title: "Name",
        apiKey: "product_name",
        sorting: true,
        sortBy: "desc",
        class: "fw-bold text-dark",
        style: { minWidth: "250px" },
      },
      {
        title: "UPID",
        apiKey: "master_product_code",
        sorting: true,
        sortBy: "desc",
        style: { minWidth: "120px" },
      },
      {
        title: "Price",
        apiKey: "final_price",
        sorting: true,
        sortBy: "desc",
        type: "price",
        style: { minWidth: "100px" },
      },
      {
        title: "Category",
        apiKey: "category_name",
        style: { minWidth: "250px" },
      },
      {
        title: "Vendors",
        apiKey: "vendor_count",
        type: "string",
        style: { width: "80px", textAlign: "center" },
      },
      {
        title: "Status",
        apiKey: "status",
        type: "switch",
        style: { width: "80px" },
      },
    ],

    data:
      data?.map((item) => {
        const primaryImage =
          item.media?.find((m) => m.is_primary)?.url ||
          item.media?.[0]?.url ||
          null;

        let catName = "N/A";
        if (item.category_id) {
          if (
            Array.isArray(item.category_id.path) &&
            item.category_id.path.length > 0
          ) {
            catName = item.category_id.path.join(" > ");
          } else if (item.category_id.name) {
            catName = item.category_id.name;
          }
        }

        // Price Logic
        let displayPrice = item.standard_price;
        if (!displayPrice && item.linked_vendor_offerings?.length > 0) {
          displayPrice = item.linked_vendor_offerings[0].price;
        }

        return {
          ...item,
          id: item.id || item._id,
          product_thumbnail: primaryImage
            ? { original_url: primaryImage }
            : null,
          product_name: item.product_name,
          master_product_code: item.master_product_code,
          final_price: displayPrice || 0,
          category_name: catName,
          vendor_count: item.linked_vendor_offerings?.length || 0,
          status: item.status === "active" ? 1 : 0,
        };
      }) || [],
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
        url={product}
        isExport={true}
        isDuplicate={false}
        keyInPermission={"product"}
      />
    </>
  );
};

export default TableWrapper(AllProductTable);
