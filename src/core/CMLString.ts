import { State } from "./CMLState.js"

//--------------------------------------------------
// CML statement for string class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/*
public function get string():String
*/
/** @private */
export class CMLString extends State {
    // functions
    //------------------------------------------------------------
    _string: string
    constructor(str: string) {
        super(null);
        this.type = State.ST_STRING;
        this._string = str;
    }
}
