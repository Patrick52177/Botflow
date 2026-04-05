namespace BotFlow.Application.DTOs.Bot;

public record CreateChatbotDto(
    string Name,
    string? Description,
    string Channel,
    string? WelcomeMessage,
    string? SystemPrompt
);

public record UpdateChatbotDto(
    string? Name,
    string? Description,
    string? Status,
    string? AiProvider,
    string? AiModel,
    string? SystemPrompt,
    float? Temperature,
    int? MaxTokens,
    float? ConfidenceThreshold,
    string? WidgetTitle,
    string? WidgetSubtitle,
    string? WidgetColor,
    string? WelcomeMessage
);

public record ChatbotDto(
    Guid Id,
    Guid TenantId,
    string Name,
    string? Description,
    string Status,
    string Channel,
    string AiProvider,
    string AiModel,
    string? SystemPrompt,
    float Temperature,
    int MaxTokens,
    string? WidgetColor,
    string? WelcomeMessage,
    DateTime CreatedAt,
    int ConversationCount,
    int MessageCount
);

public record FlowNodeDto(
    Guid Id,
    Guid ChatbotId,
    string Type,
    string Label,
    string ContentJson,
    float PosX,
    float PosY
);

public record FlowEdgeDto(
    Guid Id,
    Guid SourceNodeId,
    Guid TargetNodeId,
    string? ConditionLabel
);

public record SaveFlowDto(
    List<FlowNodeDto> Nodes,
    List<FlowEdgeDto> Edges
);

public record KnowledgeEntryDto(
    Guid Id,
    string Question,
    string Answer,
    string[] Keywords,
    string? Category,
    bool IsActive,
    int Priority
);

public record CreateKnowledgeEntryDto(
    string Question,
    string Answer,
    string[] Keywords,
    string? Category,
    int Priority = 0
);
