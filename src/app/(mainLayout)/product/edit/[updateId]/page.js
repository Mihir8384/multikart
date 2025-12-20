'use client'
import ProductForm from "@/components/product/ProductForm";
import { useParams } from "next/navigation";
import { useState } from "react";

const UpdateProduct = () => {
  const params = useParams();
  const [saveButton, setSaveButton] = useState(false);

  return (
    params?.updateId && (
      <ProductForm 
        saveButton={saveButton} 
        setSaveButton={setSaveButton} 
        updateId={params?.updateId} 
        title={"EditProduct"} 
        buttonName="Update"
      />
    )
  );
};

export default UpdateProduct;
