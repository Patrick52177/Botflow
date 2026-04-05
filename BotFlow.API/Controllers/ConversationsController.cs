using BotFlow.Application.DTOs.Conversation;
using BotFlow.Application.Interfaces;
using BotFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BotFlow.API.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _convs;
    private readonly IFlowEngineService _flowEngine;
    private readonly AppDbContext _db;
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    public ConversationsController(
        IConversationService convs,
        IFlowEngineService flowEngine,
        AppDbContext db)
    {
        _convs      = convs;
        _flowEngine = flowEngine;
        _db         = db;
    }

    [HttpGet]
    public async Task<ActionResult<ConversationListDto>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
        => Ok(await _convs.GetAllAsync(TenantId, page, pageSize, status));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ConversationDto>> GetById(Guid id)
    {
        var conv = await _convs.GetByIdAsync(id, TenantId);
        return conv is null ? NotFound() : Ok(conv);
    }

    // ✅ Retourne le welcomeMessage du chatbot
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<object>> Create([FromBody] CreateConversationDto dto)
    {
        var conv = await _convs.CreateAsync(
            dto.TenantId, dto.ChatbotId, dto.Channel, dto.SessionId);

        // Récupérer le chatbot pour le message de bienvenue
        var chatbot = await _db.Chatbots
            .FirstOrDefaultAsync(c =>
                c.Id == dto.ChatbotId &&
                c.TenantId == dto.TenantId);

        return CreatedAtAction(nameof(GetById), new { id = conv.Id }, new
        {
            conv.Id,
            conv.Status,
            conv.Channel,
            conv.SessionId,
            welcomeMessage = chatbot?.WelcomeMessage
                ?? "Bonjour ! Comment puis-je vous aider ?",
            chatbot = chatbot is null ? null : new
            {
                chatbot.Name,
                chatbot.WelcomeMessage,
                chatbot.WidgetTitle,
                chatbot.WidgetColor,
            }
        });
    }

    [HttpPost("{id:guid}/messages")]
    [AllowAnonymous]
    public async Task<ActionResult<MessageDto>> AddMessage(
        Guid id, [FromBody] SendMessageFromWidgetDto dto)
    {
        try
        {
            await _convs.AddMessageAsync(id, dto.TenantId, "user", dto.Content);

            var conv = await _convs.GetByIdAsync(id, dto.TenantId);
            if (conv != null)
            {
                var result = await _flowEngine.ProcessMessageAsync(
                    conv.ChatbotId, dto.TenantId, id, dto.Content);

                var botMsg = await _convs.AddMessageAsync(
                    id, dto.TenantId, "bot",
                    result.BotResponse,
                    isAi: result.IsAiGenerated,
                    aiProvider: result.AiProvider);

                return Ok(botMsg);
            }

            return Ok(new { role = "bot", content = "Bonjour !" });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPatch("{id:guid}/escalate")]
    public async Task<ActionResult<ConversationDto>> Escalate(
        Guid id, [FromBody] EscalateDto? dto)
    {
        try { return Ok(await _convs.EscalateAsync(id, TenantId, dto?.AgentId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPatch("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        try { return Ok(await _convs.ResolveAsync(id, TenantId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/rate")]
    [AllowAnonymous]
    public async Task<IActionResult> Rate(Guid id, [FromBody] RateDto dto)
    {
        await _convs.RateAsync(id, dto.Score, dto.Comment);
        return NoContent();
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<AnalyticsDto>> GetAnalytics(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var dateFrom = from ?? DateTime.UtcNow.AddDays(-30);
        var dateTo   = to   ?? DateTime.UtcNow;
        return Ok(await _convs.GetAnalyticsAsync(TenantId, dateFrom, dateTo));
    }
}

public record CreateConversationDto(Guid TenantId, Guid ChatbotId, string Channel, string? SessionId);
public record SendMessageFromWidgetDto(Guid TenantId, string Content);
public record EscalateDto(Guid? AgentId);
public record RateDto(int Score, string? Comment);