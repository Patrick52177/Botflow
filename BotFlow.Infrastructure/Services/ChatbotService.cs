using BotFlow.Application.DTOs.Bot;
using BotFlow.Application.Interfaces;
using BotFlow.Domain.Entities;
using BotFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BotFlow.Infrastructure.Services;

public class ChatbotService : IChatbotService
{
    private readonly AppDbContext _db;

    public ChatbotService(AppDbContext db) => _db = db;

    // ── List all bots for current tenant ────────────────────────────────────
    public async Task<List<ChatbotDto>> GetAllAsync(Guid tenantId)
    {
        return await _db.Chatbots
            .Where(c => c.TenantId == tenantId)
            .Select(c => MapToDto(c))
            .ToListAsync();
    }

    public async Task<ChatbotDto?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var bot = await _db.Chatbots.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        return bot is null ? null : MapToDto(bot);
    }

    // ── Create ───────────────────────────────────────────────────────────────
    public async Task<ChatbotDto> CreateAsync(Guid tenantId, CreateChatbotDto dto)
    {
        // Enforce plan limit
        var tenant = await _db.Tenants.FindAsync(tenantId)
            ?? throw new InvalidOperationException("Tenant not found.");
        var botCount = await _db.Chatbots.CountAsync(c => c.TenantId == tenantId);
        if (botCount >= tenant.MaxBots)
            throw new InvalidOperationException($"Plan limit reached: max {tenant.MaxBots} chatbot(s) on your plan.");

        var bot = new Chatbot
        {
            TenantId        = tenantId,
            Name            = dto.Name,
            Description     = dto.Description,
            Channel         = dto.Channel,
            WelcomeMessage  = dto.WelcomeMessage ?? "Bonjour ! Comment puis-je vous aider ?",
            SystemPrompt    = dto.SystemPrompt,
            Status          = "draft",
        };

        // Seed a default trigger node
        var triggerNode = new FlowNode
        {
            ChatbotId    = bot.Id,
            TenantId     = tenantId,
            Type         = "trigger",
            Label        = "Déclencheur",
            ContentJson  = """{"event":"chat_opened"}""",
            PosX         = 80,
            PosY         = 100,
        };
        var welcomeNode = new FlowNode
        {
            ChatbotId    = bot.Id,
            TenantId     = tenantId,
            Type         = "message",
            Label        = "Message d'accueil",
            ContentJson  = "{\"text\": \"" + bot.WelcomeMessage + "\"}",
            PosX         = 320,
            PosY         = 100,
        };

        _db.Chatbots.Add(bot);
        _db.FlowNodes.AddRange(triggerNode, welcomeNode);
        _db.FlowEdges.Add(new FlowEdge
        {
            ChatbotId    = bot.Id,
            TenantId     = tenantId,
            SourceNodeId = triggerNode.Id,
            TargetNodeId = welcomeNode.Id,
        });

        await _db.SaveChangesAsync();
        return MapToDto(bot);
    }

    // ── Update ───────────────────────────────────────────────────────────────
    public async Task<ChatbotDto> UpdateAsync(Guid id, Guid tenantId, UpdateChatbotDto dto)
    {
        var bot = await _db.Chatbots.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Chatbot not found.");

        if (dto.Name              is not null) bot.Name              = dto.Name;
        if (dto.Description       is not null) bot.Description       = dto.Description;
        if (dto.Status            is not null) bot.Status            = dto.Status;
        if (dto.AiProvider        is not null) bot.AiProvider        = dto.AiProvider;
        if (dto.AiModel           is not null) bot.AiModel           = dto.AiModel;
        if (dto.SystemPrompt      is not null) bot.SystemPrompt      = dto.SystemPrompt;
        if (dto.Temperature       is not null) bot.Temperature       = dto.Temperature.Value;
        if (dto.MaxTokens         is not null) bot.MaxTokens         = dto.MaxTokens.Value;
        if (dto.ConfidenceThreshold is not null) bot.ConfidenceThreshold = dto.ConfidenceThreshold.Value;
        if (dto.WidgetTitle       is not null) bot.WidgetTitle       = dto.WidgetTitle;
        if (dto.WidgetSubtitle    is not null) bot.WidgetSubtitle    = dto.WidgetSubtitle;
        if (dto.WidgetColor       is not null) bot.WidgetColor       = dto.WidgetColor;
        if (dto.WelcomeMessage    is not null) bot.WelcomeMessage    = dto.WelcomeMessage;

        await _db.SaveChangesAsync();
        return MapToDto(bot);
    }

    // ── Delete (soft) ────────────────────────────────────────────────────────
    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        var bot = await _db.Chatbots.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Chatbot not found.");
        bot.IsDeleted = true;
        await _db.SaveChangesAsync();
    }

    public async Task<ChatbotDto> SetStatusAsync(Guid id, Guid tenantId, string status)
    {
        var bot = await _db.Chatbots.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Chatbot not found.");
        bot.Status = status;
        await _db.SaveChangesAsync();
        return MapToDto(bot);
    }

    // ── Flow ─────────────────────────────────────────────────────────────────
    public async Task<(List<FlowNodeDto> Nodes, List<FlowEdgeDto> Edges)> GetFlowAsync(Guid chatbotId, Guid tenantId)
    {
        var nodes = await _db.FlowNodes
            .Where(n => n.ChatbotId == chatbotId && n.TenantId == tenantId)
            .Select(n => new FlowNodeDto(n.Id, n.ChatbotId, n.Type, n.Label, n.ContentJson, n.PosX, n.PosY))
            .ToListAsync();

        var edges = await _db.FlowEdges
            .Where(e => e.ChatbotId == chatbotId && e.TenantId == tenantId)
            .Select(e => new FlowEdgeDto(e.Id, e.SourceNodeId, e.TargetNodeId, e.ConditionLabel))
            .ToListAsync();

        return (nodes, edges);
    }

    public async Task SaveFlowAsync(Guid chatbotId, Guid tenantId, SaveFlowDto dto)
    {
        // Replace all nodes and edges for this chatbot atomically
        var existingNodes = await _db.FlowNodes
            .Where(n => n.ChatbotId == chatbotId && n.TenantId == tenantId)
            .ToListAsync();
        var existingEdges = await _db.FlowEdges
            .Where(e => e.ChatbotId == chatbotId && e.TenantId == tenantId)
            .ToListAsync();

        _db.FlowEdges.RemoveRange(existingEdges);
        _db.FlowNodes.RemoveRange(existingNodes);

        var newNodes = dto.Nodes.Select(n => new FlowNode
        {
            Id          = n.Id == Guid.Empty ? Guid.NewGuid() : n.Id,
            ChatbotId   = chatbotId,
            TenantId    = tenantId,
            Type        = n.Type,
            Label       = n.Label,
            ContentJson = n.ContentJson,
            PosX        = n.PosX,
            PosY        = n.PosY,
        }).ToList();

        _db.FlowNodes.AddRange(newNodes);
        await _db.SaveChangesAsync();

        // Map old IDs → new IDs for edges
        var idMap = dto.Nodes
            .Where(n => n.Id != Guid.Empty)
            .ToDictionary(n => n.Id, n => n.Id);

        var newEdges = dto.Edges.Select(e => new FlowEdge
        {
            ChatbotId    = chatbotId,
            TenantId     = tenantId,
            SourceNodeId = idMap.GetValueOrDefault(e.SourceNodeId, e.SourceNodeId),
            TargetNodeId = idMap.GetValueOrDefault(e.TargetNodeId, e.TargetNodeId),
            ConditionLabel = e.ConditionLabel,
        }).ToList();

        _db.FlowEdges.AddRange(newEdges);
        await _db.SaveChangesAsync();
    }

    // ── Knowledge base ───────────────────────────────────────────────────────
    public async Task<List<KnowledgeEntryDto>> GetKnowledgeEntriesAsync(Guid chatbotId, Guid tenantId)
    {
        return await _db.KnowledgeEntries
            .Where(k => k.ChatbotId == chatbotId && k.TenantId == tenantId)
            .OrderByDescending(k => k.Priority)
            .Select(k => new KnowledgeEntryDto(k.Id, k.Question, k.Answer, k.Keywords, k.Category, k.IsActive, k.Priority))
            .ToListAsync();
    }

    public async Task<KnowledgeEntryDto> CreateKnowledgeEntryAsync(Guid chatbotId, Guid tenantId, CreateKnowledgeEntryDto dto)
    {
        var entry = new KnowledgeEntry
        {
            TenantId  = tenantId,
            ChatbotId = chatbotId,
            Question  = dto.Question,
            Answer    = dto.Answer,
            Keywords  = dto.Keywords,
            Category  = dto.Category,
            Priority  = dto.Priority,
        };
        _db.KnowledgeEntries.Add(entry);
        await _db.SaveChangesAsync();
        return new KnowledgeEntryDto(entry.Id, entry.Question, entry.Answer, entry.Keywords, entry.Category, entry.IsActive, entry.Priority);
    }

    public async Task DeleteKnowledgeEntryAsync(Guid entryId, Guid tenantId)
    {
        var entry = await _db.KnowledgeEntries
            .FirstOrDefaultAsync(k => k.Id == entryId && k.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Knowledge entry not found.");
        entry.IsDeleted = true;
        await _db.SaveChangesAsync();
    }

    // ── Embed script ─────────────────────────────────────────────────────────
    public async Task<string> GetEmbedScriptAsync(Guid chatbotId, Guid tenantId)
    {
        var bot = await _db.Chatbots
            .Include(c => c.Tenant)
            .FirstOrDefaultAsync(c => c.Id == chatbotId && c.TenantId == tenantId)
            ?? throw new KeyNotFoundException("Chatbot not found.");

        return $"""
        <!-- BotFlow Widget — {bot.Name} -->
        <script
          src="https://cdn.botflow.io/widget.js"
          data-tenant-id="{tenantId}"
          data-bot-id="{chatbotId}"
          data-theme="{bot.WidgetColor ?? "#6C63FF"}"
          data-lang="fr"
          async>
        </script>
        """;
    }

    // ── Mapper ───────────────────────────────────────────────────────────────
    private static ChatbotDto MapToDto(Chatbot c) => new(
        c.Id, c.TenantId, c.Name, c.Description, c.Status, c.Channel,
        c.AiProvider, c.AiModel, c.SystemPrompt, c.Temperature, c.MaxTokens,
        c.WidgetColor, c.WelcomeMessage, c.CreatedAt,
        c.Conversations?.Count ?? 0,
        c.Conversations?.Sum(conv => conv.MessageCount) ?? 0
    );
}
