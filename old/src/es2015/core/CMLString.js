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
export default class CMLString extends CMLState {
    // functions
    //------------------------------------------------------------
    constructor(str) {
        super(CMLState.ST_STRING);
        this._string = str;
    }
    _setCommand(cmd) {
        return this;
    }
}
