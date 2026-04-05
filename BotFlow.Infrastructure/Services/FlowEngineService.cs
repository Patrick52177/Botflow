using System.Text.Json;
using BotFlow.Application.Interfaces;
using BotFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BotFlow.Infrastructure.Services;

public class FlowEngineService : IFlowEngineService
{
    private readonly AppDbContext _db;
    private readonly IAiService   _ai;
    private readonly ILogger<FlowEngineService> _logger;

    public FlowEngineService(AppDbContext db, IAiService ai, ILogger<FlowEngineService> logger)
    {
        _db     = db;
        _ai     = ai;
        _logger = logger;
    }

    public async Task<FlowEngineResult> ProcessMessageAsync(
        Guid chatbotId, Guid tenantId, Guid conversationId, string userMessage)
    {
        var bot = await _db.Chatbots.FindAsync(chatbotId)
            ?? throw new KeyNotFoundException("Chatbot not found.");

        var knowledgeResult = await MatchKnowledgeBaseAsync(chatbotId, tenantId, userMessage);
        if (knowledgeResult is not null)
        {
            return new FlowEngineResult(
                BotResponse:     knowledgeResult,
                IsAiGenerated:   false,
                ShouldEscalate:  false,
                TriggeredNodeId: null,
                AiProvider:      null,
                ConfidenceScore: 1.0f
            );
        }

        var flowResult = await MatchFlowConditionAsync(chatbotId, tenantId, userMessage);
        if (flowResult is not null)
        {
            return new FlowEngineResult(
                BotResponse:     flowResult.Response,
                IsAiGenerated:   false,
                ShouldEscalate:  flowResult.IsHandoff,
                TriggeredNodeId: flowResult.NodeId,
                AiProvider:      null,
                ConfidenceScore: 0.95f
            );
        }

        var history = await GetConversationHistoryAsync(conversationId);

        var systemPrompt = string.IsNullOrEmpty(bot.SystemPrompt)
            ? $"Tu es un assistant virtuel. Réponds toujours en français de manière professionnelle et concise."
            : bot.SystemPrompt;

        var aiResult = await _ai.GetResponseAsync(new AiRequest(
            Provider:     bot.AiProvider,
            Model:        bot.AiModel,
            SystemPrompt: systemPrompt,
            History:      history,
            UserMessage:  userMessage,
            Temperature:  bot.Temperature,
            MaxTokens:    bot.MaxTokens
        ));

        if (!aiResult.Success)
        {
            return new FlowEngineResult(
                BotResponse:     aiResult.Content,
                IsAiGenerated:   true,
                ShouldEscalate:  true,
                TriggeredNodeId: null,
                AiProvider:      aiResult.Provider,
                ConfidenceScore: 0f
            );
        }

        return new FlowEngineResult(
            BotResponse:     aiResult.Content,
            IsAiGenerated:   true,
            ShouldEscalate:  aiResult.ConfidenceScore < bot.ConfidenceThreshold,
            TriggeredNodeId: null,
            AiProvider:      aiResult.Provider,
            ConfidenceScore: aiResult.ConfidenceScore
        );
    }

    private async Task<string?> MatchKnowledgeBaseAsync(Guid chatbotId, Guid tenantId, string userMessage)
    {
        var entries = await _db.KnowledgeEntries
            .Where(k => k.ChatbotId == chatbotId && k.TenantId == tenantId && k.IsActive)
            .OrderByDescending(k => k.Priority)
            .ToListAsync();

        var msgLower = userMessage.ToLower();

        foreach (var entry in entries)
        {
            if (entry.Keywords.Any(kw => msgLower.Contains(kw.ToLower())))
            {
                entry.UsageCount++;
                await _db.SaveChangesAsync();
                return entry.Answer;
            }
        }
        return null;
    }

    private async Task<FlowMatchResult?> MatchFlowConditionAsync(Guid chatbotId, Guid tenantId, string userMessage)
    {
        var conditionNodes = await _db.FlowNodes
            .Where(n => n.ChatbotId == chatbotId && n.TenantId == tenantId && n.Type == "condition")
            .ToListAsync();

        var msgLower = userMessage.ToLower();

        foreach (var node in conditionNodes)
        {
            try
            {
                var content = JsonSerializer.Deserialize<JsonElement>(node.ContentJson);
                if (!content.TryGetProperty("keyword", out var kw)) continue;
                var keyword = kw.GetString()?.ToLower();
                if (string.IsNullOrEmpty(keyword) || !msgLower.Contains(keyword)) continue;

                var yesEdge = await _db.FlowEdges
                    .Include(e => e.TargetNode)
                    .FirstOrDefaultAsync(e =>
                        e.SourceNodeId == node.Id &&
                        e.ConditionLabel == "yes");

                if (yesEdge?.TargetNode is null) continue;

                var targetContent = JsonSerializer.Deserialize<JsonElement>(yesEdge.TargetNode.ContentJson);
                var response = targetContent.TryGetProperty("text", out var t) ? t.GetString() : null;
                var isHandoff = yesEdge.TargetNode.Type == "handoff";

                if (response is not null)
                    return new FlowMatchResult(response, isHandoff, yesEdge.TargetNode.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error parsing flow node {NodeId}: {Ex}", node.Id, ex.Message);
            }
        }
        return null;
    }

    // ── CORRECTION : utiliser une classe anonyme au lieu de ValueTuple ────────
    private async Task<List<(string Role, string Content)>> GetConversationHistoryAsync(Guid conversationId)
    {
        var messages = await _db.Messages
            .Where(m => m.ConversationId == conversationId && m.Role != "system")
            .OrderByDescending(m => m.CreatedAt)
            .Take(10)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.Role, m.Content })
            .ToListAsync();

        return messages
            .Select(m => (m.Role == "bot" ? "assistant" : "user", m.Content))
            .ToList();
    }

    private record FlowMatchResult(string Response, bool IsHandoff, Guid NodeId);
}