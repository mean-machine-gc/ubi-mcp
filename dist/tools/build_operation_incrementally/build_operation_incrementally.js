import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';
export const addBuilsOperationIncrementally = (mcp) => (session) => {
    mcp.addTool({
        name: "build_operation_incrementally",
        description: "Builds a complete operation specification through iterative sampling and analysis",
        parameters: z.object({
            operation_name: z.string().describe(`Name of the operation to build (e.g., 'CreateUser', 'ProcessPayment')`),
            operation_description: z.string().describe(`Brief description of what this operation should do`),
            domain_context: z.string().describe(`Domain context for this operation`),
            existing_operations: z.array(z.string()).describe(`List of existing operations in this aggregate`)
        }),
        execute: async (args) => {
            const { operation_name, operation_description = "", domain_context = "", existing_operations = [] } = args;
            const systemPrompt = `You are a business analyst expert at breaking down operations into clear business requirements.`;
            const sample = sampleLlm(session)(systemPrompt);
            try {
                // Step 1: Sample operation analysis and scoping
                const analysis = await sampleAnalysis(sample)(operation_name)(operation_description)(domain_context)(existing_operations);
                // Step 2: Sample security and access control requirements
                const sec = await sampleSecurity(sample)(analysis);
                // Step 3: Sample business preconditions iteratively
                const precon = await samplePreconditions(sample)(operation_name)(analysis);
                // Step 4: Sample branching logic and outcomes
                const branching = await sampleBranching(sample)(operation_name)(analysis)(precon);
                // Step 5: Sample final operation specification
                const specs = await sampleSpecifications(sample)(operation_name)(analysis)(precon)(branching);
                // Step 6: Sample validation and improvement suggestions
                const review = await sampleReview(sample)(specs);
                return {
                    content: [
                        {
                            type: "text",
                            text: `# Incrementally Built Operation: ${operation_name}

                                                ## Business Analysis
                                                ${analysis}

                                                ## Security Requirements
                                                ${sec}

                                                ## Preconditions Analysis  
                                                ${precon}

                                                ## Branching Logic
                                                ${branching}

                                                ## Final Operation Specification
                                                ${specs}

                                                ## Validation & Recommendations
                                                ${review}

                                                ---
                                                *This operation was built through iterative sampling and analysis. Review the recommendations and refine as needed.*`
                        }
                    ]
                };
            }
            catch (error) {
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
    });
};
const sampleAnalysis = (sample) => (operation_name) => (operation_description) => (domain_context) => async (existing_operations) => {
    const userPrompt = `Analyze the "${operation_name}" operation for building a lifecycle specification.
      
      ${operation_description ? `Description: ${operation_description}` : ''}
      ${domain_context ? `Domain context: ${domain_context}` : ''}
      ${existing_operations.length ? `Existing operations: ${existing_operations.join(', ')}` : ''}
      
      Identify:
      - The business purpose and scope
      - Who can perform this operation (actors/roles)
      - What triggers this operation
      - What the successful outcome looks like
      - What could go wrong
      
      Be specific and business-focused.`;
    return await sample(userPrompt);
};
const sampleSecurity = (sample) => async (operationAnalysis) => {
    const userPrompt = `Based on this operation analysis:
      ${operationAnalysis}
      
      Define the security and access control requirements (guards):
      
      - Authentication requirements
      - Authorization rules  
      - Ownership verification needs
      - Role-based access controls
      - Any special security considerations
      
      Provide guard names in snake_case format (e.g., user_is_authenticated, user_owns_resource).`;
    return await sample(userPrompt);
};
const samplePreconditions = (sample) => (operation_name) => async (operationAnalysis) => {
    const userPrompt = `For the "${operation_name}" operation:
      ${operationAnalysis}
      
      Identify all business preconditions that must be true for this operation to succeed:
      
      - State-based conditions (entity exists, status requirements)
      - Data validation requirements
      - Business rule constraints
      - External system dependencies
      - Temporal constraints (timing, sequences)
      
      For each precondition:
      - Provide a snake_case name
      - Give a clear business description
      - Identify the failure scenario if not met
      
      Focus on business logic, not technical implementation.`;
    return await sample(userPrompt);
};
const sampleBranching = (sample) => (operation_name) => (operationAnalysis) => async (preconditionsAnalysis) => {
    const userPrompt = `For the "${operation_name}" operation, design the success scenarios:
      
      Operation Analysis: ${operationAnalysis}
      Preconditions: ${preconditionsAnalysis}
      
      Identify:
      1. Different success paths (branches) this operation might take
      2. The conditions that determine which path is taken
      3. What event should be emitted for each path
      4. What state changes should occur (outcomes)
      
      Consider:
      - Are there different levels of success?
      - Do different input conditions lead to different outcomes?
      - What data needs to be captured in events?
      - What state assertions need to be verified?
      
      Provide branch conditions in snake_case and events in kebab-case.`;
    return await sample(userPrompt);
};
const sampleSpecifications = (sample) => (operation_name) => (securityAnalysis) => (preconditionsAnalysis) => async (branchingAnalysis) => {
    const userPrompt = `Create a complete lifecycle.yaml operation specification for "${operation_name}":
      
      Security Analysis: ${securityAnalysis}
      Preconditions: ${preconditionsAnalysis}
      Branching: ${branchingAnalysis}
      
      Format as valid YAML following this structure:
      
      \`\`\`yaml
      - name: OperationName
        description: Clear business description
        guards:
          - guard_name_1
          - guard_name_2
        when: command-name
        preconditions:
          - precondition_1
          - precondition_2
        branches:
          - condition: branch_condition
            then: event-name
            andOutcome:
              - outcome_assertion_1
              - outcome_assertion_2
      \`\`\`
      
      Ensure all names follow the conventions:
      - Commands: kebab-case
      - Events: kebab-case  
      - Guards/Preconditions/Conditions/Outcomes: snake_case`;
    return await sample(userPrompt);
};
const sampleReview = (sample) => async (operationSpec) => {
    const userPrompt = `Review this operation specification and provide validation feedback:
      
      ${operationSpec}
      
      Check for:
      - Completeness (are all scenarios covered?)
      - Consistency (do names and logic align?)
      - Best practices (security, error handling)
      - Missing edge cases
      - Potential improvements
      
      Provide specific, actionable feedback.`;
    return await sample(userPrompt);
};
