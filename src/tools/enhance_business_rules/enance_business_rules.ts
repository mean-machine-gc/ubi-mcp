import { FastMCP, FastMCPSession } from "fastmcp";
import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';

type FocusArea = 'security' | 'edge_cases' | 'compliance' | 'performance' | 'usability';

export const addEnhanceBusinessRules = (mcp: FastMCP) => (session: FastMCPSession): void => {
    mcp.addTool(
          {
            name: "enhance_business_rules",
            description: "Enhances existing business rules through multi-perspective sampling analysis",
            parameters: z.object({
              current_lifecycle: z.string().describe(`Current lifecycle.yaml content to enhance`),
              focus_areas: z.array(
                z.union([
                    z.literal('security'),
                    z.literal('edge_cases'),
                    z.literal('compliance'),
                    z.literal('performance'),
                    z.literal('usability'),
                ])
              ),
              domain_context: z.string().describe(`Domain context for this operation`),
            }),
            execute: async (args) => {
                 const { 
                        current_lifecycle,
                        focus_areas = ["security", "edge_cases", "compliance"],
                        domain_context = ""
                    } = args as {
                        current_lifecycle: string;
                        focus_areas?: FocusArea[];
                        domain_context?: string;
                    };
                const systemPrompt = `You are a business analyst expert at breaking down operations into clear business requirements.`
                const sample = sampleLlm(session)(systemPrompt)
                try{
                    // Step 1: Sample analysis of current rules
                    const analysis = await sampleAnalysis(sample)(current_lifecycle)(domain_context)

                    // Step 2: Sample security enhancement analysis, edge case analysis, compliance analysis, missing business rule identification, improvement recommendations
                    const improvements = await sampleByFocusArea(sample)(focus_areas)(analysis)(domain_context)(current_lifecycle)

                    return {
                            content: [
                                        {
                                            type: "text",
                                            text: `# Business Rules Enhancement Analysis

                                                    ## Current State Assessment
                                                    ${analysis}

                                                    ## Security Enhancement Opportunities
                                                    ${improvements.securityEnhancement}

                                                    ## Edge Case Coverage Analysis
                                                    ${improvements.edgeCaseAnalysis}

                                                    ## Compliance Considerations
                                                    ${improvements.complianceAnalysis}

                                                    ## Missing Business Rules Identification
                                                    ${improvements.missingRulesAnalysis}

                                                    ## Concrete Improvement Recommendations
                                                    ${improvements.improvements}

                                                    ---
                                                    *This enhancement analysis was generated through multi-perspective sampling. Prioritize the high-priority improvements for immediate implementation.*`
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


const sampleAnalysis = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (current_lifecycle: any) =>
    async (domain_context: any) => {
    const userPrompt =  `Analyze this lifecycle specification for business rule completeness:
      
      \`\`\`yaml
      ${current_lifecycle}
      \`\`\`
      
      ${domain_context ? `Domain context: ${domain_context}` : ''}
      
      Identify:
      - What business rules are currently implemented
      - What operations exist and their scope
      - Current security measures
      - Existing validation patterns
      - Areas that seem incomplete or shallow
      
      Provide a comprehensive assessment.`
    
    return await sample(userPrompt)
}

const sampleByFocusArea = 
    (sample: (userPrompt: string) => Promise<unknown>) => 
    (focus_areas: FocusArea[]) =>
    (currentAnalysis: any) =>
    (domain_context: any) =>
    async (current_lifecycle: any) => {
    const securityEnhancement = focus_areas.includes("security") ? await sample(
      `Analyze the security aspects of this lifecycle:
      
      Current Analysis: ${currentAnalysis}
      Lifecycle: ${current_lifecycle}
      
      Identify security gaps and enhancements:
      
      - Missing authentication/authorization checks
      - Insufficient input validation
      - Potential privilege escalation risks
      - Missing audit trail requirements
      - Data protection considerations
      - Rate limiting or abuse prevention needs
      
      For each identified gap, suggest:
      - Specific guards to add
      - Additional preconditions needed
      - Security-focused outcome assertions
      
      Be specific and actionable.`
    ) : "Security analysis skipped.";

    const edgeCaseAnalysis = focus_areas.includes("edge_cases") ? await sample(
      `Identify missing edge cases and failure scenarios:
      
      Current Lifecycle: ${current_lifecycle}
      Current Analysis: ${currentAnalysis}
      
      Consider:
      - Boundary conditions for data validation
      - Race conditions and concurrent access
      - System failure scenarios
      - Invalid state transitions
      - Malformed or malicious input
      - External dependency failures
      - Performance edge cases (large data, high load)
      
      For each edge case, suggest:
      - Additional preconditions to handle it
      - Failure scenarios to document
      - Defensive programming considerations
      
      Focus on realistic, business-impacting scenarios.`
    ) : "Edge case analysis skipped.";

    const complianceAnalysis = focus_areas.includes("compliance") ? await sample(
      `Analyze compliance and regulatory considerations:
      
      Domain: ${domain_context}
      Current Lifecycle: ${current_lifecycle}
      
      Consider compliance requirements for:
      - Data privacy (GDPR, CCPA)
      - Financial regulations (if applicable)
      - Industry-specific requirements
      - Audit trail requirements
      - Data retention policies
      - Access logging and monitoring
      
      Suggest:
      - Additional business rules for compliance
      - Audit-focused outcome assertions
      - Data handling preconditions
      - Compliance-driven guards
      
      Be specific about regulatory requirements.`
    ) : "Compliance analysis skipped.";

     const missingRulesAnalysis = await sample(
      `Identify missing business rules and operations:
      
      Current Analysis: ${currentAnalysis}
      Security Gaps: ${securityEnhancement}
      Edge Cases: ${edgeCaseAnalysis}
      Compliance: ${complianceAnalysis}
      
      Identify:
      - Missing business operations that should exist
      - Incomplete business rule coverage
      - Missing state validations
      - Insufficient error handling
      - Missing integration points
      
      For each missing rule, suggest:
      - Where it should be added (which operation)
      - What type of rule it is (guard, precondition, outcome)
      - The business justification
      - Implementation priority (high/medium/low)`
    );

    const improvements = await sample(
      `Create concrete improvement recommendations:
      
      Analysis Summary:
      - Current State: ${currentAnalysis}
      - Security Gaps: ${securityEnhancement}
      - Edge Cases: ${edgeCaseAnalysis}
      - Compliance Issues: ${complianceAnalysis}
      - Missing Rules: ${missingRulesAnalysis}
      
      Provide:
      1. High-priority improvements (critical for production)
      2. Medium-priority enhancements (important for robustness)
      3. Low-priority additions (nice-to-have)
      
      For each improvement:
      - Specific YAML changes to make
      - Business justification
      - Implementation complexity estimate
      - Risk if not implemented
      
      Format as actionable tasks.`
    );

    return {
        securityEnhancement,
        edgeCaseAnalysis,
        complianceAnalysis,
        missingRulesAnalysis,
        improvements
    }
}

    

