// import { useContext } from "react";
// import { useTranslation } from "react-i18next";
// import { Col, Container, Row } from "reactstrap";
// import SettingContext from "../../helper/settingContext";

// const Footer = () => {
//   const { t } = useTranslation( 'common');
//   const { state } = useContext(SettingContext)
//   return (
//     <Container fluid={true}>
//       <footer className="footer">
//         <Row>
//           <Col md="12" className="footer-copyright text-center">
//           <p className="mb-0">{t(state?.setCopyRight?state?.setCopyRight:'© Pixelstrap')}</p>
//           </Col>
//         </Row>
//       </footer>
//     </Container>
//   );
// };

// export default Footer;

import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Col, Container, Row, Button } from "reactstrap";
import SettingContext from "../../helper/settingContext";
import AccountContext from "../../helper/accountContext";

const Footer = () => {
  const { t } = useTranslation("common");
  const { state } = useContext(SettingContext);
  const { accountData } = useContext(AccountContext);
  const router = useRouter();

  // Check if user is an admin
  const isAdmin =
    accountData?.role?.name === "Admin" ||
    accountData?.role?.name === "Super Admin" ||
    accountData?.role?.role_type === "admin" ||
    accountData?.role?.role_type === "superadmin";

  const handleBecomeVendor = () => {
    if (!accountData) {
      router.push("/auth/login");
      return;
    }

    // Check the vendor status and redirect accordingly
    const vendorStatus = accountData?.store?.vendor_status;

    if (vendorStatus === "Approved") {
      router.push("/vendor/dashboard");
    } else {
      // This will send new, pending, or rejected vendors to the registration page
      router.push("/vendor/register");
    }
  };

  return (
    <Container fluid={true}>
      <footer className="footer">
        <Row className="align-items-center">
          <Col md="12" className="footer-copyright text-center">
            <p className="mb-0 d-inline-block">
              {t(state?.setCopyRight ? state?.setCopyRight : "© Pixelstrap")}
            </p>
            {(!accountData?.store ||
              accountData?.store?.vendor_status !== "Approved") &&
              !isAdmin && (
                <Button
                  color="primary"
                  size="sm"
                  className="ms-3 footer-vendor-btn"
                  onClick={handleBecomeVendor}
                >
                  {t("Become a Vendor")}
                </Button>
              )}
          </Col>
        </Row>
      </footer>
    </Container>
  );
};

export default Footer;
