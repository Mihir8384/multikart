import { useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AccountContext from "@/helper/accountContext";
import ConvertPermissionArr from "../customFunctions/ConvertPermissionArr";

const usePermissionCheck = (permissionTypeArr, keyToSearch) => {
  const [ansData, setAnsData] = useState([]);
  const path = usePathname();
  const moduleToSearch = keyToSearch ? keyToSearch : path.split("/")[1];
  
  // ✅ Get data from AccountContext instead of making a new API call
  const { accountData } = useContext(AccountContext);
  
  useEffect(() => {
    if (accountData) {
      const securePaths = ConvertPermissionArr(accountData?.permission);
      setAnsData(permissionTypeArr.map((permissionType) => Boolean(securePaths?.find((permission) => moduleToSearch == permission.name)?.permissionsArr.find((permission) => permission.type == permissionType))));
    }
  }, [accountData, moduleToSearch]);

  return ansData;
};

export default usePermissionCheck;
