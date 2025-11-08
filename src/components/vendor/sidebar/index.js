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
  RiUserSettingsLine,
} from "react-icons/ri";

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
    { title: "Orders", path: "/vendor/orders", icon: <RiShoppingBagLine /> },
    { title: "Payout", path: "/vendor/payout", icon: <RiWalletLine /> },
    { title: "Reports", path: "/vendor/reports", icon: <RiBarChartLine /> },
    {
      title: "Support",
      path: "/vendor/support",
      icon: <RiCustomerServiceLine />,
    },
  ];

  return (
    <div className="sidebar-wrapper">
      <nav className="sidebar-main">
        <div id="sidebar-menu">
          <ul className="sidebar-links">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={pathname === item.path ? "active" : ""}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default VendorSidebar;
