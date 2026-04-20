import { Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Sök fakturor, kunder..." className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="gap-2">
            <Link to="/invoices/new"><Plus className="h-4 w-4" /> Ny faktura</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
