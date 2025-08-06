// validators/mcp-consistency-validator.ts
import { MCPValidator } from './validator-core';
import * as YAML from 'yaml';
export class MCPConsistencyValidator {
    validator = new MCPValidator();
    validateAggregateConsistency(files) {
        const result = {
            isConsistent: true,
            errors: [],
            missingFiles: [],
            stateConsistency: {
                detectedStates: [],
                missingStateShapes: [],
                missingInvariants: []
            },
            operationConsistency: {
                missingPreconditions: [],
                missingBranchingConditions: [],
                missingOutcomeAssertions: [],
                missingCommandShapes: [],
                missingEventShapes: []
            }
        };
        // Check for missing files
        if (!files.lifecycle)
            result.missingFiles.push('lifecycle.yaml');
        if (!files.assertions)
            result.missingFiles.push('assertions.yaml');
        if (!files.decider)
            result.missingFiles.push('decider.yaml');
        if (result.missingFiles.length > 0) {
            result.isConsistent = false;
            result.errors.push({
                path: '',
                message: `Missing files: ${result.missingFiles.join(', ')}`,
                severity: 'error',
                code: 'MISSING_FILES'
            });
            return result;
        }
        try {
            const lifecycleData = YAML.parse(files.lifecycle);
            const assertionsData = YAML.parse(files.assertions);
            const deciderData = YAML.parse(files.decider);
            // Validate state consistency
            this.validateStateConsistency(lifecycleData, assertionsData, deciderData, result);
            // Validate operation consistency
            this.validateOperationConsistency(lifecycleData, assertionsData, deciderData, result);
            // Check aggregate names match
            this.validateAggregateMetadata(lifecycleData, assertionsData, deciderData, result);
        }
        catch (error) {
            result.isConsistent = false;
            result.errors.push({
                path: '',
                message: `Error parsing files: ${error.message}`,
                severity: 'error',
                code: 'PARSE_ERROR'
            });
        }
        result.isConsistent = result.errors.length === 0;
        return result;
    }
    validateStateConsistency(lifecycle, assertions, decider, result) {
        // Extract states from lifecycle
        const detectedStates = this.extractStatesFromLifecycle(lifecycle);
        result.stateConsistency.detectedStates = detectedStates;
        // Check decider has state shapes for all detected states
        detectedStates.forEach(state => {
            if (!decider.state_shape?.[`when_${state}`]) {
                result.stateConsistency.missingStateShapes.push(state);
                result.errors.push({
                    path: `decider.state_shape.when_${state}`,
                    message: `Missing state shape for detected state: ${state}`,
                    severity: 'error',
                    code: 'MISSING_STATE_SHAPE'
                });
            }
        });
        // Check if invariants are defined for states that need them
        detectedStates.forEach(state => {
            if (lifecycle.invariants?.[`when_${state}`] &&
                !assertions.invariants_assertion) {
                result.stateConsistency.missingInvariants.push(state);
                result.errors.push({
                    path: `assertions.invariants_assertion`,
                    message: `Missing invariant assertions for state: ${state}`,
                    severity: 'error',
                    code: 'MISSING_INVARIANT_ASSERTION'
                });
            }
        });
    }
    validateOperationConsistency(lifecycle, assertions, decider, result) {
        if (!lifecycle.operations)
            return;
        lifecycle.operations.forEach((op, opIndex) => {
            // Check preconditions exist in assertions
            op.preconditions?.forEach((precondition) => {
                if (!assertions.preconditions?.[precondition]) {
                    result.operationConsistency.missingPreconditions.push(precondition);
                    result.errors.push({
                        path: `operations[${opIndex}].preconditions`,
                        message: `Missing precondition definition: ${precondition}`,
                        severity: 'error',
                        code: 'MISSING_PRECONDITION'
                    });
                }
            });
            // Check guards exist in assertions
            op.guards?.forEach((guard) => {
                if (!assertions.guards?.[guard]) {
                    result.errors.push({
                        path: `operations[${opIndex}].guards`,
                        message: `Missing guard definition: ${guard}`,
                        severity: 'error',
                        code: 'MISSING_GUARD'
                    });
                }
            });
            // Check branching conditions exist
            op.branches?.forEach((branch, branchIndex) => {
                if (branch.condition !== 'always' && !assertions.branching_conditions?.[branch.condition]) {
                    result.operationConsistency.missingBranchingConditions.push(branch.condition);
                    result.errors.push({
                        path: `operations[${opIndex}].branches[${branchIndex}].condition`,
                        message: `Missing branching condition: ${branch.condition}`,
                        severity: 'error',
                        code: 'MISSING_BRANCHING_CONDITION'
                    });
                }
                // Check outcome assertions exist
                branch.andOutcome?.forEach((outcome) => {
                    if (!assertions.outcome_assertions?.[outcome]) {
                        result.operationConsistency.missingOutcomeAssertions.push(outcome);
                        result.errors.push({
                            path: `operations[${opIndex}].branches[${branchIndex}].andOutcome`,
                            message: `Missing outcome assertion: ${outcome}`,
                            severity: 'error',
                            code: 'MISSING_OUTCOME_ASSERTION'
                        });
                    }
                });
                // Check event shapes exist
                if (!decider.event_shapes?.[branch.then]) {
                    result.operationConsistency.missingEventShapes.push(branch.then);
                    result.errors.push({
                        path: `decider.event_shapes.${branch.then}`,
                        message: `Missing event shape: ${branch.then}`,
                        severity: 'error',
                        code: 'MISSING_EVENT_SHAPE'
                    });
                }
            });
            // Check command shapes exist
            if (!decider.command_shapes?.[op.when]) {
                result.operationConsistency.missingCommandShapes.push(op.when);
                result.errors.push({
                    path: `decider.command_shapes.${op.when}`,
                    message: `Missing command shape: ${op.when}`,
                    severity: 'error',
                    code: 'MISSING_COMMAND_SHAPE'
                });
            }
        });
    }
    validateAggregateMetadata(lifecycle, assertions, decider, result) {
        // Check aggregate names match
        if (lifecycle.aggregate !== assertions.aggregate) {
            result.errors.push({
                path: 'aggregate',
                message: `Aggregate name mismatch: lifecycle(${lifecycle.aggregate}) vs assertions(${assertions.aggregate})`,
                severity: 'error',
                code: 'AGGREGATE_NAME_MISMATCH'
            });
        }
        if (lifecycle.aggregate !== decider.aggregate) {
            result.errors.push({
                path: 'aggregate',
                message: `Aggregate name mismatch: lifecycle(${lifecycle.aggregate}) vs decider(${decider.aggregate})`,
                severity: 'error',
                code: 'AGGREGATE_NAME_MISMATCH'
            });
        }
        // Check versions match
        if (lifecycle.version !== assertions.version || lifecycle.version !== decider.version) {
            result.errors.push({
                path: 'version',
                message: 'Version mismatch across files',
                severity: 'error',
                code: 'VERSION_MISMATCH'
            });
        }
    }
    extractStatesFromLifecycle(lifecycle) {
        const states = new Set();
        // Extract from operations
        lifecycle.operations?.forEach((op) => {
            op.preconditions?.forEach((precondition) => {
                const match = precondition.match(/[a-z_]+_is_([a-z_]+)/);
                if (match)
                    states.add(match[1]);
            });
            op.guards?.forEach((guard) => {
                const match = guard.match(/[a-z_]+_is_([a-z_]+)/);
                if (match)
                    states.add(match[1]);
            });
        });
        // Extract from invariants
        if (lifecycle.invariants) {
            Object.keys(lifecycle.invariants).forEach(key => {
                const match = key.match(/^when_([a-z_]+)$/);
                if (match)
                    states.add(match[1]);
            });
        }
        return Array.from(states).sort();
    }
}
