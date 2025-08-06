// =============================================================================
// SYNTHETIC TOOL DESCRIPTIONS
// =============================================================================
export const syntheticToolDescriptions = {
    // =============================================================================
    // BOUNDARY ANALYSIS TOOLS
    // =============================================================================
    analyze_aggregate_boundaries: {
        name: "analyze_aggregate_boundaries",
        // One-sentence purpose
        description: "Breaks down complex business requirements into proper aggregate boundaries using DDD principles",
        // Clear trigger conditions
        when_to_use: [
            "User describes a 'system' or 'platform' (likely multiple aggregates)",
            "Intent seems to span multiple business capabilities",
            "Complexity indicators: workflows, management, multiple entities",
            "Before starting lifecycle design for complex domains"
        ],
        // Concrete outputs
        what_you_get: [
            "List of recommended aggregates with clear responsibilities",
            "Event flows and communication patterns between aggregates",
            "Which aggregate to start designing first",
            "Clear warnings if original scope was too broad"
        ],
        // Simple input
        input: "user_intent: string (what they want to build)",
        // Predictable output
        output: "Aggregate recommendations + starting point + next steps",
        // Usage pattern
        typical_flow: "User says 'order system' → Tool recommends Cart + OrderProcessing + Payment → User picks Cart to design first",
        inputSchema: {
            type: "object",
            properties: {
                user_intent: {
                    type: "string",
                    description: "What the user wants to build (e.g., 'order management system', 'user platform')"
                }
            },
            required: ["user_intent"]
        }
    },
    quick_boundary_check: {
        name: "quick_boundary_check",
        description: "Quick check: is this one aggregate or multiple aggregates?",
        when_to_use: [
            "Any time user describes their intent",
            "Before diving into detailed analysis",
            "When unsure if scope is appropriate"
        ],
        what_you_get: [
            "Single aggregate: proceed with lifecycle design",
            "Multiple aggregates: run full boundary analysis",
            "30-second assessment with clear recommendation"
        ],
        input: "user_intent: string",
        output: "Proceed OR analyze_boundaries",
        typical_flow: "User describes intent → Quick check → Clear go/no-go decision",
        inputSchema: {
            type: "object",
            properties: {
                user_intent: {
                    type: "string",
                    description: "Brief description of what user wants to build"
                }
            },
            required: ["user_intent"]
        }
    },
    // =============================================================================
    // FOUNDATION TOOLS
    // =============================================================================
    analyze_domain_patterns: {
        name: "analyze_domain_patterns",
        description: "Provides industry expertise and best practices for your specific domain",
        when_to_use: [
            "User mentions a business domain (e-commerce, healthcare, finance)",
            "Starting aggregate design in unfamiliar domain",
            "Need industry-specific security or compliance patterns"
        ],
        what_you_get: [
            "Common operations for this domain type",
            "Industry security and compliance requirements",
            "Typical business rules and validation patterns",
            "Architectural recommendations"
        ],
        input: "domain: string (e.g., 'healthcare', 'e-commerce')",
        output: "Domain expertise + operation suggestions + best practices",
        typical_flow: "User says 'patient management' → Tool provides healthcare-specific patterns and regulations",
        inputSchema: {
            type: "object",
            properties: {
                domain: {
                    type: "string",
                    description: "Business domain (e.g., 'e-commerce', 'healthcare', 'finance')"
                }
            },
            required: ["domain"]
        }
    },
    build_operation_incrementally: {
        name: "build_operation_incrementally",
        description: "Designs a complete operation through guided analysis (security, business rules, outcomes)",
        when_to_use: [
            "Complex operations with many business rules",
            "Security-sensitive operations",
            "When manual design feels overwhelming",
            "Need systematic operation analysis"
        ],
        what_you_get: [
            "Complete operation specification (guards, preconditions, branches, outcomes)",
            "Security analysis and recommendations",
            "Business rule validation and edge cases",
            "Ready-to-use YAML operation block"
        ],
        input: "operation_name: string (e.g., 'ProcessPayment', 'CreateUser')",
        output: "Complete operation YAML + business analysis",
        typical_flow: "User needs ProcessPayment → Tool analyzes security, compliance, edge cases → Generates complete operation",
        inputSchema: {
            type: "object",
            properties: {
                operation_name: {
                    type: "string",
                    description: "Name of operation to build (e.g., 'CreateUser', 'ProcessOrder')"
                },
                operation_description: {
                    type: "string",
                    description: "Brief description of what this operation should do"
                }
            },
            required: ["operation_name"]
        }
    },
    enhance_business_rules: {
        name: "enhance_business_rules",
        description: "Reviews your lifecycle for missing security, edge cases, and compliance requirements",
        when_to_use: [
            "After creating initial lifecycle draft",
            "Before finalizing lifecycle design",
            "When lifecycle feels incomplete",
            "Need security or compliance review"
        ],
        what_you_get: [
            "Missing security guards and validations",
            "Edge cases and failure scenarios you missed",
            "Compliance requirements for your domain",
            "Prioritized improvement recommendations"
        ],
        input: "current_lifecycle: string (YAML content)",
        output: "Enhancement recommendations + specific improvements",
        typical_flow: "User has draft lifecycle → Tool finds missing security rules → User adds recommendations",
        inputSchema: {
            type: "object",
            properties: {
                current_lifecycle: {
                    type: "string",
                    description: "Current lifecycle.yaml content to enhance"
                },
                focus_areas: {
                    type: "array",
                    items: { type: "string", enum: ["security", "edge_cases", "compliance"] },
                    description: "Areas to focus enhancement on"
                }
            },
            required: ["current_lifecycle"]
        }
    },
    // =============================================================================
    // GENERATION TOOLS
    // =============================================================================
    generate_assertions: {
        name: "generate_assertions",
        description: "Converts your lifecycle.yaml into executable implementation specifications",
        when_to_use: [
            "Lifecycle design is complete",
            "Ready to move from design to implementation",
            "Need technical specifications from business rules"
        ],
        what_you_get: [
            "Complete assertions.yaml file",
            "Executable expressions for all business rules",
            "Security validations and error handling",
            "Ready for TypeScript implementation"
        ],
        input: "lifecycle_yaml: string",
        output: "assertions.yaml file",
        typical_flow: "Complete lifecycle → Generate assertions → Ready for types generation",
        inputSchema: {
            type: "object",
            properties: {
                lifecycle_yaml: {
                    type: "string",
                    description: "Complete lifecycle.yaml content"
                }
            },
            required: ["lifecycle_yaml"]
        }
    },
    generate_types: {
        name: "generate_types",
        description: "Creates TypeScript types with full type safety and validation patterns",
        when_to_use: [
            "After generating assertions",
            "Need TypeScript contracts for implementation",
            "Want type-safe development"
        ],
        what_you_get: [
            "Complete types.ts file",
            "Type-safe commands, events, and state definitions",
            "Validation patterns and business rule types",
            "Framework integration types"
        ],
        input: "lifecycle_yaml + assertions_yaml",
        output: "types.ts file",
        typical_flow: "Lifecycle + assertions → Generate types → Ready for decider implementation",
        inputSchema: {
            type: "object",
            properties: {
                lifecycle_yaml: { type: "string" },
                assertions_yaml: { type: "string" }
            },
            required: ["lifecycle_yaml", "assertions_yaml"]
        }
    },
    generate_decider: {
        name: "generate_decider",
        description: "Creates executable business logic implementation from specifications",
        when_to_use: [
            "After generating types",
            "Ready for working implementation",
            "Need executable business logic"
        ],
        what_you_get: [
            "Complete decider.ts implementation",
            "All business rules as executable code",
            "Type-safe preconditions, branches, and evolutions",
            "Ready to run and test"
        ],
        input: "lifecycle_yaml + assertions_yaml + types_ts",
        output: "decider.ts file",
        typical_flow: "All specs → Generate decider → Working business logic",
        inputSchema: {
            type: "object",
            properties: {
                lifecycle_yaml: { type: "string" },
                assertions_yaml: { type: "string" },
                types_ts: { type: "string" }
            },
            required: ["lifecycle_yaml", "assertions_yaml", "types_ts"]
        }
    },
    generate_tests: {
        name: "generate_tests",
        description: "Creates comprehensive test suite covering all business scenarios and edge cases",
        when_to_use: [
            "After generating decider",
            "Need complete test coverage",
            "Ready for quality assurance"
        ],
        what_you_get: [
            "Complete Jest test suite",
            "Tests for every business rule and failure case",
            "Edge case and integration tests",
            "100% specification coverage"
        ],
        input: "All specification files",
        output: "Complete test suite",
        typical_flow: "Working decider → Generate tests → Production-ready code",
        inputSchema: {
            type: "object",
            properties: {
                lifecycle_yaml: { type: "string" },
                assertions_yaml: { type: "string" },
                types_ts: { type: "string" },
                decider_ts: { type: "string" }
            },
            required: ["lifecycle_yaml", "assertions_yaml", "types_ts", "decider_ts"]
        }
    },
    // =============================================================================
    // VALIDATION TOOLS
    // =============================================================================
    validate_drift: {
        name: "validate_drift",
        description: "Detects inconsistencies between specification files and suggests fixes",
        when_to_use: [
            "After modifying any specification file",
            "Before production deployment",
            "Debugging implementation issues",
            "Regular health checks"
        ],
        what_you_get: [
            "List of inconsistencies found",
            "Specific fixes for each issue",
            "Priority assessment (critical/warning/minor)",
            "File-by-file health report"
        ],
        input: "All specification and implementation files",
        output: "Drift report + fix recommendations",
        typical_flow: "Change lifecycle → Run drift check → Fix inconsistencies → Deploy",
        inputSchema: {
            type: "object",
            properties: {
                files: {
                    type: "object",
                    description: "All aggregate files to check for consistency"
                }
            },
            required: ["files"]
        }
    },
    test_coverage_analysis: {
        name: "test_coverage_analysis",
        description: "Identifies missing test scenarios and gaps in test coverage",
        when_to_use: [
            "After generating tests",
            "Before production release",
            "When tests feel incomplete",
            "Quality gate validation"
        ],
        what_you_get: [
            "Coverage gaps by operation and business rule",
            "Missing test scenarios with examples",
            "Test quality assessment",
            "Specific test cases to add"
        ],
        input: "All files including tests",
        output: "Coverage report + missing test recommendations",
        typical_flow: "Generated tests → Coverage analysis → Add missing tests → Complete coverage",
        inputSchema: {
            type: "object",
            properties: {
                specification_files: { type: "object" },
                test_files: { type: "object" }
            },
            required: ["specification_files", "test_files"]
        }
    }
};
// =============================================================================
// USAGE DOCUMENTATION GENERATOR
// =============================================================================
/**
 * Generates user-friendly documentation for tools
 */
