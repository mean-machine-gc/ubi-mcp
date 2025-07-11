import { saveFile, loadFile, listFiles, deleteFile, failure, toCallToolResult } from "../utils.js";
const saveFileInWorkspace = saveFile('');
const loadFileFromWorkspace = loadFile('');
const listFilesInWorkspace = listFiles('');
const deleteFileFromWorkspace = deleteFile('');
//HELPERS:
export const handleFileOperations = async (args) => {
    const { action, filename = "", content = "", file_type = "yaml" } = args;
    const result = await (async () => {
        switch (action) {
            case "save":
                if (!filename || !content) {
                    return failure("Both filename and content are required for save action");
                }
                return await saveFileInWorkspace(filename, content, file_type);
            case "load":
                if (!filename) {
                    return failure("Filename is required for load action");
                }
                return await loadFileFromWorkspace(filename);
            case "list":
                return await listFilesInWorkspace();
            case "delete":
                if (!filename) {
                    return failure("Filename is required for delete action");
                }
                return await deleteFileFromWorkspace(filename);
            default:
                return failure(`Unknown action: ${action}`);
        }
    })();
    return toCallToolResult(result);
};
