//----------------------------------------------------------------------------------------------------
// CML parser class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.List from "./CML.List.js";
//import CML.State from "./CML.State.js";
//import CML.Refer from "./CML.Refer.js";
//import CML.Assign from "./CML.Assign.js";
//import CML.String from "./CML.String.js";
//import CML.Formula from "./CML.Formula.js";
//import CML.UserDefine from "./CML.UserDefine.js";
//import CML.FormulaLiteral from "./CML.FormulaLiteral.js";
/** @private */
CML.Parser = class {
    // constructor
    //------------------------------------------------------------
    // constructor
    constructor(globalVariables_) {
        // variables
        //------------------------------------------------------------
        this.listState = new CML.List(); // statement chain
        this.loopstac = new Array(); // loop stac
        this.childstac = new Array(); // child cast "{}" stac
        this.cmdKey = ""; // current parsing key
        this.cmdTemp = null; // current parsing statement
        this.fmlTemp = null; // current parsing formula
        this._globalVariables = null;
        // private functions
        //------------------------------------------------------------
        // regular expression indexes
        this.REX_COMMENT = 1; // comment
        this.REX_STRING = 2; // string
        this.REX_FORMULA = 5; // formula and arguments
        this.REX_USERDEF = 6; // user define commands
        this.REX_NORMAL = 7; // normal commands
        this.REX_ASSIGN = 8; // assign
        this.REX_CALLSEQ = 9; // call sequence
        this.REX_PREVREFER = 10; // previous reference
        this.REX_LABELDEF = 11; // labeled sequence definition
        this.REX_NONLABELDEF = 12; // non-labeled sequence definition
        this.REX_ARG_PREFIX = 13; // argument prefix
        this.REX_ARG_LITERAL = 15; // argument literal
        this.REX_ARG_POSTFIX = 17; // argument postfix
        this.REX_ERROR = 19; // error
        this._regexp = null; // regular expression
        this._globalVariables = globalVariables_;
        CML.Formula._initialize(globalVariables_);
    }
    // parsing
    //------------------------------------------------------------
    _parse(seq, cml_string) {
        // create regular expression
        var regexp = this._createCMLRegExp();
        // parsing
        try {
            // initialize
            this._initialize(seq);
            // execute first matching
            var res = regexp.exec(cml_string);
            while (res != null) {
                //trace(res);
                if (!this._parseFormula(res)) { // parse fomula first
                    this._append(); // append previous formula and statement
                    // check the result of matching
                    if (!this._parseStatement(res)) // new normal statement
                        if (!this._parseLabelDefine(res)) // labeled sequence definition
                            if (!this._parseNonLabelDefine(res)) // non-labeled sequence definition
                                if (!this._parsePreviousReference(res)) // previous reference
                                    if (!this._parseCallSequence(res)) // call sequence
                                        if (!this._parseAssign(res)) // assign 
                                            if (!this._parseUserDefined(res)) // user define statement
                                                if (!this._parseComment(res)) // comment
                                                    if (!this._parseString(res)) // string
                                                     {
                                                        // command is not defined
                                                        if (res[this.REX_ERROR] != undefined) {
                                                            throw Error(res[this.REX_ERROR] + " ?");
                                                        }
                                                        else {
                                                            throw Error("BUG!! unknown error in this._parse()");
                                                        }
                                                    }
                }
                // execute next matching
                res = regexp.exec(cml_string);
            }
            // throw error when stacs are still remain.
            if (this.loopstac.length != 0)
                throw Error("[[...] ?");
            if (this.childstac.length != 1)
                throw Error("{{...} ?");
            this._append(); // append last statement
            this._terminate(); // terminate the tail of sequence
            seq.verify(); // verification
        }
        catch (err) {
            this.listState.cut(this.listState.head, this.listState.tail);
            seq.clear();
            throw err;
        }
    }
    // parsing subroutines
    //------------------------------------------------------------
    _initialize(seq_) {
        this.listState.clear();
        this.listState.push(seq_);
        this.loopstac.length = 0;
        this.childstac.length = 0;
        this.childstac.unshift(seq_);
        this.cmdKey = "";
        this.cmdTemp = null;
        this.fmlTemp = null;
    }
    _append() {
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
    _terminate() {
        var terminator = new CML.State(CML.State.ST_END);
        this._append_statement(terminator);
        this.listState.cut(this.listState.head, this.listState.tail);
    }
    _parseFormula(res) {
        if (res[this.REX_FORMULA] == undefined)
            return false;
        // formula, argument, ","
        if (this.cmdTemp == null)
            throw Error("in formula " + res[this.REX_FORMULA]);
        if (res[this.REX_FORMULA] == ",") {
            this._append_formula(this.fmlTemp); // append old formula
            this.fmlTemp = this._check_argument(this.cmdTemp, res, true); // push new argument
        }
        else { // + - * / % ( )
            if (this.fmlTemp == null)
                this.fmlTemp = new CML.Formula(this.cmdTemp, true); // new formula
            if (!this.fmlTemp.pushOperator(res[this.REX_FORMULA], false))
                throw Error("in formula " + res[1]);
            this.fmlTemp.pushPrefix(res[this.REX_ARG_PREFIX], true);
            this.fmlTemp.pushLiteral(res[this.REX_ARG_LITERAL]);
            this.fmlTemp.pushPostfix(res[this.REX_ARG_POSTFIX], true);
        }
        return true;
    }
    _parseStatement(res) {
        if (res[this.REX_NORMAL] == undefined)
            return false;
        this.cmdKey = res[this.REX_NORMAL]; // command key
        this.cmdTemp = new CML.State(); // new command
        // individual operations
        switch (this.cmdKey) {
            case "[":
                this.loopstac.push(this.cmdTemp); // push loop stac
                break;
            case "?":
            case ":":
                if (this.loopstac.length == 0)
                    throw Error(": after no [ ?");
                this.cmdTemp.jump = this.loopstac.pop(); // pop loop stac
                this.cmdTemp.jump.jump = this.cmdTemp; // create jump chain
                this.loopstac.push(this.cmdTemp); // push new loop stac
                break;
            case "]":
                if (this.loopstac.length == 0)
                    throw Error("[...]] ?");
                this.cmdTemp.jump = this.loopstac.pop(); // pop loop stac
                this.cmdTemp.jump.jump = this.cmdTemp; // create jump chain
                break;
            case "}":
                if (this.childstac.length <= 1)
                    throw Error("{...}} ?");
                this._append_statement(this.cmdTemp.setCommand(this.cmdKey));
                var seq = this._cut_sequence(this.childstac.shift(), this.cmdTemp);
                this.cmdKey = "";
                // non-labeled sequence is exchenged into reference
                this.cmdTemp = (seq.type == CML.State.ST_NO_LABEL) ? this._new_reference(seq, null) : null;
                break;
        }
        // push new argument
        if (this.cmdTemp != null) {
            this.fmlTemp = this._check_argument(this.cmdTemp, res);
        }
        return true;
    }
    _parseLabelDefine(res) {
        if (res[this.REX_LABELDEF] == undefined)
            return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], res[this.REX_LABELDEF]); // new sequence with label
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        this.childstac.unshift(this.cmdTemp); // push child stac
        return true;
    }
    _parseNonLabelDefine(res) {
        if (res[this.REX_NONLABELDEF] == undefined)
            return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], null); // new sequence without label
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        this.childstac.unshift(this.cmdTemp); // push child stac
        return true;
    }
    _parsePreviousReference(res) {
        if (res[this.REX_PREVREFER] == undefined)
            return false;
        this.cmdTemp = this._new_reference(null, null); // new reference command
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        return true;
    }
    _parseCallSequence(res) {
        if (res[this.REX_CALLSEQ] == undefined)
            return false;
        this.cmdTemp = this._new_reference(null, res[this.REX_CALLSEQ]); // new reference command
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        return true;
    }
    _parseAssign(res) {
        if (res[this.REX_ASSIGN] == undefined)
            return false;
        this.cmdTemp = this._new_assign(res[this.REX_ASSIGN]); // new command
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        return true;
    }
    _parseUserDefined(res) {
        if (res[this.REX_USERDEF] == undefined)
            return false;
        this.cmdTemp = this._new_user_defined(res[this.REX_USERDEF]); // new command
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new arguments
        return true;
    }
    _parseString(res) {
        if (res[this.REX_STRING] == undefined)
            return false;
        this.cmdTemp = new CML.String(res[this.REX_STRING]); // new string
        return true;
    }
    _parseComment(res) {
        if (res[this.REX_COMMENT] == undefined)
            return false;
        return true;
    }
    // create regular expression once
    _createCMLRegExp() {
        if (this._globalVariables._requestUpdateRegExp) {
            var literalRegExpString = "(0x[0-9a-f]{1,8}|\\d+\\.?\\d*|\\$(\\?\\?|\\?|" + this._userReferenceRegExp + ")[0-9]?)";
            var operandRegExpString = CML.Formula._createOperandRegExpString(literalRegExpString);
            // oonstruct regexp string
            var rexstr = "(//[^\\n]*$|/\\*.*?\\*/)"; // comment (res[1])
            rexstr += "|'(.*?)'"; // string (res[2])
            rexstr += "|(("; // ---all--- (res[3,4])
            rexstr += "(,|\\+|-|\\*|/|%|==|!=|>=|<=|>|<)"; // formula and arguments (res[5])
            rexstr += "|&(" + this._userCommandRegExp + ")"; // user define commands (res[6])
            rexstr += "|" + CML.State.command_rex; // normal commands (res[7])
            rexstr += "|" + CML.Assign.assign_rex; // assign (res[8])
            rexstr += "|([A-Z_.][A-Z0-9_.]*)"; // call sequence (res[9])
            rexstr += "|(\\{\\.\\})"; // previous reference (res[10])
            rexstr += "|#([A-Z_][A-Z0-9_]*)[ \t]*\\{"; // labeled sequence definition (res[11])
            rexstr += "|(\\{)"; // non-labeled sequence definition (res[12])
            rexstr += ")[ \t]*" + operandRegExpString + ")"; // argument(res[13,14];prefix, res[15,16];literal, res[17,18];postfix)
            rexstr += "|([a-z]+)"; // error (res[19])
            this._regexp = new RegExp(rexstr, "gm"); // "s" optoin not available on javascript
            this._globalVariables._requestUpdateRegExp = false;
        }
        this._regexp.lastIndex = 0;
        return this._regexp;
    }
    // append new command
    _append_statement(state) {
        this.listState.push(state);
    }
    // append new formula
    _append_formula(fml) {
        if (fml != null) {
            if (!fml.construct())
                throw Error("in formula");
            this.listState.push(fml);
            this._update_max_reference(fml.max_reference);
        }
    }
    // cut sequence from the list
    _cut_sequence(start, end) {
        this.listState.cut(start, end);
        end.jump = start;
        return start;
    }
    // create new sequence
    _new_sequence(parent, label) {
        return parent.newChildSequence(label);
    }
    // create new reference
    // (null,   null) means previous call "{.}"
    // (define, null) means non-labeled call "{...}"
    // (null, define) means label call "ABC"
    _new_reference(seq, name) {
        // append "@" command, when previous command isn't STF_CALLREF.
        if ((this.listState.tail.type & CML.State.STF_CALLREF) == 0) {
            this._append_statement((new CML.State()).setCommand("@"));
        }
        // create reference
        return new CML.Refer(seq, name);
    }
    // create new user defined command
    _new_user_defined(str) {
        if (!(str in this._globalVariables._mapUsrDefCmd))
            throw Error("&" + str + " ?"); // not defined
        return new CML.UserDefine(this._globalVariables._mapUsrDefCmd[str]);
    }
    // create new assign command
    _new_assign(str) {
        var asg = new CML.Assign(str);
        this._update_max_reference(asg.max_reference);
        return asg;
    }
    // check and update max reference of sequence
    _update_max_reference(max_reference) {
        if (this.childstac[0].require_argc < max_reference) {
            this.childstac[0].require_argc = max_reference;
        }
    }
    // set arguments 
    _check_argument(state, res, isComma = false) {
        var prefix = res[this.REX_ARG_PREFIX];
        var literal = res[this.REX_ARG_LITERAL];
        var postfix = res[this.REX_ARG_POSTFIX];
        // push 0 before ","
        if (isComma && state._args.length == 0)
            state._args.push(Number.NaN);
        // push argument
        var fml = null;
        if (literal != undefined) {
            // set number when this argument is constant value
            if (literal.charAt(0) != "$") {
                if (postfix == undefined) {
                    if (prefix == undefined) {
                        state._args.push(Number(literal));
                        return null;
                    }
                    else if (prefix == "-") {
                        state._args.push(-(Number(literal)));
                        return null;
                    }
                }
                else if (postfix == ")") {
                    if (prefix == "(") {
                        state._args.push(Number(literal));
                        return null;
                    }
                    else if (prefix == "-(") {
                        state._args.push(-(Number(literal)));
                        return null;
                    }
                }
            }
            // set formula when this argument is variable
            state._args.push(0);
            fml = new CML.Formula(state, false);
            fml.pushPrefix(prefix, true);
            fml.pushLiteral(literal);
            fml.pushPostfix(postfix, true);
        }
        else {
            // push NaN when there are no arguments in "," command
            if (isComma)
                state._args.push(Number.NaN);
        }
        return fml;
    }
    // regular expression string of user command. call from _createCMLRegExp()
    get _userCommandRegExp() {
        var cmdlist = new Array(), cmd;
        for (cmd in this._globalVariables._mapUsrDefCmd) {
            cmdlist.push(cmd);
        }
        return cmdlist.sort(function (a, b) {
            return (a > b) ? -1 : (a < b) ? 1 : 0;
        }).join('|');
    }
    // regular expression string of user command. call from CML.Formula
    get _userReferenceRegExp() {
        var reflist = new Array(), ref;
        for (ref in this._globalVariables._mapUsrDefRef) {
            reflist.push(ref);
        }
        return reflist.concat(CML.FormulaLiteral.defaultReferences).sort(function (a, b) {
            return (a > b) ? -1 : (a < b) ? 1 : 0;
        }).join('|').replace(/\./g, '\\.');
    }
}
