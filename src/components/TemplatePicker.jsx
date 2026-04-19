import { useState } from "react";
import { CheckCircle2, X, Eye } from "lucide-react";
import { TEMPLATE_OPTIONS } from "../lib/templateOptions";
import InvoiceTemplate from "./InvoiceTemplate";
import { Button } from "@/components/ui/button";

// Realistic sample invoice for previews
const SAMPLE_INVOICE = {
  invoice_number: "2024-001",
  invoice_date: "2024-04-15",
  due_date: "2024-05-15",
  payment_terms: 30,
  customer_name: "Acme Sverige AB",
  customer_org_number: "556123-4567",
  customer_address: "Kungsgatan 12",
  customer_postal_code: "111 43",
  customer_city: "Stockholm",
  customer_email: "info@acme.se",
  our_reference: "Anna Johansson",
  your_reference: "Lars Eriksson",
  message: "Tack för ditt förtroende! Hör av dig om du har frågor.",
  terms: "Betalning inom 30 dagar. Vid sen betalning debiteras dröjsmålsränta.",
  lines: [
    { name: "Webbutveckling", description: "Design & implementation av ny webbplats", quantity: 40, unit: "timmar", unit_price: 1200, discount_percent: 0, vat_rate: 25, line_total: 48000 },
    { name: "Hosting & drift", description: "Månadsvis driftkostnad", quantity: 12, unit: "månader", unit_price: 500, discount_percent: 10, vat_rate: 25, line_total: 5400 },
    { name: "SEO-optimering", description: "Sökmotoroptimering och analys", quantity: 1, unit: "paket", unit_price: 8000, discount_percent: 0, vat_rate: 25, line_total: 8000 },
  ],
  subtotal: 61400,
  total_vat: 15350,
  total: 76750,
  vat_breakdown: [{ rate: 25, base: 61400, amount: 15350 }],
};

const SAMPLE_COMPANY = {
  company_name: "Din Byrå AB",
  org_number: "556789-0123",
  vat_number: "SE556789012301",
  address: "Storgatan 44",
  postal_code: "411 38",
  city: "Göteborg",
  country: "Sverige",
  email: "info@dinbyra.se",
  phone: "031-123 45 67",
  website: "www.dinbyra.se",
  bankgiro: "123-4567",
  swish: "0701234567",
};

// Gradient/color stripe for each template card
const CARD_STYLES = {
  modern:   { header: "linear-gradient(135deg,#2563eb,#1d4ed8)", text: "#fff", badge: "#93c5fd" },
  minimal:  { header: "#f9fafb", text: "#111", badge: "#111", border: true },
  premium:  { header: "#0f0f0f", text: "#b8860b", badge: "#b8860b" },
  classic:  { header: "#3d3d3d", text: "#fff", badge: "#ddd" },
  nordic:   { header: "linear-gradient(135deg,#4a7c59,#2d5a3d)", text: "#fff", badge: "#bbf7d0" },
  sunset:   { header: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)", text: "#fff", badge: "#fcd34d" },
  midnight: { header: "#0f172a", text: "#60a5fa", badge: "#1e3a8a" },
  rose:     { header: "linear-gradient(135deg,#be185d,#f43f5e)", text: "#fff", badge: "#fda4af" },
  ocean:    { header: "linear-gradient(160deg,#0f766e,#0891b2)", text: "#fff", badge: "#99f6e4" },
  royal:    { header: "linear-gradient(135deg,#4f46e5,#7c3aed)", text: "#fff", badge: "#c4b5fd" },
  bold:     { header: "#111", text: "#ea580c", badge: "#ea580c" },
  slate:    { header: "linear-gradient(135deg,#334155,#475569)", text: "#fff", badge: "#94a3b8" },
  forest:   { header: "linear-gradient(135deg,#15803d,#16a34a)", text: "#fff", badge: "#bbf7d0" },
  creative: { header: "linear-gradient(180deg,#1e1b4b,#4f46e5)", text: "#a5b4fc", badge: "#22d3ee" },
  amber:    { header: "linear-gradient(135deg,#f59e0b,#d97706)", text: "#fff", badge: "#fef3c7" },
  cyber:    { header: "#09090b", text: "#22d3ee", badge: "#22d3ee" },
};

