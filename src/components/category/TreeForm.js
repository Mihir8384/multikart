import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import request from "../../utils/axiosUtils";
import SearchCategory from "./widgets/SearchCategory";
import Loader from "../commonComponent/Loader";
import CategoryContext from "../../helper/categoryContext";
import { useRouter } from "next/navigation";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import Btn from "@/elements/buttons/Btn";
import { useTranslation } from "react-i18next";

const TreeForm = forwardRef(({ type, isLoading: loading }, ref) => {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [active, setActive] = useState([]); // Controls expanded nodes
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { setCategoryState } = useContext(CategoryContext);
  const router = useRouter();

  // --- Requirement 5: Debounced Search (Efficiency) ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, refetch, isLoading } = useCustomQuery(
    ["category", debouncedSearch, type],
    () =>
      request(
        {
          url: "category",
          params: {
            search: debouncedSearch,
            type: type,
            limit: 1000,
            include_subcategories: true,
            parent_id: "null",
          },
        },
        router
      ),
    {
      enabled: false,
      refetchOnWindowFocus: false,
      select: (res) => res?.data?.data || res?.data || [],
    }
  );

  // --- Requirement 1: Expand results when searching ---
  useEffect(() => {
    if (debouncedSearch && data) {
      const allIds = [];
      const getAllIds = (items) => {
        items.forEach((item) => {
          allIds.push(item._id);
          if (item.subcategories) getAllIds(item.subcategories);
        });
      };
      getAllIds(data);
      setActive(allIds);
    }
  }, [debouncedSearch, data]);

  // --- Requirement 2: Global Toggles ---
  const handleExpandAll = () => {
    const allIds = [];
    const getAllIds = (items) => {
      items.forEach((item) => {
        allIds.push(item._id);
        if (item.subcategories) getAllIds(item.subcategories);
      });
    };
    if (data) getAllIds(data);
    setActive(allIds);
  };

  const handleCollapseAll = () => setActive([]);

  const deleteMutate = async (categoryId) => {
    setDeleteLoading(true);
    try {
      const response = await request(
        { url: `category/${categoryId}`, method: "DELETE" },
        router
      );
      if (response?.success || response?.status === 200) {
        ToastNotification("success", "Deleted successfully");
        refetch();
      }
    } catch (error) {
      ToastNotification("error", "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    call() {
      refetch();
    },
  }));

  useEffect(() => {
    refetch();
  }, [debouncedSearch]);

  useEffect(() => {
    if (data) setCategoryState([...data]);
  }, [data]);

  if (isLoading) return <Loader />;

  return (
    <div className="category-tree-wrapper">
      {/* Requirement 4: Add Category button separately */}
      <div className="title-header option-title d-flex justify-content-between mb-4">
        <h5>{t("Categories")}</h5>
        <Btn
          className="btn-primary"
          onClick={() => router.push("/category/create")}
        >
          <i className="ri-add-line"></i> {t("AddCategory")}
        </Btn>
      </div>

      {/* Requirement 2 Buttons */}
      <div className="mb-3 d-flex gap-2">
        <Btn className="btn-outline btn-sm" onClick={handleExpandAll}>
          {t("ExpandAll")}
        </Btn>
        <Btn className="btn-outline btn-sm" onClick={handleCollapseAll}>
          {t("CollapseAll")}
        </Btn>
      </div>

      <SearchCategory
        mutate={deleteMutate}
        deleteLoading={deleteLoading}
        setSearch={setSearch}
        data={data}
        active={active}
        setActive={setActive}
        type={type}
      />
    </div>
  );
});

export default TreeForm;
