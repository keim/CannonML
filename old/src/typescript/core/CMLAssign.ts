//----------------------------------------------------------------------------------------------------
// CML statement for assign class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLState from "./CMLState"
import CMLObject from "./CMLObject"
import CMLFiber from "../CMLFiber"


/** @private */
export default class CMLAssign extends CMLState
{
// variables
//------------------------------------------------------------
    private _index:number = 0;
    /*internal*/ max_reference:number = 0;

    static /*internal*/ assign_rex:string = "l\\$([1-9r][+\\-*/]?)=";

    
// functions
//------------------------------------------------------------
    constructor(str:string)
    {
        super(CMLState.ST_NORMAL);
        
        var indexStr:string = str.charAt(0);
        if (indexStr == 'r') {
            this._index = -1;
        } else {
            this._index = parseInt(indexStr)-1;
            this.max_reference = this._index+1;
        }
        
        if (str.length == 1) {
            this.func = (this._index == -1) ? this._asgr:this._asg;
        } else {
            var ope:string = (str.charAt(1));
            switch(ope) {
            case '+':   this.func = (this._index == -1) ? this._addr:this._add;  break;
            case '-':   this.func = (this._index == -1) ? this._subr:this._sub;  break;
            case '*':   this.func = (this._index == -1) ? this._mulr:this._mul;  break;
            case '/':   this.func = (this._index == -1) ? this._divr:this._div;  break;
            default:    throw Error("BUG!! unknown error in assign");
            }
        }
    }


    protected /*override*/ _setCommand(cmd:string) : CMLState
    {
        return this;
    }

    
    private _asgrg(fbr:CMLFiber):boolean { CMLState._globalVariables.setRank(this._index, this._args[0]); return true; }
    private _addrg(fbr:CMLFiber):boolean { CMLState._globalVariables.setRank(this._index, CMLState._globalVariables.getRank(this._index)+this._args[0]); return true; }
    private _subrg(fbr:CMLFiber):boolean { CMLState._globalVariables.setRank(this._index, CMLState._globalVariables.getRank(this._index)-this._args[0]); return true; }
    private _mulrg(fbr:CMLFiber):boolean { CMLState._globalVariables.setRank(this._index, CMLState._globalVariables.getRank(this._index)*this._args[0]); return true; }
    private _divrg(fbr:CMLFiber):boolean { CMLState._globalVariables.setRank(this._index, CMLState._globalVariables.getRank(this._index)/this._args[0]); return true; }
    
    private _asgr(fbr:CMLFiber):boolean { fbr.object.rank  = this._args[0]; return true; }
    private _addr(fbr:CMLFiber):boolean { fbr.object.rank += this._args[0]; return true; }
    private _subr(fbr:CMLFiber):boolean { fbr.object.rank -= this._args[0]; return true; }
    private _mulr(fbr:CMLFiber):boolean { fbr.object.rank *= this._args[0]; return true; }
    private _divr(fbr:CMLFiber):boolean { fbr.object.rank /= this._args[0]; return true; }
    
    private _asg(fbr:CMLFiber):boolean { fbr.vars[this._index]  = this._args[0]; return true; }
    private _add(fbr:CMLFiber):boolean { fbr.vars[this._index] += this._args[0]; return true; }
    private _sub(fbr:CMLFiber):boolean { fbr.vars[this._index] -= this._args[0]; return true; }
    private _mul(fbr:CMLFiber):boolean { fbr.vars[this._index] *= this._args[0]; return true; }
    private _div(fbr:CMLFiber):boolean { fbr.vars[this._index] /= this._args[0]; return true; }
}

