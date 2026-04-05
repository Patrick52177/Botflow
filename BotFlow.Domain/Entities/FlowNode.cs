namespace BotFlow.Domain.Entities;

// A node in the visual chatbot flow (trigger, message, condition, AI, etc.)
public class FlowNode : BaseEntity
{
    public Guid ChatbotId { get; set; }
    public Guid TenantId { get; set; }

    public string Type { get; set; } = "message"; // trigger | message | question | condition | ai | action | handoff
    public string Label { get; set; } = string.Empty;

    // Content varies by type — stored as JSON string
    public string ContentJson { get; set; } = "{}";

    // Visual position in the editor canvas
    public float PosX { get; set; }
    public float PosY { get; set; }

    // Navigation
    public Chatbot Chatbot { get; set; } = null!;
    public ICollection<FlowEdge> OutgoingEdges { get; set; } = new List<FlowEdge>();
    public ICollection<FlowEdge> IncomingEdges { get; set; } = new List<FlowEdge>();
}

// An edge/connection between two nodes
public class FlowEdge : BaseEntity
{
    public Guid ChatbotId { get; set; }
    public Guid TenantId { get; set; }
    public Guid SourceNodeId { get; set; }
    public Guid TargetNodeId { get; set; }

    // For condition nodes: which branch this edge represents
    public string? ConditionLabel { get; set; } // "yes" | "no" | keyword | etc.

    // Navigation
    public FlowNode SourceNode { get; set; } = null!;
    public FlowNode TargetNode { get; set; } = null!;
}
