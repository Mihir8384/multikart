import React from "react";
import { useTranslation } from "react-i18next";
import { FieldArray } from "formik";
import { RiAddLine, RiDeleteBinLine } from "react-icons/ri";
import { Col, Input, Label } from "reactstrap";
import SimpleInputField from "@/components/inputFields/SimpleInputField";
import SearchableSelectInput from "@/components/inputFields/SearchableSelectInput"; // Import Dropdown
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { useRouter } from "next/navigation";

const ContentPoliciesTab = ({ values, setFieldValue }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  // 1. Fetch All Active Policies
  const { data: allPolicies } = useCustomQuery(
    ["policies"],
    () => request({ url: "/policy", params: { status: 1 } }, router),
    {
      refetchOnWindowFocus: false,
      select: (response) => {
        // API response structure: { data: { data: { data: [...] } } }
        // response.data.data.data is the array of policies
        const policies = response?.data?.data?.data || response?.data?.data || [];
        return Array.isArray(policies) ? policies : [];
      },
    }
  );

  // 2. Filter Policies by Type for Dropdowns
  const warrantyOptions = allPolicies
    ?.filter((p) => p.type === "warranty")
    .map((p) => ({ id: p._id, name: p.name })) || [];

  const returnOptions = allPolicies
    ?.filter((p) => p.type === "return")
    .map((p) => ({ id: p._id, name: p.name })) || [];

  const refundOptions = allPolicies
    ?.filter((p) => p.type === "refund")
    .map((p) => ({ id: p._id, name: p.name })) || [];

  return (
    <Col>
      <div className="title-header option-title">
        <h5>{t("Content & Policies")}</h5>
      </div>

      {/* 'About This Item' field (Kept as text) */}
      <SimpleInputField
        nameList={[
          {
            name: "product_policies.about_this_item",
            title: t("AboutThisItem"),
            type: "textarea",
            rows: 5,
            placeholder: t("Enteralongdescriptionfortheproduct"),
          },
        ]}
      />

      {/* 'Key Features' dynamic array (Kept as text list) */}
      <div className="mb-4">
        <Label className="form-label">{t("KeyFeatures")}</Label>
        <FieldArray
          name="product_policies.key_features"
          render={(arrayHelpers) => (
            <div>
              {values.product_policies?.key_features?.map((feature, index) => (
                <div className="input-group mb-2" key={index}>
                  <Input
                    type="text"
                    className="form-control"
                    placeholder={`${t("Feature")} ${index + 1}`}
                    value={feature}
                    onChange={(e) =>
                      setFieldValue(
                        `product_policies.key_features.${index}`,
                        e.target.value
                      )
                    }
                  />
                  <Btn
                    type="button"
                    className="btn-danger"
                    onClick={() => arrayHelpers.remove(index)}
                  >
                    <RiDeleteBinLine />
                  </Btn>
                </div>
              ))}
              <Btn
                type="button"
                className="btn-primary"
                onClick={() => arrayHelpers.push("")}
              >
                <RiAddLine className="me-1" /> {t("AddFeature")}
              </Btn>
            </div>
          )}
        />
      </div>

      <div className="border-top pt-4 mt-4">
        <h5 className="mb-3">{t("Standardized Policies")}</h5>
        <p className="text-muted small mb-3">
          Select pre-defined policies created in Settings.
        </p>

        {/* 3. Replaced Text Inputs with Dropdowns */}

        {/* Warranty Policy Dropdown */}
        <SearchableSelectInput
          nameList={[
            {
              name: "product_policies.warranty_info",
              title: "Warranty Policy",
              inputprops: {
                name: "product_policies.warranty_info",
                id: "product_policies.warranty_info",
                options: warrantyOptions || [],
                initialTittle: "Select Warranty Policy",
              },
            },
          ]}
        />

        {/* Return Policy Dropdown */}
        <SearchableSelectInput
          nameList={[
            {
              name: "product_policies.return_policy",
              title: "Return Policy",
              inputprops: {
                name: "product_policies.return_policy",
                id: "product_policies.return_policy",
                options: returnOptions || [],
                initialTittle: "Select Return Policy",
              },
            },
          ]}
        />

        {/* Refund Policy Dropdown */}
        <SearchableSelectInput
          nameList={[
            {
              name: "product_policies.refund_policy",
              title: "Refund Policy",
              inputprops: {
                name: "product_policies.refund_policy",
                id: "product_policies.refund_policy",
                options: refundOptions || [],
                initialTittle: "Select Refund Policy",
              },
            },
          ]}
        />
      </div>
    </Col>
  );
};

export default ContentPoliciesTab;
