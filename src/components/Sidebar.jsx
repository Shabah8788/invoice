import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Building2,
  Plus,
  LogOut,
  Crown,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/invoices", label: "Fakturor", icon: FileText },
  { path: "/invoices/new", label: "Ny faktura", icon: Plus },
  { path: "/customers", label: "Kunder", icon: Users },
  { path: "/products", label: "Produkter", icon: Package },
  { path: "/settings", label: "Företagsprofil", icon: Building2 },
  { path: "/pricing", label: "Prenumeration", icon: Crown },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">Faktura</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Faktureringssystem</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Logga ut
        </button>
      </div>
    </aside>
  );
}