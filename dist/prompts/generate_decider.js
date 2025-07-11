import { buildPromptMessages } from "../utils.js";
export const generateImplementationPrompt = async (args) => {
    const { specs_content } = args;
    const systemPrompt = `You are a senior developer creating production-ready decider pattern implementation.

Generate implementation code including:
- Command and state type definitions
- Decider function implementation
- Event sourcing infrastructure
- API endpoints for commands
- Business rule validation
- Error handling with failure codes

Use the executable assertions from specs.yaml to implement the actual business logic.`;
    const userPrompt = `Generate production-ready implementation from this specs.yaml:

\`\`\`yaml
${specs_content}
\`\`\`

Create complete decider pattern implementation with all the business logic.`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
