using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BotFlow.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BotFlow.Infrastructure.Services;

public class AiService : IAiService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AiService> _logger;

    public AiService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<AiService> logger)
    {
        _httpFactory = httpFactory;
        _config      = config;
        _logger      = logger;
    }

    public async Task<AiResponseResult> GetResponseAsync(AiRequest request)
    {
        try
        {
            return request.Provider.ToLower() switch
            {
                "groq"   => await CallGroqAsync(request),
                "gemini" => await CallGeminiAsync(request),
                _        => await CallGroqAsync(request),
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning("AI provider '{P}' failed: {E}.", request.Provider, ex.Message);
            return new AiResponseResult(
                "Je suis désolé, je ne peux pas répondre pour le moment.",
                0f, request.Provider, request.Model, 0, false, ex.Message);
        }
    }

    // ── Groq (LLaMA 3) ──────────────────────────────────────────────────────
    private async Task<AiResponseResult> CallGroqAsync(AiRequest req)
    {
        var apiKey = _config["AI:Groq:ApiKey"]
            ?? throw new InvalidOperationException("Groq API key not configured.");

        var client = _httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var messages = new List<object>
        {
            new { role = "system", content = req.SystemPrompt }
        };
        messages.AddRange(req.History.Select(h => (object)new { role = h.Role, content = h.Content }));
        messages.Add(new { role = "user", content = req.UserMessage });

        var body = new
        {
            model       = _config["AI:Groq:Model"] ?? "llama3-8b-8192",
            max_tokens  = req.MaxTokens,
            temperature = req.Temperature,
            messages,
        };

        var json     = JsonSerializer.Serialize(body);
        var response = await client.PostAsync(
            "https://api.groq.com/openai/v1/chat/completions",
            new StringContent(json, Encoding.UTF8, "application/json"));

       if (!response.IsSuccessStatusCode)
{
    var errorBody = await response.Content.ReadAsStringAsync();
    _logger.LogError("Groq error {Status}: {Body}", (int)response.StatusCode, errorBody);
    response.EnsureSuccessStatusCode();
}
        var result = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());

        var text = result
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;

        var tokens = result.TryGetProperty("usage", out var usage)
            ? usage.GetProperty("completion_tokens").GetInt32()
            : 0;

        return new AiResponseResult(text, 0.85f, "groq", body.model, tokens, true);
    }

    // ── Gemini (Google) ──────────────────────────────────────────────────────
    private async Task<AiResponseResult> CallGeminiAsync(AiRequest req)
    {
        var apiKey = _config["AI:Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key not configured.");

        var client = _httpFactory.CreateClient();
        var model  = _config["AI:Gemini:Model"] ?? "gemini-1.5-pro";

        var parts = new List<object>();
        if (!string.IsNullOrEmpty(req.SystemPrompt))
            parts.Add(new { text = req.SystemPrompt });
        foreach (var (role, content) in req.History)
            parts.Add(new { text = $"{role}: {content}" });
        parts.Add(new { text = req.UserMessage });

        var body = new
        {
            contents         = new[] { new { parts } },
            generationConfig = new { maxOutputTokens = req.MaxTokens, temperature = req.Temperature }
        };

        var json     = JsonSerializer.Serialize(body);
        var url      = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
        var response = await client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();
        var result = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());

        var text = result
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;

        return new AiResponseResult(text, 0.88f, "gemini", model, 0, true);
    }
}