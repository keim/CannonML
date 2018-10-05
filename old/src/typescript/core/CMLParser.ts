//----------------------------------------------------------------------------------------------------
// CML parser class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLSequence from "../CMLSequence";
import CMLList from "./CMLList";
import CMLState from "./CMLState";
import CMLRefer from "./CMLRefer";
import CMLGlobal from "./CMLGlobal";
import CMLAssign from "./CMLAssign";
import CMLString from "./CMLString";
import CMLFormula from "./CMLFormula";
import CMLUserDefine from "./CMLUserDefine";
import CMLFormulaElem from "./CMLFormulaElem";
import CMLFormulaLiteral from "./CMLFormulaLiteral";


/** @private */
export default class CMLParser
{
// variables
//------------------------------------------------------------
    private listState:CMLList = new CMLList();       // statement chain
    private loopstac :any[] = new Array();           // loop stac
    private childstac:any[] = new Array();           // child cast "{}" stac
    private cmdKey :string   = "";                   // current parsing key
    private cmdTemp:CMLState = null;                 // current parsing statement
    private fmlTemp:CMLFormula = null;               // current parsing formula

    private _globalVariables:CMLGlobal = null;

    // functor for allocate CMLState instance.
    public newCMLState:Function = function():CMLState { return new CMLState(); }
    
    

// constructor
//------------------------------------------------------------
    // constructor
    constructor(globalVariables_:CMLGlobal)
    {
        this._globalVariables = globalVariables_;
        CMLFormula._initialize(globalVariables_);
    }




// parsing
//------------------------------------------------------------
    public _parse(seq:CMLSequence, cml_string:string) : void
    {
        // create regular expression
        var regexp:RegExp = this._createCMLRegExp();
        
        // parsing
        try {
            // initialize
            this._initialize(seq);
        
            // execute first matching
            var res:any = regexp.exec(cml_string);
            
            while (res != null) {
//trace(res);
                if (!this._parseFormula(res)) {              // parse fomula first
                    this._append();                          // append previous formula and statement
                    // check the result of matching
                    if (!this._parseStatement(res))          // new normal statement
                    if (!this._parseLabelDefine(res))        // labeled sequence definition
                    if (!this._parseNonLabelDefine(res))     // non-labeled sequence definition
                    if (!this._parsePreviousReference(res))  // previous reference
                    if (!this._parseCallSequence(res))       // call sequence
                    if (!this._parseAssign(res))             // assign 
                    if (!this._parseUserDefined(res))        // user define statement
                    if (!this._parseComment(res))            // comment
                    if (!this._parseString(res))             // string
                    {
                        // command is not defined
                        if (res[this.REX_ERROR] != undefined) {
                            throw Error(res[this.REX_ERROR]+" ?");
                        } else {
                            throw Error("BUG!! unknown error in this._parse()");
                        }
                    }
                }
                
                // execute next matching
                res = regexp.exec(cml_string);
            }
            
            // throw error when stacs are still remain.
            if (this.loopstac.length  != 0) throw Error("[[...] ?");
            if (this.childstac.length != 1) throw Error("{{...} ?");
            
            this._append();     // append last statement
            this._terminate();  // terminate the tail of sequence

            seq.verify();  // verification
        }
        
        catch (err) {
            this.listState.cut(this.listState.head, this.listState.tail);
            seq.clear();
            throw err;
        }
    }




// parsing subroutines
//------------------------------------------------------------
    private _initialize(seq_:CMLSequence) : void
    {
        this.listState.clear();
        this.listState.push(seq_);
        this.loopstac.length = 0;
        this.childstac.length = 0;
        this.childstac.unshift(seq_);
        this.cmdKey = "";
        this.cmdTemp = null;
        this.fmlTemp = null;
    }


    private _append() : void
    {
        // append previous statement and formula
        if (this.cmdTemp != null) {
            this._append_formula(this.fmlTemp);
            this._append_statement(this.cmdTemp.setCommand(this.cmdKey));
            this.fmlTemp = null;
        }
        // reset
        this.cmdKey = "";
        this.cmdTemp = null;
    }