export function generateToolUsageDoc(toolName) {
    const tool = syntheticToolDescriptions[toolName];
    if (!tool)
        return "Tool not found";
    return `# ${tool.name}

## What it does
${tool.description}

## When to use
${tool.when_to_use.map(item => `- ${item}`).join('\n')}

## What you get
${tool.what_you_get.map(item => `- ${item}`).join('\n')}

## Example flow
${tool.typical_flow}

## Usage
**Input:** ${tool.input}
**Output:** ${tool.output}`;
}
/**
 * Quick reference for all tools
 */
export function generateQuickReference() {
    return `# MCP Tools Quick Reference

## 🎯 Starting Design
- **quick_boundary_check**: One aggregate or multiple?
- **analyze_aggregate_boundaries**: Break complex requirements into proper aggregates
- **analyze_domain_patterns**: Get industry expertise for your domain

## 🏗️ Building Lifecycle  
- **build_operation_incrementally**: Design complex operations step-by-step
- **enhance_business_rules**: Add missing security, edge cases, compliance

## ⚙️ Generating Implementation
- **generate_assertions**: lifecycle.yaml → assertions.yaml
- **generate_types**: specifications → types.ts
- **generate_decider**: specifications → decider.ts
- **generate_tests**: everything → comprehensive test suite

## 🔍 Quality Assurance
- **validate_drift**: Find inconsistencies between files
- **test_coverage_analysis**: Find missing test scenarios

## 🚀 Typical Flow
1. describe intent → **quick_boundary_check**
2. complex scope → **analyze_aggregate_boundaries** 
3. pick aggregate → **analyze_domain_patterns**
4. design lifecycle + **build_operation_incrementally** + **enhance_business_rules**
5. **generate_assertions** → **generate_types** → **generate_decider** → **generate_tests**
6. **validate_drift** + **test_coverage_analysis** → production ready!`;
}
