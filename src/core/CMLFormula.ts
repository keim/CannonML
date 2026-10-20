import type { Fiber } from "../CMLFiber.js"
import type { Global } from "./CMLGlobal.js"
import { FormulaLiteral } from "./CMLFormulaLiteral.js"
import { FormulaOperator, type FormulaNode } from "./CMLFormulaOperator.js"

//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private statemant for formula calculation */
export class Formula {
    // functions
    //------------------------------------------------------------
    isStatic: boolean
    answerCount: number
    _rootOperator: FormulaNode | null
    _stacOperator: FormulaOperator[]
    _stacOperand: FormulaNode[]
    constructor() {
        this.isStatic = true;
        this.answerCount = 0;
        this._rootOperator = null;
        this._stacOperator = [];
        this._stacOperand = [];
    }
    // Initialize all statics (call from CML.Parser._createCMLRegExp())
    static _createOperandRegExpString(literalRegExpString: string): string {
        let rex = "(" + FormulaOperator.prefix_rex + "+)?";
        rex += literalRegExpString + "?";
        rex += "(" + FormulaOperator.postfix_rex + "+)?";
        return rex;
    }
    // initialize
    static _initialize(globalVariables_: Global) {
        Formula._globalVariables = globalVariables_;
        Formula._prefixRegExp = new RegExp(FormulaOperator.prefix_rex, 'g');
        Formula._postfixRegExp = new RegExp(FormulaOperator.postfix_rex, 'g');
    }
    // [override] 
    _setCommand(_cmd: unknown) {
        return this;
    }
    // function to create formula structure
    //------------------------------------------------------------
    // push operator stac
    pushOperator(oprator: string | undefined, oprcnt: number): boolean {
        if (!oprator)
            return false;
        const ope = new FormulaOperator(oprator, oprcnt);
        while (this._stacOperator.length > 0 && this._stacOperator[0].priorL > ope.priorR) {
            const oprcnt = this._stacOperator[0].oprcnt;
            if (this._stacOperand.length < oprcnt)
                return false;
            this._stacOperator[0].opr1 = (oprcnt > 1) ? (this._stacOperand.shift()!) : (null);
            this._stacOperator[0].opr0 = (oprcnt > 0) ? (this._stacOperand.shift()!) : (null);
            this._stacOperand.unshift(this._stacOperator.shift()!);
        }
        // closed by ()
        if (this._stacOperator.length > 0 && this._stacOperator[0].priorR == 99 && ope.priorL == 99)
            this._stacOperator.shift();
        else
            this._stacOperator.unshift(ope);
        return true;
    }
    // push operand stac
    pushLiteral(literal: string | undefined): boolean | number {
        return (literal) ? this._stacOperand.unshift(new FormulaLiteral(literal)) : true;
    }
    // push prefix
    pushPrefix(prefix: string | undefined): boolean {
        return (prefix) ? this._parse_and_push(Formula._prefixRegExp, prefix) : true;
    }
    // push postfix
    pushPostfix(postfix: string | undefined): boolean {
        return (postfix) ? this._parse_and_push(Formula._postfixRegExp, postfix) : true;
    }
    // call from pushPostfix and pushPrefix.
    _parse_and_push(rex: RegExp, str: string): boolean {
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
            this._stacOperator[0].opr1 = (oprcnt > 1) ? (this._stacOperand.shift()!) : (null);
            this._stacOperator[0].opr0 = (oprcnt > 0) ? (this._stacOperand.shift()!) : (null);
            this._stacOperand.unshift(this._stacOperator.shift()!);
        }
        // success when operand stac has only one member
        if (this._stacOperand.length == 1)
            this._rootOperator = this._stacOperand.shift()!;
        return Boolean(this._rootOperator);
    }
    // calculation
    //------------------------------------------------------------
    calcStatic(): number[] | null {
        if (!this._rootOperator) 
            return null;
        this.isStatic = this._rootOperator.isStatic;
        const answers: number[] = [];
        if (this.isStatic) {
            answers.push(this._rootOperator.calcStatic(answers));
            this.answerCount = answers.length;
        }
        return answers;
    }
    calcDynamic(fbr: Fiber): number[] {
        const answers: number[] = [];
        answers.push(this._rootOperator!.calcDynamic(answers, fbr));
        return answers;
    }

    static _globalVariables: Global = null!;
    static _prefixRegExp: RegExp = null!;
    static _postfixRegExp: RegExp = null!;

}