//--------------------------------------------------
// CML statement class for user defined function
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLState from "./CMLState";


/** @private */
export default class CMLUserDefine extends CMLState
{
// variables
//------------------------------------------------------------
    private _funcUserDefine:Function;
    private _argumentCount:number;
    private _requireSequence:boolean;


// functions
//------------------------------------------------------------
    constructor(obj:any)
    {
        super(CMLState.ST_NORMAL);
        this._funcUserDefine  = obj.func;
        this._argumentCount   = obj.argc;
        this._requireSequence = obj.reqseq;
        if (this._requireSequence) this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
        this.func = this._call;
    }


    protected /*override*/ _setCommand(cmd:string) : CMLState
    {
        this._resetParameters(this._argumentCount);
        return this;
    }


    private _call(fbr:CMLFiber): boolean
    {
        this._funcUserDefine(fbr, this._args);
        return true;
    }
}
