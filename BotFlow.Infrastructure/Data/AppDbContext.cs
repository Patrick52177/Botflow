using BotFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BotFlow.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly Guid? _currentTenantId;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext? tenantContext = null)
        : base(options)
    {
        _currentTenantId = tenantContext?.TenantId;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Chatbot> Chatbots => Set<Chatbot>();
    public DbSet<FlowNode> FlowNodes => Set<FlowNode>();
    public DbSet<FlowEdge> FlowEdges => Set<FlowEdge>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<KnowledgeEntry> KnowledgeEntries => Set<KnowledgeEntry>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Global query filters for multi-tenancy (soft delete + tenant isolation) ──
        modelBuilder.Entity<User>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<Chatbot>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<FlowNode>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<FlowEdge>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<Conversation>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<Message>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<KnowledgeEntry>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        modelBuilder.Entity<ApiKey>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentTenantId == null || e.TenantId == _currentTenantId));

        // ── Tenant ──
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Slug).HasMaxLength(100);
            e.Property(t => t.Name).HasMaxLength(200);
        });

        // ── User ──
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => new { u.Email, u.TenantId }).IsUnique();
            e.Property(u => u.Email).HasMaxLength(320);
            e.Property(u => u.Role).HasMaxLength(50);
            e.HasOne(u => u.Tenant)
             .WithMany(t => t.Users)
             .HasForeignKey(u => u.TenantId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Chatbot ──
        modelBuilder.Entity<Chatbot>(e =>
        {
            e.HasOne(c => c.Tenant)
             .WithMany(t => t.Chatbots)
             .HasForeignKey(c => c.TenantId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── FlowNode ──
        modelBuilder.Entity<FlowNode>(e =>
        {
            e.HasOne(n => n.Chatbot)
             .WithMany(c => c.FlowNodes)
             .HasForeignKey(n => n.ChatbotId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(n => n.ContentJson).HasColumnType("jsonb");
        });

        // ── FlowEdge ──
        modelBuilder.Entity<FlowEdge>(e =>
        {
            e.HasOne(ed => ed.SourceNode)
             .WithMany(n => n.OutgoingEdges)
             .HasForeignKey(ed => ed.SourceNodeId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(ed => ed.TargetNode)
             .WithMany(n => n.IncomingEdges)
             .HasForeignKey(ed => ed.TargetNodeId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Conversation ──
        modelBuilder.Entity<Conversation>(e =>
        {
            e.HasIndex(c => c.SessionId).IsUnique();
            e.HasOne(c => c.Chatbot)
             .WithMany(b => b.Conversations)
             .HasForeignKey(c => c.ChatbotId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.AssignedAgent)
             .WithMany()
             .HasForeignKey(c => c.AssignedAgentId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Message ──
        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Conversation)
             .WithMany(c => c.Messages)
             .HasForeignKey(m => m.ConversationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── KnowledgeEntry ──
        modelBuilder.Entity<KnowledgeEntry>(e =>
        {
            e.HasOne(k => k.Chatbot)
             .WithMany(c => c.KnowledgeEntries)
             .HasForeignKey(k => k.ChatbotId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(k => k.Keywords).HasColumnType("text[]");
        });

        // ── ApiKey ──
        modelBuilder.Entity<ApiKey>(e =>
        {
            e.HasIndex(a => a.KeyHash).IsUnique();
            e.HasOne(a => a.Tenant)
             .WithMany(t => t.ApiKeys)
             .HasForeignKey(a => a.TenantId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(a => a.Scopes).HasColumnType("text[]");
        });
    }

    // Auto-update UpdatedAt on save
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}

// Interface injected into DbContext so filters know the current tenant
public interface ITenantContext
{
    Guid? TenantId { get; }
}
