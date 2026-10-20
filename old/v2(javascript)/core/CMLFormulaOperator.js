//----------------------------------------------------------------------------------------------------
// Operator class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
CML.FormulaOperator = class {
    constructor(opr, oprcnt = 2) {
        this.oprcnt = oprcnt;
        this.opr0 = null;
        this.opr1 = null;
        const hash = CML.FormulaOperator.operators[this.oprcnt-1][opr];
        if (!hash) 
            throw Error("syntax error: " + opr);
        Object.assign(this, hash);
    }
    calcDynamic(resultStac, fbr) {
        const r0 = this.opr0.calcDynamic(resultStac, fbr),
              r1 = (this.oprcnt == 2) ? (this.opr1.calcDynamic(resultStac, fbr)) : 0;
        return this.func(r0, r1, resultStac);
    }
    calcStatic(resultStac) {
        const r0 = this.opr0.calcStatic(resultStac),
              r1 = (this.oprcnt == 2) ? (this.opr1.calcStatic(resultStac)) : 0;
        return this.func(r0, r1, resultStac);
    }
    get isStatic() {
        return this.opr0.isStatic && (!this.opr1 || this.opr1.isStatic);
    }
}
/** @type {String} Regular expressions */
CML.FormulaOperator.prefix_rex = "([-!(]|\\$sin|\\$cos|\\$tan|\\$asn|\\$acs|\\$atn|\\$sqr|\\$i\\?|\\$i\\?\\?|\\$int|\\$abs)";
CML.FormulaOperator.postfix_rex = "(\\))";
/** @type {Object} Operator informations */
CML.FormulaOperator.operators = [{
    "(":{
        func: r0=>r0,
        priorL: 1,
        priorR: 99,
    },
    ")":{
        func: r0=>r0,
        priorL: 99,
        priorR: 1,
    },
    "-":{
        func: r0=>(-r0),
        priorL: 10,
        priorR: 11,
    },
    "!":{
        func: r0=>((r0) ? 0 : 1),
        priorL: 10,
        priorR: 11,
    },
    "$sin":{
        func: r0=>Math.sin(r0 * 0.01745329251994329),
        priorL: 10,
        priorR: 11,
    },
    "$cos":{
        func: r0=>Math.cos(r0 * 0.017453292519943295),
        priorL: 10,
        priorR: 11,
    },
    "$tan":{
        func: r0=>Math.tan(r0 * 0.017453292519943295),
        priorL: 10,
        priorR: 11,
    },
    "$asn":{
        func: r0=>(Math.asin(r0) * 57.29577951308232),
        priorL: 10,
        priorR: 11,
    },
    "$acs":{
        func: r0=>(Math.acos(r0) * 57.29577951308232),
        priorL: 10,
        priorR: 11,
    },
    "$atn":{
        func: r0=>(Math.atan(r0) * 57.29577951308232),
        priorL: 10,
        priorR: 11,
    },
    "$sqr":{
        func: r0=>Math.sqrt(r0),
        priorL: 10,
        priorR: 11,
    },
    "$int":{
        func: r0=>Number(Math.floor(r0)),
        priorL: 10,
        priorR: 11,
    },
    "$abs":{
        func: r0=>((r0 < 0) ? -r0 : r0),
        priorL: 10,
        priorR: 11,
    },
    "$i?":{
        func: r0=>Number(Math.floor(CML.Formula._globalVariables.rand() * r0)),
        priorL: 10,
        priorR: 11,
    },
    "$i??":{
        func: r0=>Number(Math.floor(CML.Formula._globalVariables.rand() * (r0 * 2 + 1)) - r0),
        priorL: 10,
        priorR: 11,
    }
},{
    ",":{
        func: (r0, r1, vars)=>{vars.push(r0); return r1;},
        priorL : 3,
        priorR : 2,
    },
    "+":{
        func : (r0, r1)=>(r0 + r1),
        priorL : 7,
        priorR : 6,
    },
    "-":{
        func : (r0, r1)=>(r0 - r1),
        priorL : 7,
        priorR : 6,
    },
    "*":{
        func : (r0, r1)=>(r0 * r1),
        priorL : 9,
        priorR : 8,
    },
    "/":{
        func : (r0, r1)=>(r0 / r1),
        priorL : 9,
        priorR : 8,
    },
    "%":{
        func : (r0, r1)=>(r0 % r1),
        priorL : 9,
        priorR : 8,
    },
    ">":{
        func : (r0, r1)=>((r0 > r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    },
    ">=":{
        func : (r0, r1)=>((r0 >= r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    },
    "<":{
        func : (r0, r1)=>((r0 < r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    },
    "<=":{
        func : (r0, r1)=>((r0 <= r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    },
    "==":{
        func : (r0, r1)=>((r0 == r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    },
    "!=":{
        func : (r0, r1)=>((r0 != r1) ? 1 : 0),
        priorL : 5,
        priorR : 4,
    }
}];
