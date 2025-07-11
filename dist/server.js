#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { generateImplementationPrompt, generateLifecycleConversationPrompt, generateRequirementsPrompt, generateSpecsPrompt, generateTestsPrompt } from "./prompts/index.js";
import { handleFileOperations, handleLifecycleValidation } from "./tools/index.js";
import { z } from 'zod';
const mcp = new FastMCP({
    name: 'Ubi Toolkit MCP Server',
    version: "1.0.0",
});
mcp.addPrompt({
    name: "git-commit",
    description: "Generate a Git commit message",
    arguments: [
        {
            name: "changes",
            description: "Git diff or description of changes",
            required: true,
        },
    ],
    load: async (args) => {
        return `Generate a concise but descriptive commit message for these changes:\n\n${args.changes}`;
    },
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
    name: "generate_requirements",
    description: "Generate user stories and requirements from lifecycle.yaml",
    arguments: [
        {
            name: "yaml_content",
            description: "Content of the lifecycle.yaml file",
            required: true
        }
    ],
    load: async (args) => {
        return generateRequirementsPrompt(args);
    }
});
mcp.addPrompt({
    name: "generate_specs",
    description: "Generate technical specs.yaml from lifecycle.yaml",
    arguments: [
        {
            name: "yaml_content",
            description: "Content of the lifecycle.yaml file",
            required: true
        }
    ],
    load: async (args) => generateSpecsPrompt(args)
});
mcp.addPrompt({
    name: "generate_tests",
    description: "Generate test cases from specs.yaml",
    arguments: [
        {
            name: "specs_content",
            description: "Content of the specs.yaml file",
            required: true
        }
    ],
    load: async (args) => generateTestsPrompt(args)
});
mcp.addPrompt({
    name: "generate_implementation",
    description: "Generate implementation code from specs.yaml",
    arguments: [
        {
            name: "specs_content",
            description: "Content of the specs.yaml file",
            required: true
        }
    ],
    load: async (args) => generateImplementationPrompt(args)
});
mcp.addTool({
    name: "file_operations",
    description: "Save and load files in the workspace",
    parameters: z.object({
        action: z.enum(['save', 'load', 'list', 'delete']).describe('possible actions'),
        filename: z.string().optional().describe('the name of the file'),
        content: z.string().optional().describe('content of the file'),
        file_type: z.enum(['yaml', 'md', 'txt', 'json']).optional().describe('the file type')
    }),
    execute: async (args) => handleFileOperations(args)
});
mcp.addTool({
    name: "validate_lifecycle",
    description: "Validate lifecycle.yaml content",
    parameters: z.object({
        yaml_content: z.string().describe('content of the lifecycle.yaml file')
    }),
    execute: async (args) => handleLifecycleValidation(args)
});
// ============================================================================
// BOOTSTRAP
// ============================================================================
mcp.start({
    transportType: "stdio",
});
