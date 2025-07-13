import { FastMCP, FastMCPSession } from "fastmcp";
import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';


export const addGenerateTypes = (mcp: FastMCP) => (session: FastMCPSession): void => {
    mcp.addTool(
          {
            name: "generate_types",
            description: "Generates TypeScript types through progressive analysis and refinement",
            parameters: z.object({
              lifecycle_yaml: z.string().describe(`The lifecycle.yaml content')`),
              assertions_yaml: z.string().describe(`The assertions.yaml content (optional)`),
              type_philosophy: z.union([
                                    z.literal('strict'),
                                    z.literal('flexible'),
                                    z.literal('minimal'),
                                ]).describe(`Type safety approach to use`),
              include_validation_patterns: z.boolean().describe(`Whether to include validation patterns in JSDoc`)
            }),
            execute: async (args) => {
                  const {
                        lifecycle_yaml,
                        assertions_yaml = "",
                        type_philosophy = "strict",
                        include_validation_patterns = true
                    } = args as {
                        lifecycle_yaml: string;
                        assertions_yaml?: string;
                        type_philosophy?: "strict" | "flexible" | "minimal";
                        include_validation_patterns?: boolean;
                    };
                const systemPrompt = `You are a TypeScript expert specializing in domain modeling and type safety.`
                const sample = sampleLlm(session)(systemPrompt)
                try{
                    // Step 1: Extract type requirements from specifications
                    const requirements = await sampleRequirements(sample)(lifecycle_yaml)(assertions_yaml)

                    // Step 2: Design state type hierarchy
                    const stateType = await sampleBaseTypes(sample)(requirements)(type_philosophy)

                    // Step 3: Design command and event types
                    const messageTypes = await sampleMessageTypes(sample)(requirements)(stateType)(include_validation_patterns)

                    // Step 4: Generate failure types and decider type
                    const failsAndDecider = await sampleFailuerAndDecider(sample)(requirements)(messageTypes)

                    // Step 5: Validate and assemble final types
                    const finalTypes = await sampleFinalTypes(sample)(stateType)(messageTypes)(failsAndDecider)
   

                    return {
                            content: [
                                        {
                                            type: "text",
                                            text: `# Generated TypeScript Types

                                                    ## Type Requirements Analysis
                                                    ${requirements}

                                                    ## Final Types.ts
                                                    \`\`\`typescript
                                                    ${finalTypes}
                                                    \`\`\`

                                                    ---
                                                    *Generated through progressive type analysis and validation.*`
                                        }
                                    ]
                            }

                }catch(error){
                    return {
                        content: [
                            {
                            type: "text",
                            text: `Error generating types: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }
                        ],
                        isError: true
                        };
                }
            }
          },
          
        );
}

const sampleRequirements = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (lifecycle_yaml: any) =>
    async (assertions_yaml: any) => {
    const userPrompt = `Analyze these specifications to extract TypeScript type requirements:
      
      Lifecycle:
      \`\`\`yaml
      ${lifecycle_yaml}
      \`\`\`
      
      ${assertions_yaml ? `Assertions:\n\`\`\`yaml\n${assertions_yaml}\n\`\`\`` : ''}
      
      Extract:
      - All command types (from 'when' fields)
      - All event types (from 'then' fields)  
      - State variations (from operations and outcomes)
      - All possible failure codes
      - Field types and constraints from business rules
      - Validation patterns from assertions
      
      Provide a structured analysis of what TypeScript types are needed.`
    
    return await sample(userPrompt)
}

const sampleBaseTypes = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (typeRequirements: any) =>
    async (type_philosophy: any) => {
    const userPrompt = `Design the state type hierarchy based on this analysis:
      
      ${typeRequirements}
      
      Create:
      - Status enum (union of all possible statuses)
      - Base type with common fields
      - State-specific types with discriminated unions
      - Proper invariants and JSDoc annotations
      
      Use ${type_philosophy} type philosophy:
      - strict: Maximum type safety, detailed validation
      - flexible: Balanced safety with ease of use
      - minimal: Essential types only
      
      Include proper TypeScript patterns for discriminated unions.`
    
    return await sample(userPrompt)
}

const sampleMessageTypes = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (typeRequirements: any) =>
    (stateTypes: any) =>
    async (include_validation_patterns: any) => {
    const userPrompt = `Design command and event types:
      
      Type Requirements: ${typeRequirements}
      State Types: ${stateTypes}
      
      Create:
      - Individual command types with proper data shapes
      - Individual event types with essential data
      - Union types for all commands and events
      - Proper JSDoc with business rules and validation patterns
      
      ${include_validation_patterns ? 'Include @pattern, @minLength, @maxLength annotations from business rules.' : ''}
      
      Ensure commands include metadata fields for pre-resolved checks.`
    
    return await sample(userPrompt)
}

const sampleFailuerAndDecider = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (typeRequirements: any) =>
    async (commandEventTypes: any) => {
    const userPrompt = `Complete the type system with failure types and decider integration:
      
      Requirements: ${typeRequirements}
      Commands/Events: ${commandEventTypes}
      
      Create:
      - Failure enum with all possible failure codes
      - TDecider type that integrates with the framework
      - Helper types for validation and testing
      - Proper exports and imports
      
      Ensure compatibility with the decider framework type system.`
    
    return await sample(userPrompt)
}

const sampleFinalTypes = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (stateTypes: any) =>
    (commandEventTypes: any) =>
    async (systemTypes: any) => {
    const userPrompt = `Assemble the complete types.ts file:
      
      State Types: ${stateTypes}
      Command/Event Types: ${commandEventTypes}
      System Types: ${systemTypes}
      
      Create the final types.ts file with:
      - Proper imports
      - All type definitions in logical order
      - Complete JSDoc documentation
      - Proper TypeScript syntax
      - Framework integration types
      
      Validate that all types are consistent and compile correctly.`
    
    return await sample(userPrompt)
}

