//--------------------------------------------------
// CML statement for string class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/*
public function get string():String
*/
//import CML.State from "./CML.State.js";
/** @private */
CML.String = class extends CML.State {
    // functions
    //------------------------------------------------------------
    constructor(str) {
        super(null);
        this.type = CML.State.ST_STRING;
        this._string = str;
    }
}
