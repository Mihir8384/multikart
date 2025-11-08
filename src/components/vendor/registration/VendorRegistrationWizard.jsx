"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import request from "@/utils/axiosUtils";
import Step1BusinessDetails from "./steps/Step1BusinessDetails";
import Step2ContactInfo from "./steps/Step2ContactInfo";
import Step3WarehousesChannels from "./steps/Step3WarehousesChannels";
import Step4Payout from "./steps/Step4Payout";
import Step5Review from "./steps/Step5Review";

const VendorRegistrationWizard = ({
  sidebarOnly = false,
  formOnly = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Load existing registration data
    loadRegistrationData();
  }, []);

  const loadRegistrationData = async () => {
    try {
      const response = await request({
        url: "/vendor/register",
        method: "GET",
      });
      if (response?.data?.success && response?.data?.data) {
        setRegistrationData(response.data.data);
        // If data exists, set step to the *next* incomplete step, or 6 if completed
        const savedStep = response.data.data.registration_step || 0;
        if (savedStep === 6) {
          setCurrentStep(5); // Stay on review page if already submitted
        } else if (savedStep < 5) {
          setCurrentStep(savedStep + 1);
        } else {
          setCurrentStep(savedStep);
        }
      } else {
        setCurrentStep(1); // Start at step 1 if no data
      }
    } catch (error) {
      console.error("Error loading registration:", error);
      toast.error("Could not load registration data");
    }
  };

  const handleStepSubmit = async (step, values) => {
    try {
      const response = await request({
        url: "/vendor/register",
        method: "POST",
        data: { step, data: values },
      });

      if (response?.data?.success) {
        setRegistrationData(response.data.data);
        if (step === 5) {
          toast.success("Registration submitted successfully!");
          router.push("/vendor/dashboard");
        } else {
          setCurrentStep(step + 1);
          toast.success(`Step ${step} saved successfully`);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving step");
    }
  };

  const StepList = () => (
    // This wrapper is needed for the horizontal layout CSS
    <div className="step-indicator">
      {[1, 2, 3, 4, 5].map((step) => (
        <div
          key={step}
          className={`step ${currentStep >= step ? "active" : ""}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && "Business Details"}
            {step === 2 && "Contact Info"}
            {step === 3 && "Warehouses & Channels"}
            {step === 4 && "Payout"}
            {step === 5 && "Review"}
          </div>
        </div>
      ))}
    </div>
  );

  const FormArea = () => (
    <>
      <div className="registration-form">
        {currentStep === 1 && (
          <Step1BusinessDetails
            onSubmit={(values) => handleStepSubmit(1, values)}
            initialData={
              registrationData?.registration_data?.step1 || registrationData
            }
          />
        )}
        {currentStep === 2 && (
          <Step2ContactInfo
            onSubmit={(values) => handleStepSubmit(2, values)}
            initialData={
              registrationData?.registration_data?.step2 || registrationData
            }
          />
        )}
        {currentStep === 3 && (
          <Step3WarehousesChannels
            onSubmit={(values) => handleStepSubmit(3, values)}
            initialData={
              registrationData?.registration_data?.step3 || registrationData
            }
          />
        )}
        {currentStep === 4 && (
          <Step4Payout
            onSubmit={(values) => handleStepSubmit(4, values)}
            initialData={
              registrationData?.registration_data?.step4 || registrationData
            }
          />
        )}
        {currentStep === 5 && (
          <Step5Review
            onSubmit={(values) => handleStepSubmit(5, values)}
            registrationData={registrationData}
          />
        )}
      </div>
      <div className="actions mt-3">
        {currentStep > 1 && (
          <button
            className="btn btn-outline-secondary"
            onClick={() => setCurrentStep(currentStep - 1)}
            type="button"
          >
            Previous
          </button>
        )}
      </div>
    </>
  );

  if (sidebarOnly) return <StepList />;
  if (formOnly) return <FormArea />;

  // Fallback (single-column render)
  // This will be used by the page.jsx
  return (
    <div className="vendor-registration-container">
      <StepList />
      <FormArea />
    </div>
  );
};

export default VendorRegistrationWizard;
