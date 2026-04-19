import { formatCurrency, formatNumber } from "../lib/invoiceCalculations";

/* ─── Shared helpers ─────────────────────────────────────────────── */
function Lines({ invoice }) {
  return (invoice.lines || []).filter((l) => l.name);
}

function Table({ invoice, th, tdBorder, rowEven, headerText }) {
  const lines = (invoice.lines || []).filter((l) => l.name);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
      <thead>
        <tr style={{ background: th, color: headerText || "#fff" }}>
          {["Beskrivning", "Antal", "Enhet", "Á-pris", "Rabatt", "Moms", "Summa"].map((h, i) => (
            <th key={h} style={{ padding: "8px 10px", fontWeight: 600, textAlign: i > 0 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => (
          <tr key={idx} style={{ background: idx % 2 === 0 ? rowEven || "transparent" : "transparent", borderBottom: `1px solid ${tdBorder || "#e5e7eb"}` }}>
            <td style={{ padding: "8px 10px" }}>
              <div style={{ fontWeight: 600 }}>{line.name}</div>
              {line.description && <div style={{ fontSize: "10px", color: "#888", marginTop: 2 }}>{line.description}</div>}
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

function Totals({ invoice, accent, textColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
      <div style={{ width: 240 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
          <span>Delsumma</span><span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {(invoice.vat_breakdown || []).map((v) => (
          <div key={v.rate} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4 }}>
            <span>Moms {v.rate}% (av {formatCurrency(v.base)})</span><span>{formatCurrency(v.amount)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, borderTop: `2px solid ${accent || "#111"}`, paddingTop: 8, marginTop: 4, color: textColor || "inherit" }}>
          <span>Att betala</span><span>{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Footer({ invoice, company, textColor, borderColor }) {
  return (
    <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${borderColor || "#e5e7eb"}`, fontSize: 10, color: textColor || "#9ca3af" }}>
      {invoice.message && (
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: textColor || "#6b7280" }}>Meddelande: </strong>{invoice.message}
        </div>
      )}
      {invoice.terms && (
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: textColor || "#6b7280" }}>Villkor: </strong>{invoice.terms}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 8 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2, color: textColor || "#6b7280" }}>{company?.company_name}</div>
          {company?.org_number && <div>Org.nr: {company.org_number}</div>}
          {company?.vat_number && <div>Moms.nr: {company.vat_number}</div>}
        </div>
        <div>
          {company?.bankgiro && <div>Bankgiro: {company.bankgiro}</div>}
          {company?.plusgiro && <div>Plusgiro: {company.plusgiro}</div>}
          {company?.swish && <div>Swish: {company.swish}</div>}
          {company?.iban && <div>IBAN: {company.iban}</div>}
        </div>
        <div>
          {company?.email && <div>{company.email}</div>}
          {company?.phone && <div>{company.phone}</div>}
          {company?.website && <div>{company.website}</div>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 1. MODERN — Blue gradient header                                    */
/* ─────────────────────────────────────────────────────────────────── */
function Modern({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1e293b" }}>
      <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", padding: "40px 40px 32px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 12, filter: "brightness(0) invert(1)", objectFit: "contain" }} />}
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
      <div style={{ padding: "32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 8 }}>Från</div>
            <div style={{ fontWeight: 700 }}>{company?.company_name}</div>
            {company?.org_number && <div style={{ color: "#64748b", fontSize: 11 }}>Org.nr: {company.org_number}</div>}
            {company?.address && <div style={{ color: "#64748b", fontSize: 11 }}>{company.address}</div>}
            {company?.postal_code && <div style={{ color: "#64748b", fontSize: 11 }}>{company.postal_code} {company.city}</div>}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 8 }}>Till</div>
            <div style={{ fontWeight: 700 }}>{invoice.customer_name}</div>
            {invoice.customer_org_number && <div style={{ color: "#64748b", fontSize: 11 }}>Org.nr: {invoice.customer_org_number}</div>}
            {invoice.customer_address && <div style={{ color: "#64748b", fontSize: 11 }}>{invoice.customer_address}</div>}
            {invoice.customer_postal_code && <div style={{ color: "#64748b", fontSize: 11 }}>{invoice.customer_postal_code} {invoice.customer_city}</div>}
          </div>
        </div>
        <Table invoice={invoice} th="#2563eb" tdBorder="#e2e8f0" rowEven="#f8fafc" />
        <Totals invoice={invoice} accent="#2563eb" />
        <Footer invoice={invoice} company={company} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 2. MINIMAL — Ultra clean white                                      */
/* ─────────────────────────────────────────────────────────────────── */
function Minimal({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#111", padding: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 48 }}>
        <div>
          {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 36, marginBottom: 16, objectFit: "contain" }} />}
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#aaa" }}>Faktura</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: 2 }}>#{invoice.invoice_number}</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 8, lineHeight: 2 }}>
            <div>{invoice.invoice_date}</div>
            <div>Förfaller {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ width: 40, height: 2, background: "#111", marginBottom: 32 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
        <div style={{ fontSize: 11 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{company?.company_name}</div>
          <div style={{ color: "#777" }}>{company?.address}</div>
          <div style={{ color: "#777" }}>{company?.postal_code} {company?.city}</div>
        </div>
        <div style={{ fontSize: 11 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{invoice.customer_name}</div>
          <div style={{ color: "#777" }}>{invoice.customer_address}</div>
          <div style={{ color: "#777" }}>{invoice.customer_postal_code} {invoice.customer_city}</div>
        </div>
      </div>
      <Table invoice={invoice} th="#111" tdBorder="#f0f0f0" rowEven="#fafafa" />
      <Totals invoice={invoice} accent="#111" />
      <Footer invoice={invoice} company={company} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 3. PREMIUM — Black & gold luxury                                    */
/* ─────────────────────────────────────────────────────────────────── */
function Premium({ invoice, company }) {
  const gold = "#b8860b";
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1a1a1a", background: "#fff" }}>
      <div style={{ background: "#0f0f0f", padding: "40px 40px 32px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 44, marginBottom: 12, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Faktura</div>
            <div style={{ color: gold, fontSize: 11, letterSpacing: 2, marginTop: 4 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right", color: "#999", fontSize: 11, lineHeight: 2 }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 20, marginBottom: 4 }}>{formatCurrency(invoice.total)}</div>
            <div>Datum: {invoice.invoice_date}</div>
            <div>Förfaller: {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          {[
            { label: "Belopp", value: formatCurrency(invoice.total) },
            { label: "Datum", value: invoice.invoice_date },
            { label: "Förfaller", value: invoice.due_date },
          ].map((item) => (
            <div key={item.label} style={{ padding: "16px 20px", background: "#f8f8f8", borderRight: "1px solid #e5e5e5" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: 700, color: gold }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "28px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", marginBottom: 8 }}>Faktureras av</div>
            <div style={{ fontWeight: 700 }}>{company?.company_name}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{company?.org_number}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{company?.address}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{company?.postal_code} {company?.city}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", marginBottom: 8 }}>Faktureras till</div>
            <div style={{ fontWeight: 700 }}>{invoice.customer_name}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{invoice.customer_org_number}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{invoice.customer_address}</div>
            <div style={{ color: "#666", fontSize: 11 }}>{invoice.customer_postal_code} {invoice.customer_city}</div>
          </div>
        </div>
        <Table invoice={invoice} th="#0f0f0f" tdBorder="#e8e8e8" rowEven="#fafafa" />
        <Totals invoice={invoice} accent={gold} />
        <Footer invoice={invoice} company={company} borderColor="#e8e8e8" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 4. CLASSIC — Traditional business                                   */
/* ─────────────────────────────────────────────────────────────────── */
function Classic({ invoice, company }) {
  return (
    <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#2c2c2c", padding: 48 }}>
      <div style={{ textAlign: "center", borderBottom: "3px double #333", paddingBottom: 20, marginBottom: 28 }}>
        {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 10, objectFit: "contain" }} />}
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Faktura</div>
        <div style={{ color: "#666", marginTop: 4, fontStyle: "italic" }}>Nr. {invoice.invoice_number}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 28 }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{company?.company_name}</div>
          <div style={{ color: "#555", lineHeight: 1.8, fontSize: 11 }}>
            {company?.org_number && <div>Org.nr: {company.org_number}</div>}
            {company?.address && <div>{company.address}</div>}
            {company?.postal_code && <div>{company.postal_code} {company?.city}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{invoice.customer_name}</div>
          <div style={{ color: "#555", lineHeight: 1.8, fontSize: 11 }}>
            {invoice.customer_address && <div>{invoice.customer_address}</div>}
            {invoice.customer_postal_code && <div>{invoice.customer_postal_code} {invoice.customer_city}</div>}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 40, fontSize: 11, marginBottom: 24, padding: "12px 0", borderTop: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>
        <div><span style={{ color: "#888" }}>Datum:</span> {invoice.invoice_date}</div>
        <div><span style={{ color: "#888" }}>Förfaller:</span> {invoice.due_date}</div>
        {invoice.our_reference && <div><span style={{ color: "#888" }}>Vår ref:</span> {invoice.our_reference}</div>}
        {invoice.your_reference && <div><span style={{ color: "#888" }}>Er ref:</span> {invoice.your_reference}</div>}
      </div>
      <Table invoice={invoice} th="#3d3d3d" tdBorder="#ddd" rowEven="#f9f9f9" />
      <Totals invoice={invoice} accent="#333" />
      <Footer invoice={invoice} company={company} borderColor="#ddd" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 5. NORDIC — Scandinavian calm                                       */
/* ─────────────────────────────────────────────────────────────────── */
function Nordic({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1a2332", background: "#f0f4f8" }}>
      <div style={{ background: "#fff", margin: 0, padding: "36px 44px 28px", borderBottom: "4px solid #4a7c59" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 38, marginBottom: 10, objectFit: "contain" }} />}
            <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#4a7c59" }}>Faktura</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a2332" }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ background: "#4a7c59", color: "#fff", borderRadius: 12, padding: "16px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 4, letterSpacing: 1 }}>ATT BETALA</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>Förfaller {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "28px 44px", background: "#f0f4f8" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {[
            { label: "Avsändare", name: company?.company_name, org: company?.org_number, addr: company?.address, zip: `${company?.postal_code || ""} ${company?.city || ""}`, email: company?.email },
            { label: "Mottagare", name: invoice.customer_name, org: invoice.customer_org_number, addr: invoice.customer_address, zip: `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}` },
          ].map((p) => (
            <div key={p.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#4a7c59", marginBottom: 8, fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.org && <div style={{ color: "#64748b", fontSize: 11 }}>Org.nr: {p.org}</div>}
              {p.addr && <div style={{ color: "#64748b", fontSize: 11 }}>{p.addr}</div>}
              {p.zip && <div style={{ color: "#64748b", fontSize: 11 }}>{p.zip}</div>}
              {p.email && <div style={{ color: "#64748b", fontSize: 11 }}>{p.email}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <Table invoice={invoice} th="#4a7c59" tdBorder="#e8f0eb" rowEven="#f6fbf7" />
        </div>
        <Totals invoice={invoice} accent="#4a7c59" />
        <Footer invoice={invoice} company={company} borderColor="#dce8e2" textColor="#64748b" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 6. SUNSET — Warm orange/pink gradient                               */
/* ─────────────────────────────────────────────────────────────────── */
function Sunset({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1a1a2e" }}>
      <div style={{ background: "linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)", padding: "44px 44px 36px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 44, marginBottom: 12, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>FAKTURA</div>
            <div style={{ opacity: 0.85, fontSize: 14 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 16, padding: "20px 24px", textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 1, marginBottom: 4 }}>ATT BETALA</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 6 }}>{invoice.invoice_date} → {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", padding: "32px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {[
            { t: "Från", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Till", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, background: "linear-gradient(90deg,#f97316,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#64748b", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#f97316" tdBorder="#fce7d4" rowEven="#fff8f4" />
        <Totals invoice={invoice} accent="#f97316" />
        <Footer invoice={invoice} company={company} borderColor="#fce7d4" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 7. MIDNIGHT — Dark elegance                                         */
/* ─────────────────────────────────────────────────────────────────── */
function Midnight({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#e2e8f0", background: "#0f172a" }}>
      <div style={{ padding: "44px 44px 32px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 12, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, color: "#f1f5f9" }}>FAKTURA</div>
            <div style={{ color: "#60a5fa", fontSize: 13, marginTop: 4 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right", color: "#94a3b8", fontSize: 11, lineHeight: 2 }}>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 24 }}>{formatCurrency(invoice.total)}</div>
            <div>Datum: {invoice.invoice_date}</div>
            <div>Förfaller: {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "28px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {[
            { t: "AVSÄNDARE", name: company?.company_name, lines: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "MOTTAGARE", name: invoice.customer_name, lines: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ background: "#1e293b", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#60a5fa", marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{p.name}</div>
              {p.lines.map((l, i) => l && <div key={i} style={{ color: "#94a3b8", fontSize: 11 }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden" }}>
          <Table invoice={invoice} th="#1e3a8a" tdBorder="#1e293b" rowEven="#1e293b" headerText="#93c5fd" />
        </div>
        <Totals invoice={invoice} accent="#60a5fa" textColor="#f1f5f9" />
        <Footer invoice={invoice} company={company} textColor="#64748b" borderColor="#1e293b" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 8. ROSE — Rose gold & blush                                         */
/* ─────────────────────────────────────────────────────────────────── */
function Rose({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#3d1a2b", background: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#be185d,#f43f5e,#fb7185)", padding: "40px 44px 32px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 10, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 28, fontWeight: 800 }}>FAKTURA</div>
            <div style={{ opacity: 0.85, marginTop: 2 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, lineHeight: 2, opacity: 0.9 }}>
            <div style={{ fontSize: 20, fontWeight: 700, opacity: 1 }}>{formatCurrency(invoice.total)}</div>
            <div>Datum: {invoice.invoice_date}</div>
            <div>Förfaller: {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "32px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {[
            { t: "Från", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Till", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ borderLeft: "3px solid #f43f5e", paddingLeft: 14 }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#f43f5e", fontWeight: 600, marginBottom: 6 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#9d6b7a", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#be185d" tdBorder="#fce7e7" rowEven="#fff5f7" />
        <Totals invoice={invoice} accent="#be185d" />
        <Footer invoice={invoice} company={company} borderColor="#fce7e7" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 9. OCEAN — Teal waves                                               */
/* ─────────────────────────────────────────────────────────────────── */
function Ocean({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#134e4a", background: "#fff" }}>
      <div style={{ background: "linear-gradient(160deg,#0f766e,#0891b2)", padding: "40px 44px 60px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -20, left: 0, right: 0, height: 40, background: "rgba(255,255,255,0.1)", borderRadius: "50% 50% 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 12, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>FAKTURA</div>
            <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "16px 20px", textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>{invoice.invoice_date} • Förfaller {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "32px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          {[
            { t: "Avsändare", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Mottagare", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ background: "#f0fdfa", borderRadius: 10, padding: "14px 18px", border: "1px solid #ccfbf1" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#0f766e", fontWeight: 700, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#4b8c85", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 10, overflow: "hidden" }}>
          <Table invoice={invoice} th="#0f766e" tdBorder="#ccfbf1" rowEven="#f0fdfa" />
        </div>
        <Totals invoice={invoice} accent="#0f766e" />
        <Footer invoice={invoice} company={company} borderColor="#ccfbf1" textColor="#64748b" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 10. ROYAL — Deep purple luxury                                      */
/* ─────────────────────────────────────────────────────────────────── */
function Royal({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1e1b4b", background: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed,#9333ea)", padding: "44px 44px 36px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 44, marginBottom: 12, objectFit: "contain", filter: "brightness(0) invert(1)" }} />}
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 1 }}>FAKTURA</div>
            <div style={{ color: "#c4b5fd", fontSize: 13, marginTop: 4 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "20px 28px", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#c4b5fd", letterSpacing: 1, marginBottom: 6 }}>ATT BETALA</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, color: "#c4b5fd", marginTop: 6 }}>Förfaller {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "32px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          {[
            { t: "Från", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Till", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ borderTop: "3px solid #7c3aed", paddingTop: 12 }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#7c3aed", fontWeight: 700, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#6b7280", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#4f46e5" tdBorder="#ede9fe" rowEven="#faf5ff" />
        <Totals invoice={invoice} accent="#7c3aed" />
        <Footer invoice={invoice} company={company} borderColor="#ede9fe" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 11. BOLD — Big impact typography                                    */
/* ─────────────────────────────────────────────────────────────────── */
function Bold({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#111", background: "#fff" }}>
      <div style={{ padding: "44px 44px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 8, objectFit: "contain" }} />}
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.9, letterSpacing: -4, color: "#111" }}>FAK-<br />TURA</div>
          </div>
          <div style={{ textAlign: "right", paddingBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ea580c" }}>#{invoice.invoice_number}</div>
            <div style={{ color: "#777", fontSize: 11, marginTop: 4 }}>{invoice.invoice_date}</div>
          </div>
        </div>
        <div style={{ height: 8, background: "#ea580c", marginTop: 24, marginBottom: 32 }} />
      </div>
      <div style={{ padding: "0 44px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
          {[
            { t: "FRÅN", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "TILL", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t}>
              <div style={{ fontWeight: 900, fontSize: 10, letterSpacing: 3, color: "#ea580c", marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#777", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#111" tdBorder="#f0f0f0" rowEven="#fafafa" />
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ background: "#ea580c", color: "#fff", padding: "16px 24px", borderRadius: 8, width: 240 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
                <span>Delsumma</span><span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {(invoice.vat_breakdown || []).map((v) => (
                <div key={v.rate} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span>Moms {v.rate}%</span><span>{formatCurrency(v.amount)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, borderTop: "2px solid rgba(255,255,255,0.4)", paddingTop: 8, marginTop: 4 }}>
                <span>TOTALT</span><span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <Footer invoice={invoice} company={company} borderColor="#f0f0f0" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 12. SLATE — Professional corporate gray                             */
/* ─────────────────────────────────────────────────────────────────── */
function Slate({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#334155", background: "#f8fafc" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "32px 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, objectFit: "contain" }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{company?.company_name}</div>
            {company?.org_number && <div style={{ color: "#94a3b8", fontSize: 11 }}>Org.nr: {company.org_number}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#94a3b8", marginBottom: 4 }}>Faktura</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>#{invoice.invoice_number}</div>
        </div>
      </div>
      <div style={{ padding: "24px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Fakturadatum", value: invoice.invoice_date },
            { label: "Förfallodatum", value: invoice.due_date },
            { label: "Betalningsvillkor", value: `${invoice.payment_terms} dagar` },
            { label: "Att betala", value: formatCurrency(invoice.total) },
          ].map((item) => (
            <div key={item.label} style={{ background: "#fff", borderRadius: 8, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { t: "Faktureras av", name: company?.company_name, sub: [company?.address, `${company?.postal_code || ""} ${company?.city || ""}`, company?.email] },
            { t: "Faktureras till", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#94a3b8", marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#64748b", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <Table invoice={invoice} th="#334155" tdBorder="#f1f5f9" rowEven="#f8fafc" />
        </div>
        <Totals invoice={invoice} accent="#334155" />
        <Footer invoice={invoice} company={company} borderColor="#e2e8f0" textColor="#94a3b8" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 13. FOREST — Deep green nature                                      */
/* ─────────────────────────────────────────────────────────────────── */
function Forest({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#14532d", background: "#fff" }}>
      <div style={{ display: "flex", height: 8 }}>
        <div style={{ flex: 1, background: "#15803d" }} /><div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ flex: 1, background: "#22c55e" }} /><div style={{ flex: 1, background: "#4ade80" }} />
      </div>
      <div style={{ padding: "40px 44px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 12, objectFit: "contain" }} />}
            <div style={{ fontSize: 26, fontWeight: 800, color: "#14532d" }}>FAKTURA</div>
            <div style={{ color: "#16a34a", fontSize: 12, marginTop: 2 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "18px 24px", textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#16a34a", letterSpacing: 1, marginBottom: 4 }}>ATT BETALA</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#14532d" }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>Förfaller {invoice.due_date}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {[
            { t: "Avsändare", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Mottagare", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#16a34a", fontWeight: 700, marginBottom: 8 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#4b7a5a", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#15803d" tdBorder="#dcfce7" rowEven="#f0fdf4" />
        <Totals invoice={invoice} accent="#15803d" />
        <Footer invoice={invoice} company={company} borderColor="#bbf7d0" textColor="#6b7280" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 14. CREATIVE — Asymmetric sidebar design                            */
/* ─────────────────────────────────────────────────────────────────── */
function Creative({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#111", background: "#fff", display: "flex", minHeight: 1000 }}>
      <div style={{ width: 220, background: "linear-gradient(180deg,#1e1b4b,#312e81)", color: "#fff", padding: "40px 24px", flexShrink: 0 }}>
        {company?.logo_url && <img src={company.logo_url} alt="" style={{ width: "100%", maxHeight: 50, objectFit: "contain", marginBottom: 24, filter: "brightness(0) invert(1)" }} />}
        <div style={{ fontSize: 9, letterSpacing: 2, color: "#a5b4fc", marginBottom: 8 }}>FAKTURA</div>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>#{invoice.invoice_number}</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: "#a5b4fc", marginBottom: 4, letterSpacing: 1 }}>ATT BETALA</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(invoice.total)}</div>
        </div>
        <div style={{ fontSize: 10, lineHeight: 2, color: "#c7d2fe" }}>
          <div>Datum: {invoice.invoice_date}</div>
          <div>Förfaller: {invoice.due_date}</div>
          <div>Villkor: {invoice.payment_terms} dagar</div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, marginTop: 24 }}>
          <div style={{ fontSize: 9, color: "#a5b4fc", marginBottom: 8, letterSpacing: 1 }}>AVSÄNDARE</div>
          <div style={{ fontWeight: 600, fontSize: 11 }}>{company?.company_name}</div>
          {company?.org_number && <div style={{ color: "#c7d2fe", fontSize: 10 }}>{company.org_number}</div>}
          {company?.address && <div style={{ color: "#c7d2fe", fontSize: 10 }}>{company.address}</div>}
          {company?.postal_code && <div style={{ color: "#c7d2fe", fontSize: 10 }}>{company.postal_code} {company?.city}</div>}
        </div>
        <div style={{ marginTop: 20 }}>
          {company?.bankgiro && <div style={{ fontSize: 10, color: "#c7d2fe" }}>BG: {company.bankgiro}</div>}
          {company?.swish && <div style={{ fontSize: 10, color: "#c7d2fe" }}>Swish: {company.swish}</div>}
          {company?.email && <div style={{ fontSize: 10, color: "#c7d2fe", marginTop: 8 }}>{company.email}</div>}
        </div>
      </div>
      <div style={{ flex: 1, padding: "40px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>Faktureras till</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{invoice.customer_name}</div>
          {invoice.customer_org_number && <div style={{ color: "#6b7280", fontSize: 11 }}>Org.nr: {invoice.customer_org_number}</div>}
          {invoice.customer_address && <div style={{ color: "#6b7280", fontSize: 11 }}>{invoice.customer_address}</div>}
          {invoice.customer_postal_code && <div style={{ color: "#6b7280", fontSize: 11 }}>{invoice.customer_postal_code} {invoice.customer_city}</div>}
        </div>
        <Table invoice={invoice} th="#312e81" tdBorder="#e0e7ff" rowEven="#f5f3ff" />
        <Totals invoice={invoice} accent="#4f46e5" />
        {invoice.message && (
          <div style={{ marginTop: 20, padding: "12px 16px", background: "#f5f3ff", borderRadius: 8, fontSize: 11, color: "#4338ca" }}>
            <strong>Meddelande:</strong> {invoice.message}
          </div>
        )}
        {invoice.terms && (
          <div style={{ marginTop: 10, fontSize: 10, color: "#9ca3af" }}><strong style={{ color: "#6b7280" }}>Villkor:</strong> {invoice.terms}</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 15. AMBER — Warm professional                                       */
/* ─────────────────────────────────────────────────────────────────── */
function Amber({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#1c1917", background: "#fff" }}>
      <div style={{ background: "#fffbeb", borderBottom: "4px solid #f59e0b", padding: "40px 44px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 44, marginBottom: 12, objectFit: "contain" }} />}
            <div style={{ fontSize: 28, fontWeight: 900, color: "#78350f" }}>FAKTURA</div>
            <div style={{ color: "#d97706", fontSize: 13, fontWeight: 600, marginTop: 2 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#78350f" }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 11, color: "#92400e", lineHeight: 2, marginTop: 4 }}>
              <div>Datum: {invoice.invoice_date}</div>
              <div>Förfaller: {invoice.due_date}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "32px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
          {[
            { t: "Från", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "Till", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ background: "#fffbeb", borderRadius: 8, padding: "14px 18px", borderLeft: "4px solid #f59e0b" }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: "#d97706", fontWeight: 700, marginBottom: 6 }}>{p.t}</div>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#78716c", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <Table invoice={invoice} th="#92400e" tdBorder="#fde68a" rowEven="#fffbeb" />
        <Totals invoice={invoice} accent="#f59e0b" />
        <Footer invoice={invoice} company={company} borderColor="#fde68a" textColor="#78716c" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 16. CYBER — Futuristic neon                                         */
/* ─────────────────────────────────────────────────────────────────── */
function Cyber({ invoice, company }) {
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "#d4d4d8", background: "#09090b" }}>
      <div style={{ padding: "44px 44px 32px", borderBottom: "1px solid #27272a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="" style={{ height: 40, marginBottom: 12, objectFit: "contain", filter: "brightness(0) saturate(100%) invert(74%) sepia(95%) saturate(3000%) hue-rotate(90deg)" }} />}
            <div style={{ fontSize: 28, fontWeight: 800, color: "#22d3ee", letterSpacing: 2 }}>FAKTURA</div>
            <div style={{ color: "#6ee7b7", fontSize: 12, marginTop: 4 }}>#{invoice.invoice_number}</div>
          </div>
          <div style={{ border: "1px solid #22d3ee", borderRadius: 8, padding: "16px 24px", textAlign: "right", background: "rgba(34,211,238,0.05)" }}>
            <div style={{ fontSize: 9, color: "#22d3ee", letterSpacing: 2, marginBottom: 4 }}>ATT BETALA</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#22d3ee" }}>{formatCurrency(invoice.total)}</div>
            <div style={{ fontSize: 10, color: "#71717a", marginTop: 4 }}>{invoice.invoice_date} → {invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "28px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
          {[
            { t: "AVSÄNDARE", name: company?.company_name, sub: [company?.org_number, company?.address, `${company?.postal_code || ""} ${company?.city || ""}`] },
            { t: "MOTTAGARE", name: invoice.customer_name, sub: [invoice.customer_org_number, invoice.customer_address, `${invoice.customer_postal_code || ""} ${invoice.customer_city || ""}`] },
          ].map((p) => (
            <div key={p.t} style={{ border: "1px solid #27272a", borderRadius: 8, padding: "14px 18px", borderLeft: "3px solid #22d3ee" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "#22d3ee", marginBottom: 8, fontWeight: 700 }}>{p.t}</div>
              <div style={{ fontWeight: 700, color: "#f4f4f5" }}>{p.name}</div>
              {p.sub.map((s, i) => s && <div key={i} style={{ color: "#71717a", fontSize: 11 }}>{s}</div>)}
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid #27272a", borderRadius: 8, overflow: "hidden" }}>
          <Table invoice={invoice} th="#0a0a0a" tdBorder="#27272a" rowEven="#111" headerText="#22d3ee" />
        </div>
        <Totals invoice={invoice} accent="#22d3ee" textColor="#22d3ee" />
        <Footer invoice={invoice} company={company} textColor="#52525b" borderColor="#27272a" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Main export                                                         */
/* ─────────────────────────────────────────────────────────────────── */
const templates = {
  modern: Modern,
  minimal: Minimal,
  premium: Premium,
  classic: Classic,
  nordic: Nordic,
  sunset: Sunset,
  midnight: Midnight,
  rose: Rose,
  ocean: Ocean,
  royal: Royal,
  bold: Bold,
  slate: Slate,
  forest: Forest,
  creative: Creative,
  amber: Amber,
  cyber: Cyber,
};

export default function InvoiceTemplate({ invoice, company: companyProp }) {
  const Component = templates[invoice?.template] || templates.modern;
  const company = companyProp || invoice?.company_snapshot;
  return <Component invoice={invoice} company={company} />;
}