//----------------------------------------------------------------------------------------------------
// Operator class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.FormulaElem from "./CML.FormulaElem.js";
/** @private */
CML.FormulaOperator = class extends CML.FormulaElem {
    constructor(form, opr = "", isSingle = false) {
        super(form);
        this.priorL = 0;
        this.priorR = 0;
        this.oprcnt = 0;
        this.opr0 = null;
        this.opr1 = null;
        this.func = null;
        if (opr.length == 0)
            return;
        if (isSingle) {
            this.oprcnt = 1;
            if (opr == "(") {
                this.func = CML.FormulaOperator.nop;
                this.priorL = 3;
                this.priorR = 99;
            }
            else if (opr == ")") {
                this.func = CML.FormulaOperator.nop;
                this.priorL = 99;
                this.priorR = 2;
            }
            else if (opr == "-") {
                this.func = CML.FormulaOperator.neg;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "!") {
                this.func = CML.FormulaOperator.bnt;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$sin") {
                this.func = CML.FormulaOperator.snd;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$cos") {
                this.func = CML.FormulaOperator.csd;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$tan") {
                this.func = CML.FormulaOperator.tnd;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$asn") {
                this.func = CML.FormulaOperator.asn;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$acs") {
                this.func = CML.FormulaOperator.acs;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$atn") {
                this.func = CML.FormulaOperator.atn;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$sqr") {
                this.func = CML.FormulaOperator.sqr;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$int") {
                this.func = CML.FormulaOperator.ind;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$abs") {
                this.func = CML.FormulaOperator.abb;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$i?") {
                this.func = CML.FormulaOperator.ird;
                this.priorL = 10;
                this.priorR = 11;
            }
            else if (opr == "$i??") {
                this.func = CML.FormulaOperator.srd;
                this.priorL = 10;
                this.priorR = 11;
            }
        }
        else {
            this.oprcnt = 2;
            if (opr == ",") {
                this.func = CML.FormulaOperator.stacResult;
                this.priorL = 3;
                this.priorR = 2;
            }
            else if (opr == "+") {
                this.func = CML.FormulaOperator.adb;
                this.priorL = 7;
                this.priorR = 6;
            }
            else if (opr == "-") {
                this.func = CML.FormulaOperator.sub;
                this.priorL = 7;
                this.priorR = 6;
            }
            else if (opr == "*") {
                this.func = CML.FormulaOperator.mul;
                this.priorL = 9;
                this.priorR = 8;
            }
            else if (opr == "/") {
                this.func = CML.FormulaOperator.div;
                this.priorL = 9;
                this.priorR = 8;
            }
            else if (opr == "%") {
                this.func = CML.FormulaOperator.sup;
                this.priorL = 9;
                this.priorR = 8;
            }
            else if (opr == ">") {
                this.func = CML.FormulaOperator.grt;
                this.priorL = 5;
                this.priorR = 4;
            }
            else if (opr == ">=") {
                this.func = CML.FormulaOperator.geq;
                this.priorL = 5;
                this.priorR = 4;
            }
            else if (opr == "<") {
                this.func = CML.FormulaOperator.les;
                this.priorL = 5;
                this.priorR = 4;
            }
            else if (opr == "<=") {
                this.func = CML.FormulaOperator.leq;
                this.priorL = 5;
                this.priorR = 4;
            }
            else if (opr == "==") {
                this.func = CML.FormulaOperator.eqr;
                this.priorL = 5;
                this.priorR = 4;
            }
            else if (opr == "!=") {
                this.func = CML.FormulaOperator.neq;
                this.priorL = 5;
                this.priorR = 4;
            }
        }
    }
    calc(fbr) {
        return this.func(fbr, this.opr0.calc(fbr), (this.oprcnt == 2) ? (this.opr1.calc(fbr)) : 0);
    }
    calcStatic() {
        return this.func(null, this.opr0.calcStatic(), (this.oprcnt == 2) ? (this.opr1.calcStatic()) : 0);
    }
    static stacResult(fbr, r0, r1) {
        if (this._parent.variables.length <= this._parent._stacIndex) 
            this._parent.variables.length = this._parent._stacIndex + 1;
        this._parent.variables[this._parent._stacIndex] = r0;
        this._parent._stacIndex++;
        return r1;
    }
    static nop(fbr, r0, r1) { return r0; }
    static adb(fbr, r0, r1) { return r0 + r1; }
    static sub(fbr, r0, r1) { return r0 - r1; }
    static mul(fbr, r0, r1) { return r0 * r1; }
    static div(fbr, r0, r1) { return r0 / r1; }
    static sup(fbr, r0, r1) { return r0 % r1; }
    static neg(fbr, r0, r1) { return -r0; }
    static bnt(fbr, r0, r1) { return (r0 == 0) ? 1 : 0; }
    static snd(fbr, r0, r1) {
        var st = CML.FormulaElem._globalVariables._sin;
        return st[st.index(r0)];
    }
    static csd(fbr, r0, r1) {
        var st = CML.FormulaElem._globalVariables._sin;
        return st[st.index(r0) + st.cos_shift];
    }
    static tnd(fbr, r0, r1) { return Math.tan(r0 * 0.017453292519943295); }
    static asn(fbr, r0, r1) { return Math.asin(r0) * 57.29577951308232; }
    static acs(fbr, r0, r1) { return Math.acos(r0) * 57.29577951308232; }
    static atn(fbr, r0, r1) { return Math.atan(r0) * 57.29577951308232; }
    static sqr(fbr, r0, r1) { return Math.sqrt(r0); }
    static ind(fbr, r0, r1) { return Number(Math.floor(r0)); }
    static abb(fbr, r0, r1) { return (r0 < 0) ? (-r0) : (r0); }
    static ird(fbr, r0, r1) { return Number(Math.floor(CML.FormulaElem._globalVariables.rand() * r0)); }
    static srd(fbr, r0, r1) { return Number(Math.floor(CML.FormulaElem._globalVariables.rand() * (r0 * 2 + 1)) - r0); }
    static grt(fbr, r0, r1) { return (r0 > r1) ? 1 : 0; }
    static geq(fbr, r0, r1) { return (r0 >= r1) ? 1 : 0; }
    static les(fbr, r0, r1) { return (r0 < r1) ? 1 : 0; }
    static leq(fbr, r0, r1) { return (r0 <= r1) ? 1 : 0; }
    static neq(fbr, r0, r1) { return (r0 != r1) ? 1 : 0; }
    static eqr(fbr, r0, r1) { return (r0 == r1) ? 1 : 0; }
}
CML.FormulaOperator.prefix_rex = "([-!(]|\\$sin|\\$cos|\\$tan|\\$asn|\\$acs|\\$atn|\\$sqr|\\$i\\?|\\$i\\?\\?|\\$int|\\$abs)";
CML.FormulaOperator.postfix_rex = "(\\))";
