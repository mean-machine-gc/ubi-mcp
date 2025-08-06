import { buildPromptMessages } from "../utils/utils.js";
export const generateScenariosPrompt = async (args) => {
    const { yaml_content } = args;
    const systemPrompt = `You are a business analyst expert at converting lifecycle.yaml specifications into user stories and Given-When-Then scenarios.

Generate comprehensive requirements organized as:

## User Stories
For each "when" behavior, create user stories following this format:
- **As a [user/actor]**, I want to [action] so that [benefit]
- Include Given-When-Then scenarios
- Include failure scenarios for edge cases
`;
    const userPrompt = `Generate comprehensive requirements from this lifecycle.yaml:

\`\`\`yaml
${yaml_content}
\`\`\`

Create detailed user stories and requirements based on the behaviors and invariants defined above.`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
// ## Functional Requirements (FR-001, FR-002, etc.)
// ## Non-functional Requirements (NFR-001, NFR-002, etc.)  
// ## Business Rules (BR-001, BR-002, etc.)
// Each requirement should include:
// - ID and descriptive title
// - Detailed description
// - Acceptance criteria
// - Priority level
// - Dependencies
