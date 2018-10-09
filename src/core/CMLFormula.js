//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLState from "./CMLState.js";
import CMLFormulaElem from "./CMLFormulaElem.js";
import CMLFormulaLiteral from "./CMLFormulaLiteral.js";
import CMLFormulaOperator from "./CMLFormulaOperator.js";
/** @private statemant for formula calculation */
export default class CMLFormula extends CMLState {
    // functions
    //------------------------------------------------------------
    constructor(state, pnfa) {
        super(CMLState.ST_FORMULA);
        // variables
        //------------------------------------------------------------
        this._arg_index = 0;
        this._form = null;
        this.max_reference = 0;
        this.jump = state;
        this.func = this._calc;
        this._arg_index = state._args.length - 1;
        CMLFormula.stacOperator.length = 0;
        this.max_reference = 0;
        // Pickup Number From Argument ?
        if (pnfa) {
            CMLFormula.stacOperand.length = 1;
            CMLFormula.stacOperand[0] = new CMLFormulaLiteral();
            CMLFormula.stacOperand[0].num = state._args[this._arg_index];
        }
        else {
            CMLFormula.stacOperand.length = 0;
        }
    }
    // Initialize all statics (call from CMLParser._createCMLRegExp())
    static _createOperandRegExpString(literalRegExpString) {
        var rex;
        rex = "(" + CMLFormulaOperator.prefix_rex + "+)?";
        rex += literalRegExpString + "?";
        rex += "(" + CMLFormulaOperator.postfix_rex + "+)?";
        return rex;
    }
    // initialize
    static _initialize(globalVariables_) {
        CMLFormulaElem._globalVariables = globalVariables_;
        CMLFormula._prefixRegExp = new RegExp(CMLFormulaOperator.prefix_rex, 'g');
        CMLFormula._postfixRegExp = new RegExp(CMLFormulaOperator.postfix_rex, 'g');
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
        var ope = new CMLFormulaOperator(oprator, isSingle);
        while (CMLFormula.stacOperator.length > 0 && CMLFormula.stacOperator[0].priorL > ope.priorR) {
            var oprcnt = CMLFormula.stacOperator[0].oprcnt;
            if (CMLFormula.stacOperand.length < oprcnt)
                return false;
            CMLFormula.stacOperator[0].opr1 = (oprcnt > 1) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperator[0].opr0 = (oprcnt > 0) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperand.unshift(CMLFormula.stacOperator.shift());
        }
        // closed by ()
        if (CMLFormula.stacOperator.length > 0 && CMLFormula.stacOperator[0].priorL == 1 && ope.priorR == 1)
            CMLFormula.stacOperator.shift();
        else
            CMLFormula.stacOperator.unshift(ope);
        return true;
    }
    // push operand stac
    pushLiteral(literal) {
        if (literal == undefined)
            return;
        var lit = new CMLFormulaLiteral();
        var ret = lit.parseLiteral(literal);
        if (this.max_reference < ret)
            this.max_reference = ret;
        CMLFormula.stacOperand.unshift(lit);
    }
    // push prefix
    pushPrefix(prefix, isSingle) {
        return (prefix != undefined) ? this._parse_and_push(CMLFormula._prefixRegExp, prefix, isSingle) : true;
    }
    // push postfix
    pushPostfix(postfix, isSingle) {
        return (postfix != undefined) ? this._parse_and_push(CMLFormula._postfixRegExp, postfix, isSingle) : true;
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
        while (CMLFormula.stacOperator.length > 0) {
            var oprcnt = CMLFormula.stacOperator[0].oprcnt;
            if (CMLFormula.stacOperand.length < oprcnt)
                return false;
            CMLFormula.stacOperator[0].opr1 = (oprcnt > 1) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperator[0].opr0 = (oprcnt > 0) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperand.unshift(CMLFormula.stacOperator.shift());
        }
        if (CMLFormula.stacOperand.length == 1)
            this._form = CMLFormula.stacOperand.shift();
        return (this._form != null);
    }
    // calculation
    //------------------------------------------------------------
    _calc(fbr) {
        this.jump._args[this._arg_index] = this._form.calc(fbr);
        return true;
    }
}
CMLFormula.stacOperator = new Array();
CMLFormula.stacOperand = new Array();
CMLFormula._prefixRegExp = null;
CMLFormula._postfixRegExp = null;
