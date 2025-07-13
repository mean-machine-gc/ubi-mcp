import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { validateLifecycle, toCallToolResult } from "../utils/utils.js";
import { ValidationArgs } from "../types";

export const handleLifecycleValidation = async (args: ValidationArgs): Promise<CallToolResult> => {
    const { yaml_content } = args;
    const result = await validateLifecycle(yaml_content);
    return toCallToolResult(result);
  }