function TemplateCard({ template, isSelected, onSelect, onPreview }) {
  const [hovered, setHovered] = useState(false);
  const s = CARD_STYLES[template.value] || CARD_STYLES.modern;

  return (
    <button
      type="button"
      onClick={() => onPreview(template.value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-2xl overflow-hidden text-left focus:outline-none transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary shadow-xl shadow-primary/25 scale-[1.03]"
          : "ring-1 ring-border hover:ring-primary/60 hover:shadow-xl hover:scale-[1.02]"
      }`}
    >
      {/* Colored header strip — represents invoice header */}
      <div
        style={{ background: s.header }}
        className="h-28 relative p-3 flex flex-col justify-between"
      >
        {/* Row 1: company name + invoice number */}
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1.5">
            <div style={{ background: s.text, opacity: 0.95 }} className="h-3 w-14 rounded-sm" />
            <div style={{ background: s.badge, opacity: 0.8 }} className="h-1.5 w-9 rounded-sm" />
          </div>
          <div className="space-y-1 items-end flex flex-col">
            <div style={{ background: s.text, opacity: 0.6 }} className="h-2 w-10 rounded-sm" />
            <div style={{ background: s.badge, opacity: 0.5 }} className="h-1.5 w-7 rounded-sm" />
          </div>
        </div>

        {/* Row 2: "invoice lines" */}
        <div className="space-y-1.5">
          <div style={{ background: s.text, opacity: 0.18 }} className="h-1.5 w-full rounded-sm" />
          <div style={{ background: s.text, opacity: 0.13 }} className="h-1.5 w-4/5 rounded-sm" />
          <div style={{ background: s.text, opacity: 0.18 }} className="h-1.5 w-11/12 rounded-sm" />
        </div>

        {/* Bottom: total amount pill */}
        <div className="flex justify-end">
          <div style={{ background: s.badge, opacity: 0.9 }} className="h-3 w-16 rounded-sm" />
        </div>

        {/* Hover overlay */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="flex items-center gap-1.5 bg-white text-gray-900 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg">
              <Eye className="h-3.5 w-3.5" /> Visa preview
            </div>
          </div>
        )}

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-md">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {/* White body — represents invoice body */}
      <div className="bg-white px-3 pt-2 pb-1.5 space-y-1">
        <div className="h-1 bg-gray-100 w-full rounded-sm" />
        <div className="h-1 bg-gray-100 w-3/4 rounded-sm" />
        <div className="h-1 bg-gray-50 w-5/6 rounded-sm" />
      </div>

      {/* Label footer */}
      <div className={`px-3 py-2 ${isSelected ? "bg-primary/5" : "bg-card"} border-t border-border`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-bold truncate">{template.label}</span>
          {isSelected
            ? <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
            : <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: typeof s.header === "string" && s.header.includes("gradient") ? s.badge : s.header }} />
          }
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{template.desc}</p>
      </div>
    </button>
  );
}

function PreviewModal({ templateValue, onClose, onSelect, currentSelected }) {
  const [activeTemplate, setActiveTemplate] = useState(templateValue);
  const activeOption = TEMPLATE_OPTIONS.find((t) => t.value === activeTemplate);
  const isSelected = currentSelected === activeTemplate;

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.8)" }}>
      {/* Left sidebar — template switcher */}
      <div className="w-48 shrink-0 bg-background border-r border-border overflow-y-auto flex flex-col">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mallar</p>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {TEMPLATE_OPTIONS.map((t) => {
            const s = CARD_STYLES[t.value] || CARD_STYLES.modern;
            const isActive = activeTemplate === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveTemplate(t.value)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-sm ${
                  isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{
                    background: typeof s.header === "string" && s.header.includes("gradient") ? s.badge : s.header,
                    border: t.value === "minimal" ? "1px solid #ccc" : undefined,
                  }}
                />
                <span className="truncate text-xs">{t.label}</span>
                {currentSelected === t.value && <CheckCircle2 className="h-3 w-3 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main preview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-background border-b border-border shrink-0">
          <div>
            <span className="font-bold">{activeOption?.label}</span>
            <span className="text-sm text-muted-foreground ml-2">— {activeOption?.desc}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isSelected ? (
              <Button size="sm" onClick={() => { onSelect(activeTemplate); onClose(); }} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Välj denna mall
              </Button>
            ) : (
              <span className="text-xs text-primary font-semibold flex items-center gap-1 mr-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Vald mall
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable preview */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-6">
          <div
            className="mx-auto bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{ width: 794 }} /* A4 width at 96dpi */
          >
            <InvoiceTemplate
              invoice={{ ...SAMPLE_INVOICE, template: activeTemplate, company_snapshot: SAMPLE_COMPANY }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePicker({ value, onChange }) {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const selectedOption = TEMPLATE_OPTIONS.find((t) => t.value === value);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Hover över en mall för att förhandsgranska den i full storlek. Klicka för att välja.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {TEMPLATE_OPTIONS.map((t) => (
          <TemplateCard
            key={t.value}
            template={t}
            isSelected={value === t.value}
            onSelect={onChange}
            onPreview={setPreviewTemplate}
          />
        ))}
      </div>

      {/* Current selection banner */}
      {selectedOption && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-accent rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-accent-foreground shrink-0" />
          <p className="text-sm text-accent-foreground">
            <strong>{selectedOption.label}</strong> är vald som standardmall
          </p>
          <button
            type="button"
            className="ml-auto text-xs underline text-accent-foreground/70 hover:text-accent-foreground"
            onClick={() => setPreviewTemplate(value)}
          >
            Förhandsgranska
          </button>
        </div>
      )}

      {/* Full preview modal */}
      {previewTemplate && (
        <PreviewModal
          templateValue={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={onChange}
          currentSelected={value}
        />
      )}
    </div>
  );
}