import type { Fiber } from "../CMLFiber.js"
import { State, type StateFunc } from "./CMLState.js"

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
    // 以下の _asg 系は fiber を第 1 引数に取る想定だが、State.execute は (state, $, fiber, object) で呼ぶため
    // 実際には state が渡る（既知の不具合。テストで固定）。型だけ StateFunc にキャストしている
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
            this.func = ((this._index == -1) ? this._asgr : this._asg) as unknown as StateFunc;
        }
        else {
            const ope = (str.charAt(1));
            switch (ope) {
                case '+':
                    this.func = ((this._index == -1) ? this._addr : this._add) as unknown as StateFunc;
                    break;
                case '-':
                    this.func = ((this._index == -1) ? this._subr : this._sub) as unknown as StateFunc;
                    break;
                case '*':
                    this.func = ((this._index == -1) ? this._mulr : this._mul) as unknown as StateFunc;
                    break;
                case '/':
                    this.func = ((this._index == -1) ? this._divr : this._div) as unknown as StateFunc;
                    break;
                default: throw Error("BUG!! unknown error in assign");
            }
        }
    }
    _asgr(fbr: Fiber) { fbr.object.rank = this.$[0]; return true; }
    _addr(fbr: Fiber) { fbr.object.rank += this.$[0]; return true; }
    _subr(fbr: Fiber) { fbr.object.rank -= this.$[0]; return true; }
    _mulr(fbr: Fiber) { fbr.object.rank *= this.$[0]; return true; }
    _divr(fbr: Fiber) { fbr.object.rank /= this.$[0]; return true; }
    _asg(fbr: Fiber) { fbr.vars[0][this._index] = this.$[0]; return true; }
    _add(fbr: Fiber) { fbr.vars[0][this._index] += this.$[0]; return true; }
    _sub(fbr: Fiber) { fbr.vars[0][this._index] -= this.$[0]; return true; }
    _mul(fbr: Fiber) { fbr.vars[0][this._index] *= this.$[0]; return true; }
    _div(fbr: Fiber) { fbr.vars[0][this._index] /= this.$[0]; return true; }
}
