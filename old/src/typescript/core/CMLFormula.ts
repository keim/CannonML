//----------------------------------------------------------------------------------------------------
// CML statement class for formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLState from "./CMLState";
import CMLGlobal from "./CMLGlobal";
import CMLFormulaElem from "./CMLFormulaElem";
import CMLFormulaLiteral from "./CMLFormulaLiteral";
import CMLFormulaOperator from "./CMLFormulaOperator";


/** @private statemant for formula calculation */
export default class CMLFormula extends CMLState
{
// variables
//------------------------------------------------------------
    private _arg_index:number = 0;
    private _form:CMLFormulaElem = null;
    public max_reference:number = 0;
    private static stacOperator:any[] = new Array();
    private static stacOperand :any[] = new Array();

    private static _prefixRegExp:RegExp = null;
    private static _postfixRegExp:RegExp = null;

    // Initialize all statics (call from CMLParser._createCMLRegExp())
    public static _createOperandRegExpString(literalRegExpString:string) : string
    {
        var rex:string;
        rex  = "(" + CMLFormulaOperator.prefix_rex + "+)?"
        rex += literalRegExpString + "?";
        rex += "(" + CMLFormulaOperator.postfix_rex + "+)?";
        return rex;
    }
    
    
    // initialize
    public static _initialize(globalVariables_:CMLGlobal) : void
    {
        CMLFormulaElem._globalVariables = globalVariables_;
        CMLFormula._prefixRegExp  = new RegExp(CMLFormulaOperator.prefix_rex, 'g');
        CMLFormula._postfixRegExp = new RegExp(CMLFormulaOperator.postfix_rex, 'g');
    }




    
// functions
//------------------------------------------------------------
    constructor(state:CMLState, pnfa:boolean)
    {
        super(CMLState.ST_FORMULA);
        
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
        } else {
            CMLFormula.stacOperand.length = 0;
        }
    }

    
    /*override*/ protected _setCommand(cmd:string) : CMLState
    {
        return this;
    }


    
    
// function to create formula structure
//------------------------------------------------------------
    // push operator stac
    public pushOperator(oprator:any, isSingle:boolean) : boolean
    {
        if (oprator == undefined) return false;
        var ope:CMLFormulaOperator = new CMLFormulaOperator(oprator, isSingle);
        while (CMLFormula.stacOperator.length > 0 && (<CMLFormulaOperator>CMLFormula.stacOperator[0]).priorL > ope.priorR) {
            var oprcnt:number = (<CMLFormulaOperator>CMLFormula.stacOperator[0]).oprcnt;
            if (CMLFormula.stacOperand.length < oprcnt) return false;
            (<CMLFormulaOperator>CMLFormula.stacOperator[0]).opr1 = (oprcnt > 1) ? (CMLFormula.stacOperand.shift()) : (null);
            (<CMLFormulaOperator>CMLFormula.stacOperator[0]).opr0 = (oprcnt > 0) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperand.unshift(CMLFormula.stacOperator.shift());
        }
        
        // closed by ()
        if (CMLFormula.stacOperator.length>0 && (<CMLFormulaOperator>CMLFormula.stacOperator[0]).priorL==1 && ope.priorR==1) CMLFormula.stacOperator.shift();
        else CMLFormula.stacOperator.unshift(ope);
        return true;
    }
    
    
    // push operand stac
    public pushLiteral(literal:any) : void
    {
        if (literal == undefined) return;
        var lit:CMLFormulaLiteral = new CMLFormulaLiteral();
        var ret:number = lit.parseLiteral(literal);
        if (this.max_reference < ret) this.max_reference = ret;
        CMLFormula.stacOperand.unshift(lit);
    }

    
    // push prefix
    public pushPrefix(prefix:any, isSingle:boolean) : boolean
    {
        return (prefix != undefined) ? this._parse_and_push(CMLFormula._prefixRegExp, prefix, isSingle) : true;
    }

    
    // push postfix
    public pushPostfix(postfix:any, isSingle:boolean) : boolean
    {
        return (postfix != undefined) ? this._parse_and_push(CMLFormula._postfixRegExp, postfix, isSingle) : true;
    }
    
    
    // call from pushPostfix and pushPrefix.
    private _parse_and_push(rex:RegExp, str:string, isSingle:boolean) : boolean
    {
        rex.lastIndex = 0;
        var res:any = rex.exec(str);
        while (res != null) {
            if (!this.pushOperator(res[1], isSingle)) return false;
            res = rex.exec(str);
        }
        return true;
    }

    
    // construct formula structure
    public construct() : boolean
    {
        while (CMLFormula.stacOperator.length > 0) {
            var oprcnt:number = (<CMLFormulaOperator>CMLFormula.stacOperator[0]).oprcnt;
            if (CMLFormula.stacOperand.length < oprcnt) return false;
            (<CMLFormulaOperator>CMLFormula.stacOperator[0]).opr1 = (oprcnt > 1) ? (CMLFormula.stacOperand.shift()) : (null);
            (<CMLFormulaOperator>CMLFormula.stacOperator[0]).opr0 = (oprcnt > 0) ? (CMLFormula.stacOperand.shift()) : (null);
            CMLFormula.stacOperand.unshift(CMLFormula.stacOperator.shift());
        }
        if (CMLFormula.stacOperand.length==1) this._form=CMLFormula.stacOperand.shift();
        return (this._form != null);
    }

    
    

// calculation
//------------------------------------------------------------
    private _calc(fbr:CMLFiber) : boolean
    {
        this.jump._args[this._arg_index] = this._form.calc(fbr);
        return true;
    }
}

