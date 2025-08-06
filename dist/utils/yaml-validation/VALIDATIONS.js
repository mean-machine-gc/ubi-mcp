import { Type } from '@sinclair/typebox';
// =============================================================================
// LIFECYCLE.YAML SCHEMA
// =============================================================================
/**
 * Schema for branch definition in lifecycle operations
 */
export const LifecycleBranchSchema = Type.Object({
    condition: Type.String({
        description: "Business condition that determines when this branch executes",
        pattern: "^[a-z][a-z0-9_]*$"
    }),
    then: Type.String({
        description: "Event name emitted when condition is met",
        pattern: "^[a-z][a-z0-9-]*$"
    }),
    andOutcome: Type.Array(Type.String({
        description: "State assertion that must hold after event is applied",
        pattern: "^[a-z][a-z0-9_]*$"
    }), {
        description: "List of outcome assertions for the new state",
        minItems: 1
    })
});
/**
 * Schema for operation definition in lifecycle
 */
export const LifecycleOperationSchema = Type.Object({
    name: Type.String({
        description: "Human-readable operation name",
        pattern: "^[A-Z][a-zA-Z0-9]*$",
        minLength: 1,
        maxLength: 50
    }),
    description: Type.String({
        description: "Brief description of what this operation does",
        minLength: 5,
        maxLength: 200
    }),
    guards: Type.Optional(Type.Array(Type.String({
        description: "Authentication/authorization guard name",
        pattern: "^[a-z][a-z0-9_]*$"
    }), {
        description: "Access control and security rules",
        uniqueItems: true
    })),
    when: Type.String({
        description: "Command name that triggers this operation",
        pattern: "^[a-z][a-z0-9-]*$"
    }),
    preconditions: Type.Array(Type.String({
        description: "Business validation rule name",
        pattern: "^[a-z][a-z0-9_]*$"
    }), {
        description: "Business validation rules required for success",
        minItems: 1,
        uniqueItems: true
    }),
    branches: Type.Array(LifecycleBranchSchema, {
        description: "Conditional execution paths",
        minItems: 1
    })
});
/**
 * Complete lifecycle.yaml schema
 */
export const LifecycleSchema = Type.Object({
    aggregate: Type.String({
        description: "Aggregate name in PascalCase",
        pattern: "^[A-Z][a-zA-Z0-9]*$",
        minLength: 2,
        maxLength: 50
    }),
    version: Type.String({
        description: "Semantic version of the aggregate specification",
        pattern: "^\\d+\\.\\d+\\.\\d+$",
        default: "1.0.0"
    }),
    description: Type.String({
        description: "Brief description of the aggregate's purpose",
        minLength: 10,
        maxLength: 500
    }),
    operations: Type.Array(LifecycleOperationSchema, {
        description: "List of business operations this aggregate supports",
        minItems: 1
    })
});
// =============================================================================
// ASSERTIONS.YAML SCHEMA
// =============================================================================
/**
 * Schema for outcome assertion definition
 */
export const OutcomeAssertionSchema = Type.Object({
    assert: Type.String({
        description: "JavaScript/TypeScript expression that validates the outcome",
        minLength: 1
    }),
    description: Type.String({
        description: "Human-readable description of what this assertion validates",
        minLength: 5,
        maxLength: 200
    })
});
/**
 * Complete assertions.yaml schema
 */
export const AssertionsSchema = Type.Object({
    aggregate: Type.String({
        description: "Aggregate name matching lifecycle.yaml",
        pattern: "^[A-Z][a-zA-Z0-9]*$",
        minLength: 2,
        maxLength: 50
    }),
    version: Type.String({
        description: "Version matching lifecycle.yaml",
        pattern: "^\\d+\\.\\d+\\.\\d+$"
    }),
    guards: Type.Optional(Type.Record(Type.String({
        description: "Guard name from lifecycle.yaml",
        pattern: "^[a-z][a-z0-9_]*$"
    }), Type.String({
        description: "Async operation implementation (can use await)",
        minLength: 1
    }), {
        description: "Implementation specifications for authentication/authorization guards"
    })),
    preconditions: Type.Record(Type.String({
        description: "Precondition name from lifecycle.yaml",
        pattern: "^[a-z][a-z0-9_]*$"
    }), Type.String({
        description: "Pure function expression for validation",
        minLength: 1
    }), {
        description: "Implementation specifications for business validation rules"
    }),
    branching_conditions: Type.Record(Type.String({
        description: "Branching condition name from lifecycle.yaml",
        pattern: "^[a-z][a-z0-9_]*$"
    }), Type.String({
        description: "Pure function expression for branching logic",
        minLength: 1
    }), {
        description: "Implementation specifications for conditional logic"
    }),
    outcome_assertions: Type.Record(Type.String({
        description: "Outcome assertion name from lifecycle.yaml",
        pattern: "^[a-z][a-z0-9_]*$"
    }), OutcomeAssertionSchema, {
        description: "Validation specifications for business outcomes"
    })
});
/**
 * Validates lifecycle YAML data against schema
 */
export function validateLifecycle(data) {
    try {
        // Note: In actual implementation, you'd use TypeBox's Value.Check or similar
        // This is a placeholder for the validation logic
        const isValid = true; // TypeBox validation would go here
        if (isValid) {
            return {
                valid: true,
                errors: [],
                data: data
            };
        }
        else {
            return {
                valid: false,
                errors: ["Schema validation failed"], // Real errors would come from TypeBox
            };
        }
    }
    catch (error) {
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown validation error']
        };
    }
}
/**
 * Validates assertions YAML data against schema
 */
