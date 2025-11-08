"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Table, Badge } from "reactstrap";
import request from "@/utils/axiosUtils";
import { toast } from "react-toastify";

export default function VendorApprovalsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, Pending, Approved, Rejected
  const router = useRouter();

  useEffect(() => {
    loadVendors();
  }, [filter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const url =
        filter === "all"
          ? "/store?vendor_status="
          : `/store?vendor_status=${filter}`;
      const response = await request({ url, method: "GET" });
      if (response?.data?.success) {
        setVendors(response.data.data);
      }
    } catch (error) {
      toast.error("Error loading vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (vendorId, action, reason = "") => {
    try {
      const response = await request({
        url: `/admin/vendors/${vendorId}`,
        method: "PATCH",
        data: { action, reason },
      });

      if (response?.data?.success) {
        toast.success(`Vendor ${action}ed successfully`);
        loadVendors();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error processing action");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger",
      Resubmission: "info",
    };
    return <Badge color={colors[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Vendor Approvals</h2>

      <div className="mb-3">
        <select
          className="form-control"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Resubmission">Resubmission</option>
        </select>
      </div>

      <Table responsive>
        <thead>
          <tr>
            <th>Vendor ID</th>
            <th>Store Name</th>
            <th>Owner</th>
            <th>Email</th>
            <th>Status</th>
            <th>Registration Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor._id}>
              <td>{vendor.vendor_id}</td>
              <td>{vendor.store_name}</td>
              <td>{vendor.owner_user_id?.name}</td>
              <td>{vendor.owner_user_id?.email}</td>
              <td>{getStatusBadge(vendor.vendor_status)}</td>
              <td>{new Date(vendor.created_at).toLocaleDateString()}</td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    color="success"
                    onClick={() => handleAction(vendor._id, "approve")}
                    disabled={vendor.vendor_status === "Approved"}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onClick={() => handleAction(vendor._id, "reject")}
                    disabled={vendor.vendor_status === "Rejected"}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    color="info"
                    onClick={() => handleAction(vendor._id, "resubmission")}
                  >
                    Request Resubmission
                  </Button>
                  <Button
                    size="sm"
                    color="secondary"
                    onClick={() => router.push(`/admin/vendors/${vendor._id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
