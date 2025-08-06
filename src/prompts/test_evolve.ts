import { GetPromptResult } from "@modelcontextprotocol/sdk/types";
import { LifecycleConversationArgs } from "../types";
import { buildPromptMessages } from "../utils/utils";
import { ubiTypes } from "../utils/ubi/ubi-types";
import { ubiFunctions } from "../utils/ubi/ubi-functions";


export const testEvolvePrompt = async (args: {domain?: string, lifecycle_yaml?: string}): Promise<GetPromptResult> => {
  const { domain = '', lifecycle_yaml = '' } = args;

  const systemPrompt = `
  First of all make sure you know which aggregate we're working on. If not sure, ask the user.
  Once you know the aggregate, there should be an associated 

  - lifecycle.yaml file 
  - aggregatename.types.ts
  - aggregatename.events.ts
  - aggregatename.evolutions.ts
  
  Red them.
  
  Analyse the provided evolutions file. Your task is to write a comprehensive Jest test suite to test that the evalEvolution function returns the expected aggregate states when called with varying arrays of events.
  Make sure all events are tested. And make sure all the assertions in the \àndOutcome\`fields of the yaml file are tested.

  For your reference, the implementation uses the ubi library:

  - ubi types: ${ubiTypes}
    - ubi functions: ${ubiFunctions}
  
  Save your test suite as aggregatename.evolve.spec.ts
  `;

  const userPrompt = `Now that we have implemented the evolutions ${domain} let's implement a comprehensive test suite to test that each event transorfs the aggregate correctly!

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
`


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