using BotFlow.Application.DTOs.Conversation;
using BotFlow.Application.Interfaces;
using BotFlow.Domain.Entities;
using BotFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BotFlow.Infrastructure.Services;

public class ConversationService : IConversationService
{
    private readonly AppDbContext _db;
    private readonly IFlowEngineService _engine;

    public ConversationService(AppDbContext db, IFlowEngineService engine)
    {
        _db     = db;
        _engine = engine;
    }

    public async Task<ConversationListDto> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 20, string? status = null)
    {
        var query = _db.Conversations
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(c => c.TenantId == tenantId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(c => c.Status == status);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => MapToDto(c))
            .ToListAsync();

        return new ConversationListDto(items, total, page, pageSize);
    }

    public async Task<ConversationDto?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var conv = await _db.Conversations
            .Include(c => c.Messages.OrderBy(m => m.CreatedAt))
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        return conv is null ? null : MapToDto(conv);
    }

    public async Task<ConversationDto> CreateAsync(Guid tenantId, Guid chatbotId, string channel, string? sessionId = null)
    {
        var conv = new Conversation
        {
            TenantId  = tenantId,
            ChatbotId = chatbotId,
            Channel   = channel,
            SessionId = sessionId ?? Guid.NewGuid().ToString("N"),
            Status    = "active",
        };
        _db.Conversations.Add(conv);
        await _db.SaveChangesAsync();
        return MapToDto(conv);
    }

    public async Task<MessageDto> AddMessageAsync(
        Guid conversationId, Guid tenantId, string role, string content,
        bool isAi = false, string? aiProvider = null)
    {
        var conv = await _db.Conversations.FindAsync(conversationId)
            ?? throw new KeyNotFoundException("Conversation not found.");

        var msg = new Message
        {
            ConversationId = conversationId,
            TenantId       = tenantId,
            Role           = role,
            Content        = content,
            IsAiGenerated  = isAi,
            AiProvider     = aiProvider,
        };
        _db.Messages.Add(msg);
        conv.MessageCount++;
        if (isAi) conv.AiMessageCount++;

        await _db.SaveChangesAsync();
        return MapMsgToDto(msg);
    }

    public async Task<ConversationDto> EscalateAsync(Guid conversationId, Guid tenantId, Guid? agentId = null)
    {
        var conv = await _db.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Conversation not found.");
        conv.Status          = "escalated";
        conv.EscalatedAt     = DateTime.UtcNow;
        conv.AssignedAgentId = agentId;
        await _db.SaveChangesAsync();
        return MapToDto(conv);
    }

    public async Task<ConversationDto> ResolveAsync(Guid conversationId, Guid tenantId)
    {
        var conv = await _db.Conversations.FirstOrDefaultAsync(c => c.Id == conversationId && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Conversation not found.");
        conv.Status     = "resolved";
        conv.ResolvedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapToDto(conv);
    }

    public async Task RateAsync(Guid conversationId, int score, string? comment)
    {
        var conv = await _db.Conversations.FindAsync(conversationId)
            ?? throw new KeyNotFoundException("Conversation not found.");
        conv.SatisfactionScore   = Math.Clamp(score, 1, 5);
        conv.SatisfactionComment = comment;
        await _db.SaveChangesAsync();
    }

    // ── Analytics ────────────────────────────────────────────────────────────
    public async Task<AnalyticsDto> GetAnalyticsAsync(Guid tenantId, DateTime from, DateTime to)
    {
        var convs = await _db.Conversations
            .Where(c => c.TenantId == tenantId && c.CreatedAt >= from && c.CreatedAt <= to)
            .ToListAsync();

        var total      = convs.Count;
        var resolved   = convs.Count(c => c.Status == "resolved");
        var escalated  = convs.Count(c => c.Status == "escalated");
        var active     = convs.Count(c => c.Status == "active");
        var totalMsgs  = convs.Sum(c => c.MessageCount);
        var aiMsgs     = convs.Sum(c => c.AiMessageCount);
        var aiRate     = totalMsgs > 0 ? (double)aiMsgs / totalMsgs * 100 : 0;
        var avgScore   = convs.Where(c => c.SatisfactionScore.HasValue).Average(c => (double?)c.SatisfactionScore) ?? 0;

        // Daily stats
        var dailyStats = convs
            .GroupBy(c => c.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyStatDto(g.Key, g.Count(), g.Sum(c => c.MessageCount)))
            .ToList();

        // Channel breakdown
        var channelStats = convs
            .GroupBy(c => c.Channel)
            .Select(g => new ChannelStatDto(g.Key, g.Count(), total > 0 ? (double)g.Count() / total * 100 : 0))
            .ToList();

        return new AnalyticsDto(
            TotalConversations:  total,
            ActiveConversations: active,
            ResolvedConversations: resolved,
            EscalatedConversations: escalated,
            AiResolutionRate:    aiRate,
            AvgResponseTimeMs:   1300, // placeholder — real impl uses Message.CreatedAt diffs
            AvgSatisfactionScore: avgScore,
            TotalMessages:       totalMsgs,
            AiMessages:          aiMsgs,
            DailyStats:          dailyStats,
            ChannelStats:        channelStats,
            TopIntents:          new List<IntentStatDto>() // populated by NLP pipeline later
        );
    }

    // ── Mappers ──────────────────────────────────────────────────────────────
    private static ConversationDto MapToDto(Conversation c)
    {
        var lastMsg = c.Messages?.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
        return new ConversationDto(
            c.Id, c.ChatbotId, c.Status, c.Channel, c.SessionId,
            c.VisitorName, c.VisitorEmail, c.Country,
            c.AssignedAgentId, c.CreatedAt, c.ResolvedAt,
            c.MessageCount, c.AiMessageCount, c.SatisfactionScore,
            lastMsg is null ? null : MapMsgToDto(lastMsg));
    }

    private static MessageDto MapMsgToDto(Message m) => new(
        m.Id, m.ConversationId, m.Role, m.Content, m.ContentType,
        m.IsAiGenerated, m.AiProvider, m.ConfidenceScore, m.CreatedAt);
}
