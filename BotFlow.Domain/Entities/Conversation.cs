namespace BotFlow.Domain.Entities;

public class Conversation : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid ChatbotId { get; set; }

    public string Status { get; set; } = "active"; // active | resolved | escalated | abandoned
    public string Channel { get; set; } = "webchat";

    // Visitor info
    public string SessionId { get; set; } = Guid.NewGuid().ToString("N");
    public string? VisitorName { get; set; }
    public string? VisitorEmail { get; set; }
    public string? VisitorPhone { get; set; }
    public string? ExternalUserId { get; set; } // e.g. WhatsApp phone number
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Country { get; set; }

    // Escalation
    public Guid? AssignedAgentId { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Rating
    public int? SatisfactionScore { get; set; } // 1–5
    public string? SatisfactionComment { get; set; }

    // Stats
    public int MessageCount { get; set; } = 0;
    public int AiMessageCount { get; set; } = 0;

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public Chatbot Chatbot { get; set; } = null!;
    public User? AssignedAgent { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}

public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public Guid TenantId { get; set; }

    public string Role { get; set; } = "user"; // user | bot | agent | system
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "text"; // text | image | file | quick_reply

    // AI metadata
    public bool IsAiGenerated { get; set; } = false;
    public string? AiProvider { get; set; }
    public string? AiModel { get; set; }
    public float? ConfidenceScore { get; set; }
    public int? TokensUsed { get; set; }

    // Flow metadata
    public Guid? TriggeredByNodeId { get; set; }

    // Navigation
    public Conversation Conversation { get; set; } = null!;
}
