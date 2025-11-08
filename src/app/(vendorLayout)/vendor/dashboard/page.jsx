"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Col, Row, Badge, Table } from "reactstrap";
import Image from "next/image";
import Link from "next/link";
import request from "@/utils/axiosUtils";
import useCustomQuery from "@/utils/hooks/useCustomQuery";
import { toast } from "react-toastify";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data, refetch } = useCustomQuery(
    ["vendor-dashboard"],
    () => request({ url: "/vendor/dashboard", method: "GET" }, router),
    {
      refetchOnWindowFocus: false,
      select: (data) => data?.data?.data,
      onError: (error) => {
        toast.error("Failed to load dashboard data");
        console.error("Dashboard error:", error);
      },
      onSuccess: () => setLoading(false),
    }
  );

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger",
      Resubmission: "info",
    };
    return <Badge color={colors[status] || "secondary"}>{status}</Badge>;
  };

  const getOrderStatusBadge = (status) => {
    const colors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "danger",
    };
    return <Badge color={colors[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const store = data?.store;
  const stats = data?.stats || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-semibold mb-1">Vendor Dashboard</h4>
          {store && (
            <p className="text-muted mb-0">
              Welcome back, {store.store_name} ({store.vendor_id})
            </p>
          )}
        </div>
        {store?.vendor_status === "Pending" && (
          <Badge color="warning" className="p-2">
            ⏳ Registration Under Review
          </Badge>
        )}
      </div>

      {/* Registration Status Alert */}
      {store && store.vendor_status === "Pending" && (
        <div className="alert alert-warning mb-4">
          <h6 className="alert-heading">
            Registration Status: {getStatusBadge(store.vendor_status)}
          </h6>
          <p className="mb-0">
            Your vendor registration is currently under review. You'll be
            notified once your application is approved.
            {store.registration_step < 6 && (
              <span>
                {" "}
                You can{" "}
                <Link href="/vendor/register">
                  complete your registration
                </Link>{" "}
                if needed.
              </span>
            )}
          </p>
        </div>
      )}

      {!store && (
        <div className="alert alert-info mb-4">
          <h6 className="alert-heading">No Vendor Account Found</h6>
          <p className="mb-0">
            You haven't registered as a vendor yet.{" "}
            <Link href="/vendor/register">Start your vendor registration</Link>{" "}
            to begin selling.
          </p>
        </div>
      )}

      {store && (
        <>
          {/* Statistics Cards */}
          <Row className="g-3 mb-4">
            <Col md="3" sm="6">
              <Card className="widget-card">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="widget-icon me-3">
                      <Image
                        height={26}
                        width={26}
                        src="/assets/images/svg/receipt-2.svg"
                        className="img-fluid"
                        alt="products"
                      />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Products</h6>
                      <h3 className="mb-0">{stats.total_products || 0}</h3>
                      <small className="text-muted">
                        {stats.approved_products || 0} approved,{" "}
                        {stats.pending_products || 0} pending
                      </small>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col md="3" sm="6">
              <Link href="/vendor/products" className="text-decoration-none">
                <Card className="widget-card">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="widget-icon me-3">
                        <Image
                          height={26}
                          width={26}
                          src="/assets/images/svg/medal-star.svg"
                          className="img-fluid"
                          alt="orders"
                        />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Total Orders</h6>
                        <h3 className="mb-0">{stats.total_orders || 0}</h3>
                        <small className="text-muted">
                          {stats.pending_orders || 0} pending
                        </small>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </Col>

            <Col md="3" sm="6">
              <Card className="widget-card">
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="widget-icon me-3">
                      <Image
                        height={26}
                        width={26}
                        src="/assets/images/svg/empty-wallet.svg"
                        className="img-fluid"
                        alt="revenue"
                      />
                    </div>
                    <div>
                      <h6 className="text-muted mb-1">Total Revenue</h6>
                      <h3 className="mb-0">
                        ${(stats.total_revenue || 0).toFixed(2)}
                      </h3>
                      <small className="text-muted">
                        From delivered orders
                      </small>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col md="3" sm="6">
              <Link href="/vendor/profile" className="text-decoration-none">
                <Card className="widget-card">
                  <CardBody>
                    <div className="d-flex align-items-center">
                      <div className="widget-icon me-3">
                        <Image
                          height={26}
                          width={26}
                          src="/assets/images/svg/shop-white.svg"
                          className="img-fluid"
                          alt="store"
                        />
                      </div>
                      <div>
                        <h6 className="text-muted mb-1">Store Status</h6>
                        <h3 className="mb-0">
                          {getStatusBadge(store.vendor_status)}
                        </h3>
                        <small className="text-muted">
                          Registration status
                        </small>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row className="mb-4">
            <Col md="12">
              <Card>
                <CardBody>
                  <h5 className="mb-3">Quick Actions</h5>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link href="/vendor/products" className="btn btn-primary">
                      Add New Product
                    </Link>
                    <Link
                      href="/vendor/orders"
                      className="btn btn-outline-primary"
                    >
                      View All Orders
                    </Link>
                    <Link
                      href="/vendor/profile"
                      className="btn btn-outline-secondary"
                    >
                      Update Profile
                    </Link>
                    <Link
                      href="/vendor/payout"
                      className="btn btn-outline-success"
                    >
                      View Payouts
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Recent Orders */}
          <Row>
            <Col md="12">
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Recent Orders</h5>
                    <Link
                      href="/vendor/orders"
                      className="btn btn-sm btn-outline-primary"
                    >
                      View All
                    </Link>
                  </div>
                  {recentOrders.length > 0 ? (
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order._id}>
                            <td>
                              {order.order_number ||
                                order._id.toString().slice(-8)}
                            </td>
                            <td>
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td>{getOrderStatusBadge(order.order_status)}</td>
                            <td>${order.total_amount?.toFixed(2) || "0.00"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center p-4 text-muted">
                      <p>No orders yet</p>
                      <Link href="/vendor/products" className="btn btn-primary">
                        Start Adding Products
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
