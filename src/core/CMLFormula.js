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
    constructor(state, pnfa) {
        super(CML.State.ST_FORMULA);
        // variables
        //------------------------------------------------------------
        this._arg_index = 0;
        this._form = null;
        this.max_reference = 0;
        this.jump = state;
        this.func = this._calc;
        this._arg_index = state._args.length - 1;
        CML.Formula.stacOperator.length = 0;
        this.max_reference = 0;
        // Pickup Number From Argument ?
        if (pnfa) {
            CML.Formula.stacOperand.length = 1;
            CML.Formula.stacOperand[0] = new CML.FormulaLiteral();
            CML.Formula.stacOperand[0].num = state._args[this._arg_index];
        }
        else {
            CML.Formula.stacOperand.length = 0;
        }
    }
    // Initialize all statics (call from CML.Parser._createCMLRegExp())
    static _createOperandRegExpString(literalRegExpString) {
        var rex;
        rex = "(" + CML.FormulaOperator.prefix_rex + "+)?";
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
    pushOperator(oprator, isSingle) {
        if (oprator == undefined)
            return false;
        var ope = new CML.FormulaOperator(oprator, isSingle);
        while (CML.Formula.stacOperator.length > 0 && CML.Formula.stacOperator[0].priorL > ope.priorR) {
            var oprcnt = CML.Formula.stacOperator[0].oprcnt;
            if (CML.Formula.stacOperand.length < oprcnt)
                return false;
            CML.Formula.stacOperator[0].opr1 = (oprcnt > 1) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperator[0].opr0 = (oprcnt > 0) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperand.unshift(CML.Formula.stacOperator.shift());
        }
        // closed by ()
        if (CML.Formula.stacOperator.length > 0 && CML.Formula.stacOperator[0].priorL == 1 && ope.priorR == 1)
            CML.Formula.stacOperator.shift();
        else
            CML.Formula.stacOperator.unshift(ope);
        return true;
    }
    // push operand stac
    pushLiteral(literal) {
        if (literal == undefined)
            return;
        var lit = new CML.FormulaLiteral();
        var ret = lit.parseLiteral(literal);
        if (this.max_reference < ret)
            this.max_reference = ret;
        CML.Formula.stacOperand.unshift(lit);
    }
    // push prefix
    pushPrefix(prefix, isSingle) {
        return (prefix != undefined) ? this._parse_and_push(CML.Formula._prefixRegExp, prefix, isSingle) : true;
    }
    // push postfix
    pushPostfix(postfix, isSingle) {
        return (postfix != undefined) ? this._parse_and_push(CML.Formula._postfixRegExp, postfix, isSingle) : true;
    }
    // call from pushPostfix and pushPrefix.
    _parse_and_push(rex, str, isSingle) {
        rex.lastIndex = 0;
        var res = rex.exec(str);
        while (res != null) {
            if (!this.pushOperator(res[1], isSingle))
                return false;
            res = rex.exec(str);
        }
        return true;
    }
    // construct formula structure
    construct() {
        while (CML.Formula.stacOperator.length > 0) {
            var oprcnt = CML.Formula.stacOperator[0].oprcnt;
            if (CML.Formula.stacOperand.length < oprcnt)
                return false;
            CML.Formula.stacOperator[0].opr1 = (oprcnt > 1) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperator[0].opr0 = (oprcnt > 0) ? (CML.Formula.stacOperand.shift()) : (null);
            CML.Formula.stacOperand.unshift(CML.Formula.stacOperator.shift());
        }
        if (CML.Formula.stacOperand.length == 1)
            this._form = CML.Formula.stacOperand.shift();
        return (this._form != null);
    }
    // calculation
    //------------------------------------------------------------
    _calc(fbr) {
        this.jump._args[this._arg_index] = this._form.calc(fbr);
        return true;
    }
}
CML.Formula.stacOperator = new Array();
CML.Formula.stacOperand = new Array();
CML.Formula._prefixRegExp = null;
CML.Formula._postfixRegExp = null;
