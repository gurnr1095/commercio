import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Sparkles,
  Settings,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/ai", label: "AI Insights", icon: Sparkles },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 border-r border-gray-200 bg-white flex flex-col h-full transition-all duration-200 overflow-hidden",
          collapsed ? "w-[60px]" : "w-56"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center py-5 border-b border-gray-100 shrink-0",
            collapsed ? "justify-center" : "px-5"
          )}
        >
          {collapsed ? (
            <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-bold select-none">
              C
            </span>
          ) : (
            <span className="text-lg font-semibold tracking-tight">Commercio</span>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5 px-2 flex-1 pt-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  collapsed
                    ? cn(
                        "justify-center p-2.5",
                        isActive
                          ? "bg-violet-100 text-violet-700"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      )
                    : cn(
                        "gap-3 py-2",
                        isActive
                          ? "pl-2.5 pr-3 border-l-2 border-violet-600 bg-violet-50 text-violet-700"
                          : "px-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )
                )
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-gray-100 px-2 py-3 flex flex-col gap-0.5">
          <NavLink
            to="/settings"
            title={collapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                collapsed
                  ? cn(
                      "justify-center p-2.5",
                      isActive
                        ? "bg-violet-100 text-violet-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    )
                  : cn(
                      "gap-3 py-2",
                      isActive
                        ? "pl-2.5 pr-3 border-l-2 border-violet-600 bg-violet-50 text-violet-700"
                        : "px-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )
              )
            }
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && "Settings"}
          </NavLink>

          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex items-center rounded-md text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
            )}
          >
            <PanelLeft
              size={18}
              className={cn("shrink-0 transition-transform duration-200", collapsed && "rotate-180")}
            />
            {!collapsed && "Collapse"}
          </button>

          {clerkKey && (
            <div className={cn("pt-1", collapsed ? "flex justify-center" : "px-1")}>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
