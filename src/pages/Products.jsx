import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/PageHeader";
import ProductDialog from "../components/ProductDialog";
import { formatCurrency } from "../lib/invoiceCalculations";
import { toast } from "sonner";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const data = await base44.entities.Product.list("-created_date", 200);
    setProducts(data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Vill du ta bort denna produkt?")) return;
    await base44.entities.Product.delete(id);
    toast.success("Produkt borttagen");
    loadProducts();
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.article_number || "").toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Produkter & Tjänster"
        description={`${products.length} produkter`}
        actions={
          <Button className="gap-2" onClick={() => { setEditProduct(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            Ny produkt
          </Button>
        }
      />

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Sök produkter..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Inga produkter hittades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Namn</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Art.nr</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Pris</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Enhet</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Moms</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.article_number || "—"}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3">{p.unit}</td>
                    <td className="px-4 py-3 text-right">{p.vat_rate}%</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditProduct(p); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditProduct(null); }}
        product={editProduct}
        onSaved={loadProducts}
      />
    </div>
  );
}