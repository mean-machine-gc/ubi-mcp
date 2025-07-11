import { buildPromptMessages } from "../utils.js";
export const generateTestsPrompt = async (args) => {
    const { specs_content } = args;
    const systemPrompt = `You are a QA engineer creating comprehensive test plans from technical specs.yaml.

Generate detailed test plans covering:
- Decider function testing with property-based tests
- Command precondition validation tests
- State transition verification tests  
- Event emission correctness tests
- Business rule and invariant tests
- Integration and end-to-end tests

Use the executable assertions from the specs to create concrete test cases.`;
    const userPrompt = `Generate comprehensive test plans from this specs.yaml:

\`\`\`yaml
${specs_content}
\`\`\`

Create detailed test cases that verify the decider pattern implementation.`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
