"use client";
import React, { useState } from "react";
import {
  Col,
  Card,
  CardBody,
  Modal,
  ModalHeader,
  ModalBody,
  FormGroup,
  Label,
  Button,
} from "reactstrap";
import { Formik, Form, Field } from "formik";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { RiEdit2Line } from "react-icons/ri";
import { FiPlus } from "react-icons/fi";

import TableWrapper from "@/utils/hoc/TableWrapper";
import ShowTable from "@/components/table/ShowTable";
import Loader from "@/components/commonComponent/Loader";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import request from "@/utils/axiosUtils";
import { toast } from "react-toastify";
import Btn from "@/elements/buttons/Btn";

const inventoryApi = "/vendor/inventory";
const warehouseApi = "/warehouse";

const InventoryTable = ({ data, refetch, isCheck, setIsCheck, setModal, setSelectedItem, ...props }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  if (!data) return <Loader />;

  // FIX: Flatten status AND ensure every item has an 'id' property for the table logic
  const processedData = (data?.data?.data || data?.data || []).map((item) => ({
    ...item,
    id: item._id, // ShowTable often specifically looks for 'id'
    status_display:
      typeof item.stock_status === "object"
        ? item.stock_status.name
        : item.stock_status,
    status_color:
      typeof item.stock_status === "object"
        ? item.stock_status.color
        : "secondary",
  }));

  const headerObj = {
    checkBox: true,
    isSerialNo: false,
    isOption: true,
    noEdit: false,
    optionHead: {
      title: "Action",
      type: "edit",
      url: "/vendor/inventory/edit",
    },
    column: [
      { title: "Image", apiKey: "image", type: "image", class: "sm-width" },
      { title: "Product", apiKey: "name", sorting: true },
      { title: "SKU", apiKey: "sku", sorting: true },
      { title: "Warehouse", apiKey: "warehouse_name" },
      { title: "Stock Level", apiKey: "stock", sorting: true },
      { title: "Status", apiKey: "status_display", type: "badge" },
    ],
    data: processedData,
  };

  return (
    <ShowTable
      {...props}
      headerData={headerObj}
      editPermission={true}
      destroyPermission={true}
      refetch={refetch}
      moduleName="inventory"
      type="inventory"
      url={inventoryApi}
      link="inventory"
      isCheck={isCheck}
      setIsCheck={setIsCheck}
    />
  );
};

const InventoryTableWrapped = TableWrapper(InventoryTable);

