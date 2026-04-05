using BotFlow.Application.DTOs.Auth;
using BotFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BotFlow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>
    /// Creates a new tenant + admin user. Returns JWT tokens.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var result = await _auth.RegisterAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Authenticates a user within a specific tenant (identified by slug).
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var result = await _auth.LoginAsync(dto);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Issues a new access token using a valid refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshRequestDto dto)
    {
        try
        {
            var result = await _auth.RefreshTokenAsync(dto.RefreshToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Revokes the refresh token of the current user (logout).
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        await _auth.RevokeTokenAsync(userId);
        return NoContent();
    }

    /// <summary>
    /// Returns the current authenticated user info.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId   = User.FindFirst("sub")?.Value,
            email    = User.FindFirst("email")?.Value,
            tenantId = User.FindFirst("tenant_id")?.Value,
            role     = User.FindFirst("role")?.Value,
            name     = User.FindFirst("name")?.Value,
        });
    }
}

public record RefreshRequestDto(string RefreshToken);
