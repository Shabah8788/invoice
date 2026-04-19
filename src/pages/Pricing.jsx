import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => { setUser(u); setLoading(false); });
  }, []);

  async function handleUpgrade() {
    // TODO: Replace with your Stripe Payment Link when on Builder+ plan
    // e.g. window.location.href = "https://buy.stripe.com/YOUR_LINK?prefilled_email=" + user?.email;
    toast.info("Stripe-betalning konfigureras snart. Kontakta admin för att uppgradera.");
  }

  async function handleManageBilling() {
    toast.info("Fakturahantering via Stripe Customer Portal konfigureras snart.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isPro = user?.subscription === "pro";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Välj din plan</h1>
        <p className="text-muted-foreground">Enkel prissättning utan dolda avgifter</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={`bg-card rounded-2xl border-2 p-6 flex flex-col ${!isPro ? "border-primary" : "border-border"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-bold text-lg">Gratis</h2>
            {!isPro && <span className="ml-auto text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">Aktiv plan</span>}
          </div>
          <div className="mt-3 mb-6">
            <span className="text-4xl font-extrabold">0 kr</span>
            <span className="text-muted-foreground">/mån</span>
          </div>
          <ul className="space-y-2.5 mb-8 flex-1 text-sm">
            <Feature text="Upp till 5 fakturor" />
            <Feature text="Upp till 10 kunder" />
            <Feature text="Alla mallar" />
            <Feature text="PDF-export" />
          </ul>
          <Button variant="outline" disabled className="w-full">Nuvarande plan</Button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-card rounded-2xl border-2 p-6 flex flex-col relative overflow-hidden ${isPro ? "border-primary" : "border-border"}`}>
          <div className="absolute top-4 right-4">
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Populär</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-lg">Pro</h2>
            {isPro && <span className="ml-auto text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">Aktiv plan</span>}
          </div>
          <div className="mt-3 mb-6">
            <span className="text-4xl font-extrabold">80 kr</span>
            <span className="text-muted-foreground">/mån</span>
          </div>
          <ul className="space-y-2.5 mb-8 flex-1 text-sm">
            <Feature text="Obegränsat antal fakturor" />
            <Feature text="Obegränsat antal kunder" />
            <Feature text="Alla mallar" />
            <Feature text="PDF-export" />
            <Feature text="Prioriterad support" />
          </ul>
          {isPro ? (
            <Button variant="outline" className="w-full" onClick={handleManageBilling}>
              Hantera prenumeration
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleUpgrade}>
              <Crown className="h-4 w-4" /> Uppgradera till Pro
            </Button>
          )}
        </div>
      </div>

      {!isPro && (
        <p className="text-center text-sm text-muted-foreground mt-6">
          Du har använt{" "}
          <span className="font-semibold text-foreground">gratis-planen</span>.
          Uppgradera för att ta bort alla begränsningar.
        </p>
      )}
    </div>
  );
}

function Feature({ text }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span>{text}</span>
    </li>
  );
}