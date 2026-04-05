namespace BotFlow.Application.DTOs.Conversation;

public record ConversationDto(
    Guid Id,
    Guid ChatbotId,
    string Status,
    string Channel,
    string SessionId,
    string? VisitorName,
    string? VisitorEmail,
    string? Country,
    Guid? AssignedAgentId,
    DateTime CreatedAt,
    DateTime? ResolvedAt,
    int MessageCount,
    int AiMessageCount,
    int? SatisfactionScore,
    MessageDto? LastMessage
);

public record MessageDto(
    Guid Id,
    Guid ConversationId,
    string Role,
    string Content,
    string ContentType,
    bool IsAiGenerated,
    string? AiProvider,
    float? ConfidenceScore,
    DateTime CreatedAt
);

public record SendMessageDto(
    string Content,
    string ContentType = "text"
);

public record ConversationListDto(
    List<ConversationDto> Items,
    int Total,
    int Page,
    int PageSize
);

public record AnalyticsDto(
    int TotalConversations,
    int ActiveConversations,
    int ResolvedConversations,
    int EscalatedConversations,
    double AiResolutionRate,
    double AvgResponseTimeMs,
    double AvgSatisfactionScore,
    int TotalMessages,
    int AiMessages,
    List<DailyStatDto> DailyStats,
    List<ChannelStatDto> ChannelStats,
    List<IntentStatDto> TopIntents
);

public record DailyStatDto(DateTime Date, int Conversations, int Messages);
public record ChannelStatDto(string Channel, int Count, double Percentage);
public record IntentStatDto(string Intent, int Count, double Percentage);