const VendorInventory = () => {
  const { t } = useTranslation("common");
  const [isCheck, setIsCheck] = useState([]);
  const [modal, setModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch dropdown data - Get only vendor's products
  const { data: productData } = useCustomQuery(["vendorProducts"], () =>
    request({ url: "/vendor/product" })
  );
  const { data: warehouseData } = useCustomQuery(["vendorWarehouses"], () =>
    request({ url: "/vendor/warehouse" })
  );

  // Extract products array from nested structure
  const products = React.useMemo(() => {
    // Handle paginated response structure
    if (Array.isArray(productData?.data?.data?.data)) {
      return productData.data.data.data;
    }
    if (Array.isArray(productData?.data?.data)) {
      return productData.data.data;
    }
    if (Array.isArray(productData?.data)) {
      return productData.data;
    }
    if (Array.isArray(productData)) {
      return productData;
    }
    return [];
  }, [productData]);

  // Extract warehouses array
  const warehouses = React.useMemo(() => {
    // Handle both paginated and direct array responses
    if (Array.isArray(warehouseData?.data?.data?.data)) {
      return warehouseData.data.data.data;
    }
    if (Array.isArray(warehouseData?.data?.data)) {
      return warehouseData.data.data;
    }
    if (Array.isArray(warehouseData?.data)) {
      return warehouseData.data;
    }
    return [];
  }, [warehouseData]);

  const closeModal = () => {
    setModal(false);
    setSelectedItem(null);
  };

  const handleAdjustStock = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await request({
        url: inventoryApi,
        method: "post",
        data: values,
      });
      if (res.status === 200 || res.status === 201) {
        closeModal();
        toast.success(t("Stock adjusted successfully"));
        // Trigger table refresh
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Col sm="12">
      <Card className="card-no-border">
        <CardBody>
          <div className="title-header option-title d-flex align-items-center justify-content-between mb-4">
            <h5 className="mb-0 fw-bold">{t("Inventory Management")}</h5>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={() => {
                setSelectedItem(null);
                setModal(true);
              }}
            >
              <FiPlus size={18} />
              <span>{t("Adjust Stock")}</span>
            </button>
          </div>

          <InventoryTableWrapped
            url={inventoryApi}
            moduleName="inventory"
            onlyTitle={true}
            isCheck={isCheck}
            setIsCheck={setIsCheck}
            setModal={setModal}
            setSelectedItem={setSelectedItem}
            key={refreshTrigger}
          />

          {/* Add / Edit Stock Modal */}
          <Modal isOpen={modal} toggle={closeModal} centered size="lg" className="theme-modal">
            <ModalHeader toggle={closeModal} className="bg-light">
              <h5 className="modal-title fw-bold mb-0">
                {selectedItem ? t("Edit Stock") : t("Adjust New Stock")}
              </h5>
            </ModalHeader>
            <ModalBody className="p-4">
              <Formik
                enableReinitialize
                initialValues={{
                  product_id:
                    selectedItem?.product?._id || selectedItem?.product_id || "",
                  warehouse_id:
                    selectedItem?.warehouse?._id ||
                    selectedItem?.warehouse_id ||
                    "",
                  stock: selectedItem?.stock || 0,
                  low_stock_threshold: selectedItem?.low_stock_threshold || 10,
                }}
                onSubmit={handleAdjustStock}
              >
                {({ values, setFieldValue }) => {
                  // Fetch existing stock when both product and warehouse are selected
                  React.useEffect(() => {
                    const fetchExistingStock = async () => {
                      if (values.product_id && values.warehouse_id && !selectedItem) {
                        try {
                          const response = await request({
                            url: `/vendor/inventory/check?product_id=${values.product_id}&warehouse_id=${values.warehouse_id}`,
                            method: "GET",
                          });
                          
                          // If inventory exists, populate the fields
                          if (response.data?.success && response.data?.data) {
                            setFieldValue("stock", response.data.data.stock || 0);
                            setFieldValue("low_stock_threshold", response.data.data.low_stock_threshold || 10);
                            toast.info("Existing inventory loaded. You can update the stock.");
                          } else {
                            // No existing inventory, try to get stock from product data
                            const selectedProduct = products.find(p => (p.id || p._id) === values.product_id);
                            if (selectedProduct?.stock) {
                              setFieldValue("stock", selectedProduct.stock);
                              toast.info("Product stock loaded. Creating new inventory entry.");
                            } else {
                              setFieldValue("stock", 0);
                              toast.info("No existing inventory. Creating new stock entry.");
                            }
                            setFieldValue("low_stock_threshold", 10);
                          }
                        } catch (error) {
                          // No existing stock found, try to get stock from product data
                          const selectedProduct = products.find(p => (p.id || p._id) === values.product_id);
                          if (selectedProduct?.stock) {
                            setFieldValue("stock", selectedProduct.stock);
                            setFieldValue("low_stock_threshold", 10);
                          } else {
                            setFieldValue("stock", 0);
                            setFieldValue("low_stock_threshold", 10);
                          }
                        }
                      }
                    };
                    
                    fetchExistingStock();
                  }, [values.product_id, values.warehouse_id]);

                  return (
                  <Form className="theme-form">
                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Product")} <span className="text-danger">*</span></Label>
                      <Field
                        as="select"
                        name="product_id"
                        className="form-select"
                        disabled={!!selectedItem}
                        required
                      >
                        <option value="">{t("Select Product")}</option>
                        {products.length > 0 ? (
                          products.map((prod) => (
                            <option key={prod.id || prod._id} value={prod.id || prod._id}>
                              {prod.name || prod.product_name} {prod.sku && `- ${prod.sku}`}
                            </option>
                          ))
                        ) : (
                          <option disabled>No products available</option>
                        )}
                      </Field>
                      {products.length === 0 && (
                        <small className="text-muted mt-1 d-block">
                          Please list products first to manage inventory
                        </small>
                      )}
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Warehouse")} <span className="text-danger">*</span></Label>
                      <Field
                        as="select"
                        name="warehouse_id"
                        className="form-select"
                        disabled={!!selectedItem}
                        required
                      >
                        <option value="">{t("Select Warehouse")}</option>
                        {warehouses.length > 0 ? (
                          warehouses.map((wh) => (
                            <option key={wh._id} value={wh._id}>
                              {wh.name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No warehouses available</option>
                        )}
                      </Field>
                      {warehouses.length === 0 && (
                        <small className="text-muted mt-1 d-block">
                          Please create a warehouse first
                        </small>
                      )}
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Current Stock Quantity")} <span className="text-danger">*</span></Label>
                      <Field
                        name="stock"
                        type="number"
                        className="form-control"
                        placeholder="Enter stock quantity"
                        min="0"
                        required
                      />
                    </FormGroup>

                    <FormGroup className="mb-3">
                      <Label className="fw-semibold">{t("Low Stock Alert Threshold")}</Label>
                      <Field
                        name="low_stock_threshold"
                        type="number"
                        className="form-control"
                        placeholder="Enter low stock threshold"
                        min="0"
                      />
                    </FormGroup>

                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                      <Button
                        type="button"
                        color="light"
                        onClick={closeModal}
                        className="px-4"
                      >
                        {t("Cancel")}
                      </Button>
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t("Saving...")}
                          </>
                        ) : (
                          t("Save Changes")
                        )}
                      </button>
                    </div>
                  </Form>
                  );
                }}
              </Formik>
            </ModalBody>
          </Modal>
        </CardBody>
      </Card>
    </Col>
  );
};

export default VendorInventory;
