import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Eye, Download, Mail, Pencil, Trash2, CheckCircle, XCircle, Copy, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/PageHeader";
import InvoicePreviewDialog from "../components/InvoicePreviewDialog";
import { formatCurrency } from "../lib/invoiceCalculations";
import { toast } from "sonner";

const statusLabels = { draft: "Utkast", sent: "Skickad", paid: "Betald", overdue: "Förfallen", cancelled: "Makulerad" };
const statusColors = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function loadInvoice() {
    const invoices = await base44.entities.Invoice.list("-created_date", 500);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setInvoice(inv);
    }
    setLoading(false);
  }

  async function handleStatusChange(status) {
    await base44.entities.Invoice.update(id, { status });
    toast.success(`Status ändrad till ${statusLabels[status]?.toLowerCase()}`);
    loadInvoice();
  }

  async function handleDelete() {
    if (!confirm("Vill du ta bort denna faktura?")) return;
    await base44.entities.Invoice.delete(id);
    toast.success("Faktura borttagen");
    navigate("/invoices");
  }

  async function handleSendEmail() {
    if (!invoice.customer_email) {
      toast.error("Kunden har ingen e-postadress");
      return;
    }
    await base44.integrations.Core.SendEmail({
      to: invoice.customer_email,
      subject: `Faktura ${invoice.invoice_number}`,
      body: `<h2>Faktura ${invoice.invoice_number}</h2><p>Hej,</p><p>Bifogat finner du faktura ${invoice.invoice_number} på ${formatCurrency(invoice.total)}.</p><p>Förfallodatum: ${invoice.due_date}</p><p>Vänliga hälsningar,<br/>${invoice.company_snapshot?.company_name || ""}</p>`,
    });
    await base44.entities.Invoice.update(id, { status: "sent" });
    toast.success("Faktura skickad via e-post");
    loadInvoice();
  }

  async function handleDuplicate() {
    const profiles = await base44.entities.CompanyProfile.list("-created_date", 1);
    const profile = profiles[0];
    const nextNum = profile?.next_invoice_number || 1001;
    const newInvoice = { ...invoice, invoice_number: nextNum.toString(), status: "draft",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + (invoice.payment_terms || 30) * 86400000).toISOString().split("T")[0],
    };
    delete newInvoice.id; delete newInvoice.created_date; delete newInvoice.updated_date; delete newInvoice.created_by;
    await base44.entities.Invoice.create(newInvoice);
    if (profile) await base44.entities.CompanyProfile.update(profile.id, { next_invoice_number: nextNum + 1 });
    toast.success("Faktura duplicerad");
    navigate("/invoices");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Fakturan hittades inte</p>
        <Link to="/invoices" className="text-primary hover:underline mt-2 inline-block">Tillbaka till fakturor</Link>
      </div>
    );
  }

  const lines = (invoice.lines || []).filter((l) => l.name);

  return (
    <div>
      <div className="mb-6">
        <Link to="/invoices" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Tillbaka till fakturor
        </Link>
      </div>

      <PageHeader
        title={`Faktura ${invoice.invoice_number}`}
        description={invoice.customer_name}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" /> Visa
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleSendEmail}>
              <Mail className="h-4 w-4" /> Skicka
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" /> Duplicera
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Ta bort
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Lines */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Fakturarader</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Beskrivning</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Antal</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Pris</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Moms</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{line.name}</p>
                        {line.description && <p className="text-xs text-muted-foreground">{line.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">{line.quantity} {line.unit}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(line.unit_price)}</td>
                      <td className="px-4 py-3 text-right">{line.vat_rate}%</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(line.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-5">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delsumma</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {(invoice.vat_breakdown || []).map((v) => (
                    <div key={v.rate} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moms {v.rate}%</span>
                      <span>{formatCurrency(v.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Totalt</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {invoice.message && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-2">Meddelande</h3>
              <p className="text-sm text-muted-foreground">{invoice.message}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold">Status</h3>
            <div className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}>
              {statusLabels[invoice.status]}
            </div>
            <Select value={invoice.status} onValueChange={handleStatusChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Utkast</SelectItem>
                <SelectItem value="sent">Skickad</SelectItem>
                <SelectItem value="paid">Betald</SelectItem>
                <SelectItem value="overdue">Förfallen</SelectItem>
                <SelectItem value="cancelled">Makulerad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3 text-sm">
            <h3 className="font-semibold">Detaljer</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Fakturadatum</span><span>{invoice.invoice_date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Förfallodatum</span><span>{invoice.due_date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Betalningsvillkor</span><span>{invoice.payment_terms} dagar</span></div>
            {invoice.our_reference && <div className="flex justify-between"><span className="text-muted-foreground">Vår ref</span><span>{invoice.our_reference}</span></div>}
            {invoice.your_reference && <div className="flex justify-between"><span className="text-muted-foreground">Er ref</span><span>{invoice.your_reference}</span></div>}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-2 text-sm">
            <h3 className="font-semibold">Kund</h3>
            <p className="font-medium">{invoice.customer_name}</p>
            {invoice.customer_org_number && <p className="text-muted-foreground">Org.nr: {invoice.customer_org_number}</p>}
            {invoice.customer_address && <p className="text-muted-foreground">{invoice.customer_address}</p>}
            {invoice.customer_postal_code && <p className="text-muted-foreground">{invoice.customer_postal_code} {invoice.customer_city}</p>}
            {invoice.customer_email && <p className="text-muted-foreground">{invoice.customer_email}</p>}
          </div>
        </div>
      </div>

      <InvoicePreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} invoice={invoice} />
    </div>
  );
}