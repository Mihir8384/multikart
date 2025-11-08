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

  const handleBecomeVendor = () => {
    if (!accountData) {
      router.push("/auth/login");
    } else {
      router.push("/vendor/register");
    }
  };

  return (
    <Container fluid={true}>
      <footer className="footer">
        <Row>
          <Col md="12" className="footer-copyright text-center">
            <p className="mb-0">
              {t(state?.setCopyRight ? state?.setCopyRight : "© Pixelstrap")}
            </p>
            {(!accountData?.store ||
              accountData?.store?.vendor_status !== "Approved") && (
              <Button
                color="primary"
                className="mt-2"
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
