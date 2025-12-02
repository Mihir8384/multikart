"use client";
import React, { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import request from "@/utils/axiosUtils";
import { VariantAPI } from "@/utils/axiosUtils/API";
import { useTranslation } from "react-i18next";
import { RiAddLine, RiDeleteBinLine } from "react-icons/ri";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import FormInput from "@/components/commonComponent/form/FormInput";
import FormSelect from "@/components/commonComponent/form/FormSelect";
import FormToggle from "@/components/commonComponent/form/FormToggle";
import Btn from "@/elements/buttons/Btn";
import Loader from "@/components/commonComponent/Loader";
import DeleteButton from "@/components/commonComponent/DeleteButton";

// Zod schema for validation
const optionSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  label: z.string().min(1, { message: "Label is required" }),
  value: z.string().min(1, { message: "Value is required" }),
  image_url: z.string().nullable().optional(),
});

const variantSchema = z.object({
  variant_name: z.string().min(1, { message: "Variant name is required" }),
  description: z.string().optional(),
  input_type: z.string().min(1, { message: "Input type is required" }),
  active: z.boolean().default(true),
  options: z.array(optionSchema).optional(),
});

// Input type options
const inputTypeOptions = [
  { id: "dropdown", name: "Dropdown" },
  { id: "text", name: "Text" },
  { id: "swatch", name: "Color Swatch" },
  { id: "pattern", name: "Pattern (Image)" },
];

export default function EditVariant() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams();
  const updateId = params.updateId;
  const queryClient = useQueryClient();

  const { data: variantData, isLoading: isFetching } = useQuery({
    queryKey: ["variant", updateId],
    queryFn: () => request({ url: `${VariantAPI}/${updateId}` }),
    enabled: !!updateId,
    select: (data) => data?.data?.data,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(variantSchema),
  });

  useEffect(() => {
    if (variantData) {
      reset({
        variant_name: variantData.variant_name,
        description: variantData.description,
        input_type: variantData.input_type,
        active: variantData.active,
        options: variantData.options.map((opt) => ({ ...opt, id: opt._id })),
      });
    }
  }, [variantData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const selectedInputType = watch("input_type");

  const updateVariantMutation = useMutation({
    mutationFn: (data) =>
      request({ url: `${VariantAPI}/${updateId}`, method: "PUT", data }),
    onSuccess: () => {
      ToastNotification("success", t("Variantupdatedsuccessfully"));
      queryClient.invalidateQueries(["variants"]);
      queryClient.invalidateQueries(["variant", updateId]);
      router.push("/variant");
    },
    onError: (error) => {
      ToastNotification(
        "error",
        error.response?.data?.message || t("Failedtoupdatevariant")
      );
    },
  });

  const onSubmit = (data) => {
    updateVariantMutation.mutate(data);
  };

  const isOptionBased = ["dropdown", "swatch", "pattern"].includes(
    selectedInputType
  );

  if (isFetching) {
    return <Loader />;
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h4 className="card-title">{t("UpdateVariant")}</h4>
        <DeleteButton
          id={updateId}
          api={VariantAPI}
          redirectTo="/variant"
          queryKey="variants"
        />
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="theme-form">
          <div className="row">
            <div className="col-md-6">
              <FormInput
                name="variant_name"
                label={t("VariantName")}
                placeholder={t("e.g., Color, Size, Material")}
                register={register}
                errors={errors}
                control={control}
              />
            </div>
            <div className="col-md-6">
              <FormSelect
                name="input_type"
                label={t("InputType")}
                options={inputTypeOptions}
                register={register}
                errors={errors}
                placeholder={t("Selectaninputtype")}
                control={control}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <FormInput
                name="description"
                label={t("Description")}
                placeholder={t("Optionaldescriptionfortheadmin")}
                register={register}
                errors={errors}
                type="textarea"
                control={control}
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-12">
              <FormToggle
                name="active"
                label={t("Active")}
                control={control}
                errors={errors}
              />
            </div>
          </div>

          {isOptionBased && (
            <div className="mt-4 border-top pt-4">
              <h5 className="mb-3">{t("VariantOptions")}</h5>
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="row align-items-center mb-3 p-3 border rounded"
                >
                  <div className="col-md-4">
                    <FormInput
                      name={`options.${index}.label`}
                      label={t("Label")}
                      placeholder={t("e.g., Red")}
                      register={register}
                      errors={errors}
                      control={control}
                    />
                  </div>
                  <div className="col-md-4">
                    <FormInput
                      name={`options.${index}.value`}
                      label={
                        selectedInputType === "swatch"
                          ? t("Value (Hex Code)")
                          : t("Value")
                      }
                      placeholder={
                        selectedInputType === "swatch" ? "#FF0000" : "e.g., red"
                      }
                      register={register}
                      errors={errors}
                      control={control}
                    />
                  </div>
                  {selectedInputType === "pattern" && (
                    <div className="col-md-4">
                      <FormInput
                        name={`options.${index}.image_url`}
                        label={t("ImageURL")}
                        placeholder={t("http://.../image.png")}
                        register={register}
                        errors={errors}
                        control={control}
                      />
                    </div>
                  )}
                  <div className="col-md-auto mt-3">
                    <Btn
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => remove(index)}
                    >
                      <RiDeleteBinLine />
                    </Btn>
                  </div>
                </div>
              ))}
              <Btn
                type="button"
                className="btn-primary"
                onClick={() => append({ label: "", value: "" })}
              >
                <RiAddLine className="me-1" /> {t("AddOption")}
              </Btn>
            </div>
          )}

          <div className="row mt-4">
            <div className="col-12">
              <Btn
                type="submit"
                className="btn-primary"
                loading={isSubmitting || updateVariantMutation.isLoading}
              >
                {t("UpdateVariant")}
              </Btn>
              <Btn
                type="button"
                className="btn-light ms-2"
                onClick={() => router.back()}
              >
                {t("Cancel")}
              </Btn>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
