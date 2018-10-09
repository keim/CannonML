//--------------------------------------------------
// CML statement class for reference of sequence
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLState from "./CMLState.js";
/** @private */
export default class CMLRefer extends CMLState {
    // meaning of reference
    // label=null,   jump=null   means previous call "{.}"
    // label=null,   jump=define means non-labeled call
    // label=define, jump=null   means unsolved label call
    // label=define, jump=define means solved label call
    // functions
    //------------------------------------------------------------
    constructor(pointer = null, label_ = null) {
        super(CMLState.ST_REFER);
        // variables
        //------------------------------------------------------------
        this._label = null;
        this.jump = pointer;
        this._label = label_;
    }
    _setCommand(cmd) {
        return this;
    }
    isLabelUnsolved() {
        return (this.jump == null && this._label != null);
    }
}
