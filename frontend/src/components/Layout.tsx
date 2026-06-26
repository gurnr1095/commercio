import { NavLink, Outlet } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Orders" },
  { to: "/customers", label: "Customers" },
  { to: "/analytics", label: "Analytics" },
  { to: "/ai", label: "AI Insights" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-6 py-5 text-lg font-semibold tracking-tight">Commercio</div>
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {clerkKey && (
          <div className="px-5 py-4 border-t border-gray-100">
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