    private _terminate() : void
    {
        var terminator:CMLState = new CMLState(CMLState.ST_END);
        this._append_statement(terminator);
        this.listState.cut(this.listState.head, this.listState.tail);
    }
        
    
    private _parseFormula(res:any) : boolean
    {
        if (res[this.REX_FORMULA] == undefined) return false;

        // formula, argument, ","
        if (this.cmdTemp == null) throw Error("in formula " + res[this.REX_FORMULA]);
        if (res[this.REX_FORMULA] == ",") {
            this._append_formula(this.fmlTemp);                       // append old formula
            this.fmlTemp = this._check_argument(this.cmdTemp, res, true);  // push new argument
        } else { // + - * / % ( )
            if (this.fmlTemp == null) this.fmlTemp = new CMLFormula(this.cmdTemp, true);   // new formula
            if (!this.fmlTemp.pushOperator(res[this.REX_FORMULA], false)) throw Error("in formula " + res[1]);
            this.fmlTemp.pushPrefix (res[this.REX_ARG_PREFIX], true);
            this.fmlTemp.pushLiteral(res[this.REX_ARG_LITERAL]);
            this.fmlTemp.pushPostfix(res[this.REX_ARG_POSTFIX], true);
        }
        return true;
    }

    private _parseStatement(res:any) : boolean
    {
        if (res[this.REX_NORMAL] == undefined) return false;
        
        this.cmdKey = res[this.REX_NORMAL];           // command key
        this.cmdTemp = this.newCMLState();            // new command
        
        // individual operations
        switch (this.cmdKey) {
        case "[": 
        case "[?":
        case "[s?":
            this.loopstac.push(this.cmdTemp);         // push loop stac
            break;
        case ":":
            this.cmdTemp.jump = this.loopstac.pop();  // pop loop stac
            this.cmdTemp.jump.jump = this.cmdTemp;    // create jump chain
            this.loopstac.push(this.cmdTemp);         // push new loop stac
            break;
        case "]":
            if (this.loopstac.length == 0) throw Error("[...]] ?");
            this.cmdTemp.jump = this.loopstac.pop();  // pop loop stac
            this.cmdTemp.jump.jump = this.cmdTemp;    // create jump chain
            break;
        case "}":
            if (this.childstac.length <= 1) throw Error("{...}} ?");
            this._append_statement(this.cmdTemp.setCommand(this.cmdKey));
            var seq:CMLState = this._cut_sequence(this.childstac.shift(), this.cmdTemp);
            this.cmdKey = "";
            // non-labeled sequence is exchenged into reference
            this.cmdTemp = (seq.type == CMLState.ST_NO_LABEL) ? this._new_reference(seq, null) : null;
            break;
        }

        // push new argument
        if (this.cmdTemp != null) {
            this.fmlTemp = this._check_argument(this.cmdTemp, res);
        }
    
        return true;
    }

    private _parseLabelDefine(res:any) : boolean
    {
        if (res[this.REX_LABELDEF] == undefined) return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], res[this.REX_LABELDEF]);   // new sequence with label
        this.fmlTemp = this._check_argument(this.cmdTemp, res);                    // push new argument
        this.childstac.unshift(this.cmdTemp);                                 // push child stac
        return true;
    }

    private _parseNonLabelDefine(res:any) : boolean
    {
        if (res[this.REX_NONLABELDEF] == undefined) return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], null);        // new sequence without label
        this.fmlTemp = this._check_argument(this.cmdTemp, res);            // push new argument
        this.childstac.unshift(this.cmdTemp);                         // push child stac
        return true;
    }

    private _parsePreviousReference(res:any) : boolean
    {
        if (res[this.REX_PREVREFER] == undefined) return false;
        this.cmdTemp = this._new_reference(null, null);               // new reference command
        this.fmlTemp = this._check_argument(this.cmdTemp, res);            // push new argument
        return true;
    }

    private _parseCallSequence(res:any) : boolean
    {
        if (res[this.REX_CALLSEQ] == undefined) return false;
        this.cmdTemp = this._new_reference(null, res[this.REX_CALLSEQ]);   // new reference command
        this.fmlTemp = this._check_argument(this.cmdTemp, res);            // push new argument
        return true;
    }

    private _parseAssign(res:any) : boolean
    {
        if (res[this.REX_ASSIGN] == undefined) return false;
        this.cmdTemp = this._new_assign(res[this.REX_ASSIGN]);             // new command
        this.fmlTemp = this._check_argument(this.cmdTemp, res);            // push new argument
        return true;
    }

    private _parseUserDefined(res:any) : boolean
    {
        if (res[this.REX_USERDEF] == undefined) return false;
        this.cmdTemp = this._new_user_defined(res[this.REX_USERDEF]);      // new command
        this.fmlTemp = this._check_argument(this.cmdTemp, res);            // push new arguments
        return true;
    }

    private _parseString(res:any) : boolean
    {
        if (res[this.REX_STRING] == undefined) return false;
        this.cmdTemp = new CMLString(res[this.REX_STRING]);       // new string
        return true;
    }

    private _parseComment(res:any) : boolean
    {
        if (res[this.REX_COMMENT] == undefined) return false;
        return true;
    }



