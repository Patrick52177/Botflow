using BotFlow.Application.DTOs.Bot;
using BotFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BotFlow.API.Controllers;

[ApiController]
[Route("api/chatbots")]
[Authorize]
public class ChatbotsController : ControllerBase
{
    private readonly IChatbotService _bots;
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);

    public ChatbotsController(IChatbotService bots) => _bots = bots;

    // GET api/chatbots
    [HttpGet]
    public async Task<ActionResult<List<ChatbotDto>>> GetAll() =>
        Ok(await _bots.GetAllAsync(TenantId));

    // GET api/chatbots/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChatbotDto>> GetById(Guid id)
    {
        var bot = await _bots.GetByIdAsync(id, TenantId);
        return bot is null ? NotFound() : Ok(bot);
    }

    // POST api/chatbots
    [HttpPost]
    public async Task<ActionResult<ChatbotDto>> Create([FromBody] CreateChatbotDto dto)
    {
        try
        {
            var bot = await _bots.CreateAsync(TenantId, dto);
            return CreatedAtAction(nameof(GetById), new { id = bot.Id }, bot);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // PATCH api/chatbots/{id}
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<ChatbotDto>> Update(Guid id, [FromBody] UpdateChatbotDto dto)
    {
        try
        {
            var bot = await _bots.UpdateAsync(id, TenantId, dto);
            return Ok(bot);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // DELETE api/chatbots/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try { await _bots.DeleteAsync(id, TenantId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // PATCH api/chatbots/{id}/status
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ChatbotDto>> SetStatus(Guid id, [FromBody] SetStatusDto dto)
    {
        try { return Ok(await _bots.SetStatusAsync(id, TenantId, dto.Status)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Flow ─────────────────────────────────────────────────────────────────

    // GET api/chatbots/{id}/flow
    [HttpGet("{id:guid}/flow")]
    public async Task<IActionResult> GetFlow(Guid id)
    {
        var (nodes, edges) = await _bots.GetFlowAsync(id, TenantId);
        return Ok(new { nodes, edges });
    }

    // PUT api/chatbots/{id}/flow
    [HttpPut("{id:guid}/flow")]
    public async Task<IActionResult> SaveFlow(Guid id, [FromBody] SaveFlowDto dto)
    {
        await _bots.SaveFlowAsync(id, TenantId, dto);
        return NoContent();
    }

    // ── Knowledge base ────────────────────────────────────────────────────────

    // GET api/chatbots/{id}/knowledge
    [HttpGet("{id:guid}/knowledge")]
    public async Task<ActionResult<List<KnowledgeEntryDto>>> GetKnowledge(Guid id) =>
        Ok(await _bots.GetKnowledgeEntriesAsync(id, TenantId));

    // POST api/chatbots/{id}/knowledge
    [HttpPost("{id:guid}/knowledge")]
    public async Task<ActionResult<KnowledgeEntryDto>> CreateKnowledge(Guid id, [FromBody] CreateKnowledgeEntryDto dto)
    {
        var entry = await _bots.CreateKnowledgeEntryAsync(id, TenantId, dto);
        return Created($"/api/chatbots/{id}/knowledge/{entry.Id}", entry);
    }

    // DELETE api/chatbots/{id}/knowledge/{entryId}
    [HttpDelete("{id:guid}/knowledge/{entryId:guid}")]
    public async Task<IActionResult> DeleteKnowledge(Guid id, Guid entryId)
    {
        try { await _bots.DeleteKnowledgeEntryAsync(entryId, TenantId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Embed script ──────────────────────────────────────────────────────────

    // GET api/chatbots/{id}/embed
    [HttpGet("{id:guid}/embed")]
    public async Task<IActionResult> GetEmbed(Guid id)
    {
        try
        {
            var script = await _bots.GetEmbedScriptAsync(id, TenantId);
            return Ok(new { script });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}

public record SetStatusDto(string Status);
