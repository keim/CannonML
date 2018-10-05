//--------------------------------------------------
// CML statement class for reference of sequence
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------

import CMLState from "./CMLState";


/** @private */
export default class CMLRefer extends CMLState
{
// variables
//------------------------------------------------------------
    public _label:string = null;

    // meaning of reference
    // label=null,   jump=null   means previous call "{.}"
    // label=null,   jump=define means non-labeled call
    // label=define, jump=null   means unsolved label call
    // label=define, jump=define means solved label call

    
// functions
//------------------------------------------------------------
    constructor(pointer:CMLState=null, label_:string=null)
    {
        super(CMLState.ST_REFER);

        this.jump = pointer;
        this._label = label_;
    }
    
    
    protected /*override*/ _setCommand(cmd:string) : CMLState
    {
        return this;
    }
    
    
    public isLabelUnsolved() : boolean
    {
        return (this.jump==null && this._label!=null);
    }
}

