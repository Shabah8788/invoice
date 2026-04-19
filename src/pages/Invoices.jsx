import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, Plus, Search, Filter, MoreHorizontal, Copy, Trash2, Mail, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import PageHeader from "../components/PageHeader";
import { formatCurrency } from "../lib/invoiceCalculations";
import { toast } from "sonner";

const statusLabels = { draft: "Utkast", sent: "Skickad", paid: "Betald", overdue: "Förfallen", cancelled: "Makulerad" };
const statusColors = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    const data = await base44.entities.Invoice.list("-created_date", 500);
    setInvoices(data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Vill du ta bort denna faktura?")) return;
    await base44.entities.Invoice.delete(id);
    toast.success("Faktura borttagen");
    loadInvoices();
  }

  async function handleStatusChange(id, status) {
    await base44.entities.Invoice.update(id, { status });
    toast.success(`Faktura markerad som ${statusLabels[status]?.toLowerCase()}`);
    loadInvoices();
  }

  async function handleDuplicate(invoice) {
    const profiles = await base44.entities.CompanyProfile.list("-created_date", 1);
    const profile = profiles[0];
    const nextNum = profile?.next_invoice_number || 1001;

    const newInvoice = {
      ...invoice,
      invoice_number: nextNum.toString(),
      status: "draft",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + (invoice.payment_terms || 30) * 86400000).toISOString().split("T")[0],
    };
    delete newInvoice.id;
    delete newInvoice.created_date;
    delete newInvoice.updated_date;
    delete newInvoice.created_by;

    await base44.entities.Invoice.create(newInvoice);
    if (profile) {
      await base44.entities.CompanyProfile.update(profile.id, { next_invoice_number: nextNum + 1 });
    }
    toast.success("Faktura duplicerad");
    loadInvoices();
  }

  async function handleSendEmail(invoice) {
    if (!invoice.customer_email) {
      toast.error("Kunden har ingen e-postadress");
      return;
    }
    await base44.integrations.Core.SendEmail({
      to: invoice.customer_email,
      subject: `Faktura ${invoice.invoice_number}`,
      body: `<h2>Faktura ${invoice.invoice_number}</h2>
<p>Hej,</p>
<p>Bifogat finner du faktura ${invoice.invoice_number} på ${formatCurrency(invoice.total)}.</p>
<p>Förfallodatum: ${invoice.due_date}</p>
<p>Vänliga hälsningar,<br/>${invoice.company_snapshot?.company_name || ""}</p>`,
    });
    await base44.entities.Invoice.update(invoice.id, { status: "sent" });
    toast.success("Faktura skickad via e-post");
    loadInvoices();
  }

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch = (inv.invoice_number || "").toLowerCase().includes(q) ||
      (inv.customer_name || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fakturor"
        description={`${invoices.length} fakturor`}
        actions={
          <Link to="/invoices/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny faktura
            </Button>
          </Link>
        }
      />

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök fakturor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
              <SelectItem value="sent">Skickade</SelectItem>
              <SelectItem value="paid">Betalda</SelectItem>
              <SelectItem value="overdue">Förfallna</SelectItem>
              <SelectItem value="cancelled">Makulerade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Inga fakturor hittades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Nummer</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Kund</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Datum</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Förfaller</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Belopp</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.invoice_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[inv.status] || ""}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/invoices/${inv.id}`}>Visa / Redigera</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(inv)}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicera
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(inv)}>
                            <Mail className="h-4 w-4 mr-2" /> Skicka via e-post
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "paid")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Markera betald
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "cancelled")}>
                            <XCircle className="h-4 w-4 mr-2" /> Makulera
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}