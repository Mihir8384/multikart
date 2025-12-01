"use client";
import { ReactstrapInput } from "@/components/reactstrapFormik";
import ShowBox from "@/elements/alerts&Modals/ShowBox";
import Btn from "@/elements/buttons/Btn";
import SettingContext from "@/helper/settingContext";
import LoginBoxWrapper from "@/utils/hoc/LoginBoxWrapper";
import {
  YupObject,
  emailSchema,
  nameSchema,
} from "@/utils/validation/ValidationSchemas";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Image from "next/image";
import Link from "next/link";
import { useContext, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "react-i18next";
import { Col } from "reactstrap";
import { useRouter } from "next/navigation";
import request from "@/utils/axiosUtils";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { setAuthData } from "@/utils/auth";

const Login = () => {
  const [showBoxMessage, setShowBoxMessage] = useState();
  const { settingObj, state } = useContext(SettingContext);
  const { t } = useTranslation("common");
  const reCaptchaRef = useRef();
  const router = useRouter();

  return (
    <div className="box-wrapper">
      <ShowBox showBoxMessage={showBoxMessage} />
      <LoginBoxWrapper>
        <div className="log-in-title text-center">
          <h4>{t("LogInYourAccount")}</h4>
        </div>
        <div className="input-box">
          <Formik
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={YupObject({
              email: emailSchema,
              password: nameSchema,
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                setSubmitting(true);
                const loginData = {
                  email: values.email,
                  password: values.password,
                };

                const response = await request({
                  url: "/auth/signin",
                  method: "POST",
                  data: loginData,
                });

                if (response?.data?.success) {
                  const token = response?.data?.data?.token;
                  const user = response?.data?.data?.user;

                  if (token && user) {
                    setAuthData(token, user);

                    // --- THIS IS THE FIX ---
                    const isSuperAdmin = user.isAdmin; // Check the boolean flag first
                    const roleName = user.role?.name?.toLowerCase();

                    // Priority 1: Super Admin OR 'admin' role -> Admin Dashboard
                    if (isSuperAdmin || roleName === "admin") {
                      console.log("Redirecting to ADMIN dashboard (Priority)");
                      router.push("/dashboard");
                    }
                    // Priority 2: Vendor role -> Vendor Dashboard
                    else if (roleName === "vendor") {
                      console.log("Redirecting to VENDOR dashboard");
                      router.push("/vendor/dashboard");
                    }
                    // Priority 3: Default (Customer/Other) -> Main Dashboard
                    else {
                      console.log("Redirecting to default dashboard");
                      router.push("/dashboard");
                    }
                    // -----------------------
                  } else {
                    alert("Login successful but missing authentication data.");
                  }
                } else {
                  const errorMessage =
                    response?.data?.message || "Login failed.";
                  alert(errorMessage);
                }
              } catch (error) {
                console.error("Login error:", error);
                let errorMessage =
                  "Login failed. Please check your credentials.";
                if (error?.response?.data?.message) {
                  errorMessage = error.response.data.message;
                }
                alert(errorMessage);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, setFieldValue, isSubmitting }) => (
              <Form className="row g-4">
                <Col sm="12">
                  <Field
                    inputprops={{ noExtraSpace: true }}
                    autoComplete={true}
                    name="email"
                    type="email"
                    component={ReactstrapInput}
                    className="form-control"
                    id="email"
                    placeholder="Email Address"
                    label="EmailAddress"
                  />
                </Col>
                <Col sm="12">
                  <Field
                    inputprops={{ noExtraSpace: true }}
                    name="password"
                    component={ReactstrapInput}
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    label="Password"
                  />
                </Col>
                {settingObj?.google_reCaptcha?.status && (
                  <Col sm="12">
                    <ReCAPTCHA
                      ref={reCaptchaRef}
                      sitekey={settingObj?.google_reCaptcha?.site_key}
                      onChange={(value) => {
                        setFieldValue("recaptcha", value);
                      }}
                    />
                    {errors.recaptcha && touched.recaptcha && (
                      <ErrorMessage
                        name="recaptcha"
                        render={(msg) => (
                          <div className="invalid-feedback d-block">
                            {errors.recaptcha}
                          </div>
                        )}
                      />
                    )}
                  </Col>
                )}
                <Col sm="12">
                  <Btn
                    title={isSubmitting ? "Logging in..." : "Login"}
                    className="btn btn-animation w-100 justify-content-center"
                    type="submit"
                    color="false"
                    disabled={isSubmitting}
                  />
                  <div className="sign-up-box">
                    <h4>{"Don't Have Seller Account?"}</h4>
                    <Link href={`/auth/register`}>{"Sign Up"}</Link>
                  </div>
                </Col>
              </Form>
            )}
          </Formik>
        </div>
      </LoginBoxWrapper>
    </div>
  );
};

export default Login;
