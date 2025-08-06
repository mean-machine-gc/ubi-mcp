/**
 * MCP Tools for EventStorming API - HTTP Version
 * Model Context Protocol tool definitions for Ubistormer EventStorming functionality
 * Adapted to use HTTP endpoints at localhost:3002 instead of direct API calls
 */

import { z } from 'zod';

// Define schemas for common types
const NodeTypeSchema = z.enum(['actor', 'command', 'aggregate', 'event', 'viewmodel', 'preconditions', 'guards', 'branchinglogic']);
const EdgeLabelSchema = z.enum(['issues', 'on', 'then', 'if', 'if guard', 'if preconditions', 'then (policy)', 'supports decision for']);

// Helper function to describe node roles
function getNodeRoleDescription(nodeType: string): string {
  const descriptions = {
    'actor': 'A person, role, or system that initiates commands in the business process',
    'command': 'An action or intention that changes the state of the system',
    'aggregate': 'A business entity that maintains state and enforces business rules',
    'event': 'A fact that occurred in the system, typically as a result of executing a command',
    'viewmodel': 'A read model that provides information needed for decision making',
    'preconditions': 'Conditions that must be true for a command to execute successfully',
    'guards': 'Business rules that determine whether a command should be allowed to execute',
    'branchinglogic': 'Conditional logic that determines whether a specific event emits'
  };
  return descriptions[nodeType as keyof typeof descriptions] || 'Unknown node type';
}

