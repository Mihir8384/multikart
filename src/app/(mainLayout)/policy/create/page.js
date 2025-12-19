"use client";
import React from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import PolicyForm from "@/components/policy/PolicyForm"; // We will create this component next
import { useTranslation } from "react-i18next";

const CreatePolicy = () => {
  const { t } = useTranslation("common");

  return (
    <Container fluid={true}>
      <Row>
        <Col sm="12">
          <Card>
            <CardBody>
              <div className="title-header option-title">
                <h5>{t("Add New Policy")}</h5>
              </div>
              <PolicyForm />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreatePolicy;
