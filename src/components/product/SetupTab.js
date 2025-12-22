import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Col, Row, Label } from "reactstrap";
import CheckBoxField from "../inputFields/CheckBoxField.js";
import request from "../../utils/axiosUtils/index.js";
import { product, Category, tag } from "../../utils/axiosUtils/API.js";
import SearchableSelectInput from "../inputFields/SearchableSelectInput.js";
import useCustomQuery from "@/utils/hooks/useCustomQuery.js";

const SetupTab = ({ values, setFieldValue, errors, updateId }) => {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState(false);
  const [customSearch, setCustomSearch] = useState("");
  const [tc, setTc] = useState(null);
  const router = useRouter();

  // --- NEW: Initialize Defaults for Config Objects ---
  useEffect(() => {
    if (values && !values.related_product_config) {
      setFieldValue("related_product_config", {
        is_manual: true,
        auto_rules: {
          by_tags: false,
          tag_ids: [],
          by_category: false,
          category_ids: [],
        },
      });
    }
    if (values && !values.upsell_product_config) {
      setFieldValue("upsell_product_config", {
        is_manual: true,
        auto_rules: {
          by_tags: false,
          tag_ids: [],
          by_category: false,
          category_ids: [],
          by_collection: false,
          collection_ids: [],
        },
      });
    }
  }, [values?.related_product_config, values?.upsell_product_config]);

  // --- 1. Fetch Categories (Fixed Data Selector) ---
  const { data: categoryData } = useCustomQuery(
    [Category],
    () =>
      request(
        { url: Category, params: { status: 1, type: "product", limit: 1000 } },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (res) => {
        // Check different possible API response structures
        const list = res?.data?.data || res?.data || [];
        return list.map((item) => ({
          id: item.id || item._id,
          name: item.name,
        }));
      },
    }
  );

  // --- 2. Fetch Tags (Fixed Data Selector) ---
  const { data: tagData } = useCustomQuery(
    [tag],
    () =>
      request(
        { url: tag, params: { status: 1, type: "product", limit: 1000 } },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (res) => {
        const list = res?.data?.data || res?.data || [];
        return list.map((item) => ({
          id: item.id || item._id,
          name: item.name,
        }));
      },
    }
  );

  // --- 3. Fetch Products for Manual Selection ---
  const [arrayState, setArrayState] = useState([]);
  useEffect(() => {
    if (updateId) {
      setArrayState((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...(values["related_products"] || []),
            ...(values["cross_sell_products"] || []),
          ])
        )
      );
    }
  }, [updateId]);

  const { data: productData, refetch } = useCustomQuery(
    [product, arrayState, customSearch],
    () =>
      request(
        {
          url: product,
          params: {
            status: "active",
            search: customSearch ? customSearch : "",
            paginate: 15,
            ids: customSearch ? null : arrayState?.join() || null,
          },
        },
        router
      ),
    {
      enabled: true,
      refetchOnWindowFocus: false,
      select: (res) =>
        res?.data?.data
          .filter((elem) => (updateId ? (elem.id || elem._id) !== updateId : elem))
          .map((elem) => {
            const primaryImage =
              elem.media?.find((m) => m.is_primary)?.url ||
              elem.media?.[0]?.url ||
              "/assets/images/placeholder.png";
            return {
              id: elem.id || elem._id, // Support both id and _id
              name: elem.product_name,
              image: primaryImage,
              slug: elem.slug,
            };
          }),
    }
  );

  // Debouncing for product search
  useEffect(() => {
    if (tc) clearTimeout(tc);
    setTc(setTimeout(() => setCustomSearch(search), 500));
  }, [search]);

  useEffect(() => {
    refetch();
  }, [customSearch]);

  return (
    <>
      {/* ===================================================================
          SECTION 1: RELATED PRODUCTS
         =================================================================== */}
      <div className="mb-5 border-bottom pb-4">
        <h4 className="fw-bold mb-3">{t("RelatedProducts")}</h4>

        {/* Toggle Manual vs Auto */}
        {values.related_product_config && (
          <CheckBoxField
            name="related_product_config.is_manual"
            title="Enable Manual Selection"
            helpertext="Disable this to use automatic suggestion rules based on Tags or Categories."
          />
        )}

        {/* Option A: Manual Selection */}
        {values?.related_product_config?.is_manual ? (
          <div className="mt-3">
            <SearchableSelectInput
              nameList={[
                {
                  name: "related_products",
                  title: "Select Products",
                  inputprops: {
                    name: "related_products",
                    id: "related_products",
                    options: productData || [],
                    setsearch: setSearch,
                    helpertext: "*Manually select up to 6 products.",
                  },
                },
              ]}
            />
          </div>
        ) : (
          /* Option B: Auto Rules */
          <div className="p-3 bg-light rounded mt-2">
            <h6 className="fw-bold text-muted mb-3">
              Automatic Suggestions Criteria
            </h6>
            <p className="small text-muted mb-3">
              The system will randomly pick 6 products matching ANY of the
              enabled criteria below.
            </p>

            {/* Rule 1: By Tags */}
            <CheckBoxField
              name="related_product_config.auto_rules.by_tags"
              title="Suggest by Tags"
            />
            {values?.related_product_config?.auto_rules?.by_tags && (
              <SearchableSelectInput
                nameList={[
                  {
                    name: "related_product_config.auto_rules.tag_ids",
                    title: "Select Tags",
                    inputprops: {
                      name: "related_product_config.auto_rules.tag_ids",
                      id: "related_tags",
                      options: tagData || [],
                      close: false,
                    },
                  },
                ]}
              />
            )}

            {/* Rule 2: By Category */}
            <div className="mt-3">
              <CheckBoxField
                name="related_product_config.auto_rules.by_category"
                title="Suggest by Category"
              />
              {values?.related_product_config?.auto_rules?.by_category && (
                <SearchableSelectInput
                  nameList={[
                    {
                      name: "related_product_config.auto_rules.category_ids",
                      title: "Select Categories",
                      inputprops: {
                        name: "related_product_config.auto_rules.category_ids",
                        id: "related_categories",
                        options: categoryData || [],
                        close: false,
                      },
                    },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          SECTION 2: UPSELL PRODUCTS (CROSS-SELL)
         =================================================================== */}
      <div className="mb-4">
        <h4 className="fw-bold mb-3">{t("UpsellProducts")}</h4>

        {/* Toggle Manual vs Auto */}
        {values.upsell_product_config && (
          <CheckBoxField
            name="upsell_product_config.is_manual"
            title="Enable Manual Selection"
            helpertext="Disable this to use automatic suggestion rules."
          />
        )}

        {/* Option A: Manual Selection */}
        {values?.upsell_product_config?.is_manual ? (
          <div className="mt-3">
            <SearchableSelectInput
              nameList={[
                {
                  name: "cross_sell_products",
                  title: "Select Products",
                  inputprops: {
                    name: "cross_sell_products",
                    id: "cross_sell_products",
                    options: productData || [],
                    setsearch: setSearch,
                    helpertext: "*Manually select up to 3 products.",
                  },
                },
              ]}
            />
          </div>
        ) : (
          /* Option B: Auto Rules */
          <div className="p-3 bg-light rounded mt-2">
            <h6 className="fw-bold text-muted mb-3">
              Automatic Suggestions Criteria
            </h6>
            <p className="small text-muted mb-3">
              System will suggest Best Sellers matching these criteria.
            </p>

            {/* Rule 1: By Tags */}
            <CheckBoxField
              name="upsell_product_config.auto_rules.by_tags"
              title="Suggest by Tags"
            />
            {values?.upsell_product_config?.auto_rules?.by_tags && (
              <SearchableSelectInput
                nameList={[
                  {
                    name: "upsell_product_config.auto_rules.tag_ids",
                    title: "Select Tags",
                    inputprops: {
                      name: "upsell_product_config.auto_rules.tag_ids",
                      id: "upsell_tags",
                      options: tagData || [],
                      close: false,
                    },
                  },
                ]}
              />
            )}

            {/* Rule 2: By Category */}
            <div className="mt-3">
              <CheckBoxField
                name="upsell_product_config.auto_rules.by_category"
                title="Suggest by Category"
              />
              {values?.upsell_product_config?.auto_rules?.by_category && (
                <SearchableSelectInput
                  nameList={[
                    {
                      name: "upsell_product_config.auto_rules.category_ids",
                      title: "Select Categories",
                      inputprops: {
                        name: "upsell_product_config.auto_rules.category_ids",
                        id: "upsell_categories",
                        options: categoryData || [],
                        close: false,
                      },
                    },
                  ]}
                />
              )}
            </div>

            {/* Rule 3: By Collection */}
            <div className="mt-3">
              <CheckBoxField
                name="upsell_product_config.auto_rules.by_collection"
                title="Suggest by Collection"
              />
              {/* Note: Using Attributes as Collections based on available APIs */}
              {values?.upsell_product_config?.auto_rules?.by_collection && (
                <div className="alert alert-warning py-2 small">
                  Collection feature requires linking Attributes or specific
                  Groups.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SetupTab;
