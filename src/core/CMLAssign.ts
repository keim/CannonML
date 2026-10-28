import type { Fiber } from "../CMLFiber.js"
import { State } from "./CMLState.js"

//----------------------------------------------------------------------------------------------------
// CML statement for assign class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class Assign extends State {
    // functions
    //------------------------------------------------------------
    _index: number
    constructor(str: string) {
        super(null);
        // variables
        //------------------------------------------------------------
        this._index = 0;
        const indexStr = str.charAt(0);
        if (indexStr == 'r') {
            this._index = -1;
        }
        else {
            this._index = parseInt(indexStr) - 1;
        }
        if (str.length == 1) {
            this.func = this._asg;
        }
        else {
            const ope = (str.charAt(1));
            switch (ope) {
                case '+':
                    this.func = this._add;
                    break;
                case '-':
                    this.func = this._sub;
                    break;
                case '*':
                    this.func = this._mul;
                    break;
                case '/':
                    this.func = this._div;
                    break;
                default: throw Error("BUG!! unknown error in assign");
            }
        }
    }
    _asg(_: State, $: number[], fiber: Fiber) { fiber.setVariable(this._index, $[0]); return true; }
    _add(_: State, $: number[], fiber: Fiber) { fiber.setVariable(this._index, fiber.getVariable(this._index) + $[0]); return true; }
    _sub(_: State, $: number[], fiber: Fiber) { fiber.setVariable(this._index, fiber.getVariable(this._index) - $[0]); return true; }
    _mul(_: State, $: number[], fiber: Fiber) { fiber.setVariable(this._index, fiber.getVariable(this._index) * $[0]); return true; }
    _div(_: State, $: number[], fiber: Fiber) { fiber.setVariable(this._index, fiber.getVariable(this._index) / $[0]); return true; }
}
