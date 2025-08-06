import * as fs from 'fs/promises';
import * as path from 'path';
// ============================================================================
// PURE FUNCTIONS & UTILITIES
// ============================================================================
// Curried file path builder
export const buildFilePath = (workspaceDir) => (filename) => (extension) => path.join(workspaceDir, filename.endsWith(extension) ? filename : `${filename}${extension}`);
// Curried extension mapper
export const getExtension = (fileType) => {
    const extensionMap = {
        yaml: '.yaml',
        md: '.md',
        txt: '.txt',
        json: '.json'
    };
    return extensionMap[fileType];
};
// Result constructors
export const success = (data) => ({ success: true, data });
export const failure = (error) => ({ success: false, error });
export const validResult = (message, summary) => ({ valid: true, message, summary });
export const invalidResult = (errors, warnings) => ({ valid: false, errors, warnings });
//sampling
export const sampleLlm = (session) => (systemPrompt) => async (userPrompt) => {
    return await session.requestSampling({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: userPrompt,
                },
            },
        ],
        systemPrompt,
        includeContext: "thisServer",
        maxTokens: 100,
    });
};
// ============================================================================
// FILE OPERATION FUNCTIONS
// ============================================================================
// Curried file operations
export const saveFile = (workspaceDir) => async (filename, content, fileType) => {
    try {
        const extension = getExtension(fileType);
        const filePath = buildFilePath(workspaceDir)(filename)(extension);
        await fs.writeFile(filePath, content, 'utf8');
        return success({
            type: 'save',
            message: `File saved successfully: ${path.basename(filePath)}`,
            path: filePath
        });
    }
    catch (error) {
        return failure(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
export const loadFile = (workspaceDir) => async (filename) => {
    try {
        const filePath = path.join(workspaceDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        return success({
            type: 'load',
            filename,
            content
        });
    }
    catch (error) {
        return failure(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
export const listFiles = (workspaceDir) => async () => {
    try {
        const files = await fs.readdir(workspaceDir);
        const fileDetails = await Promise.all(files.map(async (file) => {
            const filePath = path.join(workspaceDir, file);
            const stats = await fs.stat(filePath);
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                type: path.extname(file).slice(1) || 'no extension'
            };
        }));
        return success({
            type: 'list',
            files: fileDetails,
            count: files.length
        });
    }
    catch (error) {
        return failure(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
export const deleteFile = (workspaceDir) => async (filename) => {
    try {
        const filePath = path.join(workspaceDir, filename);
        await fs.unlink(filePath);
        return success({
            type: 'delete',
            message: `File deleted successfully: ${filename}`
        });
    }
    catch (error) {
        return failure(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================
// Placeholder validation function (to be implemented)
export const validateLifecycle = async (yamlContent) => {
    // Implementation to be provided separately
    if (!yamlContent.trim()) {
        return invalidResult(['YAML content is empty']);
    }
    return validResult('Lifecycle validation not implemented yet');
};
// ============================================================================
// PROMPT GENERATION FUNCTIONS
// ============================================================================
// Curried prompt message builder
export const buildPromptMessages = (systemPrompt) => (userPrompt) => ({
    messages: [
        {
            role: "assistant",
            content: { type: "text", text: systemPrompt }
        },
        {
            role: "user",
            content: { type: "text", text: userPrompt }
        }
    ]
});
// ============================================================================
// RESULT CONVERSION FUNCTIONS
// ============================================================================
// Convert results to CallToolResult format
export const toCallToolResult = (result) => ({
    content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
        }]
});
