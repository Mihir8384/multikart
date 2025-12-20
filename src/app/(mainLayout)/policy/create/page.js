"use client";
import React, { useState } from "react";
import PolicyForm from "@/components/policy/PolicyForm";

const CreatePolicy = () => {
  const [saveButton, setSaveButton] = useState(false);

  return (
    <PolicyForm 
      saveButton={saveButton} 
      setSaveButton={setSaveButton} 
      title={"AddNewPolicy"} 
      buttonName="Save"
    />
  );
};

export default CreatePolicy;
