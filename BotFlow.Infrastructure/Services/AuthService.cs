using BotFlow.Application.DTOs.Auth;
using BotFlow.Application.Interfaces;
using BotFlow.Domain.Entities;
using BotFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BotFlow.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthService(AppDbContext db, JwtTokenService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    // ── Register: creates tenant + first admin user atomically ──────────────
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Check slug uniqueness (no tenant filter — global check)
        var slugExists = await _db.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == dto.TenantSlug.ToLower());

        if (slugExists)
            throw new InvalidOperationException($"Slug '{dto.TenantSlug}' is already taken.");

        await using var tx = await _db.Database.BeginTransactionAsync();

        // 1. Create tenant
        var tenant = new Tenant
        {
            Name        = dto.TenantName,
            Slug        = dto.TenantSlug.ToLower().Trim(),
            PlanType    = "starter",
            IsActive    = true,
            MaxBots     = 1,
            MaxConversationsPerMonth = 500,
            TrialEndsAt = DateTime.UtcNow.AddDays(14),
        };
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();

        // 2. Create admin user for tenant
        var emailLower = dto.Email.ToLower().Trim();
        var user = new User
        {
            TenantId      = tenant.Id,
            Email         = emailLower,
            PasswordHash  = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName     = dto.FirstName,
            LastName      = dto.LastName,
            Role          = "admin",
            IsEmailVerified = true, // skip email verification for MVP
        };

        var (refreshToken, expiry) = IssueRefreshToken(user);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return BuildAuthResponse(user, tenant, refreshToken);
    }

    // ── Login ────────────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        // Find tenant by slug first (scoped lookup — bypass global filter)
        var tenant = await _db.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == dto.TenantSlug.ToLower() && !t.IsDeleted);

        if (tenant is null || !tenant.IsActive)
            throw new UnauthorizedAccessException("Invalid credentials or tenant not found.");

        // Find user in that tenant
        var user = await _db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u =>
                u.TenantId == tenant.Id &&
                u.Email    == dto.Email.ToLower() &&
                !u.IsDeleted);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var (refreshToken, _) = IssueRefreshToken(user);
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, tenant, refreshToken);
    }

    // ── Refresh token ────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == refreshToken &&
                u.RefreshTokenExpiresAt > DateTime.UtcNow &&
                !u.IsDeleted);

        if (user is null)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var (newRefreshToken, _) = IssueRefreshToken(user);
        await _db.SaveChangesAsync();

        return BuildAuthResponse(user, user.Tenant, newRefreshToken);
    }

    // ── Revoke ───────────────────────────────────────────────────────────────
    public async Task RevokeTokenAsync(Guid userId)
    {
        var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is not null)
        {
            user.RefreshToken           = null;
            user.RefreshTokenExpiresAt  = null;
            await _db.SaveChangesAsync();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private (string Token, DateTime Expiry) IssueRefreshToken(User user)
    {
        var token  = _jwt.GenerateRefreshToken();
        var expiry = _jwt.GetRefreshTokenExpiry();
        user.RefreshToken          = token;
        user.RefreshTokenExpiresAt = expiry;
        return (token, expiry);
    }

    private AuthResponseDto BuildAuthResponse(User user, Tenant tenant, string refreshToken)
    {
        var accessToken = _jwt.GenerateAccessToken(user);
        return new AuthResponseDto(
            AccessToken:  accessToken,
            RefreshToken: refreshToken,
            ExpiresAt:    DateTime.UtcNow.AddMinutes(60),
            User: new UserDto(
                user.Id, user.Email, user.FirstName, user.LastName,
                user.Role, user.TenantId),
            Tenant: new TenantDto(
                tenant.Id, tenant.Name, tenant.Slug,
                tenant.PlanType, tenant.IsActive)
        );
    }
}
