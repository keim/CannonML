//----------------------------------------------------------------------------------------------------
// CML statement for assign class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.State from "./CML.State.js";
/** @private */
CML.Assign = class extends CML.State {
    // functions
    //------------------------------------------------------------
    constructor(str) {
        super(CML.State.ST_NORMAL);
        // variables
        //------------------------------------------------------------
        this._index = 0;
        /*internal*/ this.max_reference = 0;
        var indexStr = str.charAt(0);
        if (indexStr == 'r') {
            this._index = -1;
        }
        else {
            this._index = parseInt(indexStr) - 1;
            this.max_reference = this._index + 1;
        }
        if (str.length == 1) {
            this.func = (this._index == -1) ? this._asgr : this._asg;
        }
        else {
            var ope = (str.charAt(1));
            switch (ope) {
                case '+':
                    this.func = (this._index == -1) ? this._addr : this._add;
                    break;
                case '-':
                    this.func = (this._index == -1) ? this._subr : this._sub;
                    break;
                case '*':
                    this.func = (this._index == -1) ? this._mulr : this._mul;
                    break;
                case '/':
                    this.func = (this._index == -1) ? this._divr : this._div;
                    break;
                default: throw Error("BUG!! unknown error in assign");
            }
        }
    }
    _setCommand(cmd) {
        return this;
    }
    _asgrg(fbr) { CML.State._globalVariables.setRank(this._index, this._args[0]); return true; }
    _addrg(fbr) { CML.State._globalVariables.setRank(this._index, CML.State._globalVariables.getRank(this._index) + this._args[0]); return true; }
    _subrg(fbr) { CML.State._globalVariables.setRank(this._index, CML.State._globalVariables.getRank(this._index) - this._args[0]); return true; }
    _mulrg(fbr) { CML.State._globalVariables.setRank(this._index, CML.State._globalVariables.getRank(this._index) * this._args[0]); return true; }
    _divrg(fbr) { CML.State._globalVariables.setRank(this._index, CML.State._globalVariables.getRank(this._index) / this._args[0]); return true; }
    _asgr(fbr) { fbr.object.rank = this._args[0]; return true; }
    _addr(fbr) { fbr.object.rank += this._args[0]; return true; }
    _subr(fbr) { fbr.object.rank -= this._args[0]; return true; }
    _mulr(fbr) { fbr.object.rank *= this._args[0]; return true; }
    _divr(fbr) { fbr.object.rank /= this._args[0]; return true; }
    _asg(fbr) { fbr.vars[this._index] = this._args[0]; return true; }
    _add(fbr) { fbr.vars[this._index] += this._args[0]; return true; }
    _sub(fbr) { fbr.vars[this._index] -= this._args[0]; return true; }
    _mul(fbr) { fbr.vars[this._index] *= this._args[0]; return true; }
    _div(fbr) { fbr.vars[this._index] /= this._args[0]; return true; }
}
CML.Assign.assign_rex = "l\\$([1-9r][+\\-*/]?)=";
