import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyCustomer = {
  customer_type: "company",
  company_name: "",
  org_number: "",
  vat_number: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  postal_code: "",
  city: "",
  country: "Sverige",
  reference: "",
  notes: "",
};

export default function CustomerDialog({ open, onClose, customer, onSaved }) {
  const [form, setForm] = useState(emptyCustomer);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({ ...emptyCustomer, ...customer });
    } else {
      setForm(emptyCustomer);
    }
  }, [customer, open]);

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
      prompt: `Hämta företagsinformation för svenskt organisationsnummer: ${form.org_number}. Returnera företagsnamn, adress, postnummer, stad, och momsregistreringsnummer (SE + orgnr utan bindestreck + 01).`,
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
      toast.success("Företagsuppgifter hämtade!");
    } else {
      toast.error("Kunde inte hitta företaget");
    }
    setLookupLoading(false);
  }

  async function handleSave() {
    if (!form.company_name) {
      toast.error("Namn krävs");
      return;
    }
    setLoading(true);
    if (customer?.id) {
      await base44.entities.Customer.update(customer.id, form);
      toast.success("Kund uppdaterad");
    } else {
      await base44.entities.Customer.create(form);
      toast.success("Kund skapad");
    }
    setLoading(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Redigera kund" : "Ny kund"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Kundtyp</Label>
            <Select value={form.customer_type} onValueChange={(v) => update("customer_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Företag</SelectItem>
                <SelectItem value="individual">Privatperson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.customer_type === "company" && (
            <div>
              <Label>Organisationsnummer</Label>
              <div className="flex gap-2">
                <Input value={form.org_number} onChange={(e) => update("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
                <Button type="button" variant="outline" onClick={lookupOrg} disabled={lookupLoading} className="shrink-0">
                  {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label>{form.customer_type === "company" ? "Företagsnamn" : "Namn"}</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>

          {form.customer_type === "company" && (
            <div>
              <Label>Momsregistreringsnummer</Label>
              <Input value={form.vat_number} onChange={(e) => update("vat_number", e.target.value)} />
            </div>
          )}

          <div>
            <Label>Kontaktperson</Label>
            <Input value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
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

          <div>
            <Label>Referens</Label>
            <Input value={form.reference} onChange={(e) => update("reference", e.target.value)} />
          </div>

          <div>
            <Label>Anteckningar</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Avbryt</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {customer ? "Spara" : "Skapa kund"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}