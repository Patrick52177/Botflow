namespace BotFlow.Domain.Entities;

// FAQ / Knowledge base entries (for rule-based matching before AI fallback)
public class KnowledgeEntry : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid ChatbotId { get; set; }

    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string[] Keywords { get; set; } = Array.Empty<string>();
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 0;
    public int UsageCount { get; set; } = 0;

    // Navigation
    public Chatbot Chatbot { get; set; } = null!;
}

// API keys for widget embed + external integrations
public class ApiKey : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty; // stored as hash
    public string KeyPrefix { get; set; } = string.Empty; // "bf_tc_..." shown to user
    public string[] Scopes { get; set; } = Array.Empty<string>(); // e.g. ["messages:write", "conversations:read"]
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public string? AllowedIps { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
