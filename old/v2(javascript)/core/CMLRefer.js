//--------------------------------------------------
// CML statement class for reference of sequence
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.State from "./CML.State.js";
/** @private */
CML.Refer = class extends CML.State {
    // meaning of reference
    // label=null,   jump=null   means previous call "{.}"
    // label=null,   jump=define means non-labeled call
    // label=define, jump=null   means unsolved label call
    // label=define, jump=define means solved label call
    // functions
    //------------------------------------------------------------
    constructor(pointer = null, label = null) {
        super(null);
        this.type = CML.State.ST_REFER;
        this.jump = pointer;
        this._label = label;
    }
    isLabelUnsolved() {
        return (this.jump == null && this._label != null);
    }
}
