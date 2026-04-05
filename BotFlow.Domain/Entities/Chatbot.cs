namespace BotFlow.Domain.Entities;

public class Chatbot : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "draft"; // draft | live | paused
    public string Channel { get; set; } = "webchat"; // webchat | whatsapp | messenger

    // AI Configuration
    public string AiProvider { get; set; } = "claude"; // claude | groq | gemini
    public string AiModel { get; set; } = "claude-sonnet-4-20250514";
    public string? SystemPrompt { get; set; }
    public float Temperature { get; set; } = 0.4f;
    public int MaxTokens { get; set; } = 512;
    public float ConfidenceThreshold { get; set; } = 0.75f;

    // Widget config
    public string? WidgetTitle { get; set; }
    public string? WidgetSubtitle { get; set; }
    public string? WidgetColor { get; set; } = "#6C63FF";
    public string? WidgetPosition { get; set; } = "bottom-right";
    public string? WelcomeMessage { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
    public ICollection<FlowNode> FlowNodes { get; set; } = new List<FlowNode>();
    public ICollection<FlowEdge> FlowEdges { get; set; } = new List<FlowEdge>();
    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    public ICollection<KnowledgeEntry> KnowledgeEntries { get; set; } = new List<KnowledgeEntry>();
}
