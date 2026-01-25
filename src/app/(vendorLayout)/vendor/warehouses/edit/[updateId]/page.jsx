"use client";
import WarehouseForm from "@/components/warehouse/WarehouseForm";
import { useParams } from "next/navigation";

const EditWarehouse = () => {
  const { updateId } = useParams();
  return <WarehouseForm isVendor={true} updateId={updateId} title="Edit Fulfillment Center" />;
};

export default EditWarehouse;
