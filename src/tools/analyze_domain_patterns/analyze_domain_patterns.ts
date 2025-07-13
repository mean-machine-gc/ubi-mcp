import { FastMCP, FastMCPSession } from "fastmcp";
import { z } from 'zod'
import { sampleLlm } from "../../utils/utils";



export const addAnalyzeDomainPatters = (mcp: FastMCP) => (session: FastMCPSession): void => {
    mcp.addTool(
          {
            name: "analize_domain_patterns",
            description: "Analyzes industry patterns and best practices for a specific domain through iterative sampling",
            parameters: z.object({
              domain: z.string().describe(`The business domain to analyze (e.g., 'e-commerce', 'user management', 'financial services')`),
              context: z.string().describe(`Additional context about the specific use case or requirements`)
            }),
            execute: async (args) => {
                const { domain, context = "" } = args as {domain: string; context?: string;};
                const systemPrompt = `You are a domain modeling expert with deep knowledge of industry patterns and best practices.`
                const sample = sampleLlm(session)(systemPrompt)
                try{
                    // Step 1: Sample industry knowledge about the domain
                    const industryAnalysis = await sampleIndustry(sample)(domain)(context)

                    // Step 2: Sample specific operation patterns for this domain
                    const patterns = samplePatterns(sample)(industryAnalysis)

                    // Step 3: Sample architectural guidance
                    const guidance = sampleGuidance(sample)(domain)(patterns)

                    // Step 4: Sample specific recommendations for the user
                    const recommendations = sampleRecommendations(sample)(industryAnalysis)(guidance)(patterns)

                    return {
                            content: [
                                        {
                                            type: "text",
                                            text: `# Domain Pattern Analysis: ${domain}

                                                    ## Industry Analysis
                                                    ${industryAnalysis}

                                                    ## Common Operation Patterns
                                                    ${patterns}

                                                    ## Architectural Guidance
                                                    ${guidance}

                                                    ## Actionable Recommendations
                                                    ${recommendations}

                                                    ---
                                                    *This analysis was generated through iterative sampling of domain expertise and can be used as a foundation for building your lifecycle.yaml specification.*`
                                        }
                                    ]
                            }

                }catch(error){
                    return {
                        content: [
                            {
                            type: "text",
                            text: `Error analyzing domain patterns: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }
                        ],
                        isError: true
                        };
                }
            }
          },
          
        );
}




const sampleIndustry = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (domain: string) => 
    async (context: string) => {
    const userPrompt = `Analyze the "${domain}" domain and identify common business patterns, operations, and workflows.
        
                            Consider:
                            - Typical entities and their lifecycles
                            - Common business operations
                            - Standard security requirements
                            - Regulatory considerations
                            - Industry-specific constraints
                            
                            ${context ? `Additional context: ${context}` : ''}
                            
                            Provide a structured analysis with specific patterns.`
    
    return await sample(userPrompt)
}

const samplePatterns = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    async (industryAnalysis: any) => {
    // Step 1: Sample industry knowledge about the domain
    const userPrompt = `Based on this domain analysis:
      ${industryAnalysis}
      
      Identify 5-8 core operations that are typically needed in a ${industryAnalysis} system.
      
      For each operation, provide:
      - Operation name (in kebab-case)
      - Brief description
      - Typical preconditions
      - Common failure scenarios
      - Security considerations
      
      Format as a structured list.`
    
    return await sample(userPrompt)
}

const sampleGuidance = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (domain: string) => 
    async (operationPatterns: any) => {
    // Step 1: Sample industry knowledge about the domain
    const userPrompt = `Given these domain patterns:
      ${operationPatterns}
      
      Provide architectural recommendations for implementing a ${domain} aggregate:
      
      - State management patterns
      - Event design considerations
      - Integration points with external systems
      - Performance considerations
      - Scalability patterns
      
      Focus on practical, implementable advice.`
    
    return await sample(userPrompt)
}

const sampleRecommendations = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (industryAnalysis: any) =>
    (architecturalGuidance: any) => 
    async (operationPatterns: any) => {
    // Step 1: Sample industry knowledge about the domain
    const userPrompt = `Synthesize the following analysis into actionable recommendations:
      
      Industry Analysis: ${industryAnalysis}
      Operation Patterns: ${operationPatterns}
      Architectural Guidance: ${architecturalGuidance}
      
      Create a prioritized list of:
      1. Must-have operations for this domain
      2. Critical business rules to implement
      3. Security patterns to include
      4. Potential integration requirements
      5. Suggested next steps for implementation
      
      Make it specific and actionable for building a lifecycle.yaml file.`
    
    return await sample(userPrompt)
}






