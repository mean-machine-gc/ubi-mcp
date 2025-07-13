#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { generateImplementationPrompt, generateLifecycleConversationPrompt, generateScenariosPrompt, generateSpecsPrompt, generateTestsPrompt } from "./prompts/index.js";
import { handleFileOperations, handleLifecycleValidation } from "./tools/index.js";
import { FileOperationArgs, GenerationArgs, SpecsGenerationArgs, ValidationArgs } from "./types.js";
import { z } from 'zod'
import { validateYAMLContent, validateAggregateConsistency, quickValidationCheck, extractAggregateStates } from "./utils/yaml-validation/validator.js";


const mcp = new FastMCP({
        name: 'Ubi Toolkit MCP Server',
        version: "1.0.0",
    });

mcp.on("connect", (event) => {
  console.log("Client connected:", event.session);
  //add tools with sampling
});

mcp.addPrompt(
      {
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
        return generateLifecycleConversationPrompt(args)
      }
    }
  );

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

mcp.addPrompt(
      {
        name: "generate_specs",
        description: "Generate technical specs.yaml from lifecycle.yaml",
        arguments: [
          {
            name: "yaml_content",
            description: "Content of the lifecycle.yaml file",
            required: true
          }
        ],
        load: async (args) => generateSpecsPrompt(args as unknown as GenerationArgs)
      },
      
    );

mcp.addPrompt(
      {
        name: "generate_tests",
        description: "Generate test cases from specs.yaml",
        arguments: [
          {
            name: "specs_content",
            description: "Content of the specs.yaml file",
            required: true
          }
        ],
        load: async (args) => generateTestsPrompt(args as unknown as SpecsGenerationArgs)
      },
      
    );

mcp.addPrompt(
      {
        name: "generate_implementation",
        description: "Generate implementation code from specs.yaml",
        arguments: [
          {
            name: "specs_content",
            description: "Content of the specs.yaml file",
            required: true
          }
        ],
         load: async (args) => generateImplementationPrompt(args as unknown as SpecsGenerationArgs)
      },
      
    );



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

mcp.addTool(
      {
        name: "validate_lifecycle",
        description: "Validate lifecycle.yaml content",
        parameters: z.object({
          yaml_content: z.string().describe('content of the lifecycle.yaml file')
        }),
        execute: async (args) => handleLifecycleValidation(args as unknown as ValidationArgs)
      },
      
    );


//Validation tools:
// Example MCP tool usage pattern
export const mcpTools = {
  validateYAML: {
    name: 'validate_yaml',
    description: 'Validate YAML content against schema',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        fileType: { type: 'string', enum: ['lifecycle', 'assertions', 'decider'] }
      },
      required: ['content', 'fileType']
    },
    handler: validateYAMLContent
  },
  
  validateAggregate: {
    name: 'validate_aggregate_consistency',
    description: 'Check consistency across all aggregate files',
    inputSchema: {
      type: 'object',
      properties: {
        lifecycle: { type: 'string' },
        assertions: { type: 'string' },
        decider: { type: 'string' }
      }
    },
    handler: validateAggregateConsistency
  },
  
  quickCheck: {
    name: 'quick_validation_check',
    description: 'Quick validation for real-time feedback',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        fileType: { type: 'string', enum: ['lifecycle', 'assertions', 'decider'] }
      },
      required: ['content', 'fileType']
    },
    handler: quickValidationCheck
  },
  
  extractStates: {
    name: 'extract_aggregate_states',
    description: 'Extract state information from lifecycle file',
    inputSchema: {
      type: 'object',
      properties: {
        lifecycleContent: { type: 'string' }
      },
      required: ['lifecycleContent']
    },
    handler: extractAggregateStates
  }
};

// ============================================================================
// BOOTSTRAP
// ============================================================================

mcp.start({
  transportType: "stdio",
});