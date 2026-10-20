import { State } from "./CMLState.js"

//--------------------------------------------------
// CML statement class for reference of sequence
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class Refer extends State {
    // meaning of reference
    // label=null,   jump=null   means previous call "{.}"
    // label=null,   jump=define means non-labeled call
    // label=define, jump=null   means unsolved label call
    // label=define, jump=define means solved label call
    // functions
    //------------------------------------------------------------
    _label: string | null
    constructor(pointer: State | null = null, label: string | null = null) {
        super(null);
        this.type = State.ST_REFER;
        this.jump = pointer;
        this._label = label;
    }
    isLabelUnsolved(): boolean {
        return (this.jump == null && this._label != null);
    }
}
