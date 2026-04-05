namespace BotFlow.Domain.Entities;

public class User : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "agent"; // superadmin | admin | agent
    public bool IsEmailVerified { get; set; } = false;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
