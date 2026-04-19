import { Link } from "react-router-dom";
import { Crown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlanLimitBanner({ type, current, limit }) {
  const label = type === "invoice" ? "fakturor" : "kunder";
  const isAtLimit = current >= limit;

  if (!isAtLimit) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-amber-700 flex-1">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Du har nått gränsen för {label} på gratis-planen ({limit} st).
          Uppgradera till Pro för obegränsat antal.
        </p>
      </div>
      <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 gap-1.5">
        <Link to="/pricing">
          <Crown className="h-3.5 w-3.5" /> Uppgradera
        </Link>
      </Button>
    </div>
  );
}