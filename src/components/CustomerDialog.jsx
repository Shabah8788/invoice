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
  const [lookupQuery, setLookupQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      const nextForm = { ...emptyCustomer, ...customer };
      setForm(nextForm);
      setLookupQuery(nextForm.org_number || nextForm.company_name || "");
    } else {
      setForm(emptyCustomer);
      setLookupQuery("");
    }
  }, [customer, open]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function lookupCompany() {
    const query = lookupQuery.trim();

    if (!query || query.length < 3) {
      toast.error("Ange organisationsnummer eller företagsnamn");
      return;
    }

    setLookupLoading(true);

    try {
      const res = await fetch("/api/integrations/company-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ query }),
      });

      const result = await res.json();

      if (result?.found && result.company) {
        const c = result.company;

        setForm((f) => ({
          ...f,
          company_name: c.company_name || f.company_name,
          org_number: c.org_number || f.org_number,
          address: c.address || f.address,
          postal_code: c.postal_code || f.postal_code,
          city: c.city || f.city,
          vat_number: c.vat_number || f.vat_number,
          country: c.country || f.country,
          email: c.email || f.email,
          phone: c.phone || f.phone,
        }));

        setLookupQuery(c.company_name || c.org_number || query);
        toast.success("Företagsuppgifter hämtade!");
      } else {
        toast.error("Kunde inte hitta företaget");
      }
    } catch (e) {
      toast.error("Lookup misslyckades");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleSave() {
    if (!form.company_name) {
      toast.error("Namn krävs");
      return;
    }
    setLoading(true);
    try {
      if (customer?.id) {
        await base44.entities.Customer.update(customer.id, form);
        toast.success("Kund uppdaterad");
      } else {
        await base44.entities.Customer.create(form);
        toast.success("Kund skapad");
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
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
              <Label>Sök företag (org.nr eller namn)</Label>
              <div className="flex gap-2">
                <Input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Org.nr eller företagsnamn"
                />
                <Button type="button" variant="outline" onClick={lookupCompany} disabled={lookupLoading}>
                  {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label>{form.customer_type === "company" ? "Företagsnamn" : "Namn"}</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>

          <div>
            <Label>Organisationsnummer</Label>
            <Input value={form.org_number} onChange={(e) => update("org_number", e.target.value)} />
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
