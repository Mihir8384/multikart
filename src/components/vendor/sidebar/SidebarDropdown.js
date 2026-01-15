import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";

function SidebarDropdown({ item, isActiveParent, idx }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(isActiveParent);
  
  React.useEffect(() => {
    if (isActiveParent) setOpen(true);
  }, [isActiveParent]);

  return (
    <li className="sidebar-list">
      <a
        className={`sidebar-link sidebar-title ${
          isActiveParent || open ? "active" : ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="svg-icon">{item.icon}</div>
        <span>{item.title}</span>
        {open || isActiveParent ? (
          <RiSubtractLine className="icon-arrow" />
        ) : (
          <RiAddLine className="icon-arrow" />
        )}
      </a>
      <ul
        className={`sidebar-submenu ${
          open || isActiveParent ? "d-block" : "d-none"
        }`}
      >
        {item.children.map((child) => (
          <li key={child.path}>
            <Link
              href={child.path}
              className={pathname === child.path ? "active" : ""}
            >
              {child.icon && <div className="svg-icon">{child.icon}</div>}
              <span>{child.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default SidebarDropdown;
