//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.State from "./CML.State.js";
//import CML.FormulaElem from "./CML.FormulaElem.js";
//import CML.FormulaLiteral from "./CML.FormulaLiteral.js";
//import CML.FormulaOperator from "./CML.FormulaOperator.js";
/** @private statemant for formula calculation */
CML.Formula = class extends CML.State {
    // functions
    //------------------------------------------------------------
    constructor(state, copyfromArgument) {
        super(CML.State.ST_FORMULA | CML.State.STF_BE_INTERPOLATED);
        // variables
        //------------------------------------------------------------
        this.jump = state;
        this.func = this._calc;
        this.variables = [];
        this.isStatic = true;
        this._root = null;
        this.max_reference = 0;
        CML.Formula.stacOperator.length = 0;
        // copy argument to operand, when the 1st operand already parsed as the 1st argument
        if (copyfromArgument) {
            CML.Formula.stacOperand.length = 1;
            CML.Formula.stacOperand[0] = new CML.FormulaLiteral(this);
            CML.Formula.stacOperand[0].num = state._args[0];
        }
        else {
            CML.Formula.stacOperand.length = 0;
        }
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
        CML.FormulaElem._globalVariables = globalVariables_;
        CML.Formula._prefixRegExp = new RegExp(CML.FormulaOperator.prefix_rex, 'g');
        CML.Formula._postfixRegExp = new RegExp(CML.FormulaOperator.postfix_rex, 'g');
    }
    /*override*/ _setCommand(cmd) {
        return this;
    }
    // function to create formula structure
    //------------------------------------------------------------
    // push operator stac
    pushOperator(oprator, oprcnt) {
        if (!oprator)
            return false;
        const ope = new CML.FormulaOperator(this, oprator, oprcnt);
        while (CML.Formula.stacOperator.length > 0 && CML.Formula.stacOperator[0].priorL > ope.priorR) {
            const oprcnt = CML.Formula.stacOperator[0].oprcnt;
            if (CML.Formula.stacOperand.length < oprcnt)
                return false;
            CML.Formula.stacOperator[0].opr1 = (oprcnt > 1) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperator[0].opr0 = (oprcnt > 0) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperand.unshift(CML.Formula.stacOperator.shift());
        }
        // closed by ()
        if (CML.Formula.stacOperator.length > 0 && CML.Formula.stacOperator[0].priorR == 99 && ope.priorL == 99)
            CML.Formula.stacOperator.shift();
        else
            CML.Formula.stacOperator.unshift(ope);
        return true;
    }
    // push operand stac
    pushLiteral(literal) {
        if (!literal)
            return;
        const lit = new CML.FormulaLiteral(this);
        const ret = lit.parseLiteral(literal);
        if (this.max_reference < ret)
            this.max_reference = ret;
        CML.Formula.stacOperand.unshift(lit);
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
        while (CML.Formula.stacOperator.length > 0) {
            const oprcnt = CML.Formula.stacOperator[0].oprcnt;
            if (CML.Formula.stacOperand.length < oprcnt)
                return false;
            CML.Formula.stacOperator[0].opr1 = (oprcnt > 1) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperator[0].opr0 = (oprcnt > 0) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperand.unshift(CML.Formula.stacOperator.shift());
        }
        if (CML.Formula.stacOperand.length == 1)
            this._root = CML.Formula.stacOperand.shift();
        return Boolean(this._root);
    }
    // calculation
    //------------------------------------------------------------
    _calcStatic() {
        this.variables = [];
        this.variables.push(this._root.calcStatic());
        this.isStatic = this.variables.every(num=>!isNaN(num));
        return this.variables;
    }
    _calc(fbr) {
        this.variables = [];
        this.variables.push(this._root.calc(fbr));
        this.jump._args = this.variables.concat();
        return true;
    }
}
CML.Formula.stacOperator = [];
CML.Formula.stacOperand = [];
CML.Formula._prefixRegExp = null;
CML.Formula._postfixRegExp = null;
