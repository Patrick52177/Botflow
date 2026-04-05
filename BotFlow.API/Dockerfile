# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (better layer caching)
COPY BotFlow.sln .
COPY BotFlow.API/BotFlow.API.csproj           BotFlow.API/
COPY BotFlow.Application/BotFlow.Application.csproj   BotFlow.Application/
COPY BotFlow.Domain/BotFlow.Domain.csproj     BotFlow.Domain/
COPY BotFlow.Infrastructure/BotFlow.Infrastructure.csproj BotFlow.Infrastructure/

# Restore dependencies
RUN dotnet restore BotFlow.sln

# Copy all source files
COPY . .

# Build and publish
RUN dotnet publish BotFlow.API/BotFlow.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /app/publish .

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "BotFlow.API.dll"]
