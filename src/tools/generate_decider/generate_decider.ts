import { FastMCP, FastMCPSession } from "fastmcp";
import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';



export const addGenerateDecider = (mcp: FastMCP) => (session: FastMCPSession): void => {
    mcp.addTool(
          {
            name: "generate_decider",
            description: "Generates decider implementation through iterative construction and validation",
            parameters: z.object({
              lifecycle_yaml: z.string().describe(`The lifecycle.yaml content')`),
              assertions_yaml: z.string().describe(`The assertions.yaml content (optional)`),
              types_ts: z.string().describe(`The types.ts content`),
              validation_level: z.union([
                                    z.literal('basic'),
                                    z.literal('comprehensive'),
                                    z.literal('production'),
                                ]).describe(`Code quality and validation level`),
              }),
            execute: async (args) => {
                  const {
                        lifecycle_yaml,
                        assertions_yaml,
                        types_ts,
                        validation_level = "comprehensive"
                    } = args as {
                        lifecycle_yaml: string;
                        assertions_yaml: string;
                        types_ts: string;
                        validation_level?: "basic" | "comprehensive" | "production";
                    };
                const systemPrompt = `You are a senior TypeScript developer expert in functional programming and business logic implementation, using the ubi-decider library to implement the decider pattern`
                const sample = sampleLlm(session)(systemPrompt)
                try{
                    // Step 1: Analyze implementation requirements
                    const requirements = await sampleRequirements(sample)(lifecycle_yaml)(assertions_yaml)

                    // Step 2: Generate preconditions implementation
                    const preconditions = await samplePreconitions(sample)(requirements)(lifecycle_yaml)(types_ts)(assertions_yaml)

                    // Step 3: Generate branches implementation
                    const branches = await sampleBranches(sample)(requirements)(lifecycle_yaml)(types_ts)(assertions_yaml)

                    // Step 4: Generate evolutions implementation
                    const evolution = await sampleEvolutions(sample)(requirements)(lifecycle_yaml)(types_ts)

                    // Step 5: Generate helper functions
                    const helpers = await sampleHelpers(sample)(requirements)(assertions_yaml)(types_ts)
                
                    // Step 6: Assemble final decider
                    const decider = await sampleFinalDecider(sample)(preconditions)(evolution)(branches)(helpers)(validation_level)(types_ts)

                    return {
                            content: [
                                        {
                                            type: "text",
                                            text: `# Generated Decider Implementation

                                                    ## Implementation Analysis
                                                    ${requirements}

                                                    ## Final Decider.ts
                                                    \`\`\`typescript
                                                    ${decider}
                                                    \`\`\`

                                                    ---
                                                    *Generated through iterative implementation construction and validation.*`
                                        }
                                    ]
                            }

                }catch(error){
                    return {
                        content: [
                            {
                            type: "text",
                            text: `Error generating decider: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    const userPrompt = `Analyze implementation requirements for the decider:
      
      Lifecycle:
      \`\`\`yaml
      ${lifecycle_yaml}
      \`\`\`
      
      Assertions:
      \`\`\`yaml
      ${assertions_yaml}
      \`\`\`
      
      Extract:
      - All preconditions and their logic implementation needs
      - All branching conditions and their implementation
      - All evolution patterns for state changes
      - Helper functions needed for validation
      - Type casting and safety requirements
      
      Provide a structured plan for implementation.`
    
    return await sample(userPrompt)
}

const samplePreconitions = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (implementationAnalysis: any) =>
    (lifecycle_yaml: any) =>
    (types_ts: any) =>
    async (assertions_yaml: any) => {
    const userPrompt =  `Generate the preconditions implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Reference: ${lifecycle_yaml}
      Assertions Reference: ${assertions_yaml}
      Types Reference: ${types_ts}

      
      Create the preconditions object with:
      - Proper structure: { 'command-type': [precondition array] }
      - Format: ['Description', (dm) => boolean, 'failure_code']
      - Convert assertion expressions to executable TypeScript
      - Include proper type guards and error handling
      - Add descriptive comments
      
      Use the exact assertion expressions as the basis for implementation.`
    
    return await sample(userPrompt)
}

const sampleBranches = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (implementationAnalysis: any) =>
    (lifecycle_yaml: any) =>
    (types_ts: any) =>
    async (assertions_yaml: any) => {
    const userPrompt =  `Generate the branches implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Reference: ${lifecycle_yaml}
      Assertions Reference: ${assertions_yaml}
      Types Reference: ${types_ts}

      Create the branches object with:
      - Structure: { 'command-type': [branch array] }
      - Format: ['Condition', (dm) => boolean, (dm) => Event]
      - Proper event generation matching types
      - Type-safe command casting
      - Event data extraction from commands
      
      Ensure events match the type definitions and lifecycle specifications.`
    
    return await sample(userPrompt)
}

const sampleEvolutions = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (implementationAnalysis: any) =>
    (lifecycle_yaml: any) =>
    async (types_ts: any) => {
    const userPrompt =  `Generate the evolutions implementation:
      
      Implementation Plan: ${implementationAnalysis}
      Lifecycle Outcomes: ${lifecycle_yaml}
      State Types: ${types_ts}
      
      Create the evolutions object with:
      - Structure: { 'event-type': (em) => NewState }
      - Proper state transitions based on outcome assertions
      - Timestamp handling and generated field management
      - Type-safe state evolution
      - State preservation for unchanged fields
      
      Ensure evolutions satisfy all outcome assertions from the lifecycle.`
    
    return await sample(userPrompt)
}

const sampleHelpers = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (implementationAnalysis: any) =>
    (assertions_yaml: any) =>
    async (types_ts: any) => {
    const userPrompt =  `Generate helper functions needed by the implementation:
      
      Implementation Analysis: ${implementationAnalysis}
      Assertions: ${assertions_yaml}
      Types: ${types_ts}
      
      Generate helper functions for:
      - Validation logic (email, password, etc.)
      - Business rule checking
      - Data transformation
      - ID generation and hashing
      - Any utility functions referenced in assertions
      
      Create helper functions with proper TypeScript typing.`
    
    return await sample(userPrompt)
}

const sampleFinalDecider = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (preconditionsImpl: any) =>
    (evolutionsImpl: any) =>
    (branchesImpl: any) =>
    (helperFunctions: any) =>
    (validation_level: any) =>
    async (types_ts: any) => {
    const userPrompt =  `Assemble the complete decider.ts file:
      
      Preconditions: ${preconditionsImpl}
      Branches: ${branchesImpl}
      Evolutions: ${evolutionsImpl}
      Helpers: ${helperFunctions}
      Types Reference: ${types_ts}
      
      Create the final decider.ts file with:
      - Proper imports from types and framework
      - All implementation sections
      - Helper functions
      - Decider export with proper typing
      - Clean, readable code structure
      
      Ensure ${validation_level} quality standards and proper TypeScript compliance.`
    
    return await sample(userPrompt)
}

