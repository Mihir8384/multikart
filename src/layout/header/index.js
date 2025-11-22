import SettingContext from "@/helper/settingContext";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import Logo from "../../components/commonComponent/logoWrapper/Logo";
import ToggleButton from "../../components/commonComponent/logoWrapper/ToggleButton";
import RightNav from "./RightNav";

const Header = ({ setMode, mode, setLtr, settingData }) => {
  const { state, sidebarOpen, setSidebarOpen } = useContext(SettingContext);
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`page-header ${sidebarOpen ? "close_icon" : ""}`}>
      <div className={`header-wrapper m-0 ${mounted ? "skeleton-header" : ""}`}>
        <div className="header-logo-wrapper p-0">
          <div className="logo-wrapper">
            <Logo settingData={settingData} />
          </div>
          <ToggleButton setSidebarOpen={setSidebarOpen} />
          <a className="d-lg-none d-block mobile-logo" href="/">
            {state?.setDarkLogo?.original_url ? (
              <Image
                src={state?.setDarkLogo?.original_url}
                height={21}
                width={120}
                alt="Dark Logo"
              />
            ) : (
              <Image
                src="/assets/images/settings/logo-white.png"
                height={50}
                width={120}
                alt="InfoTech Logo"
              />
            )}
          </a>
        </div>
        <RightNav setMode={setMode} mode={mode} setLtr={setLtr} />
      </div>
    </div>
  );
};

export default Header;
