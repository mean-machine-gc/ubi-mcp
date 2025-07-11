// ============================================================================
// TYPES & DISCRIMINATED UNIONS
// ============================================================================

// File operations
export type FileType = 'yaml' | 'md' | 'txt' | 'json';
export type FileAction = 'save' | 'load' | 'list' | 'delete';

export interface FileOperationArgs {
  readonly action: FileAction;
  readonly filename?: string;
  readonly content?: string;
  readonly file_type?: FileType;
}

export interface FileInfo {
  readonly name: string;
  readonly size: number;
  readonly modified: string;
  readonly type: string;
}

// Result types with discriminated unions
export type FileOperationResult = 
  | { readonly success: true; readonly data: SaveResult | LoadResult | ListResult | DeleteResult }
  | { readonly success: false; readonly error: string };

export type SaveResult = {
  readonly type: 'save';
  readonly message: string;
  readonly path: string;
};

export type LoadResult = {
  readonly type: 'load';
  readonly filename: string;
  readonly content: string;
};

export type ListResult = {
  readonly type: 'list';
  readonly files: readonly FileInfo[];
  readonly count: number;
};

export type DeleteResult = {
  readonly type: 'delete';
  readonly message: string;
};

// Validation types
export interface ValidationArgs {
  readonly yaml_content: string;
}

export type ValidationResult = 
  | { readonly valid: true; readonly message: string; readonly summary?: Record<string, unknown> }
  | { readonly valid: false; readonly errors: readonly string[]; readonly warnings?: readonly string[] };

// Prompt argument types
export interface LifecycleConversationArgs {
  readonly domain?: string;
  readonly current_yaml?: string;
}

export interface GenerationArgs {
  readonly yaml_content: string;
}

export interface SpecsGenerationArgs {
  readonly specs_content: string;
}
