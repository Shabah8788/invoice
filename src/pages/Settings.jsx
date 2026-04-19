import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Save, Loader2, Upload, Search } from "lucide-react";
import TemplatePicker from "../components/TemplatePicker";
import { TEMPLATE_OPTIONS } from "../lib/templateOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/PageHeader";
import { toast } from "sonner";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profiles = await base44.entities.CompanyProfile.list("-created_date", 1);
    if (profiles.length > 0) {
      setForm(profiles[0]);
      setProfileId(profiles[0].id);
    } else {
      setForm({
        company_name: "", org_number: "", vat_number: "", address: "", postal_code: "",
        city: "", country: "Sverige", email: "", phone: "", website: "", logo_url: "",
        bankgiro: "", plusgiro: "", swish: "", iban: "", bic: "", bank_name: "",
        default_payment_terms: 30, default_vat_rate: 25, default_terms: "",
        default_template: "modern", primary_color: "#2563eb", next_invoice_number: 1001,
      });
    }
    setLoading(false);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function lookupOrg() {
    if (!form.org_number || form.org_number.length < 6) {
      toast.error("Ange ett giltigt organisationsnummer");
      return;
    }
    setLookupLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Hämta företagsinformation för svenskt organisationsnummer: ${form.org_number}. Returnera företagsnamn, adress, postnummer, stad, momsregistreringsnummer.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          company_name: { type: "string" },
          address: { type: "string" },
          postal_code: { type: "string" },
          city: { type: "string" },
          vat_number: { type: "string" },
        },
      },
    });
    if (result.company_name) {
      setForm((f) => ({
        ...f,
        company_name: result.company_name || f.company_name,
        address: result.address || f.address,
        postal_code: result.postal_code || f.postal_code,
        city: result.city || f.city,
        vat_number: result.vat_number || f.vat_number,
      }));
      toast.success("Uppgifter hämtade!");
    } else {
      toast.error("Kunde inte hitta företaget");
    }
    setLookupLoading(false);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("logo_url", file_url);
    toast.success("Logotyp uppladdad");
  }

  async function handleSave() {
    if (!form.company_name) {
      toast.error("Företagsnamn krävs");
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      default_payment_terms: Number(form.default_payment_terms),
      default_vat_rate: Number(form.default_vat_rate),
      next_invoice_number: Number(form.next_invoice_number),
    };
    if (profileId) {
      await base44.entities.CompanyProfile.update(profileId, data);
    } else {
      const created = await base44.entities.CompanyProfile.create(data);
      setProfileId(created.id);
    }
    toast.success("Företagsprofil sparad!");
    setSaving(false);
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Företagsprofil"
        description="Dina företagsuppgifter som visas på fakturorna"
        actions={
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Spara
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Företagsuppgifter
          </h2>

          <div>
            <Label>Organisationsnummer</Label>
            <div className="flex gap-2">
              <Input value={form.org_number} onChange={(e) => update("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
              <Button type="button" variant="outline" onClick={lookupOrg} disabled={lookupLoading} className="shrink-0">
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Företagsnamn</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>

          <div>
            <Label>Momsregistreringsnummer</Label>
            <Input value={form.vat_number} onChange={(e) => update("vat_number", e.target.value)} />
          </div>

          <div>
            <Label>Adress</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
            </div>
            <div>
              <Label>Stad</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <Label>Land</Label>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>E-post</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Webbplats</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>

          <div>
            <Label>Logotyp</Label>
            <div className="flex items-center gap-4">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded-lg border" />
              )}
              <label className="cursor-pointer">
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Ladda upp
                  </span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Bank & Settings */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Bankuppgifter</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bankgiro</Label>
                <Input value={form.bankgiro} onChange={(e) => update("bankgiro", e.target.value)} />
              </div>
              <div>
                <Label>Plusgiro</Label>
                <Input value={form.plusgiro} onChange={(e) => update("plusgiro", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Swish</Label>
              <Input value={form.swish} onChange={(e) => update("swish", e.target.value)} />
            </div>
            <div>
              <Label>Bank</Label>
              <Input value={form.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={(e) => update("iban", e.target.value)} />
              </div>
              <div>
                <Label>BIC/SWIFT</Label>
                <Input value={form.bic} onChange={(e) => update("bic", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Standardinställningar</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Betalningsvillkor (dagar)</Label>
                <Input type="number" value={form.default_payment_terms} onChange={(e) => update("default_payment_terms", e.target.value)} />
              </div>
              <div>
                <Label>Standard momssats</Label>
                <Select value={form.default_vat_rate?.toString()} onValueChange={(v) => update("default_vat_rate", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="6">6%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nästa fakturanummer</Label>
              <Input type="number" value={form.next_invoice_number} onChange={(e) => update("next_invoice_number", e.target.value)} />
            </div>
            <div>
              <Label className="text-base font-semibold">Fakturamall</Label>
              <p className="text-sm text-muted-foreground mb-3 mt-1">Välj vilken mall som ska användas på dina fakturor</p>
              <TemplatePicker value={form.default_template} onChange={(v) => update("default_template", v)} />
            </div>
            <div>
              <Label>Standardvillkor</Label>
              <Textarea value={form.default_terms} onChange={(e) => update("default_terms", e.target.value)} rows={3} placeholder="Betalningsvillkor, dröjsmålsränta, etc." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}