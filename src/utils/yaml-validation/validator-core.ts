// validators/mcp-validation-core.ts
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { ValueError } from '@sinclair/typebox/errors';
import * as YAML from 'yaml';

import { string } from 'yaml/dist/schema/common/string';
import { SchemaFactory } from './schemas/schema-factory';
import { AssertionsSchema } from './schemas/assertions-schema';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  detectedStates?: string[];
  suggestions?: string[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
  value?: any;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion: string;
}

export class MCPValidator {
    private schemaFactory = new SchemaFactory();
  
  // Main validation method for MCP tools
  validateYAMLContent(content: string, fileType: 'lifecycle' | 'assertions' | 'decider'): ValidationResult {
    try {
      const yamlData = YAML.parse(content);
      
      switch (fileType) {
        case 'lifecycle':
          return this.validateLifecycleContent(content, yamlData);
        case 'assertions':
          return this.validateAssertionsContent(content, yamlData);
        case 'decider':
          return this.validateDeciderContent(content, yamlData);
        default:
          return {
            isValid: false,
            errors: [{ path: '', message: `Unknown file type: ${fileType}`, severity: 'error', code: 'UNKNOWN_TYPE' }],
            warnings: []
          };
      }
    } catch (parseError) {
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `YAML parse error: ${(parseError as Error).message}`,
          severity: 'error',
          code: 'PARSE_ERROR'
        }],
        warnings: []
      };
    }
  }

   private validateLifecycleContent(content: string, data: any): ValidationResult {
    const schemaSet = this.schemaFactory.createSchemasFromLifecycle(content);
    const validator = TypeCompiler.Compile(schemaSet.lifecycle);
    
    const isValid = validator.Check(data);
    const errors: ValidationError[] = [];
    
    if (!isValid) {
      for (const error of validator.Errors(data)) {
        errors.push({
          path: error.path,
          message: error.message,
          severity: 'error',
          code: 'SCHEMA_VIOLATION',
          value: error.value
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.validateBusinessLogic(data),
      detectedStates: schemaSet.detectedStates,
      suggestions: this.generateSuggestions(data, schemaSet.detectedStates)
    };
  
}

private validateDeciderContent(
    content: string, 
    data: any, 
    lifecycleContent?: string
  ): ValidationResult {
    let schemaSet;
    
    if (lifecycleContent) {
      // Use lifecycle context to determine states
      schemaSet = this.schemaFactory.createSchemasFromLifecycle(lifecycleContent);
    } else {
      // Try to infer states from the decider content itself
      const states = this.extractStatesFromDecider(data);
      schemaSet = this.schemaFactory.createSchemasWithStates(states);
    }
    
    const validator = TypeCompiler.Compile(schemaSet.decider);
    const isValid = validator.Check(data);
    const errors: ValidationError[] = [];
    
    if (!isValid) {
      for (const error of validator.Errors(data)) {
        errors.push({
          path: error.path,
          message: error.message,
          severity: 'error',
          code: 'SCHEMA_VIOLATION',
          value: error.value
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      detectedStates: schemaSet.detectedStates
    };
  }

  private extractStatesFromDecider(data: any): string[] {
    const states = new Set<string>();
    
    if (data.state_shape) {
      Object.keys(data.state_shape).forEach(key => {
        const match = key.match(/^when_([a-z_]+)$/);
        if (match) {
          states.add(match[1]);
        }
      });
    }
    
    return Array.from(states).sort();
  }
  

  private validateAssertionsContent(content: string, data: any): ValidationResult {
    const validator = TypeCompiler.Compile(AssertionsSchema);
    const isValid = validator.Check(data);
    const errors: ValidationError[] = [];
    
    if (!isValid) {
      for (const error of validator.Errors(data)) {
        errors.push({
          path: error.path,
          message: error.message,
          severity: 'error',
          code: 'SCHEMA_VIOLATION',
          value: error.value
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

 

  private validateBusinessLogic(data: any): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check if all operations have meaningful descriptions
    if (data.operations) {
      data.operations.forEach((op: any, index: number) => {
        if (op.description && op.description.length < 20) {
          warnings.push({
            path: `operations[${index}].description`,
            message: 'Operation description is quite short',
            suggestion: 'Consider adding more detail about the business purpose and outcomes'
          });
        }
        
        // Check if operations have at least one guard or precondition
        if ((!op.guards || op.guards.length === 0) && (!op.preconditions || op.preconditions.length === 0)) {
          warnings.push({
            path: `operations[${index}]`,
            message: 'Operation has no guards or preconditions',
            suggestion: 'Consider adding validation rules to ensure operation integrity'
          });
        }
      });
    }
    
    return warnings;
  }

  private generateSuggestions(data: any, states: string[]): string[] {
    const suggestions: string[] = [];
    
    // Suggest missing state invariants
    if (data.invariants) {
      states.forEach(state => {
        if (!data.invariants[`when_${state}`]) {
          suggestions.push(`Consider adding invariants for 'when_${state}' to define business rules for this state`);
        }
      });
    } else {
      suggestions.push('Consider adding invariants section to define business rules and constraints');
    }
    
    // Suggest transitions if multiple states exist
    if (states.length > 1 && (!data.invariants?.transitions || Object.keys(data.invariants.transitions).length === 0)) {
      suggestions.push('Consider defining state transition rules in invariants.transitions');
    }
    
    return suggestions;
  }
}