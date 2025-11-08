"use client";
import VendorRegistrationWizard from "@/components/vendor/registration/VendorRegistrationWizard";

export default function VendorRegisterPage() {
  return (
    <div className="container-fluid">
      <h2 className="mb-4">Become a Vendor</h2>

      {/* This <div> is the grid container.
        Your CSS file styles ".vendor-registration" as:
        display: grid;
        grid-template-columns: 260px 1fr;
      */}
      <div className="vendor-registration">
        {/* Grid Child 1: The Stepper.
          This renders the ".step-indicator" div.
        */}
        <VendorRegistrationWizard sidebarOnly={true} />

        {/* Grid Child 2: The Form Card.
          This renders the ".vendor-card" div.
        */}
        <div className="vendor-card">
          <VendorRegistrationWizard formOnly={true} />
        </div>
      </div>
    </div>
  );
}