export function validateAssertions(data) {
    try {
        // Note: In actual implementation, you'd use TypeBox's Value.Check or similar
        const isValid = true; // TypeBox validation would go here
        if (isValid) {
            return {
                valid: true,
                errors: [],
                data: data
            };
        }
        else {
            return {
                valid: false,
                errors: ["Schema validation failed"], // Real errors would come from TypeBox
            };
        }
    }
    catch (error) {
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown validation error']
        };
    }
}
// =============================================================================
// CROSS-REFERENCE VALIDATION
// =============================================================================
/**
 * Validates cross-references between lifecycle and assertions
 */
export function validateCrossReferences(lifecycle, assertions) {
    const errors = [];
    // Check aggregate names match
    if (lifecycle.aggregate !== assertions.aggregate) {
        errors.push(`Aggregate name mismatch: lifecycle has "${lifecycle.aggregate}", assertions has "${assertions.aggregate}"`);
    }
    // Check versions match
    if (lifecycle.version !== assertions.version) {
        errors.push(`Version mismatch: lifecycle has "${lifecycle.version}", assertions has "${assertions.version}"`);
    }
    // Collect all referenced items from lifecycle
    const allGuards = new Set();
    const allPreconditions = new Set();
    const allBranchingConditions = new Set();
    const allOutcomeAssertions = new Set();
    for (const operation of lifecycle.operations) {
        // Collect guards
        if (operation.guards) {
            operation.guards.forEach(guard => allGuards.add(guard));
        }
        // Collect preconditions
        operation.preconditions.forEach(precondition => allPreconditions.add(precondition));
        // Collect branching conditions and outcome assertions
        for (const branch of operation.branches) {
            allBranchingConditions.add(branch.condition);
            branch.andOutcome.forEach(outcome => allOutcomeAssertions.add(outcome));
        }
    }
    // Check that all lifecycle guards have assertions implementations
    if (assertions.guards) {
        for (const guard of allGuards) {
            if (!assertions.guards[guard]) {
                errors.push(`Guard "${guard}" from lifecycle.yaml not found in assertions.yaml guards section`);
            }
        }
    }
    else if (allGuards.size > 0) {
        errors.push(`Lifecycle defines guards but assertions.yaml has no guards section`);
    }
    // Check that all lifecycle preconditions have assertions implementations
    for (const precondition of allPreconditions) {
        if (!assertions.preconditions[precondition]) {
            errors.push(`Precondition "${precondition}" from lifecycle.yaml not found in assertions.yaml preconditions section`);
        }
    }
    // Check that all lifecycle branching conditions have assertions implementations
    for (const condition of allBranchingConditions) {
        if (!assertions.branching_conditions[condition]) {
            errors.push(`Branching condition "${condition}" from lifecycle.yaml not found in assertions.yaml branching_conditions section`);
        }
    }
    // Check that all lifecycle outcome assertions have assertions implementations
    for (const outcome of allOutcomeAssertions) {
        if (!assertions.outcome_assertions[outcome]) {
            errors.push(`Outcome assertion "${outcome}" from lifecycle.yaml not found in assertions.yaml outcome_assertions section`);
        }
    }
    // Check for orphaned assertions (assertions not referenced in lifecycle)
    if (assertions.guards) {
        for (const guardName of Object.keys(assertions.guards)) {
            if (!allGuards.has(guardName)) {
                errors.push(`Orphaned guard "${guardName}" in assertions.yaml not referenced in lifecycle.yaml`);
            }
        }
    }
    for (const preconditionName of Object.keys(assertions.preconditions)) {
        if (!allPreconditions.has(preconditionName)) {
            errors.push(`Orphaned precondition "${preconditionName}" in assertions.yaml not referenced in lifecycle.yaml`);
        }
    }
    for (const conditionName of Object.keys(assertions.branching_conditions)) {
        if (!allBranchingConditions.has(conditionName)) {
            errors.push(`Orphaned branching condition "${conditionName}" in assertions.yaml not referenced in lifecycle.yaml`);
        }
    }
    for (const outcomeName of Object.keys(assertions.outcome_assertions)) {
        if (!allOutcomeAssertions.has(outcomeName)) {
            errors.push(`Orphaned outcome assertion "${outcomeName}" in assertions.yaml not referenced in lifecycle.yaml`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        data: errors.length === 0 ? { lifecycle, assertions } : undefined
    };
}
// =============================================================================
// SCHEMA METADATA
// =============================================================================
/**
 * Schema metadata for tooling integration
 */
export const SchemaMetadata = {
    lifecycle: {
        name: 'lifecycle.yaml',
        description: 'Business behavior specification for event-driven aggregates',
        version: '1.0.0',
        schema: LifecycleSchema
    },
    assertions: {
        name: 'assertions.yaml',
        description: 'Implementation specifications with executable assertions',
        version: '1.0.0',
        schema: AssertionsSchema
    }
};
// //example use:
// import { validateLifecycle, validateAssertions, validateCrossReferences } from './schemas';
// // Validate individual files
// const lifecycleResult = validateLifecycle(yamlData);
// const assertionsResult = validateAssertions(yamlData);
// // Validate cross-references
// if (lifecycleResult.valid && assertionsResult.valid) {
//   const crossRefResult = validateCrossReferences(
//     lifecycleResult.data,
//     assertionsResult.data
//   );
//   if (!crossRefResult.valid) {
//     console.log('Cross-reference errors:', crossRefResult.errors);
//   }
// }
