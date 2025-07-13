# Aggregate Drift Detection Analysis

## Context & Purpose

You are analyzing an **event-driven aggregate** for consistency drift between specification files and implementation. Your task is to identify discrepancies that could lead to runtime errors, business logic violations, or maintenance issues.

## Architecture Overview

The aggregate follows a **specification-driven development** approach:
1. **lifecycle.yaml** - Business behavior specification (source of truth for business rules)
2. **assertions.yaml** - Implementation specifications (source of truth for validation logic)
3. **types.ts** - TypeScript contracts (source of truth for data shapes)
4. **decider.ts** - Executable implementation (should derive from above three)

## Your Task

Perform a **comprehensive drift analysis** across all four files, identifying inconsistencies and providing actionable recommendations.

## Analysis Framework

### 1. Structural Consistency Analysis

**Command/Event Mapping Verification:**
- Every `when` field in lifecycle.yaml should have a corresponding command type in types.ts
- Every `then` field in lifecycle.yaml should have a corresponding event type in types.ts
- Every command type in types.ts should have preconditions in decider.ts
- Every command type in types.ts should have branches in decider.ts
- Every event type in types.ts should have evolutions in decider.ts

**Cross-Reference Validation:**
- Guards in lifecycle.yaml should appear in assertions.yaml guards section
- Preconditions in lifecycle.yaml should appear in assertions.yaml preconditions section
- Branch conditions in lifecycle.yaml should appear in assertions.yaml branching_conditions section
- Outcome items in lifecycle.yaml should appear in assertions.yaml outcome_assertions section

### 2. Business Logic Consistency Analysis

**Precondition Alignment:**
- Compare lifecycle.yaml preconditions with assertions.yaml precondition expressions
- Verify decider.ts precondition implementations match assertions.yaml logic
- Check that failure codes in decider.ts match types.ts failure enum values
- Ensure precondition descriptions are consistent across files

**Branch Logic Alignment:**
- Compare lifecycle.yaml branch conditions with assertions.yaml branching_conditions
- Verify decider.ts branch implementations match specification logic
- Check that event generation in decider.ts matches lifecycle.yaml outcomes
- Ensure branch descriptions are consistent

**State Evolution Alignment:**
- Compare lifecycle.yaml andOutcome items with assertions.yaml outcome_assertions
- Verify decider.ts evolution functions satisfy outcome assertions
- Check that state transitions match lifecycle.yaml business rules
- Ensure proper handling of optional fields and timestamps

### 3. Data Shape Consistency Analysis

**Type Definition Alignment:**
- Verify command data shapes in types.ts match what decider.ts expects
- Check event data shapes in types.ts match what decider.ts generates
- Ensure state shapes in types.ts match what decider.ts evolves
- Validate that all referenced fields exist with correct types

**Validation Pattern Alignment:**
- Compare types.ts validation patterns (@pattern, @minLength) with assertions.yaml expressions
- Verify that business rules in lifecycle.yaml are enforced by types.ts constraints
- Check that decider.ts helper functions implement types.ts validation rules

### 4. Implementation Completeness Analysis

**Missing Implementations:**
- Identify operations in lifecycle.yaml not implemented in decider.ts
- Find commands/events in types.ts not handled by decider.ts
- Locate preconditions/assertions without corresponding implementations
- Spot helper functions referenced but not implemented

**Orphaned Implementations:**
- Find decider.ts implementations not specified in lifecycle.yaml
- Identify types.ts definitions not used in business logic
- Locate assertions.yaml entries not referenced by lifecycle.yaml

## Specific Drift Patterns to Detect

### Critical Drifts (High Risk)
1. **Missing Preconditions**: Command exists but preconditions missing/incomplete
2. **Type Mismatches**: Field types don't match across files
3. **Unhandled Commands**: Types defined but no decider implementation
4. **State Evolution Errors**: Events don't properly evolve state
5. **Business Rule Violations**: Implementation contradicts business specifications

### Warning Drifts (Medium Risk)
1. **Description Inconsistencies**: Same concept described differently across files
2. **Optional Field Handling**: Inconsistent treatment of optional properties
3. **Validation Pattern Misalignment**: Types.ts patterns vs assertion expressions
4. **Helper Function Drift**: Referenced functions with incorrect implementations
5. **Timestamp Handling**: Inconsistent timestamp generation/validation

### Minor Drifts (Low Risk)
1. **Comment/Documentation Drift**: JSDoc comments not matching specifications
2. **Naming Inconsistencies**: Same concept with different names
3. **Ordering Differences**: Different ordering of operations/fields
4. **Formatting Variations**: Stylistic differences without functional impact

## Analysis Output Format

### Executive Summary
```
DRIFT ANALYSIS SUMMARY
======================
Critical Issues: X found
Warning Issues: Y found  
Minor Issues: Z found
Overall Health: [HEALTHY|NEEDS_ATTENTION|CRITICAL]
```

### Detailed Findings

For each drift found, provide:

```
DRIFT: [CRITICAL|WARNING|MINOR] - Brief Description
File(s): lifecycle.yaml, types.ts, decider.ts
Issue: Detailed description of the inconsistency
Evidence: Specific examples/code snippets showing the drift
Impact: What could go wrong if not fixed
Recommendation: Specific steps to resolve the drift
```

### Alignment Matrix

Create a matrix showing alignment status:

```
OPERATION ALIGNMENT MATRIX
==========================
Operation    | Lifecycle | Assertions | Types | Decider | Status
create-user  |    ✓      |     ✓      |   ✓   |    ✓    | ALIGNED
update-user  |    ✓      |     ✓      |   ✓   |    ⚠    | DRIFT_DETECTED
delete-user  |    ✓      |     ✗      |   ✓   |    ✗    | INCOMPLETE
```

### Change Recommendations

Prioritized list of changes needed:

```
RECOMMENDED CHANGES (Priority Order)
====================================
1. [CRITICAL] Fix type mismatch in UpdateUserCmd.data field
2. [CRITICAL] Implement missing preconditions for delete-user
3. [WARNING] Align validation patterns for email field
4. [MINOR] Update JSDoc comments in types.ts
```

## Analysis Guidelines

### Focus Areas
- **Safety First**: Prioritize issues that could cause runtime errors
- **Business Accuracy**: Ensure implementations match business intent
- **Type Safety**: Leverage TypeScript's capabilities fully
- **Maintainability**: Flag issues that make future changes risky

### Context Awareness
- Consider the aggregate's domain complexity
- Account for recent changes that might not be fully propagated
- Understand the intended evolution direction
- Recognize intentional design decisions vs accidental drift

### Practical Recommendations
- Provide specific, actionable fix instructions
- Suggest automation opportunities for preventing similar drift
- Recommend tooling or process improvements
- Consider impact on existing functionality

## Quality Standards

Your analysis should be:
- **Comprehensive**: Cover all four files and their relationships
- **Precise**: Identify exact locations and nature of drift
- **Actionable**: Provide clear steps for resolution
- **Risk-Aware**: Prioritize based on potential impact
- **Maintainable**: Consider long-term health of the codebase

Perform this analysis methodically, documenting all findings with evidence and practical recommendations for achieving perfect alignment across the aggregate specification and implementation files.