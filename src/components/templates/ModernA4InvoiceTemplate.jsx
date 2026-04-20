import { formatCurrency, formatNumber } from "@/lib/invoiceCalculations";

function Table({ invoice }) {
  const lines = (invoice.lines || []).filter((line) => line.name);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
      <thead>
        <tr style={{ background: "#2563eb", color: "#fff" }}>
          {["Beskrivning", "Antal", "Enhet", "Á-pris", "Rabatt", "Moms", "Summa"].map((heading, index) => (
            <th
              key={heading}
              style={{
                padding: "8px 10px",
                fontWeight: 600,
                textAlign: index > 0 ? "right" : "left",
                whiteSpace: "nowrap",
              }}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr
            key={`${line.name}-${index}`}
            style={{
              background: index % 2 === 0 ? "#f8fafc" : "transparent",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <td style={{ padding: "8px 10px" }}>
              <div style={{ fontWeight: 600 }}>{line.name}</div>
              {line.description ? (
                <div style={{ fontSize: "10px", color: "#888", marginTop: 2 }}>{line.description}</div>
              ) : null}
            </td>
            <td style={{ padding: "8px 10px", textAlign: "right" }}>{formatNumber(line.quantity)}</td>
            <td style={{ padding: "8px 10px", textAlign: "right" }}>{line.unit}</td>
            <td style={{ padding: "8px 10px", textAlign: "right" }}>{formatCurrency(line.unit_price)}</td>
            <td style={{ padding: "8px 10px", textAlign: "right" }}>{line.discount_percent ? `${line.discount_percent}%` : "—"}</td>
            <td style={{ padding: "8px 10px", textAlign: "right" }}>{line.vat_rate}%</td>
            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(line.line_total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ invoice }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
      <div style={{ width: 240 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
          <span>Delsumma</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {(invoice.vat_breakdown || []).map((vat) => (
          <div key={vat.rate} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
            <span>Moms {vat.rate}% (av {formatCurrency(vat.base)})</span>
            <span>{formatCurrency(vat.amount)}</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: 15,
            borderTop: "2px solid #2563eb",
            paddingTop: 8,
            marginTop: 4,
          }}
        >
          <span>Att betala</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Footer({ invoice, company }) {
  return (
    <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb", fontSize: 10, color: "#9ca3af" }}>
      {invoice.message ? (
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: "#6b7280" }}>Meddelande: </strong>
          {invoice.message}
        </div>
      ) : null}
      {invoice.terms ? (
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: "#6b7280" }}>Villkor: </strong>
          {invoice.terms}
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2, color: "#6b7280" }}>{company?.company_name}</div>
          {company?.org_number ? <div>Org.nr: {company.org_number}</div> : null}
          {company?.vat_number ? <div>Moms.nr: {company.vat_number}</div> : null}
        </div>
        <div>
          {company?.bankgiro ? <div>Bankgiro: {company.bankgiro}</div> : null}
          {company?.plusgiro ? <div>Plusgiro: {company.plusgiro}</div> : null}
          {company?.swish ? <div>Swish: {company.swish}</div> : null}
          {company?.iban ? <div>IBAN: {company.iban}</div> : null}
        </div>
        <div>
          {company?.email ? <div>{company.email}</div> : null}
          {company?.phone ? <div>{company.phone}</div> : null}
          {company?.website ? <div>{company.website}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function ModernA4InvoiceTemplate({ invoice, company: companyProp }) {
  const company = companyProp || invoice?.company_snapshot;

  return (
    <div
      style={{
        fontFamily: "'Inter',sans-serif",
        fontSize: 12,
        color: "#1e293b",
        minHeight: "297mm",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}
    >
      <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", padding: "40px 40px 32px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                style={{ height: 40, marginBottom: 12, filter: "brightness(0) invert(1)", objectFit: "contain" }}
              />
            ) : null}
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>FAKTURA</div>
            <div style={{ opacity: 0.7, marginTop: 4 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right", opacity: 0.9, fontSize: 11, lineHeight: 1.8 }}>
            <div>Datum: <strong>{invoice.invoice_date}</strong></div>
            <div>Förfaller: <strong>{invoice.due_date}</strong></div>
            <div>Villkor: <strong>{invoice.payment_terms} dagar</strong></div>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 8 }}>Från</div>
            <div style={{ fontWeight: 700 }}>{company?.company_name}</div>
            {company?.org_number ? <div style={{ color: "#64748b", fontSize: 11 }}>Org.nr: {company.org_number}</div> : null}
            {company?.address ? <div style={{ color: "#64748b", fontSize: 11 }}>{company.address}</div> : null}
            {company?.postal_code ? <div style={{ color: "#64748b", fontSize: 11 }}>{company.postal_code} {company.city}</div> : null}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 8 }}>Till</div>
            <div style={{ fontWeight: 700 }}>{invoice.customer_name}</div>
            {invoice.customer_org_number ? <div style={{ color: "#64748b", fontSize: 11 }}>Org.nr: {invoice.customer_org_number}</div> : null}
            {invoice.customer_address ? <div style={{ color: "#64748b", fontSize: 11 }}>{invoice.customer_address}</div> : null}
            {invoice.customer_postal_code ? <div style={{ color: "#64748b", fontSize: 11 }}>{invoice.customer_postal_code} {invoice.customer_city}</div> : null}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Table invoice={invoice} />
          <div style={{ flex: 1, minHeight: 24 }} />
          <div style={{ marginTop: "auto" }}>
            <Totals invoice={invoice} />
            <div style={{ marginTop: 32 }}>
              <Footer invoice={invoice} company={company} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
