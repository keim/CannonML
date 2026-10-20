//--------------------------------------------------
// CML statement class for user defined function
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.State from "./CML.State.js";
/** @private */
CML.UserDefine = class extends CML.State {
    // functions
    //------------------------------------------------------------
    constructor(obj) {
        super(null);
        this._funcUserDefine = obj.func;
        this.$ = new Array(obj.argc || 0).fill(0);
        this._requireSequence = obj.reqseq;
        if (this._requireSequence)
            this.type = CML.State.ST_RESTRICT | CML.State.STF_CALLREF;
        this.func = this._call;
    }
    _call(state, $, fiber) {
        this._funcUserDefine(fiber, $);
        return true;
    }
}
