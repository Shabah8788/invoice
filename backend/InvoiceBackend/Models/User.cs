using System.ComponentModel.DataAnnotations;

namespace InvoiceBackend.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string Role { get; set; } = "admin"; // admin, staff

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
