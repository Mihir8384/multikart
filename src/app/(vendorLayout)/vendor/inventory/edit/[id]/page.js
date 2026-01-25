"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Card,
  CardBody,
  FormGroup,
  Label,
  Button,
  Col,
  Row,
} from "reactstrap";
import request from "@/utils/axiosUtils";
import Btn from "@/elements/buttons/Btn";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const InventoryEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation("common");
  const inventoryId = params.id;
  
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch inventory details
        const inventoryRes = await request({
          url: `/vendor/inventory/${inventoryId}`,
          method: "GET",
        });

        if (!inventoryRes.data?.success) {
          throw new Error(inventoryRes.data?.message || "Failed to fetch inventory");
        }

        setInventory(inventoryRes.data?.data);

        // Fetch products and warehouses for dropdowns
        const [productRes, warehouseRes] = await Promise.all([
          request({ url: "/product", method: "GET" }),
          request({ url: "vendor/warehouse", method: "GET" }), // FIX: Use vendor warehouse API
        ]);

        setProductData(productRes.data?.data || []);
        setWarehouseData(warehouseRes.data?.data || []);
      } catch (err) {
        setError(err.message || "Failed to load inventory details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [inventoryId]);

  const InventorySchema = Yup.object().shape({
    stock: Yup.number().required("Stock quantity is required").min(0),
    low_stock_threshold: Yup.number().min(0),
  });

  if (loading) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">{t("Loading inventory details")}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          {t("Error")}: {error}
        </div>
        <Button color="secondary" onClick={() => router.push("/vendor/inventory")}>
          {t("Back to Inventory")}
        </Button>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">{t("Inventory item not found")}</div>
        <Button color="secondary" onClick={() => router.push("/vendor/inventory")}>
          {t("Back to Inventory")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <Row>
        <Col sm="12">
          <Card>
            <CardBody>
              <div className="title-header mb-4">
                <h5>{t("Edit Inventory Stock")}</h5>
              </div>

              <Formik
                initialValues={{
                  product_id: inventory.product?._id || inventory.product_id || "",
                  warehouse_id: inventory.warehouse?._id || inventory.warehouse_id || "",
                  stock: inventory.stock || 0,
                  low_stock_threshold: inventory.low_stock_threshold || 10,
                }}
                validationSchema={InventorySchema}
                onSubmit={async (values) => {
                  setIsSubmitting(true);
                  try {
                    const res = await request({
                      url: `/vendor/inventory`,
                      method: "POST",
                      data: values,
                    });

                    if (res?.status === 200 || res?.status === 201) {
                      toast.success(t("Inventory updated successfully"));
                      router.push("/vendor/inventory");
                    }
                  } catch (error) {
                    toast.error(error?.message || t("Failed to update inventory"));
                    console.error("Update error:", error);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {({ values, setFieldValue, errors, touched }) => (
                  <Form className="theme-form">
                    <FormGroup>
                      <Label>{t("Product")} *</Label>
                      <Field
                        as="select"
                        name="product_id"
                        className="form-select"
                        disabled
                      >
                        <option value="">{t("Select Product")}</option>
                        {Array.isArray(productData) &&
                          productData.map((prod) => (
                            <option key={prod._id} value={prod._id}>
                              {prod.product_name}
                            </option>
                          ))}
                      </Field>
                      <small className="text-muted">{t("Product cannot be changed")}</small>
                    </FormGroup>

                    <FormGroup>
                      <Label>{t("Warehouse")} *</Label>
                      <Field
                        as="select"
                        name="warehouse_id"
                        className="form-select"
                        disabled
                      >
                        <option value="">{t("Select Warehouse")}</option>
                        {Array.isArray(warehouseData) &&
                          warehouseData.map((wh) => (
                            <option key={wh._id} value={wh._id}>
                              {wh.name}
                            </option>
                          ))}
                      </Field>
                      <small className="text-muted">{t("Warehouse cannot be changed")}</small>
                    </FormGroup>

                    <FormGroup>
                      <Label>{t("Current Stock Quantity")} *</Label>
                      <Field
                        name="stock"
                        type="number"
                        className={`form-control ${
                          errors.stock && touched.stock ? "is-invalid" : ""
                        }`}
                        min="0"
                      />
                      {errors.stock && touched.stock && (
                        <div className="invalid-feedback d-block">{errors.stock}</div>
                      )}
                    </FormGroup>

                    <FormGroup>
                      <Label>{t("Low Stock Alert Threshold")}</Label>
                      <Field
                        name="low_stock_threshold"
                        type="number"
                        className={`form-control ${
                          errors.low_stock_threshold && touched.low_stock_threshold ? "is-invalid" : ""
                        }`}
                        min="0"
                      />
                      {errors.low_stock_threshold && touched.low_stock_threshold && (
                        <div className="invalid-feedback d-block">{errors.low_stock_threshold}</div>
                      )}
                    </FormGroup>

                    <div className="d-flex gap-2 mt-4">
                      <Button
                        color="secondary"
                        onClick={() => router.push("/vendor/inventory")}
                      >
                        {t("Cancel")}
                      </Button>
                      <Btn
                        type="submit"
                        title={t("Update Stock")}
                        loading={Number(isSubmitting)}
                        className="btn-primary"
                      />
                    </div>
                  </Form>
                )}
              </Formik>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InventoryEditPage;
