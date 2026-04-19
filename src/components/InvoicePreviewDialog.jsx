import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import InvoiceTemplate from "./InvoiceTemplate";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

export default function InvoicePreviewDialog({ open, onClose, invoice }) {
  const printRef = useRef();

  async function handleDownloadPDF() {
    const element = printRef.current;
    if (!element) return;

    toast.loading("Skapar PDF...");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Faktura_${invoice?.invoice_number || "utkast"}.pdf`);

    toast.dismiss();
    toast.success("PDF nedladdad!");
  }

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold">Förhandsgranskning</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" /> Ladda ner PDF
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6 bg-muted">
          <div ref={printRef} className="bg-white shadow-lg mx-auto" style={{ maxWidth: "210mm" }}>
            <InvoiceTemplate invoice={invoice} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}