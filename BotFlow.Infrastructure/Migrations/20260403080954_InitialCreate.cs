using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BotFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PlanType = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    PrimaryColor = table.Column<string>(type: "text", nullable: true),
                    TrialEndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PlanRenewsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StripeCustomerId = table.Column<string>(type: "text", nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "text", nullable: true),
                    MaxBots = table.Column<int>(type: "integer", nullable: false),
                    MaxConversationsPerMonth = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApiKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    KeyHash = table.Column<string>(type: "text", nullable: false),
                    KeyPrefix = table.Column<string>(type: "text", nullable: false),
                    Scopes = table.Column<string[]>(type: "text[]", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AllowedIps = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApiKeys_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Chatbots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Channel = table.Column<string>(type: "text", nullable: false),
                    AiProvider = table.Column<string>(type: "text", nullable: false),
                    AiModel = table.Column<string>(type: "text", nullable: false),
                    SystemPrompt = table.Column<string>(type: "text", nullable: true),
                    Temperature = table.Column<float>(type: "real", nullable: false),
                    MaxTokens = table.Column<int>(type: "integer", nullable: false),
                    ConfidenceThreshold = table.Column<float>(type: "real", nullable: false),
                    WidgetTitle = table.Column<string>(type: "text", nullable: true),
                    WidgetSubtitle = table.Column<string>(type: "text", nullable: true),
                    WidgetColor = table.Column<string>(type: "text", nullable: true),
                    WidgetPosition = table.Column<string>(type: "text", nullable: true),
                    WelcomeMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chatbots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chatbots_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    RefreshTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FlowNodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatbotId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    ContentJson = table.Column<string>(type: "jsonb", nullable: false),
                    PosX = table.Column<float>(type: "real", nullable: false),
                    PosY = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlowNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlowNodes_Chatbots_ChatbotId",
                        column: x => x.ChatbotId,
                        principalTable: "Chatbots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KnowledgeEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatbotId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    Keywords = table.Column<string[]>(type: "text[]", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KnowledgeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KnowledgeEntries_Chatbots_ChatbotId",
                        column: x => x.ChatbotId,
                        principalTable: "Chatbots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatbotId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Channel = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "text", nullable: false),
                    VisitorName = table.Column<string>(type: "text", nullable: true),
                    VisitorEmail = table.Column<string>(type: "text", nullable: true),
                    VisitorPhone = table.Column<string>(type: "text", nullable: true),
                    ExternalUserId = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    AssignedAgentId = table.Column<Guid>(type: "uuid", nullable: true),
                    EscalatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SatisfactionScore = table.Column<int>(type: "integer", nullable: true),
                    SatisfactionComment = table.Column<string>(type: "text", nullable: true),
                    MessageCount = table.Column<int>(type: "integer", nullable: false),
                    AiMessageCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conversations_Chatbots_ChatbotId",
                        column: x => x.ChatbotId,
                        principalTable: "Chatbots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Conversations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Conversations_Users_AssignedAgentId",
                        column: x => x.AssignedAgentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FlowEdges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatbotId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceNodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetNodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConditionLabel = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlowEdges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlowEdges_Chatbots_ChatbotId",
                        column: x => x.ChatbotId,
                        principalTable: "Chatbots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FlowEdges_FlowNodes_SourceNodeId",
                        column: x => x.SourceNodeId,
                        principalTable: "FlowNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FlowEdges_FlowNodes_TargetNodeId",
                        column: x => x.TargetNodeId,
                        principalTable: "FlowNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    IsAiGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    AiProvider = table.Column<string>(type: "text", nullable: true),
                    AiModel = table.Column<string>(type: "text", nullable: true),
                    ConfidenceScore = table.Column<float>(type: "real", nullable: true),
                    TokensUsed = table.Column<int>(type: "integer", nullable: true),
                    TriggeredByNodeId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Messages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_KeyHash",
                table: "ApiKeys",
                column: "KeyHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_TenantId",
                table: "ApiKeys",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Chatbots_TenantId",
                table: "Chatbots",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_AssignedAgentId",
                table: "Conversations",
                column: "AssignedAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ChatbotId",
                table: "Conversations",
                column: "ChatbotId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_SessionId",
                table: "Conversations",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_TenantId",
                table: "Conversations",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_FlowEdges_ChatbotId",
                table: "FlowEdges",
                column: "ChatbotId");

            migrationBuilder.CreateIndex(
                name: "IX_FlowEdges_SourceNodeId",
                table: "FlowEdges",
                column: "SourceNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_FlowEdges_TargetNodeId",
                table: "FlowEdges",
                column: "TargetNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_FlowNodes_ChatbotId",
                table: "FlowNodes",
                column: "ChatbotId");

            migrationBuilder.CreateIndex(
                name: "IX_KnowledgeEntries_ChatbotId",
                table: "KnowledgeEntries",
                column: "ChatbotId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ConversationId",
                table: "Messages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Slug",
                table: "Tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email_TenantId",
                table: "Users",
                columns: new[] { "Email", "TenantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApiKeys");

            migrationBuilder.DropTable(
                name: "FlowEdges");

            migrationBuilder.DropTable(
                name: "KnowledgeEntries");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "FlowNodes");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropTable(
                name: "Chatbots");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
