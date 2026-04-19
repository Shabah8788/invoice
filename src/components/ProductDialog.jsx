import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  unit: "st",
  vat_rate: 25,
  article_number: "",
};

const units = [
  { value: "st", label: "Styck" },
  { value: "timmar", label: "Timmar" },
  { value: "dagar", label: "Dagar" },
  { value: "km", label: "Kilometer" },
  { value: "kg", label: "Kilogram" },
  { value: "liter", label: "Liter" },
  { value: "meter", label: "Meter" },
  { value: "paket", label: "Paket" },
];

export default function ProductDialog({ open, onClose, product, onSaved }) {
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({ ...emptyProduct, ...product, price: product.price?.toString() || "" });
    } else {
      setForm(emptyProduct);
    }
  }, [product, open]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name) { toast.error("Namn krävs"); return; }
    if (!form.price) { toast.error("Pris krävs"); return; }
    setLoading(true);
    const data = { ...form, price: parseFloat(form.price), vat_rate: Number(form.vat_rate) };
    if (product?.id) {
      await base44.entities.Product.update(product.id, data);
      toast.success("Produkt uppdaterad");
    } else {
      await base44.entities.Product.create(data);
      toast.success("Produkt skapad");
    }
    setLoading(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Redigera produkt" : "Ny produkt"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Namn</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <Label>Artikelnummer</Label>
            <Input value={form.article_number} onChange={(e) => update("article_number", e.target.value)} />
          </div>

          <div>
            <Label>Beskrivning</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Pris (SEK)</Label>
              <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
            </div>
            <div>
              <Label>Enhet</Label>
              <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Moms (%)</Label>
              <Select value={form.vat_rate.toString()} onValueChange={(v) => update("vat_rate", Number(v))}>
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

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Avbryt</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {product ? "Spara" : "Skapa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}