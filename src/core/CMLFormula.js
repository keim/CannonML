//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.State from "./CML.State.js";
//import CML.FormulaLiteral from "./CML.FormulaLiteral.js";
//import CML.FormulaOperator from "./CML.FormulaOperator.js";
/** @private statemant for formula calculation */
CML.Formula = class {
    // functions
    //------------------------------------------------------------
    constructor() {
        this.isStatic = true;
        this.answerCount = 0;
        this._rootOperator = null;
        this._stacOperator = [];
        this._stacOperand = [];
    }
    // Initialize all statics (call from CML.Parser._createCMLRegExp())
    static _createOperandRegExpString(literalRegExpString) {
        let rex = "(" + CML.FormulaOperator.prefix_rex + "+)?";
        rex += literalRegExpString + "?";
        rex += "(" + CML.FormulaOperator.postfix_rex + "+)?";
        return rex;
    }
    // initialize
    static _initialize(globalVariables_) {
        CML.Formula._globalVariables = globalVariables_;
        CML.Formula._prefixRegExp = new RegExp(CML.FormulaOperator.prefix_rex, 'g');
        CML.Formula._postfixRegExp = new RegExp(CML.FormulaOperator.postfix_rex, 'g');
    }
    // [override] 
    _setCommand(cmd) {
        return this;
    }
    // function to create formula structure
    //------------------------------------------------------------
    // push operator stac
    pushOperator(oprator, oprcnt) {
        if (!oprator)
            return false;
        const ope = new CML.FormulaOperator(oprator, oprcnt);
        while (this._stacOperator.length > 0 && this._stacOperator[0].priorL > ope.priorR) {
            const oprcnt = this._stacOperator[0].oprcnt;
            if (this._stacOperand.length < oprcnt)
                return false;
            this._stacOperator[0].opr1 = (oprcnt > 1) ? (this._stacOperand.shift()) : (null);
            this._stacOperator[0].opr0 = (oprcnt > 0) ? (this._stacOperand.shift()) : (null);
            this._stacOperand.unshift(this._stacOperator.shift());
        }
        // closed by ()
        if (this._stacOperator.length > 0 && this._stacOperator[0].priorR == 99 && ope.priorL == 99)
            this._stacOperator.shift();
        else
            this._stacOperator.unshift(ope);
        return true;
    }
    // push operand stac
    pushLiteral(literal) {
        return (literal) ? this._stacOperand.unshift(new CML.FormulaLiteral(literal)) : true;
    }
    // push prefix
    pushPrefix(prefix) {
        return (prefix) ? this._parse_and_push(CML.Formula._prefixRegExp, prefix) : true;
    }
    // push postfix
    pushPostfix(postfix) {
        return (postfix) ? this._parse_and_push(CML.Formula._postfixRegExp, postfix) : true;
    }
    // call from pushPostfix and pushPrefix.
    _parse_and_push(rex, str) {
        rex.lastIndex = 0;
        let res = rex.exec(str);
        while (res) {
            if (!this.pushOperator(res[1], 1))
                return false;
            res = rex.exec(str);
        }
        return true;
    }
    // construct formula structure
    construct() {
        // no arguments
        if (this._stacOperand.length == 0)
            return true;
        // construct tree structure
        while (this._stacOperator.length > 0) {
            const oprcnt = this._stacOperator[0].oprcnt;
            if (this._stacOperand.length < oprcnt)
                return false;
            this._stacOperator[0].opr1 = (oprcnt > 1) ? (this._stacOperand.shift()) : (null);
            this._stacOperator[0].opr0 = (oprcnt > 0) ? (this._stacOperand.shift()) : (null);
            this._stacOperand.unshift(this._stacOperator.shift());
        }
        // success when operand stac has only one member
        if (this._stacOperand.length == 1)
            this._rootOperator = this._stacOperand.shift();
        return Boolean(this._rootOperator);
    }
    // calculation
    //------------------------------------------------------------
    calcStatic() {
        if (!this._rootOperator) 
            return null;
        const answers = [];
        answers.push(this._rootOperator.calcStatic(answers));
        this.isStatic = answers.every(num=>!isNaN(num));
        this.answerCount = answers.length;
        return (this.isStatic) ? answers : null;
    }
    calcDynamic(fbr) {
        const answers = [];
        answers.push(this._rootOperator.calcDynamic(answers, fbr));
        return answers;
    }
}
CML.Formula._globalVariables = null;
CML.Formula._prefixRegExp = null;
CML.Formula._postfixRegExp = null;
