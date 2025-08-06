import { buildPromptMessages } from "../utils/utils";
import { ubiTypes } from "../utils/ubi/ubi-types";
import { ubiFunctions } from "../utils/ubi/ubi-functions";
export const implementEvolutionsPrompt = async (args) => {
    const { domain = '', types = "", lifecycle_yaml = "", events = '' } = args;
    const systemPrompt = `
  First of all make sure you know which aggregate we're working on. If not sure, ask the user.
  Once you know the aggregate, there should be an associated lifecycle.yaml file and an aggregatename.types.ts. Red them.
  Analyse the provided TypeScript domain model. Your task is to create an evolve function using the ubi-decider library, as in this example: ${evolutionExample}.

    Domain Model: ${types}

    First you need to create an event.ts file with the types of the events. DONT be specific yet with the data, only place dummy types as follow:

    \`\`\`ts
    export type Event1 = {
        type: 'event-type-name' //event type name from the \`then\`field in the lifecycle.yaml file
        data: any //set this to any for the moment, you will come back here after the evolutions task
    }


    export type AggregateNameEvents = Event1 | Event2 //discriminated union of the aggregate events
    \`\`\`

    Save this in a file called aggregatename.events.ts.

    Next you need to create a dummy TAggregateName decider type as follow:

    \`\`\`ts
    //aggregate-name/decider.ts
    export type TNotificationDecider = TDecider<
        {type: 'dummy-cmd', data: {}},
        AggregateNameEvents, //events union from aggregatename.events.ts
        AggregateName, //actual domain model union type provided
        'dummy_failure'
    >
    \`\`\`

    Save it as aggregatename.decider.ts.

    Then you can create the evolutions implementation as per example provided. Each event might mutate the state, or leave it as it is. 
    You can refer to the yaml file describing the aggregate lifecycle to understand how each event should affect the new state.

    Lifecycle yaml: ${lifecycle_yaml}

    Creating the evolutions BEFORE creating the events types will help you understand what is the MINIMAL amount of information that each event needs to carry in order to apply the associated transformation to the state.
    Sometimes, the only thing an event does is to update the status field, so the minimu information it needs to carry is the status, plus the id of the aggregate and some useful timestamps, for example:

    type MinimalEvent = {
      type: 'order-confirmed',
      data: {
        aggregateId: 'abc',
        status: 'confirmed',
        confirmedAt: //timestamp
      }
    }

    !IMPORTANT: be absolutely sure that each event carries exactly the amount of information needed for applying the state transition, plus some useful references ids, e.g. doneAt, aggregateId, doneBy, and NOTHING MORE!

    If you realise that some events are bloated, reduce them to the minimum amount of data needed and readjust the evolutions accordingly.

    After you have done with the evolutions, and you are sure events only have minimal data, you can go back to the aggregatename.events.ts and complete the events type definitions with the real data, as follow:

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

    In case there is a mismatch between the domain or event types, and the properties needed to perform the correct mutations, feel free to modify either of those.

    When done, you can save the evolution implementation in a file called aggregatename.evolutions.ts.

    For your reference, these are the types used in the ubi-decider library that is used for implementation of the decider pattern: ${ubiTypes}, and these are some helper functions: ${ubiFunctions}
  `;
    const userPrompt = `Now that we have implemented the types and events for ${domain} let's implement the evolutions and see how the state evolves with each eavent!

`;
    return buildPromptMessages(systemPrompt)(userPrompt);
};
const evolutionExample = `
\`\`\`ts
export const evolutions: TNotificationDecider['evolutions'] = {
    'notification-created': (em) => {
        const e = em.evt as NotificationCreated
        return {
            notificationId: e.data.notificationId,
            subscriptionId: e.data.subscriptionId,
            eventType: e.data.eventType,
            eventData: e.data.eventData,
            endpointUrl: e.data.endpointUrl,
            secretToken: e.data.secretToken,
            retryPolicy: e.data.retryPolicy,
            retryCount: 0,
            status: 'pending',
            createdAt: e.data.createdAt,
            scheduledFor: e.data.scheduledFor
        } satisfies PendingNotification
    },

    'notification-delivered': (em) => {
        const e = em.evt as NotificationDelivered
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'delivered',
            deliveredAt: e.data.deliveredAt,
            lastAttempt: e.data.deliveryAttempt
        } satisfies DeliveredNotification
    },

    'notification-delivery-attempted': (em) => {
        const e = em.evt as NotificationDeliveryAttempted
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'attempted',
            lastAttempt: e.data.deliveryAttempt,
            scheduledFor: e.data.scheduledFor
        } satisfies AttemptedNotification
    },

    'notification-delivery-failed': (em) => {
        const e = em.evt as NotificationDeliveryFailed
        const s = em.state as PendingNotification | AttemptedNotification
        return {
            ...s,
            status: 'failed',
            finalFailureAt: e.data.finalFailureAt,
            lastAttempt: e.data.deliveryAttempt
        } satisfies FailedNotification
    },

    'notification-reset-for-retry': (em) => {
        const e = em.evt as NotificationResetForRetry
        const s = em.state as FailedNotification | AbandonedNotification
        return {
            ...s,
            status: 'pending',
            retryCount: 0,
            scheduledFor: e.data.scheduledFor,
            createdAt: e.data.resetAt // Optional: you might want to keep original createdAt; adjust as per business rules
        } satisfies PendingNotification
    },

    'notification-abandoned': (em) => {
        const e = em.evt as NotificationAbandoned
        const s = em.state as PendingNotification | AttemptedNotification | FailedNotification
        return {
            ...s,
            status: 'abandoned',
            abandonedAt: e.data.abandonedAt,
            abandonedBy: e.data.abandonedBy,
            abandonmentReason: e.data.abandonmentReason
        } satisfies AbandonedNotification
    },

    'notification-marked-delivered': (em) => {
        const e = em.evt as NotificationMarkedDelivered
        const s = em.state as PendingNotification | AttemptedNotification | FailedNotification
        return {
            ...s,
            status: 'manually-delivered',
            deliveredAt: e.data.deliveredAt,
            markedDeliveredBy: e.data.markedDeliveredBy
        } satisfies ManuallyDeliveredNotification
    }
}

export const testExports = {
    evolve: evalEvolutions<NotificationEvents, Notification | undefined>(evolutions)
}
\`\`\`
`;
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
