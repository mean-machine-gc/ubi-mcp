// mcp-tools/validation-tools.ts

import { AggregateFiles, MCPConsistencyValidator } from "./validator-consistency";
import { MCPValidator } from "./validator-core";

// Tool: Validate single YAML content
export async function validateYAMLContent(
  content: string, 
  fileType: 'lifecycle' | 'assertions' | 'decider'
) {
  const validator = new MCPValidator();
  const result = validator.validateYAMLContent(content, fileType);
  
  return {
    success: result.isValid,
    validation: {
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      errors: result.errors,
      warnings: result.warnings,
      detectedStates: result.detectedStates,
      suggestions: result.suggestions
    }
  };
}

// Tool: Validate aggregate consistency across all files
export async function validateAggregateConsistency(files: AggregateFiles) {
  const validator = new MCPConsistencyValidator();
  const result = validator.validateAggregateConsistency(files);
  
  return {
    success: result.isConsistent,
    consistency: {
      isConsistent: result.isConsistent,
      errorCount: result.errors.length,
      errors: result.errors,
      missingFiles: result.missingFiles,
      stateConsistency: result.stateConsistency,
      operationConsistency: result.operationConsistency,
      summary: generateConsistencySummary(result)
    }
  };
}

// Tool: Quick validation check for AI feedback
export async function quickValidationCheck(
  content: string,
  fileType: 'lifecycle' | 'assertions' | 'decider'
) {
  const validator = new MCPValidator();
  const result = validator.validateYAMLContent(content, fileType);
  
  // Return simplified result for AI consumption
  return {
    valid: result.isValid,
    issues: result.errors.length + result.warnings.length,
    criticalErrors: result.errors.filter(e => e.severity === 'error').length,
    quickFeedback: generateQuickFeedback(result)
  };
}

// Tool: Extract states from lifecycle for other generators
export async function extractAggregateStates(lifecycleContent: string) {
  const validator = new MCPValidator();
  const result = validator.validateYAMLContent(lifecycleContent, 'lifecycle');
  
  return {
    states: result.detectedStates || [],
    stateCount: (result.detectedStates || []).length,
    suggestions: result.suggestions || []
  };
}

function generateConsistencySummary(result: any): string {
  const issues = [];
  
  if (result.missingFiles.length > 0) {
    issues.push(`Missing files: ${result.missingFiles.join(', ')}`);
  }
  
  if (result.stateConsistency.missingStateShapes.length > 0) {
    issues.push(`Missing state shapes for: ${result.stateConsistency.missingStateShapes.join(', ')}`);
  }
  
  if (result.operationConsistency.missingPreconditions.length > 0) {
    issues.push(`${result.operationConsistency.missingPreconditions.length} missing preconditions`);
  }
  
  if (issues.length === 0) {
    return `✅ All files are consistent. Detected ${result.stateConsistency.detectedStates.length} states.`;
  }
  
  return `❌ Found ${issues.length} consistency issues: ${issues.join('; ')}`;
}

function generateQuickFeedback(result: any): string {
  if (result.isValid) {
    const feedback = ['✅ YAML is valid'];
    if (result.detectedStates?.length > 0) {
      feedback.push(`Detected states: ${result.detectedStates.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      feedback.push(`${result.warnings.length} suggestions available`);
    }
    return feedback.join('. ');
  } else {
    const criticalCount = result.errors.filter((e: any) => e.severity === 'error').length;
    return `❌ ${criticalCount} validation errors found. First error: ${result.errors[0]?.message || 'Unknown error'}`;
  }
}