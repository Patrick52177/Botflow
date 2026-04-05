using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BotFlow.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BotFlow.Infrastructure.Services;

public class JwtTokenService
{
    private readonly IConfiguration _config;
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenMinutes;
    private readonly int _refreshTokenDays;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
        _secret       = config["Jwt:Secret"]   ?? throw new InvalidOperationException("Jwt:Secret missing");
        _issuer       = config["Jwt:Issuer"]   ?? "BotFlow";
        _audience     = config["Jwt:Audience"] ?? "BotFlow";
        _accessTokenMinutes = int.Parse(config["Jwt:AccessTokenMinutes"] ?? "60");
        _refreshTokenDays   = int.Parse(config["Jwt:RefreshTokenDays"]  ?? "30");
    }

    public string GenerateAccessToken(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("role",      user.Role),
            new Claim("name",      $"{user.FirstName} {user.LastName}"),
        };

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(_accessTokenMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public DateTime GetRefreshTokenExpiry() =>
        DateTime.UtcNow.AddDays(_refreshTokenDays);

    public ClaimsPrincipal? ValidateAccessToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key,
                ValidateIssuer           = true,
                ValidIssuer              = _issuer,
                ValidateAudience         = true,
                ValidAudience            = _audience,
                ValidateLifetime         = true,
                ClockSkew                = TimeSpan.Zero
            }, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
