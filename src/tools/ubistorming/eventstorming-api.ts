/**
 * Ubistormer v0.0.1 - EventStorming API for Ubi Framework
 * TypeScript API for interacting with EventStorming graph data
 * Designed for MCP server integration to allow LLM graph modifications
 */
import { GraphologyAdapter } from './graphology-adapter.js';

export type NodeType = 
  | 'actor' 
  | 'command' 
  | 'aggregate' 
  | 'event' 
  | 'viewmodel' 
  | 'preconditions' 
  | 'guards' 
  | 'branchinglogic';

export type EdgeLabel = 
  | 'issues'              // Actor -> Command
  | 'on'                  // Command -> Aggregate  
  | 'then'                // Command -> Event
  | 'if'                  // Event -> BranchingLogic
  | 'if guard'            // Command -> Guards
  | 'if preconditions'    // Command -> Preconditions
  | 'then (policy)'       // Event -> Command (policy)
  | 'supports decision for'; // ViewModel -> Command

export interface EventStormingNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  // Extended fields for enhanced functionality
  businessContext?: string;     // Markdown business documentation
  assertion?: string;           // Decision model assertion code
  coreCommand?: string;         // Core command type definition
  shellCommand?: string;        // Shell command type definition
  hydrationFunction?: string;   // Hydration function code
  outcomeAssertions?: string;   // Event outcome assertions
  exampleState?: string;        // Example aggregate state
  domainModel?: string;         // Domain model type definition
}

export interface EventStormingEdge {
  source: string;
  target: string;
  label: EdgeLabel;
}

export interface EventStormingGraph {
  nodes: EventStormingNode[];
  edges: EventStormingEdge[];
}

// Enhanced interfaces for process and aggregate extraction
export interface ProcessFlow {
  command: EventStormingNode;
  actor?: EventStormingNode;
  aggregate?: EventStormingNode;
  guards: EventStormingNode[];
  preconditions: EventStormingNode[];
  events: EventStormingNode[];
  branchingLogic: EventStormingNode[];
  policiesTriggered: EventStormingNode[]; // Commands triggered by events
}

