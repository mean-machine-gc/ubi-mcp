export const ubiFunctions = `
\`\`\`ts
import { 
    Message,
    FailEvt,
    EvalPreconditionsFn,
    EvalBranchesFn,
    DecisionModel,
    DecisionOutcome,
    Precondition,
    Preconditions,
    Branches,
    FailDecision,
    SuccessDecision,
    Branch,
    Evolutions,
    EvolutionFn,
    DecideFn,
    OutcomeModel,
    EvalEvolutionsFn,
    AnyDecider,
    DefaultFails,
    RunBuiltFn,
} from './types'

/**
 * Constructs a failure event indicating a command could not be applied.
 * @template C  Command type
 * @template F  Failure reason literal type
 * @param cmd  The original command that failed
 * @returns A function taking a failure reason and returning a FailEvt
 */
const newFailEvt =
  <C, F extends string>(cmd: C) =>
  (m: F): FailEvt<C, F> => {
    return {
      type: "operation-failed",
      data: {
        cmd,
        reason: m,
      },
    };
  };

/**
 * Evaluates a set of preconditions against a DecisionModel.
 * @template C Message type
 * @template A State type
 * @template F Failure reason literal type
 * @param p  Preconditions map keyed by command type
 * @returns A function that, given a DecisionModel, returns either a FailDecision or success marker
 */
const _evalPreconditions = <C extends Message, A, F extends string>
    (p: Preconditions<C, A, F>) =>
    (dm: DecisionModel<C, A>): FailDecision<C, F> | { outcome: 'success' } => {
        // Retrieve preconditions for this command type
        const preconditions: Precondition<C, A, F>[] = p[dm.cmd.type];
        // Collect failure events for any violated preconditions
        const evts: FailEvt<C, F>[] = preconditions.reduce(
          (acc: FailEvt<C, F>[], [desc, assertFn, reason]) => {
            if (!assertFn(dm)) {
              acc.push(newFailEvt<C, F>(dm.cmd)(reason));
            }
            return acc;
          },
          []
        );
        // If any failures, return a FailDecision
        if (evts.length) {
            return {
                outcome: 'fail',
                evts
            };
        }
        // No failures: return success marker
        return {
            outcome: 'success'
        };
    }

/**
 * Evaluates branching logic to produce domain events from a DecisionModel.
 * @template C Message type
 * @template E Event type produced
 * @template A State type
 * @param b  Branch definitions keyed by command type
 * @returns A function that, given a DecisionModel, returns a SuccessDecision with events
 */
const _evalBranches = <C extends Message, E, A>
    (b: Branches<C, E, A>) =>
    (dm: DecisionModel<C, A>): SuccessDecision<E> => {
        const branches: Branch<C, E, A>[] = b[dm.cmd.type];
        if (!branches.length) {
            throw new Error(\`There must be at least one branch for cmd \`);
        }
        // Generate events for each branch whose guard passes
        const evts: E[] = branches.reduce((out: E[], [desc, guardFn, toEvt]) => {
            if(guardFn(dm)){
                return [...out, toEvt(dm)]
            }
            return out
            // return guardFn(dm) ? [...out, toEvt(dm)] : out;
        }, []);
        if (!evts.length) {
            throw new Error(\`There must be at least one event returned for cmd \`);
        }
        return {
            outcome: 'success',
            evts
        };
    }

/**
 * Composes precondition and branch evaluation into a full decision function.
 * @template C Message type
 * @template E Event type
 * @template A State type
 * @template F Failure reason literal type
 * @param ep  Precondition evaluator
 * @param eb  Branch evaluator
 * @returns A DecideFn taking preconditions, branches, and a model to produce a DecisionOutcome
 */
const _decide = <C extends Message, E, A, F extends string>
    (ep: EvalPreconditionsFn<C, A, F>) =>
    (eb: EvalBranchesFn<C, E, A>) =>
    (p: Preconditions<C, A, F>) =>
    (b: Branches<C, E, A>) =>
    (dm: DecisionModel<C, A>): DecisionOutcome<C, E, F> => {
        const preconRes = ep(p)(dm);
        if (preconRes.outcome === 'fail') {
            return preconRes;
        }
        return eb(b)(dm);
    }

/**
 * Factory to create a fully-typed DecideFn via partial application.
 */
const decide = <C extends Message, E, A, F extends string>(): DecideFn<C, E, A, F> =>
    _decide<C, E, A, F>(_evalPreconditions<C, A, F>)(_evalBranches<C, E, A>);

/**
 * Applies a sequence of events to an initial state, returning the final state.
 * @template E Event type
 * @template A State type
 * @param e  Map of evolution functions keyed by event type
 * @returns A function that, given events and an initial state, reduces to the final state
 */
const evalEvolutions = <E extends Message, A>
    (e: Evolutions<E, A>) =>
    (events: E[]) =>
    (initialState: A): A => {
        const newState = events.reduce((state: A, evt: E) => {
            const fn: EvolutionFn<E, A> = e[evt.type];
            const evolved = fn({ evt, state })
            return evolved;
        }, initialState);
        return newState
    };

/**
 * Builds the full run function from decide + evolve.
 * @template C Message type (cmd)
 * @template E Message type (evt)
 * @template A State type
 * @template F Failure reason literal type
 */
const _runBuilder = <C extends Message, E extends Message, A, F extends string>
    (decideFn: DecideFn<C, E, A, F>) =>
    (evolveFn: EvalEvolutionsFn<E, A>) =>
    (p: Preconditions<C, A, F>) =>
    (b: Branches<C, E, A>) =>
    (e: Evolutions<E, A>) =>
    (dm: DecisionModel<C, A>): OutcomeModel<C, E, A, F> => {
        const decisionOutcome = decideFn(p)(b)(dm);
        if (decisionOutcome.outcome === 'fail') {
            return { ...decisionOutcome, dm };
        }
        const newState = evolveFn(e)(decisionOutcome.evts)(dm.state);
        return { ...decisionOutcome, dm, state: newState };
    };

/**
 * Factory for a fully-typed RunBuiltFn via partial application.
 */
const _run = <C extends Message, E extends Message, A, F extends string>(): RunBuiltFn<C, E, A, F> =>
    _runBuilder(decide<C, E, A, F>())(evalEvolutions<E, A>);

/**
 * Main Decider class ties together preconditions, branches, and evolutions
 * into a single object with \`.run\` and \`.evolve\` methods.
 */
export class Decider<D extends AnyDecider> {
    public run: D['run'];
    public evolve: D['evolve'];

    constructor(
        private p: D['preconditions'],
        private b: D['branches'],
        private e: D['evolutions']
    ) {
        // Instantiate the run function with all type parameters and inputs
        this.run = _run<D['cmds'], D['evts'], D['state'] | undefined, D['fails'] | DefaultFails>()(
            this.p
        )(this.b)(this.e);
        // Instantiate the evolve function
        this.evolve = evalEvolutions<D['evts'], D['state'] | undefined>(this.e);
    }
}

    
\`\`\`

`;
