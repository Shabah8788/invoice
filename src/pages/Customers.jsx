import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Pencil, Trash2, Building2, User, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlan, FREE_CUSTOMER_LIMIT } from "../lib/usePlan";
import PlanLimitBanner from "../components/PlanLimitBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/PageHeader";
import CustomerDialog from "../components/CustomerDialog";
import { toast } from "sonner";

export default function Customers() {
  const { canCreateCustomer, customerCount } = usePlan();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const data = await base44.entities.Customer.list("-created_date", 200);
    setCustomers(data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Vill du ta bort denna kund?")) return;
    await base44.entities.Customer.delete(id);
    toast.success("Kund borttagen");
    loadCustomers();
  }

  function handleEdit(customer) {
    setEditCustomer(customer);
    setDialogOpen(true);
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.contact_person || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.org_number || "").includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  function handleNewCustomer() {
    if (!canCreateCustomer) {
      return;
    }
    setEditCustomer(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Kunder"
        description={`${customers.length} kunder`}
        actions={
          canCreateCustomer ? (
            <Button className="gap-2" onClick={handleNewCustomer}>
              <Plus className="h-4 w-4" />
              Ny kund
            </Button>
          ) : (
            <Button asChild className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
              <Link to="/pricing"><Crown className="h-4 w-4" /> Uppgradera</Link>
            </Button>
          )
        }
      />
      <PlanLimitBanner type="customer" current={customerCount} limit={FREE_CUSTOMER_LIMIT} />

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök kunder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Inga kunder hittades</p>
            <p className="text-sm mt-1">Skapa din första kund för att komma igång</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    {c.customer_type === "individual" ? (
                      <User className="h-5 w-5 text-accent-foreground" />
                    ) : (
                      <Building2 className="h-5 w-5 text-accent-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.company_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.contact_person && <span>{c.contact_person}</span>}
                      {c.org_number && <span>• {c.org_number}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditCustomer(null); }}
        customer={editCustomer}
        onSaved={loadCustomers}
      />
    </div>
  );
}