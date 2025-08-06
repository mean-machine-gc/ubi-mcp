import { sampleLlm } from "../../utils/utils";
import { z } from 'zod';
export const addGenerateTests = (mcp) => (session) => {
    mcp.addTool({
        name: "generate_tests",
        description: "Generates comprehensive test suite through sampling-based coverage analysis",
        parameters: z.object({
            lifecycle_yaml: z.string().describe(`The lifecycle.yaml content')`),
            assertions_yaml: z.string().describe(`The assertions.yaml content (optional)`),
            types_ts: z.string().describe(`The types.ts content`),
            decider_ts: z.string().describe(`The implemented decider code to test`),
        }),
        execute: async (args) => {
            const { lifecycle_yaml, assertions_yaml, types_ts, decider_ts, } = args;
            const systemPrompt = `You are a business analyst expert at breaking down operations into clear business requirements.`;
            const sample = sampleLlm(session)(systemPrompt);
            try {
                // Step 1: Analyze test requirements across all specifications
                const requirements = await sampleAnalysis(sample)(lifecycle_yaml)(assertions_yaml)(types_ts)(decider_ts);
                // Step 2: Generate shared test helpers and utilities
                const helpers = await sampleHelpers(sample)(requirements)(types_ts)(decider_ts);
                // Step 3: Generate operation-specific test files
                const operationsTests = await sampleOperationTests(sample)(requirements)(helpers)(decider_ts);
                // Step 4: Generate edge case and integration tests
                const edge_cases = await sampleEdgeCases(sample)(requirements)(operationsTests)(decider_ts);
                // Step 5: Validate test completeness and generate final suite
                const tests = await sampleFinalTests(sample)(requirements)(helpers)(operationsTests)(edge_cases);
                return {
                    content: [
                        {
                            type: "text",
                            text: `# Generated Comprehensive Test Suite

                                                    ## Test Requirements Analysis
                                                    ${requirements}

                                                    ## Final Test Suite
                                                    ${tests}

                                                    ---
                                                    *Generated through sampling-based test coverage analysis and validation.*`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error generating tests: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    });
};
const sampleAnalysis = (sample) => (lifecycle_yaml) => (assertions_yaml) => (types_ts) => async (decider_ts) => {
    const userPrompt = `Analyze comprehensive test requirements:
      
      Lifecycle: ${lifecycle_yaml}
      Assertions: ${assertions_yaml}
      Types: ${types_ts}
      Decider: ${decider_ts}
      
      Extract test scenarios for:
      - Every precondition (success and failure)
      - Every branch condition
      - Every state evolution
      - Every outcome assertion
      - Edge cases and boundary conditions
      
      Organize by operation and provide a test coverage matrix.`;
    return await sample(userPrompt);
};
const sampleHelpers = (sample) => (testRequirements) => (types_ts) => async (decider_ts) => {
    const userPrompt = `Generate shared test helpers based on the requirements:
      
      Test Requirements: ${testRequirements}
      Types Reference: ${types_ts}
      Implementation Reference: ${decider_ts}

      
      Create shared-helpers.ts with:
      - Test data builders for all command types
      - Sample state objects for different scenarios
      - Common assertion helpers
      - Decider execution utilities
      - Mock data generators
      `;
    return await sample(userPrompt);
};
const sampleOperationTests = (sample) => (testRequirements) => (sharedHelpers) => async (decider_ts) => {
    const userPrompt = `Generate operation-specific test files:
      
      Test Requirements: ${testRequirements}
      Shared Helpers: ${sharedHelpers}
      Implementation Reference: ${decider_ts}
      
      For each operation, create test file with:
      - Success scenario tests (all branches)
      - Precondition failure tests (each precondition)
      - Edge case tests (boundary conditions)
      - State evolution validation
      - Proper test organization and naming
      
      Generate complete Jest test suites with proper TypeScript typing.`;
    return await sample(userPrompt);
};
const sampleEdgeCases = (sample) => (testRequirements) => (operationTests) => async (decider_ts) => {
    const userPrompt = `Generate edge case and integration tests:
      
      Test Requirements: ${testRequirements}
      Operation Tests: ${operationTests}
      Implementation Reference: ${decider_ts}
      
      Create additional tests for:
      - Data validation boundary conditions
      - State immutability verification
      - Cross-operation state consistency
      - Performance edge cases
      - Error handling robustness
      
      Focus on scenarios that could cause production issues.`;
    return await sample(userPrompt);
};
const sampleFinalTests = (sample) => (testRequirements) => (sharedHelpers) => (operationTests) => async (edgeCaseTests) => {
    const userPrompt = `Assemble the complete test suite:
      
      Test Requirements: ${testRequirements}
      Shared Helpers: ${sharedHelpers}
      Operation Tests: ${operationTests}
      Edge Case Tests: ${edgeCaseTests}
      
      Create the final test file structure with:
      - Complete shared-helpers.ts
      - All operation-specific test files
      - Proper test organization
      - Coverage validation
      - Test documentation
      
      Ensure all specified coverage goals are met.`;
    return await sample(userPrompt);
};
