using BotFlow.Application.DTOs.Bot;
using BotFlow.Application.DTOs.Conversation;

namespace BotFlow.Application.Interfaces;

public interface IChatbotService
{
    Task<List<ChatbotDto>> GetAllAsync(Guid tenantId);
    Task<ChatbotDto?> GetByIdAsync(Guid id, Guid tenantId);
    Task<ChatbotDto> CreateAsync(Guid tenantId, CreateChatbotDto dto);
    Task<ChatbotDto> UpdateAsync(Guid id, Guid tenantId, UpdateChatbotDto dto);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<ChatbotDto> SetStatusAsync(Guid id, Guid tenantId, string status);

    // Flow management
    Task<(List<FlowNodeDto> Nodes, List<FlowEdgeDto> Edges)> GetFlowAsync(Guid chatbotId, Guid tenantId);
    Task SaveFlowAsync(Guid chatbotId, Guid tenantId, SaveFlowDto dto);

    // Knowledge base
    Task<List<KnowledgeEntryDto>> GetKnowledgeEntriesAsync(Guid chatbotId, Guid tenantId);
    Task<KnowledgeEntryDto> CreateKnowledgeEntryAsync(Guid chatbotId, Guid tenantId, CreateKnowledgeEntryDto dto);
    Task DeleteKnowledgeEntryAsync(Guid entryId, Guid tenantId);

    // Widget embed script generation
    Task<string> GetEmbedScriptAsync(Guid chatbotId, Guid tenantId);
}

public interface IConversationService
{
    Task<ConversationListDto> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20, string? status = null);
    Task<ConversationDto?> GetByIdAsync(Guid id, Guid tenantId);
    Task<ConversationDto> CreateAsync(Guid tenantId, Guid chatbotId, string channel, string? sessionId = null);
    Task<MessageDto> AddMessageAsync(Guid conversationId, Guid tenantId, string role, string content, bool isAi = false, string? aiProvider = null);
    Task<ConversationDto> EscalateAsync(Guid conversationId, Guid tenantId, Guid? agentId = null);
    Task<ConversationDto> ResolveAsync(Guid conversationId, Guid tenantId);
    Task RateAsync(Guid conversationId, int score, string? comment);
    Task<AnalyticsDto> GetAnalyticsAsync(Guid tenantId, DateTime from, DateTime to);
}

public interface IAiService
{
    Task<AiResponseResult> GetResponseAsync(AiRequest request);
}

public interface IFlowEngineService
{
    Task<FlowEngineResult> ProcessMessageAsync(Guid chatbotId, Guid tenantId, Guid conversationId, string userMessage);
}

public interface ITenantService
{
    Task<List<TenantSummaryDto>> GetAllTenantsAsync(); // superadmin only
    Task<TenantDetailDto?> GetTenantAsync(Guid id);
    Task<TenantDetailDto> CreateTenantAsync(CreateTenantDto dto);
    Task<TenantDetailDto> UpdateTenantAsync(Guid id, UpdateTenantDto dto);
    Task<string> GenerateApiKeyAsync(Guid tenantId, string name, string[] scopes);
}

// Additional DTOs needed by interfaces
public record AiRequest(
    string Provider,
    string Model,
    string SystemPrompt,
    List<(string Role, string Content)> History,
    string UserMessage,
    float Temperature,
    int MaxTokens
);

public record AiResponseResult(
    string Content,
    float ConfidenceScore,
    string Provider,
    string Model,
    int TokensUsed,
    bool Success,
    string? Error = null
);

public record FlowEngineResult(
    string BotResponse,
    bool IsAiGenerated,
    bool ShouldEscalate,
    Guid? TriggeredNodeId,
    string? AiProvider,
    float? ConfidenceScore
);

public record TenantSummaryDto(
    Guid Id, string Name, string Slug, string PlanType,
    bool IsActive, int UserCount, int BotCount, int MonthlyConversations
);

public record TenantDetailDto(
    Guid Id, string Name, string Slug, string PlanType,
    bool IsActive, int MaxBots, int MaxConversationsPerMonth,
    DateTime CreatedAt, DateTime? TrialEndsAt
);

public record CreateTenantDto(
    string Name, string Slug, string PlanType,
    string AdminEmail, string AdminPassword,
    string AdminFirstName, string AdminLastName
);

public record UpdateTenantDto(
    string? Name, string? PlanType, bool? IsActive,
    int? MaxBots, int? MaxConversationsPerMonth
);
