import { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { buildPromptMessages } from "../utils/utils.js";
import { GenerationArgs } from "../types.js";

export const generateSpecsPrompt = async (args: GenerationArgs): Promise<GetPromptResult> => {
  const { yaml_content } = args;

  const systemPrompt = `You are a senior software architect creating a technical specs.yaml from a high-level lifecycle.yaml.

Transform the business-oriented lifecycle.yaml into a technical specs.yaml using the decider pattern format with:

- **when**: Commands with executable assertions
- **and**: Preconditions with (dm) => boolean assertions and failureCodes
- **branches**: Execution paths with (dm) => boolean conditions
- **then**: Domain events emitted
- **andOutcome**: State changes with (om) => void assertions using expect syntax
- **invariants**: Business rules with appliesTo scope and executable assertions

Convert business language into:
- Executable TypeScript/JavaScript assertions
- Proper decider pattern structure (dm: DecisionModel = {cmd, state}, om: OutcomeModel = {evts, state})
- Technical event names and state properties
- Testable assertions using expect syntax
- Specific failure codes for error handling

The output should be a complete specs.yaml that developers can implement directly using the decider pattern.`;

  const userPrompt = `Transform this business-oriented lifecycle.yaml into a technical specs.yaml:

\`\`\`yaml
${yaml_content}
\`\`\`

Convert the business behaviors into executable decider pattern specifications with proper assertions, failure codes, and technical implementation details.`;

  return buildPromptMessages(systemPrompt)(userPrompt);
};