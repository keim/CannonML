//----------------------------------------------------------------------------------------------------
// Element interface class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLGlobal from "./CMLGlobal";


/** @private */
export default class CMLFormulaElem
{
    public static _globalVariables:CMLGlobal = null;
    constructor() { }
    public calc(fbr:CMLFiber) : number { return 0; }
}


