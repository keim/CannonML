//----------------------------------------------------------------------------------------------------
// CML parser class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLSequence;
    import org.si.cml.namespaces._cml_internal;
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
    /** @private */
    public class CMLParser
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        use namespace _cml_fiber_internal;
        
        
        
        
    // variables
    //------------------------------------------------------------
        static private var mapUsrDefRef:Object = new Object();      // user defined reference
        static private var mapUsrDefCmd:Object = new Object();      // user defined command

        static private var listState:CMLList = new CMLList();       // statement chain
        static private var loopstac :Array = new Array();           // loop stac
        static private var childstac:Array = new Array();           // child cast "{}" stac
        static private var cmdKey :String   = "";                   // current parsing key
        static private var cmdTemp:CMLState = null;                 // current parsing statement
        static private var fmlTemp:CMLFormula = null;               // current parsing formula

        // functor for allocate CMLState instance.
        static internal var newCMLState:Function = function():CMLState { return new CMLState(); }
        
        

    // constructor
    //------------------------------------------------------------
        // constructor
        function CMLParser()
        {
        }




    // operations
    //------------------------------------------------------------
        // set user define getter
        static _cml_internal function userReference(name:String, func:Function) : void
        {
            mapUsrDefRef[name] = func;
        }


        // set user define setter
        static _cml_internal function userCommand(name:String, func:Function, argc:int, requireSequence:Boolean) : void
        {
            mapUsrDefCmd[name] = {func:func, argc:argc, reqseq:requireSequence};
        }




    // parsing
    //------------------------------------------------------------
        static _cml_internal function _parse(seq:CMLSequence, cml_string:String) : void
        {
            // create regular expression
            var regexp:RegExp = _createCMLRegExp();
            
            // parsing
            try {
                // initialize
                _initialize(seq);
            
                // execute first matching
                var res:Object = regexp.exec(cml_string);
                
                while (res != null) {
//trace(res);
                    if (!_parseFormula(res)) {              // parse fomula first
                        _append();                          // append previous formula and statement
                        // check the result of matching
                        if (!_parseStatement(res))          // new normal statement
                        if (!_parseLabelDefine(res))        // labeled sequence definition
                        if (!_parseNonLabelDefine(res))     // non-labeled sequence definition
                        if (!_parsePreviousReference(res))  // previous reference
                        if (!_parseCallSequence(res))       // call sequence
                        if (!_parseAssign(res))             // assign 
                        if (!_parseUserDefined(res))        // user define statement
                        if (!_parseComment(res))            // comment
                        if (!_parseString(res))             // string
                        {
                            // command is not defined
                            if (res[REX_ERROR] != undefined) {
                                throw Error(res[REX_ERROR]+" ?");
                            } else {
                                throw Error("BUG!! unknown error in CMLParser._parse()");
                            }
                        }
                    }
                    
                    // execute next matching
                    res = regexp.exec(cml_string);
                }
                
                // throw error when stacs are still remain.
                if (loopstac.length  != 0) throw Error("[[...] ?");
                if (childstac.length != 1) throw Error("{{...} ?");
                
                _append();     // append last statement
                _terminate();  // terminate the tail of sequence

                seq.verify();  // verification
            }
            
            catch (err:Error) {
                listState.cut(listState.head, listState.tail);
                seq.clear();
                throw err;
            }
        }




    // parsing subroutines
    //------------------------------------------------------------
        static private function _initialize(seq_:CMLSequence) : void
        {
            listState.clear();
            listState.push(seq_);
            loopstac.length = 0;
            childstac.length = 0;
            childstac.unshift(seq_);
            cmdKey = "";
            cmdTemp = null;
            fmlTemp = null;
        }


        static private function _append() : void
        {
            // append previous statement and formula
            if (cmdTemp != null) {
                _append_formula(fmlTemp);
                _append_statement(cmdTemp.setCommand(cmdKey));
                fmlTemp = null;
            }
            // reset
            cmdKey = "";
            cmdTemp = null;
        }


        static private function _terminate() : void
        {
            var terminator:CMLState = new CMLState(CMLState.ST_END);
            _append_statement(terminator);
            listState.cut(listState.head, listState.tail);
        }
            
        
        static private function _parseFormula(res:*) : Boolean
        {
            if (res[REX_FORMULA] == undefined) return false;

            // formula, argument, ","
            if (cmdTemp == null) throw Error("in formula " + res[REX_FORMULA]);
            if (res[REX_FORMULA] == ",") {
                _append_formula(fmlTemp);                       // append old formula
                fmlTemp = _check_argument(cmdTemp, res, true);  // push new argument
            } else { // + - * / % ( )
                if (fmlTemp == null) fmlTemp = new CMLFormula(cmdTemp, true);   // new formula
                if (!fmlTemp.pushOperator(res[REX_FORMULA], false)) throw Error("in formula " + res[1]);
                fmlTemp.pushPrefix (res[REX_ARG_PREFIX], true);
                fmlTemp.pushLiteral(res[REX_ARG_LITERAL]);
                fmlTemp.pushPostfix(res[REX_ARG_POSTFIX], true);
            }
            return true;
        }
    
        static private function _parseStatement(res:*) : Boolean
        {
            if (res[REX_NORMAL] == undefined) return false;
            
            cmdKey = res[REX_NORMAL];           // command key
            cmdTemp = newCMLState();            // new command
            
            // individual operations
            switch (cmdKey) {
            case "[": 
            case "[?":
            case "[s?":
                loopstac.push(cmdTemp);         // push loop stac
                break;
            case ":":
                cmdTemp.jump = loopstac.pop();  // pop loop stac
                cmdTemp.jump.jump = cmdTemp;    // create jump chain
                loopstac.push(cmdTemp);         // push new loop stac
                break;
            case "]":
                if (loopstac.length == 0) throw Error("[...]] ?");
                cmdTemp.jump = loopstac.pop();  // pop loop stac
                cmdTemp.jump.jump = cmdTemp;    // create jump chain
                break;
            case "}":
                if (childstac.length <= 1) throw Error("{...}} ?");
                _append_statement(cmdTemp.setCommand(cmdKey));
                var seq:CMLState = _cut_sequence(childstac.shift(), cmdTemp);
                cmdKey = "";
                // non-labeled sequence is exchenged into reference
                cmdTemp = (seq.type == CMLState.ST_NO_LABEL) ? _new_reference(seq, null) : null;
                break;
            }

            // push new argument
            if (cmdTemp != null) {
                fmlTemp = _check_argument(cmdTemp, res);
            }
        
            return true;
        }

        static private function _parseLabelDefine(res:*) : Boolean
        {
            if (res[REX_LABELDEF] == undefined) return false;
            cmdTemp = _new_sequence(childstac[0], res[REX_LABELDEF]);   // new sequence with label
            fmlTemp = _check_argument(cmdTemp, res);                    // push new argument
            childstac.unshift(cmdTemp);                                 // push child stac
            return true;
        }

        static private function _parseNonLabelDefine(res:*) : Boolean
        {
            if (res[REX_NONLABELDEF] == undefined) return false;
            cmdTemp = _new_sequence(childstac[0], null);        // new sequence without label
            fmlTemp = _check_argument(cmdTemp, res);            // push new argument
            childstac.unshift(cmdTemp);                         // push child stac
            return true;
        }

        static private function _parsePreviousReference(res:*) : Boolean
        {
            if (res[REX_PREVREFER] == undefined) return false;
            cmdTemp = _new_reference(null, null);               // new reference command
            fmlTemp = _check_argument(cmdTemp, res);            // push new argument
            return true;
        }

        static private function _parseCallSequence(res:*) : Boolean
        {
            if (res[REX_CALLSEQ] == undefined) return false;
            cmdTemp = _new_reference(null, res[REX_CALLSEQ]);   // new reference command
            fmlTemp = _check_argument(cmdTemp, res);            // push new argument
            return true;
        }
    
        static private function _parseAssign(res:*) : Boolean
        {
            if (res[REX_ASSIGN] == undefined) return false;
            cmdTemp = _new_assign(res[REX_ASSIGN]);             // new command
            fmlTemp = _check_argument(cmdTemp, res);            // push new argument
            return true;
        }

        static private function _parseUserDefined(res:*) : Boolean
        {
            if (res[REX_USERDEF] == undefined) return false;
            cmdTemp = _new_user_defined(res[REX_USERDEF]);      // new command
            fmlTemp = _check_argument(cmdTemp, res);            // push new arguments
            return true;
        }

        static private function _parseString(res:*) : Boolean
        {
            if (res[REX_STRING] == undefined) return false;
            cmdTemp = new CMLString(res[REX_STRING]);       // new string
            return true;
        }

        static private function _parseComment(res:*) : Boolean
        {
            if (res[REX_COMMENT] == undefined) return false;
            return true;
        }



    // private functions
    //------------------------------------------------------------
        // regular expression indexes
        static private const REX_COMMENT:uint     = 1;  // comment
        static private const REX_STRING:uint      = 2;  // string
        static private const REX_FORMULA:uint     = 5;  // formula and arguments
        static private const REX_USERDEF:uint     = 6;  // user define commands
        static private const REX_NORMAL:uint      = 7;  // normal commands
        static private const REX_ASSIGN:uint      = 8;  // assign
        static private const REX_CALLSEQ:uint     = 9;  // call sequence
        static private const REX_PREVREFER:uint   = 10; // previous reference
        static private const REX_LABELDEF:uint    = 11; // labeled sequence definition
        static private const REX_NONLABELDEF:uint = 12; // non-labeled sequence definition
        static private const REX_ARG_PREFIX:uint  = 13; // argument prefix
        static private const REX_ARG_LITERAL:uint = 15; // argument literal
        static private const REX_ARG_POSTFIX:uint = 17; // argument postfix
        static private const REX_ERROR:uint       = 19; // error
    
        static private var _regexp:RegExp = null;                   // regular expression
    
    
        // create regular expression once
        static private function _createCMLRegExp() : RegExp
        {
            if (_regexp == null) {
                var rexstr:String = "(//[^\\n]*$|/\\*.*?\\*/)";     // comment (res[1])
                rexstr += "|'(.*?)'";                               // string (res[2])
                rexstr += "|(("                                     // ---all--- (res[3,4])
                rexstr += "(,|\\+|-|\\*|/|%|==|!=|>=|<=|>|<)";      // formula and arguments (res[5])
                rexstr += "|&(" + _userCommandRegExp + ")";         // user define commands (res[6])
                rexstr += "|" + CMLState.command_rex;               // normal commands (res[7])
                rexstr += "|" + CMLAssign.assign_rex;               // assign (res[8])
                rexstr += "|([A-Z_.][A-Z0-9_.]*)";                  // call sequence (res[9])
                rexstr += "|(\\{\\.\\})";                           // previous reference (res[10])
                rexstr += "|#([A-Z_][A-Z0-9_]*)[ \t]*\\{";          // labeled sequence definition (res[11])
                rexstr += "|(\\{)";                                 // non-labeled sequence definition (res[12])
                rexstr += ")[ \t]*" + CMLFormula.operand_rex + ")"; // argument(res[13,14];prefix, res[15,16];literal, res[17,18];postfix)
                rexstr += "|([a-z]+)";                              // error (res[19])
                _regexp = new RegExp(rexstr, "gms");

                // NOTE: CMLFormula.operand_rex is a property and it initializes CMLFormula.
            }
                    
            _regexp.lastIndex = 0;
            return _regexp;
        }
                
        
        // append new command
        static private function _append_statement(state:CMLState) : void
        {
            listState.push(state);
        }

        
        // append new formula
        static private function _append_formula(fml:CMLFormula) : void
        {
            if (fml != null) {
                if (!fml.construct()) throw Error("in formula");
                listState.push(fml);
                _update_max_reference(fml.max_reference);
            }
        }


        // cut sequence from the list
        static private function _cut_sequence(start:CMLState, end:CMLState) : CMLState
        {
            listState.cut(start, end);
            end.jump = start;
            return start;
        }
        
        
        // create new sequence
        static private function _new_sequence(parent:CMLSequence, label:String) : CMLSequence
        {
            return parent.newChildSequence(label);
        }
                
        
        // create new reference
        // (null,   null) means previous call "{.}"
        // (define, null) means non-labeled call "{...}"
        // (null, define) means label call "ABC"
        static private function _new_reference(seq:CMLState, name:String) : CMLState
        {   
            // append "@" command, when previous command isn't STF_CALLREF.
            if ((CMLState(listState.tail).type & CMLState.STF_CALLREF) == 0) {
                _append_statement((new CMLState()).setCommand("@"));
            }
            // create reference
            return new CMLRefer(seq, name);
        }

        
        // create new user defined command
        static private function _new_user_defined(str:String) : CMLUserDefine
        {
            if (!(str in mapUsrDefCmd)) throw Error("&"+str+" ?");  // not defined
            return new CMLUserDefine(mapUsrDefCmd[str]);
        }
        
                
        // create new assign command
        static private function _new_assign(str:String) : CMLAssign
        {
            var asg:CMLAssign = new CMLAssign(str);
            _update_max_reference(asg.max_reference);
            return asg;
        }
        

        // check and update max reference of sequence
        static private function _update_max_reference(max_reference:int) : void
        {
            if (CMLSequence(childstac[0]).require_argc < max_reference) {
                CMLSequence(childstac[0]).require_argc = max_reference;
            }
        }
        

        // set arguments 
        static private function _check_argument(state:CMLState, res:*, isComma:Boolean=false) : CMLFormula
        {
            var prefix:*  = res[REX_ARG_PREFIX];
            var literal:* = res[REX_ARG_LITERAL];
            var postfix:* = res[REX_ARG_POSTFIX];
            
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
        static private function get _userCommandRegExp() : String
        {
            var cmdlist:Array = new Array();
            for (var cmd:String in mapUsrDefCmd) { cmdlist.push(cmd); }
            return cmdlist.sort(Array.DESCENDING).join('|');
        }


        // regular expression string of user command. call from CMLFormula
        static internal function get _userReferenceRegExp() : String
        {
            var reflist:Array = new Array();
            for (var ref:String in mapUsrDefRef) { reflist.push(ref); }
            return reflist.concat(CMLFormulaLiteral.defaultReferences).sort(Array.DESCENDING).join('|').replace(/\./g, '\\.');
        }


        // call from CMLFormula
        static internal function _getUserReference(name:String) : Function
        {
            return mapUsrDefRef[name];
        }
    }
}



