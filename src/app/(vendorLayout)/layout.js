"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "reactstrap";
import Footer from "@/layout/footer";
import Header from "@/layout/header";
import VendorSidebar from "@/components/vendor/sidebar";

const VendorLayout = ({ children }) => {
  const [mode, setMode] = useState(false);
  const [ltr, setLtr] = useState(true);
  const path = usePathname();

  useEffect(() => {
    mode
      ? document.body.classList.add("dark-only")
      : document.body.classList.remove("dark-only");
  }, [mode, ltr]);

  return (
    <>
      <div className="page-wrapper compact-wrapper" id="pageWrapper">
        <Header
          setMode={setMode}
          mode={mode}
          setLtr={setLtr}
          settingData={"settingData"}
        />
        <div className="page-body-wrapper">
          <VendorSidebar />
          <div className="page-body">
            <Container fluid={true}>{children}</Container>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorLayout;
