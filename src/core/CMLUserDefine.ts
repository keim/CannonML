import type { Fiber } from "../CMLFiber.js"
import type { UserCommand, UserCommandFunc } from "./CMLGlobal.js"
import { State } from "./CMLState.js"

//--------------------------------------------------
// CML statement class for user defined function
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class UserDefine extends State {
    // functions
    //------------------------------------------------------------
    _funcUserDefine: UserCommandFunc
    _requireSequence: boolean | undefined
    constructor(obj: UserCommand) {
        super(null);
        this._funcUserDefine = obj.func;
        this.$ = new Array(obj.argc || 0).fill(0);
        this._requireSequence = obj.reqseq;
        if (this._requireSequence)
            this.type = State.ST_RESTRICT | State.STF_CALLREF;
        this.func = this._call;
    }
    _call(_state: State, $: number[], fiber: Fiber) {
        this._funcUserDefine(fiber, $);
        return true;
    }
}
