import { FastMCP, FastMCPSession } from "fastmcp";
import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';



export const addGenerateAssertions = (mcp: FastMCP) => (session: FastMCPSession): void => {
    mcp.addTool(
          {
            name: "generate_assertions",
            description: "Generates assertions.yaml through iterative sampling and validation",
            parameters: z.object({
              lifecycle_yaml: z.string().describe(`The lifecycle.yaml content to generate assertions from')`),
              validation_focus: z.array(
                z.union([
                    z.literal('completeness'),
                    z.literal('security'),
                    z.literal('business_rules'),
                    z.literal('edge_cases'),
                ])
              ).describe(`Areas to focus validation analysis on`),
              iteration_depth: z.number().describe(`Number of refinement iterations to perform`),
            }),
            execute: async (args) => {
                  const {
                        lifecycle_yaml,
                        validation_focus = ["completeness", "security", "business_rules"],
                        iteration_depth = 3
                    } = args as {
                        lifecycle_yaml: string;
                        validation_focus?: string[];
                        iteration_depth?: number;
                    };
                const systemPrompt = `You are a business analyst expert at breaking down operations into clear business requirements.`
                const sample = sampleLlm(session)(systemPrompt)
                try{
      
                    // Step 1: Parse and analyze lifecycle structure
                    const analysis = await sampleAnalysis(sample)(lifecycle_yaml)

                    // Step 2: Generate base assertions for each category
                    const baseAssertion = await sampleBaseAssertions(sample)(analysis)
                    
                    // Step 3: Enhance with security analysis (if requested)
                    // Step 4: Validate completeness and consistency
                    // Step 5: Apply fixes and generate final version
                    const finalAnalysis = await sampleByFocusArea(sample)(validation_focus)(baseAssertion)(lifecycle_yaml)
   
                    return {
                            content: [
                                        {
                                            type: "text",
                                            text: `# Generated Assertions with Iterative Sampling

                                                    ## Structure Analysis
                                                    ${analysis}

                                                    ## Validation Analysis
                                                    ${finalAnalysis.validationAnalysis}

                                                    ## Final Assertions.yaml
                                                    \`\`\`yaml
                                                    ${finalAnalysis.finalAssertions}
                                                    \`\`\`

                                                    ---
                                                    *Generated through ${iteration_depth} iterations of sampling-based analysis and validation.*`
                                        }
                                    ]
                            }

                }catch(error){
                    return {
                        content: [
                            {
                            type: "text",
                            text: `Error generating assertions: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }
                        ],
                        isError: true
                        };
                }
            }
          },
          
        );
}




const sampleAnalysis = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    async (lifecycle_yaml: any) => {
    const userPrompt = `Analyze this lifecycle.yaml structure to identify all elements that need assertions:
      
      \`\`\`yaml
      ${lifecycle_yaml}
      \`\`\`
      
      Extract and categorize:
      - All guards that need implementation
      - All preconditions that need expressions
      - All branching conditions that need logic
      - All outcome assertions that need validation
      
      Provide a structured mapping of what needs to be implemented.`
    
    return await sample(userPrompt)
}

const sampleBaseAssertions = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    async (structureAnalysis: any) => {
    const userPrompt = `Generate base assertions.yaml content based on this analysis:
      
      ${structureAnalysis}
      
      Create the initial assertions.yaml structure with:
      - Guards section with async implementations
      - Preconditions section with pure function expressions  
      - Branching_conditions section with decision logic
      - Outcome_assertions section with assert + description
      
      Follow the naming conventions and expression patterns from the specification.
      Use proper TypeScript/JavaScript expressions that reference cmd.payload, cmd.metadata, state, etc.`
    
    return await sample(userPrompt)
}

const sampleByFocusArea = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (validation_focus: string[]) =>
    (baseAssertions: any) =>
    async (lifecycle_yaml: any) => {

    const securityEnhanced = validation_focus.includes("security") ? await sample(
      `Enhance these assertions with security considerations:
      
      Current assertions:
      ${baseAssertions}
      
      Original lifecycle:
      ${lifecycle_yaml}
      
      Add or improve:
      - Additional security guards for sensitive operations
      - Input validation preconditions to prevent injection/manipulation
      - Authorization checks beyond basic authentication
      - Security-focused outcome assertions (audit trails, data protection)
      
      Integrate security enhancements into the existing structure.`
    ) : baseAssertions;


    const validationAnalysis = await sample(
      `Validate these assertions for completeness and consistency:
      
      ${securityEnhanced}
      
      Check for:
      - Every lifecycle element has corresponding assertion
      - Expressions are syntactically valid
      - Naming conventions are consistent
      - Logic is implementable and testable
      - No circular dependencies or conflicts
      
      Identify any gaps or issues and suggest specific fixes.`
    );

     const finalAssertions = await sample(
      `Apply validation feedback to create the final assertions.yaml:
      
      Current assertions: ${securityEnhanced}
      Validation feedback: ${validationAnalysis}
      
      Generate the final, production-ready assertions.yaml file that:
      - Addresses all validation issues
      - Includes proper header (aggregate, version)
      - Has complete, correct expressions
      - Follows all naming conventions
      - Is properly formatted YAML
      
      Output only the final YAML content.`
    );



    return {
        validationAnalysis,
        finalAssertions
    }
}

