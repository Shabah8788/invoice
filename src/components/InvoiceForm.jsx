import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User, FileText, AlignLeft, Info } from "lucide-react";
import { calculateLineTotal, formatCurrency, calculateInvoiceTotals } from "../lib/invoiceCalculations";
import { TEMPLATE_OPTIONS } from "../lib/templateOptions";
import { cn } from "@/lib/utils";

const units = ["st", "timmar", "dagar", "km", "kg", "liter", "meter", "paket"];
const vatRates = [25, 12, 6, 0];

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-muted/40">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><Info className="h-3 w-3" />{message}</p>;
}

function FormField({ label, error, required, children, className }) {
  return (
    <div className={className}>
      <Label className={cn("mb-1.5 block text-xs font-medium", error && "text-destructive")}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export default function InvoiceForm({ form, setForm, customers, products, profile, errors = {} }) {
  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectCustomer(customerId) {
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    setForm((f) => ({
      ...f,
      customer_id: c.id,
      customer_name: c.company_name,
      customer_org_number: c.org_number || "",
      customer_vat_number: c.vat_number || "",
      customer_address: c.address || "",
      customer_postal_code: c.postal_code || "",
      customer_city: c.city || "",
      customer_country: c.country || "",
      customer_email: c.email || "",
      customer_reference: c.reference || "",
    }));
  }

  function updateLine(idx, field, value) {
    setForm((f) => {
      const lines = [...f.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      lines[idx].line_total = calculateLineTotal(lines[idx]);
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        { name: "", description: "", quantity: 1, unit: "st", unit_price: 0, discount_percent: 0, vat_rate: profile?.default_vat_rate || 25, line_total: 0 },
      ],
    }));
  }

  function removeLine(idx) {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  }

  function addProductToLine(idx, productId) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setForm((f) => {
      const lines = [...f.lines];
      lines[idx] = {
        ...lines[idx],
        product_id: p.id,
        name: p.name,
        description: p.description || "",
        unit_price: p.price,
        unit: p.unit || "st",
        vat_rate: p.vat_rate || 25,
      };
      lines[idx].line_total = calculateLineTotal(lines[idx]);
      return { ...f, lines };
    });
  }

  function updatePaymentTerms(days) {
    const dueDate = new Date(new Date(form.invoice_date || Date.now()).getTime() + days * 86400000)
      .toISOString()
      .split("T")[0];
    setForm((f) => ({ ...f, payment_terms: days, due_date: dueDate }));
  }

  const totals = calculateInvoiceTotals(form.lines);
  const templateLabel = TEMPLATE_OPTIONS.find((t) => t.value === form.template)?.label || form.template;
  const hasLineError = errors.lines;

  return (
    <div className="space-y-5">

      {/* ── Row 1: Kund + Fakturadetaljer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Kund */}
        <SectionCard icon={User} title="Kund">
          <div className="space-y-4">
            <FormField label="Välj kund" required error={errors.customer_id}>
              <Select
                value={form.customer_id}
                onValueChange={selectCustomer}
              >
                <SelectTrigger className={cn(errors.customer_id && "border-destructive ring-1 ring-destructive bg-destructive/5")}>
                  <SelectValue placeholder="Sök och välj kund…" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">Inga kunder ännu</div>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FormField>

            {form.customer_name && (
              <div className="rounded-xl bg-accent/60 border border-accent p-4 space-y-0.5 text-sm">
                <p className="font-semibold text-accent-foreground">{form.customer_name}</p>
                {form.customer_org_number && (
                  <p className="text-xs text-muted-foreground">Org.nr: {form.customer_org_number}</p>
                )}
                {form.customer_address && (
                  <p className="text-xs text-muted-foreground">{form.customer_address}</p>
                )}
                {(form.customer_postal_code || form.customer_city) && (
                  <p className="text-xs text-muted-foreground">
                    {form.customer_postal_code} {form.customer_city}
                  </p>
                )}
                {form.customer_email && (
                  <p className="text-xs text-muted-foreground">{form.customer_email}</p>
                )}
              </div>
            )}

            <FormField label="Er referens">
              <Input
                value={form.your_reference}
                onChange={(e) => update("your_reference", e.target.value)}
                placeholder="Kontaktpersonens namn eller kod"
              />
            </FormField>
          </div>
        </SectionCard>

        {/* Fakturadetaljer */}
        <SectionCard icon={FileText} title="Fakturadetaljer">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fakturanummer" required error={errors.invoice_number}>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => update("invoice_number", e.target.value)}
                  className={cn(errors.invoice_number && "border-destructive ring-1 ring-destructive bg-destructive/5")}
                  placeholder="1001"
                />
              </FormField>

              <FormField label="Betalningsvillkor" required>
                <Select
                  value={form.payment_terms?.toString()}
                  onValueChange={(v) => updatePaymentTerms(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 30, 45, 60, 90].map((d) => (
                      <SelectItem key={d} value={d.toString()}>{d} dagar</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Fakturadatum" required error={errors.invoice_date}>
                <Input
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => update("invoice_date", e.target.value)}
                  className={cn(errors.invoice_date && "border-destructive ring-1 ring-destructive bg-destructive/5")}
                />
              </FormField>

              <FormField label="Förfallodatum" required error={errors.due_date}>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => update("due_date", e.target.value)}
                  className={cn(errors.due_date && "border-destructive ring-1 ring-destructive bg-destructive/5")}
                />
              </FormField>
            </div>

            <FormField label="Vår referens">
              <Input
                value={form.our_reference}
                onChange={(e) => update("our_reference", e.target.value)}
                placeholder="Ditt namn eller avdelning"
              />
            </FormField>

            {/* Mall-indikator */}
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Mall:</span>
              <span className="font-semibold text-foreground">{templateLabel}</span>
              <span className="text-muted-foreground ml-auto text-xs">(ändras i Företagsprofil)</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Fakturarader ── */}
      <div className={cn("bg-card rounded-2xl border shadow-sm overflow-hidden", hasLineError && "border-destructive ring-1 ring-destructive")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlignLeft className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Fakturarader</h3>
            {hasLineError && <span className="text-xs text-destructive font-medium">{errors.lines}</span>}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={addLine}>
            <Plus className="h-3.5 w-3.5" /> Lägg till rad
          </Button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-3 font-medium text-muted-foreground text-left min-w-[220px]">Produkt / Beskrivning</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-20">Antal</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-24">Enhet</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-28">Á-pris</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-20">Rabatt%</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-24">Moms</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-right w-28">Summa</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {form.lines.map((line, idx) => (
                <tr key={idx} className={cn("hover:bg-muted/10 transition-colors", !line.name && idx > 0 && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      {products.length > 0 && !line.name && (
                        <Select onValueChange={(v) => addProductToLine(idx, v)}>
                          <SelectTrigger className="h-8 text-xs border-dashed">
                            <SelectValue placeholder="Välj från produkter…" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — {formatCurrency(p.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Input
                        className={cn("h-8", !line.name && "border-destructive/50 focus-visible:ring-destructive/30")}
                        placeholder="Namn *"
                        value={line.name}
                        onChange={(e) => updateLine(idx, "name", e.target.value)}
                      />
                      <Input
                        className="h-7 text-xs text-muted-foreground"
                        placeholder="Beskrivning (valfritt)"
                        value={line.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      className="h-8 text-right"
                      value={line.quantity}
                      min={0}
                      onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Select value={line.unit} onValueChange={(v) => updateLine(idx, "unit", v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      className="h-8 text-right"
                      value={line.unit_price}
                      min={0}
                      onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      className="h-8 text-right"
                      value={line.discount_percent}
                      min={0}
                      max={100}
                      onChange={(e) => updateLine(idx, "discount_percent", parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Select value={line.vat_rate?.toString()} onValueChange={(v) => updateLine(idx, "vat_rate", Number(v))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {vatRates.map((r) => <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(calculateLineTotal(line))}
                  </td>
                  <td className="px-2 py-3">
                    {form.lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeLine(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {form.lines.map((line, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rad {idx + 1}</span>
                {form.lines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:bg-destructive/10 px-2"
                    onClick={() => removeLine(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Ta bort
                  </Button>
                )}
              </div>
              {products.length > 0 && !line.name && (
                <Select onValueChange={(v) => addProductToLine(idx, v)}>
                  <SelectTrigger className="border-dashed text-sm">
                    <SelectValue placeholder="Välj från produkter…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder="Produktnamn *"
                value={line.name}
                onChange={(e) => updateLine(idx, "name", e.target.value)}
                className={cn(!line.name && "border-destructive/50")}
              />
              <Input
                placeholder="Beskrivning (valfritt)"
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Antal</Label>
                  <Input type="number" value={line.quantity} min={0} onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Enhet</Label>
                  <Select value={line.unit} onValueChange={(v) => updateLine(idx, "unit", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Á-pris</Label>
                  <Input type="number" value={line.unit_price} min={0} onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Rabatt %</Label>
                  <Input type="number" value={line.discount_percent} min={0} max={100} onChange={(e) => updateLine(idx, "discount_percent", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Moms</Label>
                  <Select value={line.vat_rate?.toString()} onValueChange={(v) => updateLine(idx, "vat_rate", Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{vatRates.map((r) => <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <span className="text-sm font-semibold">{formatCurrency(calculateLineTotal(line))}</span>
              </div>
            </div>
          ))}
          <div className="p-4">
            <Button variant="outline" className="w-full gap-1.5" onClick={addLine}>
              <Plus className="h-4 w-4" /> Lägg till rad
            </Button>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-border px-5 py-5 bg-muted/20">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delsumma (exkl. moms)</span>
                <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.vat_breakdown.map((v) => (
                <div key={v.rate} className="flex justify-between text-sm text-muted-foreground">
                  <span>Moms {v.rate}%</span>
                  <span className="tabular-nums">{formatCurrency(v.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold border-t border-border pt-3 mt-2">
                <span>Att betala</span>
                <span className="text-primary tabular-nums text-lg">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meddelande & Villkor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <Label className="text-sm font-semibold mb-2 block">Meddelande till kund</Label>
          <Textarea
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            rows={4}
            placeholder="Tack för din beställning! Hör av dig vid frågor."
            className="resize-none"
          />
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <Label className="text-sm font-semibold mb-2 block">Villkor &amp; betalningsinformation</Label>
          <Textarea
            value={form.terms}
            onChange={(e) => update("terms", e.target.value)}
            rows={4}
            placeholder="Betalningsvillkor, dröjsmålsränta, OCR-nummer…"
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
}