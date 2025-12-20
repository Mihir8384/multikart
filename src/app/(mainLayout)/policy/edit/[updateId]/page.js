'use client'
import PolicyForm from "@/components/policy/PolicyForm";
import { useParams } from "next/navigation";
import { useState } from "react";

const UpdatePolicy = () => {
  const params = useParams();
  const [saveButton, setSaveButton] = useState(false);

  return (
    params?.updateId && (
      <PolicyForm 
        saveButton={saveButton} 
        setSaveButton={setSaveButton} 
        updateId={params?.updateId} 
        title={"EditPolicy"} 
        buttonName="Update"
      />
    )
  );
};

export default UpdatePolicy;