// HTTP client helper
async function httpRequest(method: string, path: string, body?: any): Promise<any> {
  const url = `http://localhost:3002/api/eventstorming${path}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`HTTP request failed: ${method} ${url}`, error);
    throw error;
  }
}

export function registerEventStormingTools(server: any) {
  // ==================== QUERY & ANALYSIS TOOLS ====================

  server.addTool({
    name: "eventstorming_get_graph",
    description: "Get the complete EventStorming graph data",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/graph');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_nodes_by_type",
    description: "Get all nodes of a specific type",
    parameters: z.object({
      type: NodeTypeSchema.describe("Type of nodes to retrieve"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/nodes?type=${args.type}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_process_flow",
    description: `Get complete process flow for a command showing the full business process:
    Actor → Command → Aggregate → Events → Branching Logic
    
    Returns the command's actor, target aggregate, guards/preconditions, resulting events, 
    and any branching logic. Essential for understanding how a business operation flows 
    through the system.`,
    parameters: z.object({
      commandId: z.string().describe("ID of the command to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/process-flow/${args.commandId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_aggregate_view",
    description: `Get all processes and commands for a specific aggregate (business entity).
    
    Shows which commands operate on this aggregate, what processes it participates in,
    all events it produces, and view models that depend on it. Use this to understand
    the complete lifecycle and responsibilities of a business entity.`,
    parameters: z.object({
      aggregateId: z.string().describe("ID of the aggregate to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/aggregate-view/${args.aggregateId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_validate_graph",
    description: "Validate the graph according to EventStorming methodology rules",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/validate');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_statistics",
    description: "Get statistics about the EventStorming graph",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/statistics');
      return JSON.stringify(result, null, 2);
    },
  });

  // ==================== ADVANCED ANALYSIS TOOLS ====================

  server.addTool({
    name: "eventstorming_get_processes_by_event",
    description: "Find all processes that produce or consume a specific event",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/processes-by-event/${args.eventId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_aggregates_by_actor",
    description: "Find all aggregates that an actor interacts with",
    parameters: z.object({
      actorId: z.string().describe("ID of the actor to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/aggregates-by-actor/${args.actorId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_all_process_flows",
    description: "Get all process flows in the system for comprehensive analysis",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/all-process-flows');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_all_aggregate_views",
    description: "Get all aggregate views in the system for comprehensive analysis",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/all-aggregate-views');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_detect_circular_dependencies",
    description: "Detect circular dependencies in the EventStorming graph",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/circular-dependencies');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_change_impact_analysis",
    description: "Analyze the impact of changing a specific node on the rest of the system",
    parameters: z.object({
      nodeId: z.string().describe("ID of the node to analyze impact for"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/change-impact/${args.nodeId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_find_critical_nodes",
    description: "Find nodes that are critical to the system (high centrality/connectivity)",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/critical-nodes');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_validate_methodology",
    description: "Comprehensive validation against EventStorming methodology rules",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/validate-methodology');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_command_execution_paths",
    description: "Get all possible execution paths for a command including branching logic",
    parameters: z.object({
      commandId: z.string().describe("ID of the command to analyze execution paths for"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/command-execution-paths/${args.commandId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_analyze_aggregate_health",
    description: "Analyze the health and complexity of a specific aggregate",
    parameters: z.object({
      aggregateId: z.string().describe("ID of the aggregate to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/aggregate-health/${args.aggregateId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_get_graph_health_metrics",
    description: "Get comprehensive health metrics for the entire EventStorming graph",
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/health');
      return JSON.stringify(result, null, 2);
    },
  });

  // ==================== BASIC CRUD TOOLS ====================

  server.addTool({
    name: "eventstorming_add_node",
    description: "Add a new node to the EventStorming graph",
    parameters: z.object({
      id: z.string().describe("Unique identifier for the node (kebab-case)"),
      label: z.string().describe("Human-readable label for the node"),
      type: NodeTypeSchema.describe("Type of EventStorming element"),
      description: z.string().optional().describe("Optional description of the node"),
      yaml: z.string().optional().describe("YAML configuration content (especially for aggregates)"),
      businessContext: z.string().optional().describe("Markdown business documentation"),
      assertion: z.string().optional().describe("Decision model assertion code"),
      coreCommand: z.string().optional().describe("Core command type definition"),
      shellCommand: z.string().optional().describe("Shell command type definition"),
      hydrationFunction: z.string().optional().describe("Hydration function code"),
      outcomeAssertions: z.string().optional().describe("Event outcome assertions"),
      exampleState: z.string().optional().describe("Example aggregate state"),
      domainModel: z.string().optional().describe("Domain model type definition"),
      objectExamples: z.string().optional().describe("Object examples for aggregates"),
    }),
    execute: async (args: any) => {
      const nodeData = {
        id: args.id,
        label: args.label,
        type: args.type,
        description: args.description,
        yaml: args.yaml,
        businessContext: args.businessContext,
        assertion: args.assertion,
        coreCommand: args.coreCommand,
        shellCommand: args.shellCommand,
        hydrationFunction: args.hydrationFunction,
        outcomeAssertions: args.outcomeAssertions,
        exampleState: args.exampleState,
        domainModel: args.domainModel,
        objectExamples: args.objectExamples,
      };
      
      const result = await httpRequest('POST', '/nodes', nodeData);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_add_edge",
    description: "Add a new connection between two nodes",
    parameters: z.object({
      source: z.string().describe("ID of the source node"),
      target: z.string().describe("ID of the target node"),
      label: EdgeLabelSchema.describe("Type of relationship between nodes"),
    }),
    execute: async (args: any) => {
      const edgeData = {
        source: args.source,
        target: args.target,
        label: args.label,
      };
      
      const result = await httpRequest('POST', '/edges', edgeData);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_remove_node",
    description: "Remove a node and all its connections from the graph",
    parameters: z.object({
      id: z.string().describe("ID of the node to remove"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('DELETE', `/nodes/${args.id}`);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_update_node_extended_fields",
    description: "Update a node with extended fields like businessContext, assertion, yaml, etc.",
    parameters: z.object({
      nodeId: z.string().describe("ID of the node to update"),
      yaml: z.string().optional().describe("YAML configuration content (especially for aggregates)"),
      businessContext: z.string().optional().describe("Markdown business documentation"),
      assertion: z.string().optional().describe("Decision model assertion code"),
      coreCommand: z.string().optional().describe("Core command type definition"),
      shellCommand: z.string().optional().describe("Shell command type definition"),
      hydrationFunction: z.string().optional().describe("Hydration function code"),
      outcomeAssertions: z.string().optional().describe("Event outcome assertions"),
      exampleState: z.string().optional().describe("Example aggregate state"),
      domainModel: z.string().optional().describe("Domain model type definition"),
      objectExamples: z.string().optional().describe("Object examples for aggregates"),
    }),
    execute: async (args: any) => {
      const { nodeId, ...fields } = args;
      const result = await httpRequest('PUT', `/nodes/${nodeId}`, fields);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_update_aggregate_yaml",
    description: "Update the YAML configuration for an aggregate node. This is a specialized tool for managing aggregate configurations.",
    parameters: z.object({
      nodeId: z.string().describe("ID of the aggregate node to update"),
      yaml: z.string().describe("Complete YAML configuration content for the aggregate"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('PUT', `/nodes/${args.nodeId}`, {
        yaml: args.yaml
      });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_update_aggregate_object_examples",
    description: "Update the object examples for an aggregate node. This is a specialized tool for managing aggregate object examples and instances.",
    parameters: z.object({
      nodeId: z.string().describe("ID of the aggregate node to update"),
      objectExamples: z.string().describe("TypeScript/JavaScript code with object examples for the aggregate"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('PUT', `/nodes/${args.nodeId}`, {
        objectExamples: args.objectExamples
      });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_update_node_position",
    description: "Update a node's position on the canvas",
    parameters: z.object({
      nodeId: z.string().describe("ID of the node to move"),
      x: z.number().describe("X coordinate position"),
      y: z.number().describe("Y coordinate position"),
      width: z.number().optional().describe("Width (for resizable nodes like boundaries)"),
      height: z.number().optional().describe("Height (for resizable nodes like boundaries)"),
    }),
    execute: async (args: any) => {
      const updates: any = {
        position: { x: args.x, y: args.y }
      };
      
      if (args.width !== undefined && args.height !== undefined) {
        updates.dimensions = { width: args.width, height: args.height };
      }
      
      const result = await httpRequest('PUT', `/nodes/${args.nodeId}`, updates);
      return JSON.stringify(result, null, 2);
    },
  });

  // ==================== HIGH-LEVEL CONSTRUCTION TOOLS ====================

  server.addTool({
    name: "eventstorming_create_command_flow",
    description: "Create a complete command flow (Actor -> Command -> Aggregate -> Event)",
    parameters: z.object({
      actorId: z.string().describe("ID for the actor node"),
      actorLabel: z.string().describe("Label for the actor"),
      commandId: z.string().describe("ID for the command node"),
      commandLabel: z.string().describe("Label for the command"),
      aggregateId: z.string().describe("ID for the aggregate node"),
      aggregateLabel: z.string().describe("Label for the aggregate"),
      eventId: z.string().describe("ID for the event node"),
      eventLabel: z.string().describe("Label for the event"),
      description: z.string().optional().describe("Optional description for all nodes"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('POST', '/command-flow', args);
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_add_command_guards",
    description: "Add guard conditions to a command (validation before execution)",
    parameters: z.object({
      commandId: z.string().describe("ID of the command to add guards to"),
      guards: z.array(z.object({
        id: z.string().describe("ID for the guard node"),
        label: z.string().describe("Label for the guard condition"),
        description: z.string().optional().describe("Optional description of the guard"),
      })).describe("Array of guard conditions to add"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('POST', `/command-guards/${args.commandId}`, {
        guards: args.guards
      });
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_add_command_preconditions",
    description: "Add preconditions to a command (requirements for ANY success)",
    parameters: z.object({
      commandId: z.string().describe("ID of the command to add preconditions to"),
      preconditions: z.array(z.object({
        id: z.string().describe("ID for the precondition node"),
        label: z.string().describe("Label for the precondition"),
        description: z.string().optional().describe("Optional description of the precondition"),
      })).describe("Array of preconditions to add"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('POST', `/command-preconditions/${args.commandId}`, {
        preconditions: args.preconditions
      });
      return JSON.stringify(result, null, 2);
    },
  });

  // ==================== FILE OPERATIONS (DEPRECATED) ====================
  // File operations are deprecated - the graph is now purely in-memory

  // ==================== LLM-FRIENDLY HELPER TOOLS ====================

  server.addTool({
    name: "eventstorming_analyze_system_overview",
    description: `Get a comprehensive system overview combining multiple analyses:
    
    - Node/edge counts and distribution by type
    - Overall health score and critical issues count
    - Top 5 most critical/connected nodes
    - Circular dependencies detection
    - Validation results with violations/warnings
    
    Perfect starting point for system analysis or architecture health checks.`,
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/system-overview');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_suggest_improvements",
    description: `Analyze the graph and suggest specific improvements based on EventStorming best practices.
    
    Provides prioritized suggestions for:
    - Structural issues (missing required connections)
    - Architectural problems (circular dependencies)
    - Health concerns (low validation scores)
    - Over-connected nodes (potential bottlenecks)
    
    Each suggestion includes issue description, priority level, and recommended action.`,
    parameters: z.object({}),
    execute: async () => {
      const result = await httpRequest('GET', '/suggest-improvements');
      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "eventstorming_explain_node_context", 
    description: `Get comprehensive context about any node in the system:
    
    - Node details (type, label, description, business context)
    - Role explanation (what this type of node does in EventStorming)
    - All incoming/outgoing connections with relationship types
    - Impact analysis (how many nodes would be affected by changes)
    - Criticality assessment (low/medium/high based on connectivity)
    
    Use this to understand complex nodes or explain system parts to stakeholders.`,
    parameters: z.object({
      nodeId: z.string().describe("ID of the node to explain"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/node-context/${args.nodeId}`);
      return JSON.stringify(result, null, 2);
    },
  });

  // ==================== LEGACY SUPPORT ====================

  server.addTool({
    name: "eventstorming_get_command_flow",
    description: "Get complete information about a command flow (legacy method, use get_process_flow instead)",
    parameters: z.object({
      commandId: z.string().describe("ID of the command to analyze"),
    }),
    execute: async (args: any) => {
      const result = await httpRequest('GET', `/command-flow/${args.commandId}`);
      return JSON.stringify(result, null, 2);
    },
  });
}