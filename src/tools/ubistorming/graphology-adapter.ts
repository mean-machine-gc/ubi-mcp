import Graph from 'graphology';
// Removed unused import
import { bfsFromNode as graphBfsFromNode, dfsFromNode as graphDfsFromNode } from 'graphology-traversal';
import { bidirectional } from 'graphology-shortest-path';
import type { EventStormingNode, EventStormingEdge, EventStormingGraph, NodeType, EdgeLabel } from './eventstorming-api.js';

export interface NodeAttributes extends EventStormingNode {}

export interface EdgeAttributes extends Omit<EventStormingEdge, 'source' | 'target'> {}

/**
 * GraphologyAdapter provides a high-performance graph interface for EventStorming operations
 * using the Graphology library for efficient graph manipulation and traversal.
 */
export class GraphologyAdapter {
  private graph: Graph<NodeAttributes, EdgeAttributes>;

  constructor() {
    // Create a directed graph that allows multiple edges between nodes
    // This is important for EventStorming where multiple relationships can exist
    this.graph = new Graph({ 
      type: 'directed',
      multi: true,
      allowSelfLoops: false
    });
  }

  /**
   * Load data from EventStorming format into Graphology
   */
  loadFromEventStormingData(data: EventStormingGraph): void {
    this.clear();
    
    // Add all nodes first
    data.nodes.forEach(node => {
      this.graph.addNode(node.id, node);
    });
    
    // Add all edges
    data.edges.forEach(edge => {
      // Generate unique edge key for multi-edges
      const edgeKey = `${edge.source}-${edge.target}-${edge.label}`;
      this.graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
        label: edge.label
      });
    });
  }

  /**
   * Export graph back to EventStorming format for backward compatibility
   */
  exportToEventStormingData(): EventStormingGraph {
    const nodes: EventStormingNode[] = [];
    const edges: EventStormingEdge[] = [];
    
    this.graph.forEachNode((_nodeId, attributes) => {
      nodes.push(attributes);
    });
    
    this.graph.forEachEdge((_edgeId, attributes, source, target) => {
      edges.push({
        source,
        target,
        label: attributes.label
      });
    });
    
    return { nodes, edges };
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.graph.clear();
  }

  // ===== NODE OPERATIONS =====

  /**
   * Add a node to the graph
   */
  addNode(node: EventStormingNode): boolean {
    if (this.graph.hasNode(node.id)) {
      return false;
    }
    this.graph.addNode(node.id, node);
    return true;
  }

  /**
   * Update node attributes
   */
  updateNode(nodeId: string, updates: Partial<EventStormingNode>): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }
    this.graph.updateNode(nodeId, (attributes: Partial<NodeAttributes>): NodeAttributes => ({ 
      ...attributes, 
      ...updates 
    } as NodeAttributes));
    return true;
  }

  /**
   * Remove a node and all its edges
   */
  removeNode(nodeId: string): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }
    this.graph.dropNode(nodeId);
    return true;
  }

  /**
   * Get node attributes
   */
  getNode(nodeId: string): EventStormingNode | null {
    return this.graph.hasNode(nodeId) ? this.graph.getNodeAttributes(nodeId) : null;
  }

  /**
   * Check if node exists
   */
  hasNode(nodeId: string): boolean {
    return this.graph.hasNode(nodeId);
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType(type: NodeType): EventStormingNode[] {
    const nodes: EventStormingNode[] = [];
    this.graph.forEachNode((_nodeId, attributes) => {
      if (attributes.type === type) {
        nodes.push(attributes);
      }
    });
    return nodes;
  }

  // ===== EDGE OPERATIONS =====

  /**
   * Add an edge between two nodes
   */
  addEdge(edge: EventStormingEdge): boolean {
    if (!this.graph.hasNode(edge.source) || !this.graph.hasNode(edge.target)) {
      return false;
    }
    
    const edgeKey = `${edge.source}-${edge.target}-${edge.label}`;
    if (this.graph.hasEdge(edgeKey)) {
      return false;
    }
    
    this.graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
      label: edge.label
    });
    return true;
  }

  /**
   * Remove an edge
   */
  removeEdge(source: string, target: string, label: EdgeLabel): boolean {
    const edgeKey = `${source}-${target}-${label}`;
    if (!this.graph.hasEdge(edgeKey)) {
      return false;
    }
    this.graph.dropEdge(edgeKey);
    return true;
  }

  /**
   * Get all edges for a node
   */
  getNodeEdges(nodeId: string): EventStormingEdge[] {
    const edges: EventStormingEdge[] = [];
    
    this.graph.forEachEdge(nodeId, (_edgeId, attributes, source, target) => {
      edges.push({
        source,
        target,
        label: attributes.label
      });
    });
    
    return edges;
  }

  // ===== TRAVERSAL OPERATIONS =====

  /**
   * Get all nodes connected by outgoing edges with specific label
   */
  getOutNeighborsByLabel(nodeId: string, label: EdgeLabel): EventStormingNode[] {
    const neighbors: EventStormingNode[] = [];
    
    this.graph.forEachOutEdge(nodeId, (_edgeId, attributes, _source, target) => {
      if (attributes.label === label) {
        neighbors.push(this.graph.getNodeAttributes(target));
      }
    });
    
    return neighbors;
  }

  /**
   * Get all nodes connected by incoming edges with specific label
   */
  getInNeighborsByLabel(nodeId: string, label: EdgeLabel): EventStormingNode[] {
    const neighbors: EventStormingNode[] = [];
    
    this.graph.forEachInEdge(nodeId, (_edgeId, attributes, source, _target) => {
      if (attributes.label === label) {
        neighbors.push(this.graph.getNodeAttributes(source));
      }
    });
    
    return neighbors;
  }

  /**
   * Get all neighbors (both in and out) by label
   */
  getNeighborsByLabel(nodeId: string, label: EdgeLabel): EventStormingNode[] {
    const neighbors: EventStormingNode[] = [];
    
    this.graph.forEachEdge(nodeId, (_edgeId, attributes, source, target) => {
      if (attributes.label === label) {
        const neighborId = source === nodeId ? target : source;
        neighbors.push(this.graph.getNodeAttributes(neighborId));
      }
    });
    
    return neighbors;
  }

  /**
   * Find shortest path between two nodes
   */
  findShortestPath(source: string, target: string): string[] | null {
    try {
      return bidirectional(this.graph, source, target);
    } catch {
      return null;
    }
  }

  /**
   * Perform breadth-first search from a node
   */
  bfsFromNode(startNode: string, callback: (nodeId: string, attributes: EventStormingNode) => void): void {
    graphBfsFromNode(this.graph, startNode, (nodeId: string, attributes: NodeAttributes, _depth: number) => {
      callback(nodeId, attributes);
    });
  }

  /**
   * Perform depth-first search from a node
   */
  dfsFromNode(startNode: string, callback: (nodeId: string, attributes: EventStormingNode) => void): void {
    graphDfsFromNode(this.graph, startNode, (nodeId: string, attributes: NodeAttributes, _depth: number) => {
      callback(nodeId, attributes);
    });
  }

  /**
   * Get all reachable nodes from a starting node
   */
  getReachableNodes(startNode: string): EventStormingNode[] {
    const reachable: EventStormingNode[] = [];
    
    this.bfsFromNode(startNode, (_nodeId: string, attributes: EventStormingNode) => {
      reachable.push(attributes);
    });
    
    return reachable;
  }

  // ===== FILTERING OPERATIONS =====

  /**
   * Filter nodes by a predicate function
   */
  filterNodes(predicate: (node: EventStormingNode) => boolean): EventStormingNode[] {
    const filtered: EventStormingNode[] = [];
    
    this.graph.forEachNode((_nodeId, attributes) => {
      if (predicate(attributes)) {
        filtered.push(attributes);
      }
    });
    
    return filtered;
  }

  /**
   * Filter edges by a predicate function
   */
  filterEdges(predicate: (edge: EventStormingEdge) => boolean): EventStormingEdge[] {
    const filtered: EventStormingEdge[] = [];
    
    this.graph.forEachEdge((_edgeId, attributes, source, target) => {
      const edge = { source, target, label: attributes.label };
      if (predicate(edge)) {
        filtered.push(edge);
      }
    });
    
    return filtered;
  }

  // ===== SUBGRAPH OPERATIONS =====

  /**
   * Create a subgraph containing only specified nodes and their edges
   */
  createSubgraph(nodeIds: string[]): GraphologyAdapter {
    const subgraph = new GraphologyAdapter();
    
    // Add nodes
    nodeIds.forEach(nodeId => {
      if (this.graph.hasNode(nodeId)) {
        subgraph.addNode(this.graph.getNodeAttributes(nodeId));
      }
    });
    
    // Add edges between included nodes
    this.graph.forEachEdge((_edgeId, attributes, source, target) => {
      if (nodeIds.includes(source) && nodeIds.includes(target)) {
        subgraph.addEdge({ source, target, label: attributes.label });
      }
    });
    
    return subgraph;
  }

  // ===== STATISTICS =====

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      nodeCount: this.graph.order,
      edgeCount: this.graph.size,
      nodesByType: this.getNodeCountsByType(),
      edgesByLabel: this.getEdgeCountsByLabel()
    };
  }

  private getNodeCountsByType(): Record<NodeType, number> {
    const counts = {} as Record<NodeType, number>;
    
    this.graph.forEachNode((_nodeId, attributes) => {
      counts[attributes.type] = (counts[attributes.type] || 0) + 1;
    });
    
    return counts;
  }

  private getEdgeCountsByLabel(): Record<EdgeLabel, number> {
    const counts = {} as Record<EdgeLabel, number>;
    
    this.graph.forEachEdge((edgeId, attributes) => {
      counts[attributes.label] = (counts[attributes.label] || 0) + 1;
    });
    
    return counts;
  }

  // ===== ADVANCED GRAPH ANALYSIS =====

  /**
   * Detect cycles in the graph (useful for finding circular dependencies)
   */
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const dfsVisit = (nodeId: string, path: string[]): boolean => {
      if (recStack.has(nodeId)) {
        // Found a cycle - extract the cycle from the path
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart).concat([nodeId]));
        return true;
      }
      
      if (visited.has(nodeId)) {
        return false;
      }
      
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);
      
      // Check all outgoing neighbors
      this.graph.forEachOutNeighbor(nodeId, (neighbor) => {
        dfsVisit(neighbor, [...path]);
      });
      
      recStack.delete(nodeId);
      path.pop();
      return false;
    };
    
    // Check each node as a potential cycle start
    this.graph.forEachNode((nodeId) => {
      if (!visited.has(nodeId)) {
        dfsVisit(nodeId, []);
      }
    });
    
    return cycles;
  }

  /**
   * Find all possible paths between two nodes
   */
  findAllPaths(startNode: string, endNode: string, maxDepth: number = 10): string[][] {
    const paths: string[][] = [];
    
    const dfs = (currentNode: string, targetNode: string, currentPath: string[], depth: number) => {
      if (depth > maxDepth) return;
      
      if (currentNode === targetNode) {
        paths.push([...currentPath, currentNode]);
        return;
      }
      
      if (currentPath.includes(currentNode)) {
        return; // Avoid cycles
      }
      
      const newPath = [...currentPath, currentNode];
      
      this.graph.forEachOutNeighbor(currentNode, (neighbor) => {
        dfs(neighbor, targetNode, newPath, depth + 1);
      });
    };
    
    dfs(startNode, endNode, [], 0);
    return paths;
  }

  /**
   * Get impact analysis: find all nodes affected by a change to a given node
   */
  getImpactAnalysis(nodeId: string): { 
    directImpact: EventStormingNode[], 
    indirectImpact: EventStormingNode[],
    totalReach: number 
  } {
    const directImpact: EventStormingNode[] = [];
    const allImpacted = new Set<string>();
    
    // Direct impact: immediate neighbors
    this.graph.forEachOutNeighbor(nodeId, (neighbor) => {
      const node = this.graph.getNodeAttributes(neighbor);
      directImpact.push(node);
      allImpacted.add(neighbor);
    });
    
    // Indirect impact: BFS to find all reachable nodes
    const queue = [nodeId];
    const visited = new Set([nodeId]);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      this.graph.forEachOutNeighbor(current, (neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          allImpacted.add(neighbor);
        }
      });
    }
    
    const indirectImpact = Array.from(allImpacted)
      .filter(id => !directImpact.some(node => node.id === id))
      .map(id => this.graph.getNodeAttributes(id));
    
    return {
      directImpact,
      indirectImpact,
      totalReach: allImpacted.size
    };
  }

  /**
   * Find bottleneck nodes (nodes with high betweenness centrality)
   */
  findBottlenecks(): Array<{ node: EventStormingNode, centrality: number }> {
    const centrality = new Map<string, number>();
    
    // Simple betweenness centrality approximation
    // For each pair of nodes, find shortest paths and count how many pass through each node
    this.graph.forEachNode((nodeId1) => {
      this.graph.forEachNode((nodeId2) => {
        if (nodeId1 !== nodeId2) {
          const path = this.findShortestPath(nodeId1, nodeId2);
          if (path && path.length > 2) {
            // Count intermediate nodes in the path
            for (let i = 1; i < path.length - 1; i++) {
              const intermediateNode = path[i];
              centrality.set(intermediateNode, (centrality.get(intermediateNode) || 0) + 1);
            }
          }
        }
      });
    });
    
    return Array.from(centrality.entries())
      .map(([nodeId, score]) => ({
        node: this.graph.getNodeAttributes(nodeId),
        centrality: score
      }))
      .sort((a, b) => b.centrality - a.centrality);
  }

  /**
   * Find connected components in the graph
   */
  findConnectedComponents(): EventStormingNode[][] {
    const visited = new Set<string>();
    const components: EventStormingNode[][] = [];
    
    const dfs = (nodeId: string, component: EventStormingNode[]) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      component.push(this.graph.getNodeAttributes(nodeId));
      
      // Visit both incoming and outgoing neighbors for undirected connectivity
      this.graph.forEachNeighbor(nodeId, (neighbor) => {
        dfs(neighbor, component);
      });
    };
    
    this.graph.forEachNode((nodeId) => {
      if (!visited.has(nodeId)) {
        const component: EventStormingNode[] = [];
        dfs(nodeId, component);
        components.push(component);
      }
    });
    
    return components;
  }

  /**
   * Get advanced graph metrics
   */
  getAdvancedMetrics() {
    return {
      ...this.getStats(),
      cycles: this.detectCycles().length,
      connectedComponents: this.findConnectedComponents().length,
      avgDegree: this.graph.size > 0 ? (this.graph.size * 2) / this.graph.order : 0,
      density: this.graph.order > 1 ? this.graph.size / (this.graph.order * (this.graph.order - 1)) : 0,
      bottlenecks: this.findBottlenecks().slice(0, 5) // Top 5 bottlenecks
    };
  }

  /**
   * Validate EventStorming methodology rules
   */
  validateEventStormingRules(): { 
    isValid: boolean, 
    violations: string[], 
    warnings: string[] 
  } {
    const violations: string[] = [];
    const warnings: string[] = [];
    
    // Rule 1: Commands should have actors
    const commands = this.getNodesByType('command');
    commands.forEach(command => {
      const actors = this.getInNeighborsByLabel(command.id, 'issues');
      if (actors.length === 0) {
        warnings.push(`Command "${command.label}" has no actor issuing it`);
      }
    });
    
    // Rule 2: Commands should operate on aggregates
    commands.forEach(command => {
      const aggregates = this.getOutNeighborsByLabel(command.id, 'on');
      if (aggregates.length === 0) {
        violations.push(`Command "${command.label}" doesn't operate on any aggregate`);
      }
    });
    
    // Rule 3: Commands should produce events
    commands.forEach(command => {
      const events = this.getOutNeighborsByLabel(command.id, 'then');
      if (events.length === 0) {
        warnings.push(`Command "${command.label}" doesn't produce any events`);
      }
    });
    
    // Rule 4: Actors should issue commands
    const actors = this.getNodesByType('actor');
    actors.forEach(actor => {
      const issuedCommands = this.getOutNeighborsByLabel(actor.id, 'issues');
      if (issuedCommands.length === 0) {
        warnings.push(`Actor "${actor.label}" doesn't issue any commands`);
      }
    });
    
    // Rule 5: Events should be produced by commands or policy reactions
    const events = this.getNodesByType('event');
    events.forEach(event => {
      const commandSources = this.getInNeighborsByLabel(event.id, 'then');
      const policySources = this.getInNeighborsByLabel(event.id, 'then (policy)');
      if (commandSources.length === 0 && policySources.length === 0) {
        warnings.push(`Event "${event.label}" is not produced by any command or policy`);
      }
    });
    
    // Rule 6: Aggregates should have commands operating on them
    const aggregates = this.getNodesByType('aggregate');
    aggregates.forEach(aggregate => {
      const operatingCommands = this.getInNeighborsByLabel(aggregate.id, 'on');
      if (operatingCommands.length === 0) {
        warnings.push(`Aggregate "${aggregate.label}" has no commands operating on it`);
      }
    });
    
    // Rule 7: Guards and preconditions should be connected to commands
    const guards = this.getNodesByType('guards');
    guards.forEach(guard => {
      const connectedCommands = this.getInNeighborsByLabel(guard.id, 'if guard');
      if (connectedCommands.length === 0) {
        warnings.push(`Guard "${guard.label}" is not connected to any command`);
      }
    });
    
    const preconditions = this.getNodesByType('preconditions');
    preconditions.forEach(precondition => {
      const connectedCommands = this.getInNeighborsByLabel(precondition.id, 'if preconditions');
      if (connectedCommands.length === 0) {
        warnings.push(`Precondition "${precondition.label}" is not connected to any command`);
      }
    });
    
    // Rule 8: Branching logic should be connected to events
    const branchingLogic = this.getNodesByType('branchinglogic');
    branchingLogic.forEach(branch => {
      const connectedEvents = this.getInNeighborsByLabel(branch.id, 'if');
      if (connectedEvents.length === 0) {
        warnings.push(`Branching logic "${branch.label}" is not connected to any event`);
      }
    });
    
    // Rule 9: View models should support decision making for commands
    const viewModels = this.getNodesByType('viewmodel');
    viewModels.forEach(viewModel => {
      const supportedCommands = this.getOutNeighborsByLabel(viewModel.id, 'supports decision for');
      if (supportedCommands.length === 0) {
        warnings.push(`View model "${viewModel.label}" doesn't support decisions for any command`);
      }
    });
    
    // Rule 10: Detect circular dependencies
    const cycles = this.detectCycles();
    cycles.forEach(cycle => {
      violations.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
    });
    
    // Rule 11: Check for orphaned nodes (nodes with no connections)
    this.graph.forEachNode((_nodeId, attributes) => {
      const inDegree = this.graph.inDegree(_nodeId);
      const outDegree = this.graph.outDegree(_nodeId);
      
      if (inDegree === 0 && outDegree === 0) {
        warnings.push(`Node "${attributes.label}" (${attributes.type}) has no connections`);
      } else if (attributes.type === 'command' && inDegree === 0) {
        warnings.push(`Command "${attributes.label}" has no incoming connections (no actor issues it)`);
      } else if (attributes.type === 'event' && outDegree === 0) {
        warnings.push(`Event "${attributes.label}" has no outgoing connections (nothing reacts to it)`);
      }
    });
    
    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Get the underlying Graphology instance for advanced operations
   */
  getGraphologyInstance(): Graph<NodeAttributes, EdgeAttributes> {
    return this.graph;
  }
}