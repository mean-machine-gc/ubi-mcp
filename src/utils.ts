import { GetPromptResult, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DeleteResult, FileInfo, FileOperationResult, FileType, ListResult, LoadResult, SaveResult, ValidationResult } from './types.js';

// ============================================================================
// PURE FUNCTIONS & UTILITIES
// ============================================================================

// Curried file path builder
export const buildFilePath = (workspaceDir: string) => (filename: string) => (extension: string): string =>
  path.join(workspaceDir, filename.endsWith(extension) ? filename : `${filename}${extension}`);

// Curried extension mapper
export const getExtension = (fileType: FileType): string => {
  const extensionMap: Record<FileType, string> = {
    yaml: '.yaml',
    md: '.md',
    txt: '.txt',
    json: '.json'
  };
  return extensionMap[fileType];
};

// Result constructors
export const success = <T>(data: T): { readonly success: true; readonly data: T } => 
  ({ success: true, data });

export const failure = (error: string): { readonly success: false; readonly error: string } => 
  ({ success: false, error });

export const validResult = (message: string, summary?: Record<string, unknown>): ValidationResult =>
  ({ valid: true, message, summary });

export const invalidResult = (errors: readonly string[], warnings?: readonly string[]): ValidationResult =>
  ({ valid: false, errors, warnings });

// ============================================================================
// FILE OPERATION FUNCTIONS
// ============================================================================

// Curried file operations
export const saveFile = (workspaceDir: string) => async (filename: string, content: string, fileType: FileType): Promise<FileOperationResult> => {
  try {
    const extension = getExtension(fileType);
    const filePath = buildFilePath(workspaceDir)(filename)(extension);
    
    await fs.writeFile(filePath, content, 'utf8');
    
    return success<SaveResult>({
      type: 'save',
      message: `File saved successfully: ${path.basename(filePath)}`,
      path: filePath
    });
  } catch (error) {
    return failure(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const loadFile = (workspaceDir: string) => async (filename: string): Promise<FileOperationResult> => {
  try {
    const filePath = path.join(workspaceDir, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    return success<LoadResult>({
      type: 'load',
      filename,
      content
    });
  } catch (error) {
    return failure(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const listFiles = (workspaceDir: string) => async (): Promise<FileOperationResult> => {
  try {
    const files = await fs.readdir(workspaceDir);
    const fileDetails = await Promise.all(
      files.map(async (file): Promise<FileInfo> => {
        const filePath = path.join(workspaceDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          type: path.extname(file).slice(1) || 'no extension'
        };
      })
    );
    
    return success<ListResult>({
      type: 'list',
      files: fileDetails,
      count: files.length
    });
  } catch (error) {
    return failure(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteFile = (workspaceDir: string) => async (filename: string): Promise<FileOperationResult> => {
  try {
    const filePath = path.join(workspaceDir, filename);
    await fs.unlink(filePath);
    
    return success<DeleteResult>({
      type: 'delete',
      message: `File deleted successfully: ${filename}`
    });
  } catch (error) {
    return failure(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

// Placeholder validation function (to be implemented)
export const validateLifecycle = async (yamlContent: string): Promise<ValidationResult> => {
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
export const buildPromptMessages = (systemPrompt: string) => (userPrompt: string): GetPromptResult => ({
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
export const toCallToolResult = (result: FileOperationResult | ValidationResult): CallToolResult => ({
  content: [{
    type: "text",
    text: JSON.stringify(result, null, 2)
  }]
});