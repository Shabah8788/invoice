namespace InvoiceBackend.Models;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";

    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    public Guid OrganizationId { get; set; }

    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }

    public decimal Subtotal { get; set; }
    public decimal TotalVat { get; set; }
    public decimal Total { get; set; }

    public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
}
