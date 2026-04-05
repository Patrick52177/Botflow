using System.Security.Claims;
using BotFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Http;

namespace BotFlow.Infrastructure.Services;

/// <summary>
/// Resolves the current tenant from the JWT claim "tenant_id".
/// Injected into AppDbContext so EF Core query filters automatically
/// scope all queries to the authenticated tenant.
/// </summary>
public class HttpTenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpTenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?
                .User.FindFirstValue("tenant_id");

            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}
