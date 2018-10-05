//----------------------------------------------------------------------------------------------------
// Operator class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLObject from "./CMLObject";
import CMLSinTable from "./CMLSinTable";
import CMLFormulaElem from "./CMLFormulaElem";


/** @private */
export default class CMLFormulaOperator extends CMLFormulaElem
{
    public static prefix_rex :string = "([-!(]|\\$sin|\\$cos|\\$tan|\\$asn|\\$acs|\\$atn|\\$sqr|\\$i\\?|\\$i\\?\\?|\\$int|\\$abs)";
    public static postfix_rex:string = "(\\))";

    public priorL:number = 0;
    public priorR:number = 0;
    public oprcnt:number   = 0;
    public opr0:CMLFormulaElem = null;
    public opr1:CMLFormulaElem = null;
    private func:Function = null;
    
    
    constructor(opr:string="", isSingle:boolean=false)
    {
        super();

        if (opr.length == 0) return;
        
        if (isSingle) {
            this.oprcnt = 1;
            if (opr == "(") { this.func=null; this.priorL=1; this.priorR=99; } else
            if (opr == ")") { this.func=null; this.priorL=99; this.priorR=1; } else
            if (opr == "-") { this.func=CMLFormulaOperator.neg;  this.priorL=10; this.priorR=11; } else
            if (opr == "!") { this.func=CMLFormulaOperator.bnt;  this.priorL=10; this.priorR=11; } else
            if (opr == "$sin") { this.func=CMLFormulaOperator.snd;  this.priorL=10; this.priorR=11; } else
            if (opr == "$cos") { this.func=CMLFormulaOperator.csd;  this.priorL=10; this.priorR=11; } else
            if (opr == "$tan") { this.func=CMLFormulaOperator.tnd;  this.priorL=10; this.priorR=11; } else
            if (opr == "$asn") { this.func=CMLFormulaOperator.asn;  this.priorL=10; this.priorR=11; } else
            if (opr == "$acs") { this.func=CMLFormulaOperator.acs;  this.priorL=10; this.priorR=11; } else
            if (opr == "$atn") { this.func=CMLFormulaOperator.atn;  this.priorL=10; this.priorR=11; } else
            if (opr == "$sqr") { this.func=CMLFormulaOperator.sqr;  this.priorL=10; this.priorR=11; } else 
            if (opr == "$int") { this.func=CMLFormulaOperator.ind;  this.priorL=10; this.priorR=11; } else
            if (opr == "$abs") { this.func=CMLFormulaOperator.abb;  this.priorL=10; this.priorR=11; } else
            if (opr == "$i?")  { this.func=CMLFormulaOperator.ird;  this.priorL=10; this.priorR=11; } else
            if (opr == "$i??") { this.func=CMLFormulaOperator.srd;  this.priorL=10; this.priorR=11; } 
        } else {
            this.oprcnt = 2;
            if (opr == "+")  { this.func=CMLFormulaOperator.adb; this.priorL=7; this.priorR=6; } else 
            if (opr == "-")  { this.func=CMLFormulaOperator.sub; this.priorL=7; this.priorR=6; } else 
            if (opr == "*")  { this.func=CMLFormulaOperator.mul; this.priorL=9; this.priorR=8; } else 
            if (opr == "/")  { this.func=CMLFormulaOperator.div; this.priorL=9; this.priorR=8; } else 
            if (opr == "%")  { this.func=CMLFormulaOperator.sup; this.priorL=9; this.priorR=8; } else 
            if (opr == ">")  { this.func=CMLFormulaOperator.grt; this.priorL=5; this.priorR=4; } else 
            if (opr == ">=") { this.func=CMLFormulaOperator.geq; this.priorL=5; this.priorR=4; } else 
            if (opr == "<")  { this.func=CMLFormulaOperator.les; this.priorL=5; this.priorR=4; } else 
            if (opr == "<=") { this.func=CMLFormulaOperator.leq; this.priorL=5; this.priorR=4; } else 
            if (opr == "==") { this.func=CMLFormulaOperator.eqr; this.priorL=5; this.priorR=4; } else 
            if (opr == "!=") { this.func=CMLFormulaOperator.neq; this.priorL=5; this.priorR=4; } 
        }
    }
    
    
    public /*override*/ calc(fbr:CMLFiber) : number
    {
        return this.func(this.opr0.calc(fbr), (this.oprcnt==2) ? (this.opr1.calc(fbr)) : 0);
    }
    
    
    private static adb(r0:number, r1:number) : number { return r0+r1; }
    private static sub(r0:number, r1:number) : number { return r0-r1; }
    private static mul(r0:number, r1:number) : number { return r0*r1; }
    private static div(r0:number, r1:number) : number { return r0/r1; }
    private static sup(r0:number, r1:number) : number { return r0%r1; }
    private static neg(r0:number, r1:number) : number { return -r0; }
    private static bnt(r0:number, r1:number) : number { return (r0==0)?1:0; }
    private static snd(r0:number, r1:number) : number { 
        var st:CMLSinTable = CMLFormulaElem._globalVariables._sin;
        return st[st.index(r0)];
    }
    private static csd(r0:number, r1:number) : number {
        var st:CMLSinTable = CMLFormulaElem._globalVariables._sin;
        return st[st.index(r0) + st.cos_shift];
    }
    private static tnd(r0:number, r1:number) : number { return Math.tan(r0*0.017453292519943295); }
    private static asn(r0:number, r1:number) : number { return Math.asin(r0)*57.29577951308232; }
    private static acs(r0:number, r1:number) : number { return Math.acos(r0)*57.29577951308232; }
    private static atn(r0:number, r1:number) : number { return Math.atan(r0)*57.29577951308232; }
    private static sqr(r0:number, r1:number) : number { return Math.sqrt(r0); }
    private static ind(r0:number, r1:number) : number { return Number(Math.floor(r0)); }
    private static abb(r0:number, r1:number) : number { return (r0<0)?(-r0):(r0); }
    private static ird(r0:number, r1:number) : number { return Number(Math.floor(CMLFormulaElem._globalVariables.rand()*r0)); }
    private static srd(r0:number, r1:number) : number { return Number(Math.floor(CMLFormulaElem._globalVariables.rand()*(r0*2+1))-r0); }
    private static grt(r0:number, r1:number) : number { return (r0>r1)?1:0; }
    private static geq(r0:number, r1:number) : number { return (r0>=r1)?1:0; }
    private static les(r0:number, r1:number) : number { return (r0<r1)?1:0; }
    private static leq(r0:number, r1:number) : number { return (r0<=r1)?1:0; }
    private static neq(r0:number, r1:number) : number { return (r0!=r1)?1:0; }
    private static eqr(r0:number, r1:number) : number { return (r0==r1)?1:0; }
}
