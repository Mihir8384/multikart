"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Row, Col, Card, CardBody } from "reactstrap";
import { useTranslation } from "react-i18next";
import Btn from "@/elements/buttons/Btn";
import request from "@/utils/axiosUtils";
import Loader from "../commonComponent/Loader";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";

const WarehouseList = ({ isVendor = false }) => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  
  // Use prop if provided, otherwise detect from pathname
  const isVendorLayout = React.useMemo(() => {
    // First priority: explicit prop
    if (isVendor) return true;
    // Second: Check pathname from Next.js
    if (pathname?.includes('/vendor/')) return true;
    // Third: Fallback to window location for client-side
    if (typeof window !== 'undefined' && window.location.pathname.includes('/vendor/')) return true;
    return false;
  }, [isVendor, pathname]);
  
  // Determine API endpoint based on layout
  const apiEndpoint = isVendorLayout ? "vendor/warehouse" : "warehouse";

  // Fetch data from the API
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await request({ url: apiEndpoint }, router);
      if (response?.data?.success) {
        setWarehouses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching fulfillment centers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [apiEndpoint]);

  // Requirement: Single Remove functionality [cite: 1805]
  const handleDelete = async (id) => {
    if (
      window.confirm(
        t("Are you sure you want to delete this fulfillment center?")
      )
    ) {
      try {
        const response = await request(
          {
            url: `${apiEndpoint}/${id}`,
            method: "DELETE",
          },
          router
        );
        if (response?.data?.success) {
          ToastNotification("success", "Deleted successfully");
          fetchWarehouses();
        }
      } catch (error) {
        ToastNotification("error", "Failed to delete center");
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <Col sm="12">
      {/* Header with Title and Add Button [cite: 1798, 1800] */}
      <div className="title-header option-title">
        <h5>{t("Fulfillment Centers")}</h5>
        <div className="right-options">
          <ul>
            <li>
              <Btn
                className="btn-primary"
                onClick={() => router.push(isVendorLayout ? "/vendor/warehouses/create" : "/warehouse/create")}
              >
                <i className="ri-add-line"></i> {t("Add new address")}
              </Btn>
            </li>
          </ul>
        </div>
      </div>

      {/* Card Grid Layout [cite: 1801] */}
      <Row className="g-sm-4 g-3">
        {warehouses.length > 0 ? (
          warehouses.map((center) => (
            <Col xl="3" lg="4" sm="6" key={center._id}>
              <Card className="warehouse-card">
                <CardBody>
                  <div className="warehouse-details">
                    {/* Center Name [cite: 1801] */}
                    <h6 className="fw-bold mb-2">{center.name}</h6>

                    {/* Full Address Block [cite: 1802, 1803] */}
                    <p className="text-content mb-1">
                      {center.building_name}
                      {center.floor && `, ${center.floor} Floor`}
                      {center.unit && `, Unit ${center.unit}`}
                    </p>
                    <p className="text-content mb-1">
                      {center.island}, {center.atoll}, {center.country}
                    </p>

                    {/* Contact Info [cite: 1804] */}
                    <p className="text-content fw-bold mt-2">
                      {center.contact_no}
                    </p>
                  </div>

                  {/* Action Links [cite: 1805] */}
                  <div className="warehouse-footer mt-3 pt-3 border-top d-flex gap-3">
                    <a
                      href="#"
                      className="text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(isVendorLayout ? `/vendor/warehouses/edit/${center._id}` : `/warehouse/edit/${center._id}`);
                      }}
                    >
                      {t("Edit")}
                    </a>
                    <a
                      href="#"
                      className="text-danger"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(center._id);
                      }}
                    >
                      {t("Remove")}
                    </a>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))
        ) : (
          <Col xs="12">
            <div className="no-data-found">
              <h6>{t("No Fulfillment Centers Found")}</h6>
            </div>
          </Col>
        )}
      </Row>
    </Col>
  );
};

export default WarehouseList;
