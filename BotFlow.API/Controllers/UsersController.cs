using BotFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BCrypt.Net;
using BotFlow.Domain.Entities;

namespace BotFlow.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private Guid TenantId => Guid.Parse(User.FindFirstValue("tenant_id")!);
    private string Role    => User.FindFirstValue("role") ?? "agent";

    public UsersController(AppDbContext db) => _db = db;

    // GET api/users — liste tous les users du tenant
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Where(u => u.TenantId == TenantId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new {
                u.Id, u.Email, u.FirstName, u.LastName,
                u.Role, u.LastLoginAt, u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    // POST api/users/invite — inviter un nouveau membre
    [HttpPost("invite")]
    public async Task<IActionResult> Invite([FromBody] InviteUserDto dto)
    {
        if (Role != "admin" && Role != "superadmin")
            return Forbid();

        var exists = await _db.Users.AnyAsync(u =>
            u.TenantId == TenantId && u.Email == dto.Email.ToLower());

        if (exists)
            return Conflict(new { error = "Cet email est déjà utilisé dans votre espace." });

        var user = new User
        {
            TenantId        = TenantId,
            Email           = dto.Email.ToLower().Trim(),
            PasswordHash    = BCrypt.Net.BCrypt.HashPassword("BotFlow2025!"),
            FirstName       = dto.FirstName,
            LastName        = dto.LastName,
            Role            = dto.Role == "admin" ? "admin" : "agent",
            IsEmailVerified = true,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new {
            user.Id, user.Email, user.FirstName,
            user.LastName, user.Role, user.CreatedAt
        });
    }

    // DELETE api/users/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (Role != "admin" && Role != "superadmin")
            return Forbid();

        var currentUserId = Guid.Parse(User.FindFirstValue("sub")!);
        if (id == currentUserId)
            return BadRequest(new { error = "Vous ne pouvez pas supprimer votre propre compte." });

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == TenantId);

        if (user is null) return NotFound();

        user.IsDeleted = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record InviteUserDto(string Email, string FirstName, string LastName, string Role);