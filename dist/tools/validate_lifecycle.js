import { validateLifecycle, toCallToolResult } from "../utils/utils.js";
export const handleLifecycleValidation = async (args) => {
    const { yaml_content } = args;
    const result = await validateLifecycle(yaml_content);
    return toCallToolResult(result);
};
