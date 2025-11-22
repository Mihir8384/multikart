import React, { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import SettingContext from "../../../helper/settingContext";

const Logo = () => {
  const { state, settingObj } = useContext(SettingContext);
  return (
    <Link href="/dashboard">
      {state?.setLightLogo?.original_url ? (
        <Image
          className="for-white"
          src={`${state?.setLightLogo?.original_url || null}`}
          alt="Light Logo"
          width={1300}
          height={500}
          priority
        />
      ) : (
        <Image
          className="for-white"
          src="/assets/images/settings/logo-white.png"
          alt="InfoTech Logo"
          width={200}
          height={100}
          priority
        />
      )}
    </Link>
  );
};

export default Logo;