// private functions
//------------------------------------------------------------
    // regular expression indexes
    private REX_COMMENT:number     = 1;  // comment
    private REX_STRING:number      = 2;  // string
    private REX_FORMULA:number     = 5;  // formula and arguments
    private REX_USERDEF:number     = 6;  // user define commands
    private REX_NORMAL:number      = 7;  // normal commands
    private REX_ASSIGN:number      = 8;  // assign
    private REX_CALLSEQ:number     = 9;  // call sequence
    private REX_PREVREFER:number   = 10; // previous reference
    private REX_LABELDEF:number    = 11; // labeled sequence definition
    private REX_NONLABELDEF:number = 12; // non-labeled sequence definition
    private REX_ARG_PREFIX:number  = 13; // argument prefix
    private REX_ARG_LITERAL:number = 15; // argument literal
    private REX_ARG_POSTFIX:number = 17; // argument postfix
    private REX_ERROR:number       = 19; // error

    private _regexp:RegExp = null;                   // regular expression


    // create regular expression once
    private _createCMLRegExp() : RegExp
    {
        if (this._globalVariables._requestUpdateRegExp) {
            var literalRegExpString:string = "(0x[0-9a-f]{1,8}|\\d+\\.?\\d*|\\$(\\?\\?|\\?|" + this._userReferenceRegExp + ")[0-9]?)";
            var operandRegExpString:string = CMLFormula._createOperandRegExpString(literalRegExpString);
            // oonstruct regexp string
            var rexstr:string = "(//[^\\n]*$|/\\*.*?\\*/)";     // comment (res[1])
            rexstr += "|'(.*?)'";                               // string (res[2])
            rexstr += "|(("                                     // ---all--- (res[3,4])
            rexstr += "(,|\\+|-|\\*|/|%|==|!=|>=|<=|>|<)";      // formula and arguments (res[5])
            rexstr += "|&(" + this._userCommandRegExp + ")";    // user define commands (res[6])
            rexstr += "|" + CMLState.command_rex;               // normal commands (res[7])
            rexstr += "|" + CMLAssign.assign_rex;               // assign (res[8])
            rexstr += "|([A-Z_.][A-Z0-9_.]*)";                  // call sequence (res[9])
            rexstr += "|(\\{\\.\\})";                           // previous reference (res[10])
            rexstr += "|#([A-Z_][A-Z0-9_]*)[ \t]*\\{";          // labeled sequence definition (res[11])
            rexstr += "|(\\{)";                                 // non-labeled sequence definition (res[12])
            rexstr += ")[ \t]*" + operandRegExpString + ")";    // argument(res[13,14];prefix, res[15,16];literal, res[17,18];postfix)
            rexstr += "|([a-z]+)";                              // error (res[19])
            this._regexp = new RegExp(rexstr, "gm");            // "s" optoin not available on javascript
            this._globalVariables._requestUpdateRegExp = false;
        }
                
        this._regexp.lastIndex = 0;
        return this._regexp;
    }
 
    
    
    // append new command
    private _append_statement(state:CMLState) : void
    {
        this.listState.push(state);
    }

    
    // append new formula
    private _append_formula(fml:CMLFormula) : void
    {
        if (fml != null) {
            if (!fml.construct()) throw Error("in formula");
            this.listState.push(fml);
            this._update_max_reference(fml.max_reference);
        }
    }


    // cut sequence from the list
    private _cut_sequence(start:CMLState, end:CMLState) : CMLState
    {
        this.listState.cut(start, end);
        end.jump = start;
        return start;
    }
    
    
    // create new sequence
    private _new_sequence(parent:CMLSequence, label:string) : CMLSequence
    {
        return parent.newChildSequence(label);
    }
            
    
    // create new reference
    // (null,   null) means previous call "{.}"
    // (define, null) means non-labeled call "{...}"
    // (null, define) means label call "ABC"
    private _new_reference(seq:CMLState, name:string) : CMLState
    {   
        // append "@" command, when previous command isn't STF_CALLREF.
        if (((<CMLState>this.listState.tail).type & CMLState.STF_CALLREF) == 0) {
            this._append_statement((new CMLState()).setCommand("@"));
        }
        // create reference
        return new CMLRefer(seq, name);
    }

    
    // create new user defined command
    private _new_user_defined(str:string) : CMLUserDefine
    {
        if (!(str in this._globalVariables._mapUsrDefCmd)) throw Error("&"+str+" ?");  // not defined
        return new CMLUserDefine(this._globalVariables._mapUsrDefCmd[str]);
    }
    
            
    // create new assign command
    private _new_assign(str:string) : CMLAssign
    {
        var asg:CMLAssign = new CMLAssign(str);
        this._update_max_reference(asg.max_reference);
        return asg;
    }
    

    // check and update max reference of sequence
    private _update_max_reference(max_reference:number) : void
    {
        if ((<CMLSequence>this.childstac[0]).require_argc < max_reference) {
            (<CMLSequence>this.childstac[0]).require_argc = max_reference;
        }
    }
    

    // set arguments 
    private _check_argument(state:CMLState, res:any, isComma:boolean=false) : CMLFormula
    {
        var prefix:any  = res[this.REX_ARG_PREFIX];
        var literal:any = res[this.REX_ARG_LITERAL];
        var postfix:any = res[this.REX_ARG_POSTFIX];
        
        // push 0 before ","
        if (isComma && state._args.length==0) state._args.push(Number.NaN);

        // push argument
        var fml:CMLFormula = null;
        if (literal != undefined) {
            // set number when this argument is constant value
            if (literal.charAt(0) != "$") {
                if (postfix == undefined) {
                    if      (prefix == undefined) { state._args.push(Number(literal));    return null; } 
                    else if (prefix == "-")       { state._args.push(-(Number(literal))); return null; }
                } else 
                if (postfix == ")") {
                    if      (prefix == "(")  { state._args.push(Number(literal));    return null; }
                    else if (prefix == "-(") { state._args.push(-(Number(literal))); return null; }
                }
            }

            // set formula when this argument is variable
            state._args.push(0);
            fml = new CMLFormula(state, false);
            fml.pushPrefix (prefix, true);
            fml.pushLiteral(literal);
            fml.pushPostfix(postfix, true);
        } else {
            // push NaN when there are no arguments in "," command
            if (isComma) state._args.push(Number.NaN);
        }
        
        return fml;
    }

    
    // regular expression string of user command. call from _createCMLRegExp()
    private get _userCommandRegExp() : string
    {
        var cmdlist:any[] = new Array(), cmd:string;
        for (cmd in this._globalVariables._mapUsrDefCmd) { cmdlist.push(cmd); }
        return cmdlist.sort(function(a,b){
            return ( a > b ) ? -1 : ( a < b ) ? 1 : 0;
        }).join('|');
    }


    // regular expression string of user command. call from CMLFormula
    private get _userReferenceRegExp() : string
    {
        var reflist:any[] = new Array(), ref:string;
        for (ref in this._globalVariables._mapUsrDefRef) { reflist.push(ref); }
        return reflist.concat(CMLFormulaLiteral.defaultReferences).sort(function(a,b){
            return ( a > b ) ? -1 : ( a < b ) ? 1 : 0;
        }).join('|').replace(/\./g, '\\.');
    }
}


