using BotFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BotFlow.API.Hubs;

/// <summary>
/// SignalR hub — handles real-time chat between visitors, bots, and agents.
///
/// Client events received:
///   JoinConversation(conversationId)
///   SendMessage(conversationId, content)
///   AgentSendMessage(conversationId, content)
///   TypingIndicator(conversationId, isTyping)
///
/// Client events emitted:
///   MessageReceived(message)
///   BotTyping(conversationId, bool)
///   ConversationEscalated(conversationId)
///   ConversationResolved(conversationId)
///   Error(message)
/// </summary>
public class ChatHub : Hub
{
    private readonly IConversationService _conversations;
    private readonly IFlowEngineService   _flowEngine;
    private readonly ILogger<ChatHub>     _logger;

    public ChatHub(
        IConversationService conversations,
        IFlowEngineService   flowEngine,
        ILogger<ChatHub>     logger)
    {
        _conversations = conversations;
        _flowEngine    = flowEngine;
        _logger        = logger;
    }

    // ── Visitor connects and joins a conversation room ────────────────────────
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
        _logger.LogInformation("Client {Conn} joined conversation {Conv}", Context.ConnectionId, conversationId);
    }

    // ── Visitor sends a message — triggers flow engine ────────────────────────
    public async Task SendMessage(string conversationId, Guid tenantId, Guid chatbotId, string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        var convId = Guid.Parse(conversationId);

        // 1. Persist user message
        var userMsg = await _conversations.AddMessageAsync(convId, tenantId, "user", content);
        await Clients.Group(conversationId).SendAsync("MessageReceived", userMsg);

        // 2. Show bot typing indicator
        await Clients.Group(conversationId).SendAsync("BotTyping", conversationId, true);

        try
        {
            // 3. Run through flow engine (rules → AI)
            var result = await _flowEngine.ProcessMessageAsync(chatbotId, tenantId, convId, content);

            // 4. Persist bot response
            var botMsg = await _conversations.AddMessageAsync(
                convId, tenantId, "bot", result.BotResponse,
                isAi: result.IsAiGenerated, aiProvider: result.AiProvider);

            // 5. Stop typing indicator and send bot message
            await Clients.Group(conversationId).SendAsync("BotTyping", conversationId, false);
            await Clients.Group(conversationId).SendAsync("MessageReceived", botMsg);

            // 6. Auto-escalate if engine requested it
            if (result.ShouldEscalate)
            {
                await _conversations.EscalateAsync(convId, tenantId);
                await Clients.Group(conversationId).SendAsync("ConversationEscalated", conversationId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message for conversation {Conv}", conversationId);
            await Clients.Group(conversationId).SendAsync("BotTyping", conversationId, false);
            await Clients.Caller.SendAsync("Error", "An error occurred processing your message.");
        }
    }

    // ── Agent sends a manual reply ────────────────────────────────────────────
    [Authorize]
    public async Task AgentSendMessage(string conversationId, Guid tenantId, string content)
    {
        var convId   = Guid.Parse(conversationId);
        var agentMsg = await _conversations.AddMessageAsync(convId, tenantId, "agent", content);
        await Clients.Group(conversationId).SendAsync("MessageReceived", agentMsg);
    }

    // ── Typing indicator ──────────────────────────────────────────────────────
    public async Task TypingIndicator(string conversationId, bool isTyping)
    {
        await Clients.OthersInGroup(conversationId)
            .SendAsync("VisitorTyping", conversationId, isTyping);
    }

    // ── Agent resolves a conversation ─────────────────────────────────────────
    [Authorize]
    public async Task ResolveConversation(string conversationId, Guid tenantId)
    {
        await _conversations.ResolveAsync(Guid.Parse(conversationId), tenantId);
        await Clients.Group(conversationId).SendAsync("ConversationResolved", conversationId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client {Conn} disconnected", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
