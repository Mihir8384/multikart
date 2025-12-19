"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Col } from "reactstrap";
import { useTranslation } from "react-i18next";
import Btn from "@/elements/buttons/Btn";
import { VariantAPI } from "@/utils/axiosUtils/API"; // Using the correct Uppercase export
import AllVariantsTable from "@/components/variant/AllVariantsTable";

const VariantList = () => {
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <Col sm="12">
      <div className="title-header option-title">
        <h5>{t("Variants")}</h5>
        <div className="right-options">
          <ul>
            <li>
              <Btn
                className="btn-primary"
                onClick={() => router.push("/variant/create")}
              >
                <i className="ri-add-line"></i> {t("AddVariant")}
              </Btn>
            </li>
          </ul>
        </div>
      </div>
      {/* Pass VariantAPI here */}
      <AllVariantsTable
        url={VariantAPI}
        moduleName="Variant"
        isCheck={isCheck}
        setIsCheck={setIsCheck}
      />
    </Col>
  );
};

export default VariantList;
