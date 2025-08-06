import { z } from 'zod';
import { ubiTypes } from "../../utils/ubi/ubi-types";
export const addImplement = (mcp) => {
    mcp.addTool({
        name: "implement_decider",
        description: "Builds a complete decider step by step from a lifecycle.yaml file",
        parameters: z.object({
            lifecycle_yaml: z.string().describe(`The content of the lifecycle.yaml file')`),
        }),
        execute: async (args) => {
            const { lifecycle_yaml, } = args;
            const systemPrompt = `
                    You are an expert at domain modelling with TypeScript and you will be building a decider pattern using the library ubi-decider
                    ub-decider types: ${ubiTypes}
                    
                //     `;
            // const test = context.session.sample()
            // const sample = sampleLlm(context.session as unknown as FastMCPSession)(systemPrompt)
            try {
                //     // Step 1: Create a template for the domain model
                //     const domainModel = await sampleDomainModel(sample)(lifecycle_yaml)
                //     // Step 2: Create types for the events
                //     const eventsModel = await sampleEventsModel(sample)(domainModel)(lifecycle_yaml)
                //     // Step 3: Create evolutions
                //     const evolutions = await sampleEvolutions(sample)(lifecycle_yaml)(domainModel)(eventsModel)
                //     // Step 4: Create evolutions 
                //     const evolutionTests = await sampleTests(sample)(lifecycle_yaml)(evolutions)              
                return {
                    content: [
                        {
                            type: "text",
                            text: `# Incrementally Built Domain Model, Events, Evolutions and Evolution Tests:


                                                ---
                                                *This operation was built through iterative sampling and analysis. Review the recommendations and refine as needed.*`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error implementing domain model: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    });
};
const sampleDomainModel = (sample) => async (lifecycle_yaml) => {
    const userPrompt = `Analyse this lifecycle.yaml file describing the lifecycle of an aggregate: ${lifecycle_yaml}.
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
    
    `;
    return await sample(userPrompt);
};
const sampleEventsModel = (sample) => (domainModel) => async (lifecycle_yaml) => {
    const userPrompt = `Analyse this lifecycle.yaml file describing the lifecycle of an aggregate: ${lifecycle_yaml}.
    You can discard the Guard because they will be evaluated before entering the decider, if they are not passed then the decider execution will be skipped.
    The task is to create basic templates for the events that are listed on the lifecycle.yaml, and that are necessary to apply relevant modifications to the aggregate.
    You can extract the list of events from the \`then\`fields, and understand what data they need to carry in order to mutate the state in the evolve step of the decider, you can refer to the domain model of the aggregate: ${domainModel}
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

    
    `;
    return await sample(userPrompt);
};
const sampleEvolutions = (sample) => (lifecycle_yaml) => (domainModel) => async (eventsModel) => {
    const userPrompt = `
    Analyse the provided TypeScript domain model and the associated Events types. Your task is to create an evolve function using the ubi-decider library, as in this example: ${evolutionExample}.

    Domain Model: ${domainModel}
    Events: ${eventsModel}

    Firts you need to create a dummy TAggregateName decider type as follow:

    \`\`\`ts
    //aggregate-name/decider.ts
    export type TNotificationDecider = TDecider<
        {type: 'dummy-cmd', data: {}},
        AggregateNameEvents, //actual events union type provided
        AggregateName, //actual domain model union type provided
        'dummy_failure'
    >
    \`\`\`

    Then you can create the evolutions implementation as per example provided. Each event might mutate the state, or leave it as it is. 
    You can refer to the yaml file describing the aggregate lifecycle to understand how each evant should affect the new state.

    Lifecycle yaml: ${lifecycle_yaml}

    In case there is a mismatch between the domain or event types, and the properties needed to perform the correct mutations, feel free to modify either of those.

    When done, you can present your results in this format:

    \`\`\`ts
    //aggregate-name/decider.ts
    //the decider type

    //aggregate-name/evolutions.ts
    //the evolutions implementation

    //aggregate-name/model.ts
    //the aggregate domain model including any eventual modification

    //aggregate-name/events.ts
    //the aggregate events including any eventual modification
    \`\`\`

    
    `;
    return await sample(userPrompt);
};
const sampleTests = (sample) => (lifecycle_yaml) => async (model) => {
    const userPrompt = `
    Create a complete Jest test suite for the aggregate provided. Each event in a array of events should modify a given initial state to a predictable final state.
    Only consider valid events. Use different arrays with different events, and test the correct effect of each event.
    The assertions on the final state should be according the shapes described in the TypeScript model, and be aligned with the \`andOutcome\` values of the lifecycle yaml.

    TypeScript model: ${model}
    Lifecycle yaml: ${lifecycle_yaml}    

    Format your results as:

    \`\`\`ts
    ${model}

    //aggregate-name/evolutions.spec.ts
    //your test suite here
    \`\`\`
    `;
    return await sample(userPrompt);
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
