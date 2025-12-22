"use client";
import StoreForm from "@/components/store/StoreForm";
import { store } from "@/utils/axiosUtils/API";
import FormWrapper from "@/utils/hoc/FormWrapper";
import useCreate from "@/utils/hooks/useCreate";

const StoreCreate = () => {
  const { mutate, isLoading } = useCreate(store, null, "/store");
  return (
    <FormWrapper title="AddVendor">
      <StoreForm mutate={mutate} loading={isLoading} buttonName="Save" />
    </FormWrapper>
  );
};

export default StoreCreate;
