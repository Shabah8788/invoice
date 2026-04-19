import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Building2,
  Plus,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/invoices", label: "Fakturor", icon: FileText },
  { path: "/invoices/new", label: "Ny faktura", icon: Plus },
  { path: "/customers", label: "Kunder", icon: Users },
  { path: "/products", label: "Produkter", icon: Package },
  { path: "/settings", label: "Företagsprofil", icon: Building2 },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Faktura</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-muted">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="bg-card border-b border-border p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full"
          >
            <LogOut className="h-4 w-4" />
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}