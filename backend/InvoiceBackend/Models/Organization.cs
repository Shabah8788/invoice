namespace InvoiceBackend.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