export interface AggregateView {
  aggregate: EventStormingNode;
  processes: ProcessFlow[];
  allCommands: EventStormingNode[];
  allEvents: EventStormingNode[];
  viewModels: EventStormingNode[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CommandFlow {
  command: EventStormingNode;
  actor?: EventStormingNode;
  aggregate?: EventStormingNode;
  guards: EventStormingNode[];
  preconditions: EventStormingNode[];
  events: EventStormingNode[];
  branchingLogic: EventStormingNode[];
}


/**
 * EventStorming Graph API
 * Provides methods to create, read, update, and delete EventStorming elements
 * with built-in validation for EventStorming methodology rules
 * Now powered by Graphology for high-performance graph operations
 */
export class EventStormingAPI {
  private graphAdapter: GraphologyAdapter;

  constructor(initialData?: EventStormingGraph) {
    this.graphAdapter = new GraphologyAdapter();
    
    if (initialData) {
      this.graphAdapter.loadFromEventStormingData(initialData);
    }
  }

  // ==================== FILE I/O OPERATIONS ====================

  /**
   * Load graph from ubistorming.json file (or custom path)
   */
  async loadFromFile(filePath?: string): Promise<ValidationResult> {
    // Default to ubistorming.json in root directory
    const defaultPath = filePath || './ubistorming.json';
    
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(defaultPath, 'utf-8');
      return this.importFromJSON(content);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Save graph to ubistorming.json file (or custom path)
   */
  async saveToFile(filePath?: string): Promise<ValidationResult> {
    // Default to ubistorming.json in root directory
    const defaultPath = filePath || './ubistorming.json';
    
    try {
      const fs = await import('fs/promises');
      const content = this.exportToJSON();
      await fs.writeFile(defaultPath, content, 'utf-8');
      return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  // ==================== BASIC CRUD OPERATIONS ====================

  /**
   * Get the complete graph data
   */
  getGraph(): EventStormingGraph {
    return this.graphAdapter.exportToEventStormingData();
  }

  /**
   * Load graph from JSON data
   */
  loadGraph(data: EventStormingGraph): void {
    this.graphAdapter.loadFromEventStormingData(data);
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType(type: NodeType): EventStormingNode[] {
    return this.graphAdapter.getNodesByType(type);
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): EventStormingNode | undefined {
    return this.graphAdapter.getNode(id) || undefined;
  }

  /**
   * Get all edges connected to a node
   */
  getNodeEdges(nodeId: string): EventStormingEdge[] {
    return this.graphAdapter.getNodeEdges(nodeId);
  }

  /**
   * Get edges by label type
   */
  getEdgesByLabel(label: EdgeLabel): EventStormingEdge[] {
    return this.graphAdapter.filterEdges((edge: EventStormingEdge) => edge.label === label);
  }

  // ==================== NODE OPERATIONS ====================

  /**
   * Add a new node to the graph
   */
  addNode(node: EventStormingNode): ValidationResult {
    // Check if node already exists
    if (this.graphAdapter.hasNode(node.id)) {
      return {
        isValid: false,
        errors: [`Node with ID '${node.id}' already exists`],
        warnings: []
      };
    }

    // Validate node
    const validation = this.validateNode(node);
    if (!validation.isValid) {
      return validation;
    }

    this.graphAdapter.addNode(node);
    return { isValid: true, errors: [], warnings: validation.warnings };
  }

  /**
   * Update an existing node
   */
  updateNode(id: string, updates: Partial<EventStormingNode>): ValidationResult {
    if (!this.graphAdapter.hasNode(id)) {
      return {
        isValid: false,
        errors: [`Node with ID '${id}' not found`],
        warnings: []
      };
    }

    const currentNode = this.graphAdapter.getNode(id)!;
    const updatedNode = { ...currentNode, ...updates };
    const validation = this.validateNode(updatedNode);
    
    if (!validation.isValid) {
      return validation;
    }

    this.graphAdapter.updateNode(id, updates);
    return { isValid: true, errors: [], warnings: validation.warnings };
  }

  /**
   * Remove a node and all connected edges
   */
  removeNode(id: string): ValidationResult {
    if (!this.graphAdapter.hasNode(id)) {
      return {
        isValid: false,
        errors: [`Node with ID '${id}' not found`],
        warnings: []
      };
    }

    // Graphology automatically removes all connected edges when node is removed
    this.graphAdapter.removeNode(id);
    return { isValid: true, errors: [], warnings: [] };
  }

  // ==================== EDGE OPERATIONS ====================

  /**
   * Add a new edge to the graph
   */
  addEdge(edge: EventStormingEdge): ValidationResult {
    // Check if source and target nodes exist
    const sourceNode = this.getNode(edge.source);
    const targetNode = this.getNode(edge.target);

    if (!sourceNode) {
      return {
        isValid: false,
        errors: [`Source node '${edge.source}' not found`],
        warnings: []
      };
    }

    if (!targetNode) {
      return {
        isValid: false,
        errors: [`Target node '${edge.target}' not found`],
        warnings: []
      };
    }

    // Validate edge according to EventStorming rules
    const validation = this.validateEdge(edge, sourceNode, targetNode);
    if (!validation.isValid) {
      return validation;
    }

    // Try to add the edge (Graphology handles duplicate checking)
    const added = this.graphAdapter.addEdge(edge);
    if (!added) {
      return {
        isValid: false,
        errors: [`Edge already exists: ${edge.source} --${edge.label}--> ${edge.target}`],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: validation.warnings };
  }

  /**
   * Remove an edge from the graph
   */
  removeEdge(source: string, target: string, label: EdgeLabel): ValidationResult {
    const removed = this.graphAdapter.removeEdge(source, target, label);
    
    if (!removed) {
      return {
        isValid: false,
        errors: [`Edge not found: ${source} --${label}--> ${target}`],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // ==================== HIGH-LEVEL OPERATIONS ====================

  /**
   * Create a complete command flow (Actor -> Command -> Aggregate -> Event)
   */
  createCommandFlow(params: {
    actorId: string;
    actorLabel: string;
    commandId: string;
    commandLabel: string;
    aggregateId: string;
    aggregateLabel: string;
    eventId: string;
    eventLabel: string;
    description?: string;
  }): ValidationResult {
    const results: ValidationResult[] = [];

    // Add actor
    results.push(this.addNode({
      id: params.actorId,
      label: params.actorLabel,
      type: 'actor',
      description: params.description
    }));

    // Add command
    results.push(this.addNode({
      id: params.commandId,
      label: params.commandLabel,
      type: 'command',
      description: params.description
    }));

    // Add aggregate
    results.push(this.addNode({
      id: params.aggregateId,
      label: params.aggregateLabel,
      type: 'aggregate',
      description: params.description
    }));

    // Add event
    results.push(this.addNode({
      id: params.eventId,
      label: params.eventLabel,
      type: 'event',
      description: params.description
    }));

    // Add edges
    results.push(this.addEdge({
      source: params.actorId,
      target: params.commandId,
      label: 'issues'
    }));

    results.push(this.addEdge({
      source: params.commandId,
      target: params.aggregateId,
      label: 'on'
    }));

    results.push(this.addEdge({
      source: params.commandId,
      target: params.eventId,
      label: 'then'
    }));

    // Combine results
    const errors = results.flatMap(r => r.errors);
    const warnings = results.flatMap(r => r.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add guards to a command
   */
  addCommandGuards(commandId: string, guards: Array<{id: string, label: string, description?: string}>): ValidationResult {
    const results: ValidationResult[] = [];

    for (const guard of guards) {
      // Add guard node
      results.push(this.addNode({
        id: guard.id,
        label: guard.label,
        type: 'guards',
        description: guard.description
      }));

      // Connect command to guard
      results.push(this.addEdge({
        source: commandId,
        target: guard.id,
        label: 'if guard'
      }));
    }

    const errors = results.flatMap(r => r.errors);
    const warnings = results.flatMap(r => r.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add preconditions to a command
   */
  addCommandPreconditions(commandId: string, preconditions: Array<{id: string, label: string, description?: string}>): ValidationResult {
    const results: ValidationResult[] = [];

    for (const precondition of preconditions) {
      // Add precondition node
      results.push(this.addNode({
        id: precondition.id,
        label: precondition.label,
        type: 'preconditions',
        description: precondition.description
      }));

      // Connect command to precondition
      results.push(this.addEdge({
        source: commandId,
        target: precondition.id,
        label: 'if preconditions'
      }));
    }

    const errors = results.flatMap(r => r.errors);
    const warnings = results.flatMap(r => r.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get complete process flow for a command (enhanced version with Graphology)
   */
  getProcessFlow(commandId: string): ProcessFlow | null {
    const command = this.graphAdapter.getNode(commandId);
    if (!command || command.type !== 'command') {
      return null;
    }

    // Use Graphology's efficient neighbor lookup methods
    const actors = this.graphAdapter.getInNeighborsByLabel(commandId, 'issues')
      .filter((node: EventStormingNode) => node.type === 'actor');
    const actor = actors.length > 0 ? actors[0] : undefined;

    const aggregates = this.graphAdapter.getOutNeighborsByLabel(commandId, 'on')
      .filter((node: EventStormingNode) => node.type === 'aggregate');
    const aggregate = aggregates.length > 0 ? aggregates[0] : undefined;

    const guards = this.graphAdapter.getOutNeighborsByLabel(commandId, 'if guard')
      .filter((node: EventStormingNode) => node.type === 'guards');

    const preconditions = this.graphAdapter.getOutNeighborsByLabel(commandId, 'if preconditions')
      .filter((node: EventStormingNode) => node.type === 'preconditions');

    const events = this.graphAdapter.getOutNeighborsByLabel(commandId, 'then')
      .filter((node: EventStormingNode) => node.type === 'event');

    // Get branching logic for all events
    const branchingLogic = events.flatMap((event: EventStormingNode) => 
      this.graphAdapter.getOutNeighborsByLabel(event.id, 'if')
        .filter((node: EventStormingNode) => node.type === 'branchinglogic')
    );

    // Get policies triggered by events (commands triggered by events)
    const policiesTriggered = events.flatMap((event: EventStormingNode) => 
      this.graphAdapter.getOutNeighborsByLabel(event.id, 'then (policy)')
        .filter((node: EventStormingNode) => node.type === 'command')
    );

    return {
      command,
      actor,
      aggregate,
      guards,
      preconditions,
      events,
      branchingLogic,
      policiesTriggered
    };
  }

  /**
   * Get complete command flow information (legacy method for backward compatibility)
   */
  getCommandFlow(commandId: string): CommandFlow | null {
    const command = this.getNode(commandId);
    if (!command || command.type !== 'command') {
      return null;
    }

    const actors = this.graphAdapter.getInNeighborsByLabel(commandId, 'issues');
    const actor = actors.find((node: EventStormingNode) => node.type === 'actor');

    const aggregates = this.graphAdapter.getOutNeighborsByLabel(commandId, 'on');
    const aggregate = aggregates.find((node: EventStormingNode) => node.type === 'aggregate');

    const guards = this.graphAdapter.getOutNeighborsByLabel(commandId, 'if guard')
      .filter((node: EventStormingNode) => node.type === 'guards');

    const preconditions = this.graphAdapter.getOutNeighborsByLabel(commandId, 'if preconditions')
      .filter((node: EventStormingNode) => node.type === 'preconditions');

    const events = this.graphAdapter.getOutNeighborsByLabel(commandId, 'then')
      .filter((node: EventStormingNode) => node.type === 'event');

    const branchingLogic = events.flatMap((event: EventStormingNode) => 
      this.graphAdapter.getOutNeighborsByLabel(event.id, 'if')
        .filter((node: EventStormingNode) => node.type === 'branchinglogic')
    );

    return {
      command,
      actor,
      aggregate,
      guards,
      preconditions,
      events,
      branchingLogic
    };
  }

  /**
   * Get all processes for a specific aggregate
   */
  getAggregateView(aggregateId: string): AggregateView | null {
    const aggregate = this.getNode(aggregateId);
    if (!aggregate || aggregate.type !== 'aggregate') {
      return null;
    }

    // Find all commands that operate on this aggregate
    const commandsOnAggregate = this.graphAdapter.getInNeighborsByLabel(aggregateId, 'on')
      .filter((node: EventStormingNode) => node.type === 'command');

    // Get process flows for all commands
    const processes = commandsOnAggregate
      .map((cmd: EventStormingNode) => this.getProcessFlow(cmd.id))
      .filter((flow: ProcessFlow | null) => flow !== null) as ProcessFlow[];

    // Collect all unique events from processes
    const allEvents = Array.from(
      new Map(
        processes.flatMap(p => p.events)
          .map(event => [event.id, event])
      ).values()
    );

    // Find view models that support decisions for commands on this aggregate
    const viewModels: EventStormingNode[] = [];
    commandsOnAggregate.forEach((cmd: EventStormingNode) => {
      const cmdViewModels = this.graphAdapter.getInNeighborsByLabel(cmd.id, 'supports decision for')
        .filter((node: EventStormingNode) => node.type === 'viewmodel');
      viewModels.push(...cmdViewModels);
    });

    return {
      aggregate,
      processes,
      allCommands: commandsOnAggregate,
      allEvents,
      viewModels
    };
  }

  /**
   * Get all process flows in the system
   */
  getAllProcessFlows(): ProcessFlow[] {
    const commands = this.getNodesByType('command');
    return commands
      .map(cmd => this.getProcessFlow(cmd.id))
      .filter(flow => flow !== null) as ProcessFlow[];
  }

  /**
   * Get all aggregate views in the system
   */
  getAllAggregateViews(): AggregateView[] {
    const aggregates = this.getNodesByType('aggregate');
    return aggregates
      .map(agg => this.getAggregateView(agg.id))
      .filter(view => view !== null) as AggregateView[];
  }

  /**
   * Find processes that involve a specific event
   */
  getProcessesByEvent(eventId: string): ProcessFlow[] {
    return this.getAllProcessFlows()
      .filter(process => process.events.some(event => event.id === eventId));
  }

  /**
   * Find aggregates that are affected by a specific actor
   */
  getAggregatesByActor(actorId: string): AggregateView[] {
    return this.getAllAggregateViews()
      .filter(view => view.processes.some(process => process.actor?.id === actorId));
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate a node according to EventStorming rules
   */
  private validateNode(node: EventStormingNode): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structural validation only
    if (!node.id || node.id.trim() === '') {
      errors.push('Node ID cannot be empty');
    }

    if (!node.label || node.label.trim() === '') {
      errors.push('Node label cannot be empty');
    }

    // ID format validation (kebab-case recommended)
    if (node.id && !/^[a-z0-9\-_]+$/.test(node.id)) {
      warnings.push(`Node ID '${node.id}' should use kebab-case format (lowercase with hyphens/underscores)`);
    }

    // Check for valid node type
    const validTypes = ['actor', 'command', 'aggregate', 'event', 'viewmodel', 'preconditions', 'guards', 'branchinglogic'];
    if (!validTypes.includes(node.type)) {
      errors.push(`Invalid node type '${node.type}'. Must be one of: ${validTypes.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate an edge according to EventStorming rules
   */
  private validateEdge(edge: EventStormingEdge, sourceNode: EventStormingNode, targetNode: EventStormingNode): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Define valid edge combinations
    const validCombinations: Record<EdgeLabel, Array<{source: NodeType, target: NodeType}>> = {
      'issues': [{ source: 'actor', target: 'command' }],
      'on': [{ source: 'command', target: 'aggregate' }],
      'then': [{ source: 'command', target: 'event' }],
      'if': [{ source: 'event', target: 'branchinglogic' }],
      'if guard': [{ source: 'command', target: 'guards' }],
      'if preconditions': [{ source: 'command', target: 'preconditions' }],
      'then (policy)': [{ source: 'event', target: 'command' }],
      'supports decision for': [{ source: 'viewmodel', target: 'command' }]
    };

    // Check if edge combination is valid
    const validCombs = validCombinations[edge.label];
    const isValidCombination = validCombs.some(combo => 
      combo.source === sourceNode.type && combo.target === targetNode.type
    );

    if (!isValidCombination) {
      errors.push(
        `Invalid edge: ${sourceNode.type} --${edge.label}--> ${targetNode.type}. ` +
        `Valid combinations for '${edge.label}': ${validCombs.map(c => `${c.source} -> ${c.target}`).join(', ')}`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate the entire graph for EventStorming methodology compliance
   */
  validateGraph(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>();
    const allEdges = this.graphAdapter.filterEdges((_edge: EventStormingEdge) => true);
    allEdges.forEach((edge: EventStormingEdge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const allNodes = this.graphAdapter.filterNodes((_node: EventStormingNode) => true);
    const orphanedNodes = allNodes.filter((node: EventStormingNode) => !connectedNodeIds.has(node.id));
    if (orphanedNodes.length > 0) {
      warnings.push(`Orphaned nodes found: ${orphanedNodes.map((n: EventStormingNode) => n.label).join(', ')}`);
    }

    // Check commands have events (EventStorming rule)
    const commands = this.getNodesByType('command');
    for (const command of commands) {
      const hasEvents = allEdges.some((edge: EventStormingEdge) => 
        edge.source === command.id && edge.label === 'then'
      );
      if (!hasEvents) {
        errors.push(`Command '${command.label}' must generate at least one event`);
      }
    }

    // Check events are connected to something meaningful
    const events = this.getNodesByType('event');
    for (const event of events) {
      const hasIncomingCommand = allEdges.some((edge: EventStormingEdge) => 
        edge.target === event.id && edge.label === 'then'
      );
      if (!hasIncomingCommand) {
        warnings.push(`Event '${event.label}' is not generated by any command`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get graph statistics
   */
  getStatistics() {
    const allNodes = this.graphAdapter.filterNodes((_node: EventStormingNode) => true);
    const allEdges = this.graphAdapter.filterEdges((_edge: EventStormingEdge) => true);
    
    const nodesByType = allNodes.reduce((acc: Record<NodeType, number>, node: EventStormingNode) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    const edgesByLabel = allEdges.reduce((acc: Record<EdgeLabel, number>, edge: EventStormingEdge) => {
      acc[edge.label] = (acc[edge.label] || 0) + 1;
      return acc;
    }, {} as Record<EdgeLabel, number>);

    return {
      totalNodes: allNodes.length,
      totalEdges: allEdges.length,
      nodesByType,
      edgesByLabel,
      commands: this.getNodesByType('command').length,
      events: this.getNodesByType('event').length,
      aggregates: this.getNodesByType('aggregate').length,
      actors: this.getNodesByType('actor').length
    };
  }

  // ==================== EXPORT/IMPORT ====================

  /**
   * Export graph to webhook-narrative.json format
   */
  exportToJSON(): string {
    const graphData = this.graphAdapter.exportToEventStormingData();
    return JSON.stringify(graphData, null, 2);
  }

  /**
   * Import graph from webhook-narrative.json format
   */
  importFromJSON(jsonString: string): ValidationResult {
    try {
      const data = JSON.parse(jsonString) as EventStormingGraph;
      
      // Validate structure
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return {
          isValid: false,
          errors: ['Invalid JSON: missing or invalid nodes array'],
          warnings: []
        };
      }

      if (!data.edges || !Array.isArray(data.edges)) {
        return {
          isValid: false,
          errors: ['Invalid JSON: missing or invalid edges array'],
          warnings: []
        };
      }

      this.graphAdapter.loadFromEventStormingData(data);
      const validation = this.validateGraph();
      
      return {
        isValid: true,
        errors: [],
        warnings: validation.warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Update a node's extended fields (businessContext, assertion, etc.)
   */
  updateNodeExtendedFields(nodeId: string, fields: {
    businessContext?: string;
    assertion?: string;
    coreCommand?: string;
    shellCommand?: string;
    hydrationFunction?: string;
    outcomeAssertions?: string;
    exampleState?: string;
    domainModel?: string;
  }): ValidationResult {
    if (!this.graphAdapter.hasNode(nodeId)) {
      return {
        isValid: false,
        errors: [`Node with ID '${nodeId}' not found`],
        warnings: []
      };
    }

    // Update the node with new fields
    const success = this.graphAdapter.updateNode(nodeId, fields);
    if (!success) {
      return {
        isValid: false,
        errors: [`Failed to update node with ID '${nodeId}'`],
        warnings: []
      };
    }

    return { isValid: true, errors: [], warnings: [] };
  }

  // ==================== ADVANCED GRAPH ANALYSIS ====================

  /**
   * Detect circular dependencies in the graph
   * Useful for finding problematic event loops or command chains
   */
  detectCircularDependencies(): { 
    cycles: string[][], 
    affectedNodes: EventStormingNode[] 
  } {
    const cycles = this.graphAdapter.detectCycles();
    const affectedNodeIds = new Set<string>();
    
    cycles.forEach((cycle: string[]) => {
      cycle.forEach((nodeId: string) => affectedNodeIds.add(nodeId));
    });
    
    const affectedNodes = Array.from(affectedNodeIds)
      .map(id => this.graphAdapter.getNode(id))
      .filter(node => node !== null) as EventStormingNode[];
    
    return { cycles, affectedNodes };
  }

  /**
   * Analyze the impact of changing or removing a specific node
   * Returns all nodes that would be directly or indirectly affected
   */
  getChangeImpactAnalysis(nodeId: string): {
    node: EventStormingNode | null,
    directImpact: EventStormingNode[],
    indirectImpact: EventStormingNode[],
    totalReach: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  } {
    const node = this.graphAdapter.getNode(nodeId);
    if (!node) {
      return {
        node: null,
        directImpact: [],
        indirectImpact: [],
        totalReach: 0,
        riskLevel: 'LOW'
      };
    }

    const impact = this.graphAdapter.getImpactAnalysis(nodeId);
    
    // Determine risk level based on impact scope
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (impact.totalReach > 10) {
      riskLevel = 'HIGH';
    } else if (impact.totalReach > 5) {
      riskLevel = 'MEDIUM';
    }

    return {
      node,
      ...impact,
      riskLevel
    };
  }

  /**
   * Find bottleneck nodes that are critical to the system
   * These are nodes that many paths pass through
   */
  findCriticalNodes(): Array<{ 
    node: EventStormingNode, 
    centrality: number,
    criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }> {
    const bottlenecks = this.graphAdapter.findBottlenecks();
    
    return bottlenecks.map(({ node, centrality }: { node: EventStormingNode, centrality: number }) => {
      let criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (centrality > 20) {
        criticalityLevel = 'HIGH';
      } else if (centrality > 10) {
        criticalityLevel = 'MEDIUM';
      }
      
      return { node, centrality, criticalityLevel };
    });
  }

  /**
   * Validate EventStorming methodology rules
   */
  validateEventStormingMethodology(): {
    isValid: boolean,
    violations: Array<{ rule: string, message: string, affectedNodes: string[] }>,
    warnings: Array<{ rule: string, message: string, affectedNodes: string[] }>,
    suggestions: string[]
  } {
    const validation = this.graphAdapter.validateEventStormingRules();
    
    // Convert simple strings to structured format
    const violations = validation.violations.map((msg: string) => ({
      rule: 'EventStorming Methodology',
      message: msg,
      affectedNodes: this.extractNodeIdsFromMessage(msg)
    }));
    
    const warnings = validation.warnings.map((msg: string) => ({
      rule: 'EventStorming Best Practice',
      message: msg,
      affectedNodes: this.extractNodeIdsFromMessage(msg)
    }));

    const suggestions = this.generateSuggestions(violations, warnings);

    return {
      isValid: validation.isValid,
      violations,
      warnings,
      suggestions
    };
  }

  /**
   * Find all possible execution paths from a command to its outcomes
   */
  getCommandExecutionPaths(commandId: string): {
    command: EventStormingNode | null,
    paths: Array<{
      path: EventStormingNode[],
      pathType: 'HAPPY_PATH' | 'ERROR_PATH' | 'POLICY_PATH',
      description: string
    }>
  } {
    const command = this.graphAdapter.getNode(commandId);
    if (!command || command.type !== 'command') {
      return { command: null, paths: [] };
    }

    const paths: Array<{
      path: EventStormingNode[],
      pathType: 'HAPPY_PATH' | 'ERROR_PATH' | 'POLICY_PATH',
      description: string
    }> = [];

    // Find direct events
    const events = this.graphAdapter.getOutNeighborsByLabel(commandId, 'then');
    
    events.forEach((event: EventStormingNode) => {
      const eventPaths = this.graphAdapter.findAllPaths(commandId, event.id, 5);
      eventPaths.forEach((pathIds: string[]) => {
        const pathNodes = pathIds.map((id: string) => this.graphAdapter.getNode(id)).filter((n: EventStormingNode | null) => n) as EventStormingNode[];
        
        // Determine path type based on event name or relationships
        let pathType: 'HAPPY_PATH' | 'ERROR_PATH' | 'POLICY_PATH' = 'HAPPY_PATH';
        if (event.label.toLowerCase().includes('error') || event.label.toLowerCase().includes('failed')) {
          pathType = 'ERROR_PATH';
        }
        
        // Check if this leads to policy commands
        const policyCommands = this.graphAdapter.getOutNeighborsByLabel(event.id, 'then (policy)');
        if (policyCommands.length > 0) {
          pathType = 'POLICY_PATH';
        }

        paths.push({
          path: pathNodes,
          pathType,
          description: `${command.label} → ${event.label}${policyCommands.length > 0 ? ' → Policy Actions' : ''}`
        });
      });
    });

    return { command, paths };
  }

  /**
   * Analyze aggregate consistency and cohesion
   */
  analyzeAggregateHealth(aggregateId: string): {
    aggregate: EventStormingNode | null,
    commandCount: number,
    eventCount: number,
    cohesionScore: number,
    consistencyIssues: string[],
    recommendations: string[]
  } {
    const aggregate = this.graphAdapter.getNode(aggregateId);
    if (!aggregate || aggregate.type !== 'aggregate') {
      return {
        aggregate: null,
        commandCount: 0,
        eventCount: 0,
        cohesionScore: 0,
        consistencyIssues: [],
        recommendations: []
      };
    }

    const commands = this.graphAdapter.getInNeighborsByLabel(aggregateId, 'on');
    const allEvents = commands.flatMap((cmd: EventStormingNode) => 
      this.graphAdapter.getOutNeighborsByLabel(cmd.id, 'then')
    );

    const consistencyIssues: string[] = [];
    const recommendations: string[] = [];

    // Check for commands without events
    commands.forEach((cmd: EventStormingNode) => {
      const events = this.graphAdapter.getOutNeighborsByLabel(cmd.id, 'then');
      if (events.length === 0) {
        consistencyIssues.push(`Command "${cmd.label}" produces no events`);
      }
    });

    // Calculate cohesion score (0-100)
    const totalInteractions = commands.length + allEvents.length;
    const cohesionScore = totalInteractions > 0 ? Math.min(100, (commands.length * allEvents.length) / totalInteractions * 10) : 0;

    // Generate recommendations
    if (commands.length > 10) {
      recommendations.push('Consider splitting this aggregate - it handles too many commands');
    }
    if (commands.length < 2) {
      recommendations.push('This aggregate might be too small - consider merging with related aggregates');
    }
    if (cohesionScore < 30) {
      recommendations.push('Low cohesion detected - ensure commands and events are related');
    }

    return {
      aggregate,
      commandCount: commands.length,
      eventCount: allEvents.length,
      cohesionScore,
      consistencyIssues,
      recommendations
    };
  }

  /**
   * Get comprehensive graph health metrics
   */
  getGraphHealthMetrics(): {
    overall: {
      nodeCount: number,
      edgeCount: number,
      density: number,
      connectedComponents: number
    },
    methodology: {
      validationScore: number,
      violationCount: number,
      warningCount: number
    },
    complexity: {
      cyclicComplexity: number,
      avgPathLength: number,
      bottleneckCount: number
    },
    recommendations: string[]
  } {
    const metrics = this.graphAdapter.getAdvancedMetrics();
    const validation = this.validateEventStormingMethodology();
    
    const validationScore = validation.isValid ? 100 : 
      Math.max(0, 100 - (validation.violations.length * 20) - (validation.warnings.length * 5));

    const recommendations: string[] = [];
    
    if (metrics.cycles > 0) {
      recommendations.push('Resolve circular dependencies in your event flows');
    }
    if (metrics.density < 0.1) {
      recommendations.push('Graph seems sparse - consider adding more relationships');
    }
    if (metrics.density > 0.8) {
      recommendations.push('Graph is very dense - consider simplifying relationships');
    }
    if (validation.violations.length > 0) {
      recommendations.push('Fix EventStorming methodology violations');
    }

    return {
      overall: {
        nodeCount: metrics.nodeCount,
        edgeCount: metrics.edgeCount,
        density: metrics.density,
        connectedComponents: metrics.connectedComponents
      },
      methodology: {
        validationScore,
        violationCount: validation.violations.length,
        warningCount: validation.warnings.length
      },
      complexity: {
        cyclicComplexity: metrics.cycles,
        avgPathLength: metrics.avgDegree,
        bottleneckCount: metrics.bottlenecks.length
      },
      recommendations
    };
  }

  // ==================== HELPER METHODS ====================

  private extractNodeIdsFromMessage(message: string): string[] {
    // Extract node IDs or names from validation messages
    const matches = message.match(/"([^"]+)"/g);
    return matches ? matches.map(match => match.replace(/"/g, '')) : [];
  }

  private generateSuggestions(violations: any[], warnings: any[]): string[] {
    const suggestions: string[] = [];
    
    if (violations.length > 0) {
      suggestions.push('Focus on fixing methodology violations first - they represent structural issues');
    }
    
    if (warnings.length > 5) {
      suggestions.push('Consider reviewing your EventStorming model for completeness');
    }
    
    suggestions.push('Use impact analysis before making changes to critical nodes');
    suggestions.push('Check for circular dependencies regularly to avoid infinite loops');
    
    return suggestions;
  }
}