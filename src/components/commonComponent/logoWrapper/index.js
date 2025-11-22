import Image from "next/image";
import { useContext } from "react";
import SettingContext from "../../../helper/settingContext";
// Logo and toggle intentionally omitted to reserve space for a larger brand mark

const LogoWrapper = ({ setSidebarOpen }) => {
  const { state } = useContext(SettingContext);
  return (
    <div className="logo-wrapper logo-wrapper-center sidebar-logo-area">
      {/* Render a larger, responsive logo that fills the header gap */}
      {state?.setTinyLogo?.original_url ? (
        <div className="sidebar-logo-img">
          <Image
            src={state?.setTinyLogo?.original_url}
            alt="Tiny Logo"
            fill
            sizes="(max-width: 600px) 80px, 120px"
            style={{ objectFit: "contain" }}
          />
        </div>
      ) : (
        <div className="sidebar-logo-img">
          <Image
            src="/assets/images/settings/tiny-logo.png"
            alt="InfoTech Tiny Logo"
            fill
            sizes="(max-width: 600px) 80px, 120px"
            style={{ objectFit: "contain" }}
          />
        </div>
      )}
    </div>
  );
};

export default LogoWrapper;
