//--------------------------------------------------
// CML statement for string class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/*
public function get string():String
*/

import CMLState from "./CMLState";


/** @private */
export default class CMLString extends CMLState
{
// variables
//------------------------------------------------------------
    public _string:string;
    

// functions
//------------------------------------------------------------
    constructor(str:string)
    {
        super(CMLState.ST_STRING);
        this._string = str;
    }


    protected /*override*/ _setCommand(cmd:string) : CMLState
    {
        return this;
    }
}

