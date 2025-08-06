import { buildPromptMessages } from "../utils/utils";
export const implementTypesPrompt = async (args) => {
    const { domain = "", current_yaml = "" } = args;
    const systemPrompt = `Analyse this lifecycle.yaml file describing the lifecycle of an aggregate: ${current_yaml}.
    You can discard the Guard because they will be evaluated before entering the decider, if they are not passed then the decider execution will be skipped.
    The first task is to create basic templates for the aggregate types and for the event types.
    Looking at the \`andOutcome\ lists, describing what assertions can be made on the new state after an operation, try to generate a basic structure for the aggregate domain model, as follow:
    
    \`\`\`ts
    
    export type ExampleSimpleType = string //use explicit type declarations for simple types

    export type NestedObjectType = {
        //use explicit type declarations for nested types. 
        //Never use primities, declare simple types instad.
        //Different aggregate states might have different variations for nested objects, use separate types for variations and discrimitated unions to represent the nested object
        //Nested objects might be entities themselves, with an id and a status. In this case, model the base type for the common fields, and one additional type for ach status, and a discrimitated union for the nested entity.
    }

    export type NameOfAggregateBase = {
        aggregateNameId: string //aggregates always have an id
        //fields common to all aggregate states
    }

    export type SpecificStateNameAggreggateName = NameOfAggregateBase & {
        status: 'specific_status'
        additionalProperty1: AdditionalProperty1Type //add additional properties this particular state has. Include meaningful timestamps, e.g. submittedAt, and ids, e.g. submittedBy
    }

    export type AggregateName = SpecificStateNameAggreggateName1 | SpecificStateNameAggreggateName1

    \`\`\`

    Model types by aggregate state, avoid as much as possible optional field, create variants and discriminated unions instead.
    
    When you're done, you can save the file as \`aggregatename.types.ts\`.
    
    After that is done, the new task is to create basic templates for the events that are listed on the lifecycle.yaml, and that are necessary to apply relevant modifications to the aggregate.
    You can extract the list of events from the \`then\`fields of the yaml, and understand what data they need to carry in order to mutate the state in the evolve step of the decider.
    Generate types for all the events as follow:
    
    \`\`\`ts
    
    export type ExampleSimpleType = string //use explicit type declarations for simple types

    export type NestedObjectType = {
        //use explicit type declarations for nested types. 
        //Different events might have different variations for nested objects, use separate types for variations and discrimitated unions to represent the nested object
        //Reuse aggregate nested objects as much as possible
    }

    export type Event1 = {
        type: 'event-type-name' //event type name from the \`then\`field in the lifecycle.yaml file
        data: {
            //the types of the data necessary to mutate the state
            //include meaningful timestamps, e.g. submittedAt, and ids, e.g. submittedBy
        }
    }


    export type AggregateNameEvents = Event1 | Event2 //discriminated union of the aggregate events

    \`\`\`

    When you're done, you can save the file as \`aggregatename.events.ts\`.

    
    
    
    `;
    const userPrompt = `Now that we have a lifecycle.yaml file for ${domain} we can begin the implementation. Let's create types and events!

`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
// ## Available Tools During Design Process
// You have access to intelligent sampling-based tools that can assist during the conversation:
// ### Foundation & Analysis Tools
// - **analyze_domain_patterns**: Analyzes industry patterns and best practices for the domain through iterative sampling
// - **build_operation_incrementally**: Builds complete operation specifications through progressive analysis
// - **enhance_business_rules**: Enhances existing rules through multi-perspective analysis (security, edge cases, compliance)
// ### When to Use These Tools
// - **At the start**: Use \`analyze_domain_patterns\` when the user mentions a domain to provide intelligent foundation
// - **For each operation**: Use \`build_operation_incrementally\` to help design complex operations step-by-step
// - **For refinement**: Use \`enhance_business_rules\` when reviewing or improving the lifecycle specification
// ### Generation Tools (Available After Design)
// **implement_decider**: implement the decider up to the evolution step, with tests!
// - **generate_assertions**: Creates assertions.yaml with implementation specifications
// - **generate_types**: Creates types.ts with TypeScript type definitions  
// - **generate_decider**: Creates decider.ts with executable business logic
// - **generate_tests**: Creates comprehensive Jest test suites
// - **validate_drift**: Analyzes consistency across all specification files
