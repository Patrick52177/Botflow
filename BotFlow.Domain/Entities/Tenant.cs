namespace BotFlow.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty; // unique subdomain/identifier
    public string PlanType { get; set; } = "starter"; // starter | pro | enterprise
    public bool IsActive { get; set; } = true;
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; } = "#6C63FF";

    // Subscription
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? PlanRenewsAt { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Limits
    public int MaxBots { get; set; } = 1;
    public int MaxConversationsPerMonth { get; set; } = 500;

    // Navigation
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Chatbot> Chatbots { get; set; } = new List<Chatbot>();
    public ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
}
