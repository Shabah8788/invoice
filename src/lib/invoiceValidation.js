import { z } from "zod";
import { calculateInvoiceTotals } from "./invoiceCalculations";

const textField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => String(value ?? "").replace(/[<>]/g, "").trim());

const numericField = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  });

const invoiceLineSchema = z.object({
  name: textField,
  description: textField.optional(),
  unit: textField.optional(),
  quantity: numericField,
  unit_price: numericField,
  discount_percent: numericField,
  vat_rate: numericField,
  line_total: numericField.optional(),
});

const invoiceSchema = z.object({
  template: textField.optional(),
  invoice_number: textField.optional(),
  invoice_date: textField.optional(),
  due_date: textField.optional(),
  payment_terms: numericField.optional(),
  customer_name: textField.optional(),
  customer_org_number: textField.optional(),
  customer_address: textField.optional(),
  customer_postal_code: textField.optional(),
  customer_city: textField.optional(),
  message: textField.optional(),
  terms: textField.optional(),
  our_reference: textField.optional(),
  your_reference: textField.optional(),
  lines: z.array(invoiceLineSchema).default([]),
  subtotal: numericField.optional(),
  total: numericField.optional(),
  total_vat: numericField.optional(),
  vat_breakdown: z.array(z.object({
    rate: numericField,
    base: numericField,
    amount: numericField,
  })).optional(),
  company_snapshot: z.any().optional(),
});

export function sanitizeText(value) {
  return String(value ?? "").replace(/[<>]/g, "").trim();
}

export function normalizeInvoiceForRender(invoice) {
  const parsed = invoiceSchema.safeParse(invoice ?? {});
  const safeInvoice = parsed.success ? parsed.data : invoiceSchema.parse({});

  const sanitizedLines = (safeInvoice.lines || [])
    .map((line) => ({
      ...line,
      name: sanitizeText(line.name),
      description: sanitizeText(line.description),
      unit: sanitizeText(line.unit),
    }))
    .filter((line) => line.name);

  const calculated = calculateInvoiceTotals(sanitizedLines);

  return {
    ...safeInvoice,
    template: sanitizeText(safeInvoice.template || "modern") || "modern",
    invoice_number: sanitizeText(safeInvoice.invoice_number),
    customer_name: sanitizeText(safeInvoice.customer_name),
    customer_org_number: sanitizeText(safeInvoice.customer_org_number),
    customer_address: sanitizeText(safeInvoice.customer_address),
    customer_postal_code: sanitizeText(safeInvoice.customer_postal_code),
    customer_city: sanitizeText(safeInvoice.customer_city),
    message: sanitizeText(safeInvoice.message),
    terms: sanitizeText(safeInvoice.terms),
    our_reference: sanitizeText(safeInvoice.our_reference),
    your_reference: sanitizeText(safeInvoice.your_reference),
    lines: sanitizedLines,
    subtotal: safeInvoice.subtotal || calculated.subtotal,
    total_vat: safeInvoice.total_vat || calculated.total_vat,
    total: safeInvoice.total || calculated.total,
    vat_breakdown: safeInvoice.vat_breakdown?.length ? safeInvoice.vat_breakdown : calculated.vat_breakdown,
  };
}

export function hasRenderableInvoiceData(invoice) {
  const normalized = normalizeInvoiceForRender(invoice);
  return Boolean(normalized.invoice_number || normalized.customer_name || normalized.lines.length);
}
