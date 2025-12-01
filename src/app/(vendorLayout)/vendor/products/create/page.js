"use client";
import React, { useState } from "react";
import { Col, Row, Card, CardBody, Input } from "reactstrap"; // Removed Button import
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import request from "@/utils/axiosUtils";
import { product } from "@/utils/axiosUtils/API";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import Loader from "@/components/commonComponent/Loader";
import Btn from "@/elements/buttons/Btn";
import { RiSearchLine } from "react-icons/ri";
import { placeHolderImage } from "@/data/CommonPath";
import Link from "next/link";
// 1. Import the new form component
import VendorOfferingForm from "@/components/vendor/VendorOfferingForm";

const VendorProductSearch = () => {
  const { t } = useTranslation("common");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // 2. Add state for the selected product and modal visibility
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Active Master Products
  const { data: masterProducts, isLoading } = useCustomQuery(
    ["masterProducts", debouncedSearch],
    () =>
      request(
        {
          url: product,
          params: {
            status: "active",
            search: debouncedSearch,
            paginate: 12,
          },
        },
        router
      ),
    {
      refetchOnWindowFocus: false,
      select: (data) => data?.data?.data,
    }
  );

  // 3. Handler to open the modal
  const handleSellClick = (prod) => {
    setSelectedProduct(prod);
    setModalOpen(true);
  };

  // 4. Handler to close the modal
  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) setSelectedProduct(null);
  };

  return (
    <div className="container-fluid">
      <Row>
        <Col sm="12">
          <Card>
            <CardBody>
              <div className="title-header option-title">
                <h5>{t("Search Master Catalogue")}</h5>
              </div>

              {/* Search Bar */}
              <div className="search-box mb-4">
                <div className="position-relative">
                  <Input
                    placeholder={t("Search by product name, brand, or UPID...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingRight: "40px" }}
                  />
                  <RiSearchLine
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "15px",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                </div>
                <div className="mt-2 text-muted small">
                  {t("Can't find your product?")}
                  <Link
                    href="/vendor/products/request"
                    className="ms-1 text-primary"
                  >
                    {t("Request a new product")}
                  </Link>
                </div>
              </div>

              {/* Results Grid */}
              {isLoading ? (
                <Loader />
              ) : (
                <div className="row g-3">
                  {masterProducts?.length > 0 ? (
                    masterProducts.map((prod) => {
                      const image =
                        prod.media?.find((m) => m.is_primary)?.url ||
                        prod.media?.[0]?.url ||
                        placeHolderImage;

                      return (
                        <Col xl="3" lg="4" md="6" key={prod._id}>
                          <Card className="h-100 border">
                            <div className="p-3 text-center bg-light">
                              <Image
                                src={image}
                                alt={prod.product_name}
                                width={150}
                                height={150}
                                objectFit="contain"
                                className="img-fluid"
                              />
                            </div>
                            <CardBody className="d-flex flex-column">
                              <h6 className="mb-2 text-truncate">
                                {prod.product_name}
                              </h6>
                              <p className="text-muted small mb-1">
                                {t("UPID")}: {prod.master_product_code}
                              </p>
                              <p className="text-muted small mb-3">
                                {t("Brand")}: {prod.brand_id?.name || "N/A"}
                              </p>

                              <div className="mt-auto">
                                <Btn
                                  className="btn-primary w-100"
                                  // 5. Update click handler
                                  onClick={() => handleSellClick(prod)}
                                >
                                  {t("Sell This Product")}
                                </Btn>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      );
                    })
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">
                        {t("No products found matching your search.")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* 6. Render the Modal */}
      <VendorOfferingForm
        isOpen={modalOpen}
        toggle={toggleModal}
        product={selectedProduct}
      />
    </div>
  );
};

export default VendorProductSearch;
