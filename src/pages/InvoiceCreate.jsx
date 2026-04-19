import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Eye, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import InvoiceForm from "../components/InvoiceForm";
import InvoicePreviewDialog from "../components/InvoicePreviewDialog";
import { calculateInvoiceTotals } from "../lib/invoiceCalculations";
import { usePlan, FREE_INVOICE_LIMIT } from "../lib/usePlan";
import { toast } from "sonner";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { isPro, invoiceCount, canCreateInvoice } = usePlan();
  const [profile, setProfile] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    invoice_number: "",
    status: "draft",
    customer_id: "",
    customer_name: "",
    customer_org_number: "",
    customer_vat_number: "",
    customer_address: "",
    customer_postal_code: "",
    customer_city: "",
    customer_country: "",
    customer_email: "",
    customer_reference: "",
    invoice_date: today,
    due_date: "",
    payment_terms: 30,
    our_reference: "",
    your_reference: "",
    message: "",
    lines: [{ name: "", description: "", quantity: 1, unit: "st", unit_price: 0, discount_percent: 0, vat_rate: 25, line_total: 0 }],
    template: "modern",
    terms: "",
  });

  useEffect(() => {
    async function load() {
      const [profiles, custs, prods] = await Promise.all([
        base44.entities.CompanyProfile.list("-created_date", 1),
        base44.entities.Customer.list("-created_date", 200),
        base44.entities.Product.list("-created_date", 200),
      ]);
      const p = profiles[0];
      setProfile(p);
      setCustomers(custs);
      setProducts(prods);

      if (p) {
        const paymentTerms = p.default_payment_terms || 30;
        const dueDate = new Date(Date.now() + paymentTerms * 86400000).toISOString().split("T")[0];
        setForm((f) => ({
          ...f,
          invoice_number: (p.next_invoice_number || 1001).toString(),
          payment_terms: paymentTerms,
          due_date: dueDate,
          template: p.default_template || "modern",
          terms: p.default_terms || "",
          lines: f.lines.map((l) => ({ ...l, vat_rate: p.default_vat_rate || 25 })),
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.customer_id) e.customer_id = "Välj en kund";
    if (!form.invoice_number) e.invoice_number = "Fakturanummer krävs";
    if (!form.invoice_date) e.invoice_date = "Fakturadatum krävs";
    if (!form.due_date) e.due_date = "Förfallodatum krävs";
    if (!form.lines.some((l) => l.name)) e.lines = "Minst en rad krävs";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) { toast.error("Fyll i alla obligatoriska fält"); return; }

    setSaving(true);
    const totals = calculateInvoiceTotals(form.lines);
    const invoiceData = {
      ...form,
      ...totals,
      lines: form.lines.filter((l) => l.name),
      company_snapshot: profile ? {
        company_name: profile.company_name,
        org_number: profile.org_number,
        vat_number: profile.vat_number,
        address: profile.address,
        postal_code: profile.postal_code,
        city: profile.city,
        country: profile.country,
        email: profile.email,
        phone: profile.phone,
        website: profile.website,
        logo_url: profile.logo_url,
        bankgiro: profile.bankgiro,
        plusgiro: profile.plusgiro,
        swish: profile.swish,
        iban: profile.iban,
        bic: profile.bic,
        bank_name: profile.bank_name,
      } : {},
    };

    await base44.entities.Invoice.create(invoiceData);

    if (profile) {
      await base44.entities.CompanyProfile.update(profile.id, {
        next_invoice_number: (Number(form.invoice_number) || 1000) + 1,
      });
    }

    toast.success("Faktura skapad!");
    setSaving(false);
    navigate("/invoices");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!canCreateInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
        <Crown className="h-14 w-14 text-amber-400" />
        <h2 className="text-2xl font-bold">Fakturgräns nådd</h2>
        <p className="text-muted-foreground max-w-sm">
          Du har skapat {invoiceCount} av {FREE_INVOICE_LIMIT} fakturor på gratis-planen.
          Uppgradera till Pro för obegränsat antal fakturor.
        </p>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
          <Link to="/pricing"><Crown className="h-4 w-4" /> Uppgradera till Pro – 80 kr/mån</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ny faktura"
        description={`Fakturanummer: ${form.invoice_number}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" /> Förhandsgranska
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Spara
            </Button>
          </div>
        }
      />

      <InvoiceForm
        form={form}
        setForm={setForm}
        customers={customers}
        products={products}
        profile={profile}
        errors={errors}
      />

      <InvoicePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoice={{ ...form, ...calculateInvoiceTotals(form.lines), company_snapshot: profile }}
      />
    </div>
  );
}