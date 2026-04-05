namespace BotFlow.Application.DTOs.Auth;

public record RegisterDto(
    string TenantName,
    string TenantSlug,
    string Email,
    string Password,
    string FirstName,
    string LastName
);

public record LoginDto(
    string Email,
    string Password,
    string TenantSlug
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User,
    TenantDto Tenant
);

public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid TenantId
);

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string PlanType,
    bool IsActive
);
