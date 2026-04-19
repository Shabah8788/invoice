import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, Users, TrendingUp, AlertCircle, Plus, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { formatCurrency } from "../lib/invoiceCalculations";

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [inv, cust] = await Promise.all([
        base44.entities.Invoice.list("-created_date", 100),
        base44.entities.Customer.list("-created_date", 50),
      ]);
      setInvoices(inv);
      setCustomers(cust);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const unpaidInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");

  const recentInvoices = invoices.slice(0, 5);

  const statusLabels = { draft: "Utkast", sent: "Skickad", paid: "Betald", overdue: "Förfallen", cancelled: "Makulerad" };
  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Översikt av din fakturering"
        actions={
          <Link to="/invoices/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny faktura
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Totalt fakturerat" value={formatCurrency(totalInvoiced)} subtitle={`${invoices.length} fakturor`} />
        <StatCard icon={AlertCircle} label="Obetalda" value={formatCurrency(unpaidTotal)} subtitle={`${unpaidInvoices.length} fakturor`} />
        <StatCard icon={FileText} label="Betalda" value={formatCurrency(paidInvoices.reduce((s, i) => s + (i.total || 0), 0))} subtitle={`${paidInvoices.length} fakturor`} />
        <StatCard icon={Users} label="Kunder" value={customers.length} subtitle={`${overdueInvoices.length} förfallna`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Senaste fakturor</h2>
            <Link to="/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
              Visa alla <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Inga fakturor ännu</p>
              <Link to="/invoices/new" className="text-primary text-sm hover:underline mt-1 inline-block">
                Skapa din första faktura
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(inv.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inv.status] || ""}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold">Senaste kunder</h2>
            <Link to="/customers" className="text-sm text-primary hover:underline flex items-center gap-1">
              Visa alla <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {customers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Inga kunder ännu</p>
              <Link to="/customers" className="text-primary text-sm hover:underline mt-1 inline-block">
                Lägg till en kund
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {customers.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                      <Users className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.company_name}</p>
                      <p className="text-xs text-muted-foreground">{c.contact_person || c.email || ""}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(c.created_date).toLocaleDateString("sv-SE")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}