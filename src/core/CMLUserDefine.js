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
        super(CML.State.ST_NORMAL);
        this._funcUserDefine = obj.func;
        this._argumentCount = obj.argc;
        this._requireSequence = obj.reqseq;
        if (this._requireSequence)
            this.type = CML.State.ST_RESTRICT | CML.State.STF_CALLREF;
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
