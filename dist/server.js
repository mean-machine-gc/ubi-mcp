#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { generateLifecycleConversationPrompt } from "./prompts/index";
import { implementTypesPrompt } from "./prompts/implement_types";
import { implementEvolutionsPrompt } from "./prompts/implement_evolutions";
import { testEvolvePrompt } from "./prompts/test_evolve";
import { implementDecisionPrompt } from "./prompts/implement_decision";
import { testOperationPrompt } from "./prompts/test_operation";
import { generateUbistormerPrompt } from "./prompts/ubistormer";
import { registerEventStormingTools } from "./tools/ubistorming/add-tools";
const mcp = new FastMCP({
    name: 'Ubi Toolkit MCP Server',
    version: "1.0.0",
    instructions: `
        Ubi mcp server provides promts to AI-assisted Domain-driven Design
        `
});
// addImplement(mcp)
// mcp.on("connect", (event) => {
//   console.log("Client connected:", event.session);
//   //add tools with sampling
//   addAnalyzeDomainPatters(mcp)(event.session)
//   addBuilsOperationIncrementally(mcp)(event.session)
//   addEnhanceBusinessRules(mcp)(event.session)
//   addGenerateAssertions(mcp)(event.session)
//   addGenerateTypes(mcp)(event.session)
//   addGenerateDecider(mcp)(event.session)
//   addGenerateTests(mcp)(event.session)
// });
registerEventStormingTools(mcp);
mcp.addPrompt({
    name: "ubistormer",
    description: "Have a conversation with the user to collaborate on an EventStorming project",
    arguments: [
        {
            name: "jsonUrl",
            description: "The absolute path where the json containing the graph is",
            required: true
        },
    ],
    load: async (args) => {
        return generateUbistormerPrompt(args);
    }
});
mcp.addPrompt({
    name: "design_lifecycle_conversation",
    description: "Have a conversation to design a lifecycle.yaml file",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "current_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        }
    ],
    load: async (args) => {
        return generateLifecycleConversationPrompt(args);
    }
});
mcp.addPrompt({
    name: "implement_evolutions",
    description: "Implement evolutions for the decider pattern from a lifecycle.yaml file and aggregate and events types",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "types",
            description: "The types for the aggregate",
            required: false
        },
        {
            name: "events",
            description: "The event types for the aggregate",
            required: false
        },
        {
            name: "lifecycle_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        }
    ],
    load: async (args) => {
        return implementEvolutionsPrompt(args);
    }
});
mcp.addPrompt({
    name: "implement_types",
    description: "Implement aggreagate and events types from a lifecycle.yamle file",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "types",
            description: "The types for the aggregate",
            required: false
        },
        {
            name: "events",
            description: "The event types for the aggregate",
            required: false
        },
        {
            name: "evolutions",
            description: "The evolutions implementations to test",
            required: false
        },
        {
            name: "lifecycle_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        }
    ],
    load: async (args) => {
        return implementTypesPrompt(args);
    }
});
mcp.addPrompt({
    name: "test_evolve",
    description: "Creates a comprehensive test suite for the evolve function",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "lifecycle_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        }
    ],
    load: async (args) => {
        return testEvolvePrompt(args);
    }
});
mcp.addPrompt({
    name: "implement_decision",
    description: "Implement decision step of the decider pattarn for a given operation",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "operation",
            description: "The operation to implement",
            required: false
        },
        {
            name: "types",
            description: "The types for the aggregate",
            required: false
        },
        {
            name: "events",
            description: "The event types for the aggregate",
            required: false
        },
        {
            name: "lifecycle_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        }
    ],
    load: async (args) => {
        return implementDecisionPrompt(args);
    }
});
mcp.addPrompt({
    name: "test_operation",
    description: "Implement a comprehensive test suite for a given operation",
    arguments: [
        {
            name: "domain",
            description: "The domain/system being modeled (e.g., 'shopping cart', 'book loan')",
            required: false
        },
        {
            name: "operation",
            description: "The operation to implement",
            required: false
        },
        {
            name: "types",
            description: "The types for the aggregate",
            required: false
        },
        {
            name: "events",
            description: "The event types for the aggregate",
            required: false
        },
        {
            name: "lifecycle_yaml",
            description: "Current lifecycle.yaml content being worked on",
            required: false
        },
        {
            name: "decision_implementation",
            description: "The implementation of the decision step for the given operation",
            required: false
        }
    ],
    load: async (args) => {
        return testOperationPrompt(args);
    }
});
// mcp.addPrompt(
//       {
//         name: "generate_scenarios",
//         description: "Generate user stories and requirements from lifecycle.yaml",
//         arguments: [
//           {
//             name: "yaml_content",
//             description: "Content of the lifecycle.yaml file",
//             required: true
//           }
//         ],
//         load: async (args) => {
//           return generateScenariosPrompt(args as unknown as GenerationArgs)
//         }
//       },
//     );
// mcp.addPrompt(
//       {
//         name: "generate_specs",
//         description: "Generate technical specs.yaml from lifecycle.yaml",
//         arguments: [
//           {
//             name: "yaml_content",
//             description: "Content of the lifecycle.yaml file",
//             required: true
//           }
//         ],
//         load: async (args) => generateSpecsPrompt(args as unknown as GenerationArgs)
//       },
//     );
// mcp.addPrompt(
//       {
//         name: "generate_tests",
//         description: "Generate test cases from specs.yaml",
//         arguments: [
//           {
//             name: "specs_content",
//             description: "Content of the specs.yaml file",
//             required: true
//           }
//         ],
//         load: async (args) => generateTestsPrompt(args as unknown as SpecsGenerationArgs)
//       },
//     );
// mcp.addPrompt(
//       {
//         name: "generate_implementation",
//         description: "Generate implementation code from specs.yaml",
//         arguments: [
//           {
//             name: "specs_content",
//             description: "Content of the specs.yaml file",
//             required: true
//           }
//         ],
//          load: async (args) => generateImplementationPrompt(args as unknown as SpecsGenerationArgs)
//       },
//     );
// mcp.addTool(
//       {
//         name: "file_operations",
//         description: "Save and load files in the workspace",
//         parameters: z.object({
//           action: z.enum(['save', 'load', 'list', 'delete']).describe('possible actions'),
//           filename: z.string().optional().describe('the name of the file'),
//           content: z.string().optional().describe('content of the file'),
//           file_type: z.enum(['yaml', 'md', 'txt', 'json']).optional().describe('the file type')
//         }),
//         execute: async (args) => handleFileOperations(args as unknown as FileOperationArgs)
//       },
//     );
// mcp.addTool(
//       {
//         name: "validate_lifecycle",
//         description: "Validate lifecycle.yaml content",
//         parameters: z.object({
//           yaml_content: z.string().describe('content of the lifecycle.yaml file')
//         }),
//         execute: async (args) => handleLifecycleValidation(args as unknown as ValidationArgs)
//       },
//     );
//Validation tools:
// Example MCP tool usage pattern
// export const mcpTools = {
//   validateYAML: {
//     name: 'validate_yaml',
//     description: 'Validate YAML content against schema',
//     inputSchema: {
//       type: 'object',
//       properties: {
//         content: { type: 'string' },
//         fileType: { type: 'string', enum: ['lifecycle', 'assertions', 'decider'] }
//       },
//       required: ['content', 'fileType']
//     },
//     handler: validateYAMLContent
//   },
//   validateAggregate: {
//     name: 'validate_aggregate_consistency',
//     description: 'Check consistency across all aggregate files',
//     inputSchema: {
//       type: 'object',
//       properties: {
//         lifecycle: { type: 'string' },
//         assertions: { type: 'string' },
//         decider: { type: 'string' }
//       }
//     },
//     handler: validateAggregateConsistency
//   },
//   quickCheck: {
//     name: 'quick_validation_check',
//     description: 'Quick validation for real-time feedback',
//     inputSchema: {
//       type: 'object',
//       properties: {
//         content: { type: 'string' },
//         fileType: { type: 'string', enum: ['lifecycle', 'assertions', 'decider'] }
//       },
//       required: ['content', 'fileType']
//     },
//     handler: quickValidationCheck
//   },
//   extractStates: {
//     name: 'extract_aggregate_states',
//     description: 'Extract state information from lifecycle file',
//     inputSchema: {
//       type: 'object',
//       properties: {
//         lifecycleContent: { type: 'string' }
//       },
//       required: ['lifecycleContent']
//     },
//     handler: extractAggregateStates
//   }
// };
// ============================================================================
// BOOTSTRAP
// ============================================================================
mcp.start({
    transportType: "stdio",
});
