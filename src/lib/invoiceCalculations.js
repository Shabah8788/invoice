export function calculateLineTotal(line) {
  const quantity = line.quantity || 0;
  const unitPrice = line.unit_price || 0;
  const discount = line.discount_percent || 0;
  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discount / 100);
  return subtotal - discountAmount;
}

export function calculateInvoiceTotals(lines) {
  let subtotal = 0;
  let totalVat = 0;
  const vatMap = {};

  (lines || []).forEach((line) => {
    const lineTotal = calculateLineTotal(line);
    subtotal += lineTotal;
    const vatRate = line.vat_rate || 0;
    const vatAmount = lineTotal * (vatRate / 100);
    totalVat += vatAmount;

    if (!vatMap[vatRate]) {
      vatMap[vatRate] = { rate: vatRate, base: 0, amount: 0 };
    }
    vatMap[vatRate].base += lineTotal;
    vatMap[vatRate].amount += vatAmount;
  });

  const vatBreakdown = Object.values(vatMap).sort((a, b) => b.rate - a.rate);
  const total = subtotal + totalVat;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total_vat: Math.round(totalVat * 100) / 100,
    total: Math.round(total * 100) / 100,
    vat_breakdown: vatBreakdown.map((v) => ({
      rate: v.rate,
      base: Math.round(v.base * 100) / 100,
      amount: Math.round(v.amount * 100) / 100,
    })),
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(amount) {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}