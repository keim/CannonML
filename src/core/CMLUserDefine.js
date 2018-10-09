//--------------------------------------------------
// CML statement class for user defined function
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLState from "./CMLState.js";
/** @private */
export default class CMLUserDefine extends CMLState {
    // functions
    //------------------------------------------------------------
    constructor(obj) {
        super(CMLState.ST_NORMAL);
        this._funcUserDefine = obj.func;
        this._argumentCount = obj.argc;
        this._requireSequence = obj.reqseq;
        if (this._requireSequence)
            this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
        this.func = this._call;
    }
    _setCommand(cmd) {
        this._resetParameters(this._argumentCount);
        return this;
    }
    _call(fbr) {
        this._funcUserDefine(fbr, this._args);
        return true;
    }
}
