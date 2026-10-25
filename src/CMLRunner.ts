import { Fiber } from "./CMLFiber.js"
import type { Sequence } from "./CMLSequence.js"
import { CMLObject } from "./core/CMLObject.js"

//----------------------------------------------------------------------------------------------------
// CML runner class
//  Copyright (c) 2016 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------
/** Callback functions of Runner (see CannonML constructor / Runner.setCallbackFunctions). */
export interface RunnerCallbacks {
    onCreateNewRunner?: (runner: Runner) => void
    onDestroy?: (runner: Runner) => void
    onUpdate?: (runner: Runner) => void
}

/** CML.Runner provides CML.Object with Fiber and Sequence  */
export class Runner extends CMLObject {
    // constructor
    //------------------------------------------------------------
    /** @private constractor call in CannonML._newCMLRunner() */
    _sequence: Sequence | null
    _createdby: Runner | null
    _onCreateNewRunner?: ((runner: Runner) => void) | null
    _onDestroy?: ((runner: Runner) => void) | null
    _onUpdate?: ((runner: Runner) => void) | null
    scopeEnabled: boolean
    constructor(createdby_: Runner | null, sequence_: Sequence | null) {
        super();
        // executing sequence
        this._sequence = sequence_;
        // created by
        this._createdby = createdby_;
        // callback functions
        this._onCreateNewRunner = createdby_ && createdby_._onCreateNewRunner;
        this._onDestroy = createdby_ && createdby_._onDestroy;
        this._onUpdate = createdby_ && createdby_._onUpdate;
        this.scopeEnabled = true;
    }
    // variables
    //------------------------------------------------------------
    /** executing sequence */
    get sequence() { return this._sequence; }
    /** set callback functions
     *  @param hash Hash indludes callback functions 'onCreateNewRunner', 'onDestroy' and 'onUpdate'. The callback functions give the CML.Runnner insatnace to move your object.
     */
    setCallbackFunctions(hash: RunnerCallbacks) {
        if (hash.onCreateNewRunner)
            this._onCreateNewRunner = hash.onCreateNewRunner;
        if (hash.onDestroy)
            this._onDestroy = hash.onDestroy;
        if (hash.onUpdate)
            this._onUpdate = hash.onUpdate;
    }
    // operation
    //------------------------------------------------------------
    /** Execute a sequence.
     *  @param seq The sequencye to execute.
     *  @param invertFlag The flag to invert execution same as 'm' command.
     *  @return Instance of fiber that execute the sequence.
     */
    execute(seq: Sequence, invertFlag = 0): Fiber | null {
        return Fiber._newRootFiber(this, seq, invertFlag);
    }
    /** Stop all fibers of object. This function is slow.
     *  If you want to execute faster, keep returned CML.Fiber of CML.Object.execute() and call CML.Fiber.destroy() wherever possible.
     *  @param obj object to halt motion sequence.
     *  @see CML.Runner#execute()
     *  @see CML.Fiber#destroy()
     */
    halt() {
        Fiber._destroyAllFibers(this);
    }
    // callback functions
    //------------------------------------------------------------
    /** @private */
    onCreate() {
        if (this._createdby && this._createdby._onCreateNewRunner) {
            this._createdby._onCreateNewRunner(this);
        }
    }
    /** @private */
    onDestroy() {
        if (this._onDestroy) {
            this._onDestroy(this);
        }
    }
    /** @private */
    onUpdate() {
        if (this._onUpdate) {
            this._onUpdate(this);
        }
        if (this.destructionStatus < 0 && this.scopeEnabled) {
            const hw = CMLObject._globalVariables._halfScreenWidth,
                  hh = CMLObject._globalVariables._halfScreenHeight;
            if (this.pos.x < -hw || hw < this.pos.x || this.pos.y < -hh || hh < this.pos.y) 
                this.destroy(Runner.ESCAPE_STATUS);
        }
    }
    /** @private */
    onFireObject(seq: Sequence): Runner {
        return new Runner(this, seq);
    }


    /* destory status for escape */
    static ESCAPE_STATUS: number = 999999;
}