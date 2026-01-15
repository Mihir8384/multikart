"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  RiDashboardLine,
  RiStoreLine,
  RiShoppingBagLine,
  RiWalletLine,
  RiBarChartLine,
  RiCustomerServiceLine,
  RiPercentLine,
  RiArchiveLine,
  RiUserSettingsLine,
  RiUserLine, // <-- 1. ICON IS IMPORTED
} from "react-icons/ri";

import SidebarDropdown from "./SidebarDropdown";

const VendorSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/vendor/dashboard",
      icon: <RiDashboardLine />,
    },
    { title: "Profile", path: "/vendor/profile", icon: <RiUserSettingsLine /> },
    { title: "Warehouses", path: "/vendor/warehouses", icon: <RiStoreLine /> },
    {
      title: "Products",
      path: "/vendor/products",
      icon: <RiShoppingBagLine />,
    },
    { title: "Discounts", path: "/vendor/discounts", icon: <RiPercentLine /> },
    {
      title: "Inventory",
      path: "/vendor/inventory",
      icon: <RiArchiveLine />, // Or any inventory-related icon
      type: "link",
    },
    { title: "Orders", path: "/vendor/orders", icon: <RiShoppingBagLine /> },
    {
      title: "Payout",
      icon: <RiWalletLine />,
      type: "sub",
      children: [
        {
          title: "Payout Account",
          path: "/vendor/payout",
          icon: <RiWalletLine />,
        },
        {
          title: "Payout Request",
          path: "/vendor/payout/request",
          icon: <RiWalletLine />,
        },
        {
          title: "Payout History",
          path: "/vendor/payout/history",
          icon: <RiWalletLine />,
        },
      ],
    },
    { title: "Reports", path: "/vendor/reports", icon: <RiBarChartLine /> },
    {
      title: "Support",
      path: "/vendor/support",
      icon: <RiCustomerServiceLine />,
    },
  ];

  // --- 2. DEFINE THE ACCOUNT LINK ---
  const accountLink = {
    title: "My Account",
    path: "/account", // Link back to the personal profile
    icon: <RiUserLine />,
  };
  // ---------------------------------

  return (
    <div className="sidebar-wrapper">
      <nav className="sidebar-main">
        <div id="sidebar-menu">
          <ul className="sidebar-links">
            {menuItems.map((item, idx) => {
              const isActiveParent =
                item.children &&
                item.children.some((child) => pathname === child.path);
              if (item.children) {
                return (
                  <SidebarDropdown
                    key={item.title}
                    item={item}
                    isActiveParent={isActiveParent}
                    idx={idx}
                  />
                );
              } else {
                return (
                  <li className="sidebar-list" key={item.path}>
                    <Link
                      href={item.path}
                      className={`sidebar-link sidebar-title link-nav ${
                        pathname === item.path ? "active" : ""
                      }`}
                    >
                      <div className="svg-icon">{item.icon}</div>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              }
            })}

            {/* --- 3. ADD SEPARATOR AND LINK --- */}
            <li className="sidebar-list">
              <hr className="mt-3 mb-2" />
            </li>
            <li className="sidebar-list">
              <Link
                href={accountLink.path}
                className={`sidebar-link sidebar-title link-nav ${
                  pathname === accountLink.path ? "active" : ""
                }`}
              >
                <div className="svg-icon">{accountLink.icon}</div>
                <span>{accountLink.title}</span>
              </Link>
            </li>
            {/* --- END OF ADDITION --- */}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default VendorSidebar;
