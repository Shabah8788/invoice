import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, Eye, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import InvoiceForm from "../components/InvoiceForm";
import InvoicePreviewDialog from "../components/InvoicePreviewDialog";
import { calculateInvoiceTotals } from "../lib/invoiceCalculations";
import { normalizeInvoiceForRender, sanitizeText } from "../lib/invoiceValidation";
import { usePlan, FREE_INVOICE_LIMIT } from "../lib/usePlan";
import { toast } from "sonner";

function buildCompanySnapshot(profile) {
  return {
    company_name: sanitizeText(profile?.company_name),
    org_number: sanitizeText(profile?.org_number),
    vat_number: sanitizeText(profile?.vat_number),
    address: sanitizeText(profile?.address),
    postal_code: sanitizeText(profile?.postal_code),
    city: sanitizeText(profile?.city),
    country: sanitizeText(profile?.country),
    email: sanitizeText(profile?.email),
    phone: sanitizeText(profile?.phone),
    website: sanitizeText(profile?.website),
    logo_url: sanitizeText(profile?.logo_url),
    bankgiro: sanitizeText(profile?.bankgiro),
    plusgiro: sanitizeText(profile?.plusgiro),
    swish: sanitizeText(profile?.swish),
    iban: sanitizeText(profile?.iban),
    bic: sanitizeText(profile?.bic),
    bank_name: sanitizeText(profile?.bank_name),
  };
}

function normalizeInvoiceLines(lines = []) {
  return lines
    .map((line) => {
      const quantity = Number(line.quantity || 0);
      const unitPrice = Number(line.unit_price || 0);
      const discountPercent = Number(line.discount_percent || 0);
      const vatRate = Number(line.vat_rate || 0);

      return {
        ...line,
        name: sanitizeText(line.name),
        description: sanitizeText(line.description),
        unit: sanitizeText(line.unit || "st"),
        quantity,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        vat_rate: vatRate,
        line_total: Number(line.line_total || 0),
      };
    })
    .filter((line) => line.name);
}

function buildInvoicePayload(form, profile) {
  const lines = normalizeInvoiceLines(form.lines);
  const totals = calculateInvoiceTotals(lines);

  return normalizeInvoiceForRender({
    ...form,
    invoice_number: sanitizeText(form.invoice_number),
    customer_name: sanitizeText(form.customer_name),
    customer_org_number: sanitizeText(form.customer_org_number),
    customer_vat_number: sanitizeText(form.customer_vat_number),
    customer_address: sanitizeText(form.customer_address),
    customer_postal_code: sanitizeText(form.customer_postal_code),
    customer_city: sanitizeText(form.customer_city),
    customer_country: sanitizeText(form.customer_country),
    customer_email: sanitizeText(form.customer_email),
    customer_reference: sanitizeText(form.customer_reference),
    our_reference: sanitizeText(form.our_reference),
    your_reference: sanitizeText(form.your_reference),
    message: sanitizeText(form.message),
    terms: sanitizeText(form.terms),
    payment_terms: Number(form.payment_terms || 0),
    lines,
    ...totals,
    company_snapshot: buildCompanySnapshot(profile),
  });
}

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
    const validLines = normalizeInvoiceLines(form.lines);
    const missingCompanyFields = [
      ["company_name", "Företagsnamn"],
      ["org_number", "Organisationsnummer"],
      ["address", "Adress"],
      ["postal_code", "Postnummer"],
      ["city", "Ort"],
      ["email", "E-post"],
    ].filter(([key]) => !sanitizeText(profile?.[key])).map(([, label]) => label);

    if (!profile) e.company_profile = "Företagsprofil saknas";
    if (missingCompanyFields.length) {
      e.company_profile = `Komplettera företagsprofilen: ${missingCompanyFields.join(", ")}`;
    }

    if (!form.customer_id) e.customer_id = "Välj en kund";
    if (!sanitizeText(form.customer_name)) e.customer_name = "Kundnamn krävs";
    if (!sanitizeText(form.customer_address)) e.customer_address = "Kundadress krävs";
    if (!sanitizeText(form.customer_postal_code)) e.customer_postal_code = "Postnummer krävs";
    if (!sanitizeText(form.customer_city)) e.customer_city = "Ort krävs";
    if (!sanitizeText(form.invoice_number)) e.invoice_number = "Fakturanummer krävs";
    if (!form.invoice_date) e.invoice_date = "Fakturadatum krävs";
    if (!form.due_date) e.due_date = "Förfallodatum krävs";
    if (!validLines.length) e.lines = "Minst en komplett rad krävs";

    const invalidLineIndex = validLines.findIndex(
      (line) => !line.unit || line.quantity <= 0 || line.unit_price < 0 || line.vat_rate < 0 || line.discount_percent < 0 || line.discount_percent > 100
    );

    if (invalidLineIndex !== -1) {
      e.lines = `Kontrollera fakturarad ${invalidLineIndex + 1}: namn, enhet, antal, pris, rabatt och moms måste vara giltiga`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      toast.error(errors.company_profile || "Fyll i alla obligatoriska fakturafält och kontrollera företagsprofilen");
      return;
    }

    setSaving(true);
    try {
      const invoiceData = buildInvoicePayload(form, profile);

      await base44.entities.Invoice.create(invoiceData);

      if (profile) {
        await base44.entities.CompanyProfile.update(profile.id, {
          next_invoice_number: (Number(form.invoice_number) || 1000) + 1,
        });
      }

      toast.success("Faktura skapad!");
      navigate("/invoices");
    } finally {
      setSaving(false);
    }
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

  const previewInvoice = buildInvoicePayload(form, profile);

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
        invoice={previewInvoice}
      />
    </div>
  );
}