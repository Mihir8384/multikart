"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Col } from "reactstrap";
import { useTranslation } from "react-i18next";
import Btn from "@/elements/buttons/Btn";
import AllPoliciesTable from "@/components/policy/AllPoliciesTable";

const PolicyPage = () => {
  const [isCheck, setIsCheck] = useState([]);
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <Col sm="12">
      <div className="title-header option-title">
        <h5>{t("Policies")}</h5>
        <div className="right-options">
          <ul>
            <li>
              <Btn
                className="btn-primary"
                onClick={() => router.push("/policy/create")}
              >
                <i className="ri-add-line"></i> {t("AddPolicy")}
              </Btn>
            </li>
          </ul>
        </div>
      </div>

      <AllPoliciesTable
        url="/policy"
        moduleName="Policy"
        isCheck={isCheck}
        setIsCheck={setIsCheck}
      />
    </Col>
  );
};

export default PolicyPage;
