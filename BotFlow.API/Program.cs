using System.Text;
using BotFlow.Application.Interfaces;
using BotFlow.API.Hubs;
using BotFlow.API.Middleware;
using BotFlow.Infrastructure.Data;
using BotFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, HttpTenantContext>();
builder.Services.AddDbContext<AppDbContext>((sp, opts) =>
    opts.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.MigrationsAssembly("BotFlow.Infrastructure")));

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer           = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"] ?? "BotFlow",
            ValidateAudience         = true,
            ValidAudience            = builder.Configuration["Jwt:Audience"] ?? "BotFlow",
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero,
        };
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("SuperAdmin", p => p.RequireClaim("role", "superadmin"));
    opts.AddPolicy("AdminOrAbove", p => p.RequireClaim("role", "superadmin", "admin"));
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p =>
        p.SetIsOriginAllowed(_ => true)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

builder.Services.AddSignalR(opts => opts.EnableDetailedErrors = builder.Environment.IsDevelopment());

builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IAuthService,         AuthService>();
builder.Services.AddScoped<IChatbotService,      ChatbotService>();
builder.Services.AddScoped<IConversationService, ConversationService>();
builder.Services.AddScoped<IFlowEngineService,   FlowEngineService>();
builder.Services.AddScoped<IAiService,           AiService>();
builder.Services.AddHttpClient();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
{
    opts.SwaggerDoc("v1", new OpenApiInfo { Title = "BotFlow API", Version = "v1" });
    opts.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Name = "Authorization",
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT"
    });
    opts.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }},
        Array.Empty<string>()
    }});
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
//app.MapHealthChecks("/health");
app.Run();
