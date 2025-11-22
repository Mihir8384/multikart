import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardBody, Col, Row } from "reactstrap";
import OrderFilter from "./OrderFilter";

const OrderStatus = ({ data, filterType, setFilterValue, setFilterType }) => {
  const { t } = useTranslation("common");

  const statusItems = [
    {
      status: "pending",
      label: t("Pending"),
      count: data?.total_pending_orders,
      icon: "/assets/images/svg/box-time.svg",
      color: "#FFC107",
      bgColor: "#FFC107",
    },
    {
      status: "processing",
      label: t("Processing"),
      count: data?.total_processing_orders,
      icon: "/assets/images/svg/note.svg",
      color: "#0EA5E9",
      bgColor: "#0EA5E9",
    },
    {
      status: "cancelled",
      label: t("cancelled"),
      count: data?.total_cancelled_orders,
      icon: "/assets/images/svg/box-remove.svg",
      color: "#EF4444",
      bgColor: "#EF4444",
    },
    {
      status: "shipped",
      label: t("shipped"),
      count: data?.total_shipped_orders,
      icon: "/assets/images/svg/box.svg",
      color: "#A855F7",
      bgColor: "#A855F7",
    },
    {
      status: "out_for_delivery",
      label: t("Outfordelivery"),
      count: data?.total_out_of_delivery_orders,
      icon: "/assets/images/svg/group.svg",
      color: "#10B981",
      bgColor: "#10B981",
    },
    {
      status: "delivered",
      label: t("Delivered"),
      count: data?.total_delivered_orders,
      icon: "/assets/images/svg/group.svg",
      color: "#22C55E",
      bgColor: "#22C55E",
    },
  ];

  return (
    <Col>
      <div className="order-status-ribbon">
        {statusItems.map((item, index) => (
          <Link
            key={index}
            href={{ pathname: `/order`, query: { status: item.status } }}
            className="order-status-segment"
            style={{
              background: item.bgColor,
              "--segment-color": item.color,
            }}
          >
            <div className="segment-content">
              <Image
                height={20}
                width={20}
                src={item.icon}
                className="segment-icon"
                alt={item.status}
              />
              <span className="segment-label">{item.label}</span>
              <span className="segment-count">{item.count}</span>
            </div>
          </Link>
        ))}
      </div>
    </Col>
  );
};

export default OrderStatus;
