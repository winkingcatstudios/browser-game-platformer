interface StateConfig {
    name?: string
    onEnter?: () => void
    onUpdate?: (deltaTime: number) => void
    onExit?: () => void
};

// helper class for a state machines
export default class StateMachine {
    // local variables
    private context?: any;
    private name: string;
    private currentState?: StateConfig;
    private isSwitchingState = false;
    private stateQueue: string[] = [];
    private states = new Map<string, StateConfig>();

    // constructor takes context and name
    // this is the only place we allow "any" since 
    // statemachines need to be univeral
    constructor (context?: any, name?: string) {
        this.context = context;
        this.name = name ?? 'fsm';
    }

    // returns current state name
    isCurrentState(name: string) {
        if (!this.currentState) {
            return false;
        }
        return this.currentState.name === name;
    }

    // add state to statemachine, should be done in class constructor
    // I don't use onExit anywhere in this project, but this is meant
    // to be extendable and reuseable
    addState(name: string, config?: StateConfig) {
        this.states.set(name, {
            name,
            onEnter: config?.onEnter?.bind(this.context),
            onUpdate: config?.onUpdate?.bind(this.context),
            onExit: config?.onExit?.bind(this.context)
        })
        return this;
    }

    // set current state of satemachince by name
    // classes shoul use enums or constants here instead
    // of string literals to avoid errors
    // I used string literals, but would refactor this for
    // larger projects
    setState(name: string) {
        if (!this.states.has(name)) {
            return;
        }

        if (this.isSwitchingState) {
            this.stateQueue.push(name);
            return;
        }

        // lock state transitions to avoid stacking transitions which
        // can cause problems on callbacks
        this.isSwitchingState = true;

        if (this.currentState && this.currentState.onExit) {
            this.currentState.onExit();
        }

        this.currentState = this.states.get(name);

        if (this.currentState?.onEnter) {
            this.currentState?.onEnter();
        }

        this.isSwitchingState = false;

        return this;
    }

    // tick statemachine onUpdate
    update(deltaTime: number) {
        if (this.stateQueue.length > 0) {
            const name = this.stateQueue.shift()!;
            this.setState(name);
            return;
        }

        if (!this.currentState) {
            return
        }

        if (this.currentState.onUpdate) {
            this.currentState.onUpdate(deltaTime);
        }
    }

}