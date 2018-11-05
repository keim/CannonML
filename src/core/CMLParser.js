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
        this.loopstac = []; // loop stac
        this.childstac = []; // child cast "{}" stac
        this.cmdKey = ""; // current parsing key
        this.cmdTemp = null; // current parsing statement
        this.fmlTemp = null; // current parsing formula
        this.currentLabelRegExpString = null; // labels in current parsing script
        // private functions
        //------------------------------------------------------------
        // regular expression indexes
        this._compiledLabelRegExpString = null; // labels in current parsing script
        this._regexp = null; // regular expression
        this._regexpUserCommand = null; // regular expression for user commands
        this._globalVariables = globalVariables_;
        CML.Formula._initialize(globalVariables_);
    }
    // parsing
    //------------------------------------------------------------
    _parse(seq, cml_string) {
        // initialize and create regular expression
        const regexp = this._initialize(seq, cml_string);
        // parsing
        try {
            // execute first matching
            let res = regexp.exec(cml_string);
            while (res != null) {
                //trace(res);
                if (!this._parseFormula(res)) { // parse fomula first
                    this._append(); // append previous formula and statement
                    // check the result of matching
                    if (!this._parseStatement(res)) // new normal statement
                        if (!this._parseLabelDefine(res)) // labeled sequence definition
                            if (!this._parseNonLabeledSequence(res)) // non-labeled sequence
                                if (!this._parseCallSequence(res)) // call sequence
                                    if (!this._parseAssign(res)) // assign 
                                        if (!this._parseComment(res)) // comment
                                            if (!this._parseString(res)) // string
                                            {
                                                // command is not defined
                                                if (res[this.REX_ERROR] != undefined) 
                                                    throw Error(res[this.REX_ERROR] + " ?");
                                                else 
                                                    throw Error("BUG!! unknown error in this._parse()");
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
    _initialize(seq_, cml_string) {
        this.listState.clear();
        this.listState.push(seq_);
        this.loopstac.length = 0;
        this.childstac.length = 0;
        this.childstac.unshift(seq_);
        this.cmdKey = "";
        this.cmdTemp = null;
        this.fmlTemp = null;
        const seqLabels = (cml_string.match(/#[A-Za-z0-9_]+/g) || []).map(l=>l.substr(1)),
              gloLabels = CML.Sequence.globalSequences.reduce((acm,seq)=>acm.concat(seq.childLabels), []),
              commands  = Object.keys(this._globalVariables._mapUsrDefCmd);
        this.currentLabelRegExpString = commands.concat(gloLabels, seqLabels).sort((a,b)=>((a>b)?-1:1)).join('|');
        return this._createCMLRegExp();
    }
    _append() {
        // append previous statement and formula
        if (this.cmdTemp != null) {
            this._append_formula(this.fmlTemp, this.cmdTemp);
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
        if (!res[this.REX_FORMULA])
            return false;
        if (!this.cmdTemp)
            throw Error("in formula " + res[this.REX_FORMULA]);
        if (!this.fmlTemp)
            this.fmlTemp = new CML.Formula(this.cmdTemp, true); // new formula
        if (!this.fmlTemp.pushOperator(res[this.REX_FORMULA], false))
            throw Error("in formula " + res[1]);
        this.fmlTemp.pushPrefix(res[this.REX_ARG_PREFIX], true);
        this.fmlTemp.pushLiteral(res[this.REX_ARG_LITERAL]);
        this.fmlTemp.pushPostfix(res[this.REX_ARG_POSTFIX], true);
        return true;
    }
    _parseStatement(res) {
        if (!res[this.REX_NORMAL])
            return false;
        this.cmdKey = res[this.REX_NORMAL]; // command key
        this.cmdTemp = new CML.State();     // new command
        let topStac;
        // individual operations
        switch (this.cmdKey) {
            case "[":
                this.cmdTemp.jump = this.cmdTemp; // set jump pointer -> "["
                this.loopstac.push(this.cmdTemp); // push loop stac
                break;
            case "?":
                if (this.listState.tail.type != CML.State.ST_BLOCKSTART && 
                    this.listState.tail.type != CML.State.ST_ELSE)
                    throw Error("? should be after [ or :");
                topStac = this.loopstac.pop();      // pop loop stac
                this.cmdTemp.jump = topStac.jump;   // keep jump pointer -> "["
                topStac.jump = this.cmdTemp;        // create jump pointer chain
                this.loopstac.push(this.cmdTemp);   // push new loop stac
                break;
            case ":":
                topStac = this.loopstac.pop();      // pop loop stac
                if (topStac.type != CML.State.ST_IF)
                    throw Error(": should be after ?");
                this.cmdTemp.jump = topStac.jump;   // keep jump pointer -> "["
                topStac.jump = this.cmdTemp;        // create jump pointer chain
                this.loopstac.push(this.cmdTemp);   // push new loop stac
                break;
            case "]":
                if (this.loopstac.length == 0)
                    throw Error("[...]] ?");
                topStac = this.loopstac.pop();      // pop loop stac
                this.cmdTemp.jump = topStac.jump;   // set jump pointer -> "["
                topStac.jump = this.cmdTemp;        // create jump pointer chain
                break;
            case "}":
                if (this.childstac.length <= 1)
                    throw Error("{...}} ?");
                this._append_statement(this.cmdTemp.setCommand(this.cmdKey));
                var seq = this._cut_sequence(this.childstac.shift(), this.cmdTemp);
                // non-labeled sequence is exchenged into reference
                /**/
                //CMLSequence>_gosub>_refer>_ret>null means nothing ...
                this.cmdTemp = (seq.type == CML.State.ST_NO_LABEL) ? this._new_reference(seq, null) : null;
                this.cmdKey = "";
                break;
        }
        // push new argument
        if (this.cmdTemp) {
            this.fmlTemp = this._check_argument(this.cmdTemp, res);
        }
        return true;
    }
    _parseLabelDefine(res) {
        if (!res[this.REX_LABELDEF])
            return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], res[this.REX_LABELDEF]); // new sequence with label
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        this.childstac.unshift(this.cmdTemp); // push child stac
        return true;
    }
    _parseNonLabeledSequence(res) {
        if (!res[this.REX_NONLABELDEF])
            return false;
        this.cmdTemp = this._new_sequence(this.childstac[0], null); // new sequence without label
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        this.childstac.unshift(this.cmdTemp); // push child stac
        return true;
    }
    _parseCallSequence(res) {
        if (!res[this.REX_CALLSEQ])
            return false;
        if (res[this.REX_CALLSEQ] in this._globalVariables._mapUsrDefCmd) 
            this.cmdTemp = this._new_user_defined(res[this.REX_CALLSEQ]); // new user command
        else 
            this.cmdTemp = this._new_reference(null, res[this.REX_CALLSEQ]); // new reference call
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        return true;
    }
    _parseAssign(res) {
        if (!res[this.REX_ASSIGN])
            return false;
        this.cmdTemp = this._new_assign(res[this.REX_ASSIGN]); // new command
        this.fmlTemp = this._check_argument(this.cmdTemp, res); // push new argument
        return true;
    }
    _parseString(res) {
        if (!res[this.REX_STRING])
            return false;
        this.cmdTemp = new CML.String(res[this.REX_STRING]); // new string
        return true;
    }
    _parseComment(res) {
        if (!res[this.REX_COMMENT])
            return false;
        return true;
    }
    // create regular expression once
    _createCMLRegExp() {
        if (this._globalVariables._requestUpdateRegExp || this._compiledLabelRegExpString != this.currentLabelRegExpString) {
            const literalRegExpString = "(0x[0-9a-f]{1,8}|\\d+\\.?\\d*|\\$(\\?\\?|\\?|" + this._userReferenceRegExpString() + ")[0-9]?)";
            const operandRegExpString = CML.Formula._createOperandRegExpString(literalRegExpString);
            // oonstruct regexp string
            this.REX_COMMENT = 1; // comment
            this.REX_STRING = 2; // string
            this.REX_FORMULA = 5; // formula and arguments
            this.REX_NORMAL = 6; // normal commands
            this.REX_ASSIGN = 7; // assign
            this.REX_CALLSEQ = 8; // call sequence
            this.REX_LABELDEF = 9; // labeled sequence definition
            this.REX_NONLABELDEF = 10; // non-labeled sequence definition
            this.REX_ARG_PREFIX = 11; // argument prefix
            this.REX_ARG_LITERAL = 13; // argument literal
            this.REX_ARG_POSTFIX = 15; // argument postfix
            this.REX_ERROR = 17; // error
            let rexstr = "(//[^\\n]*$|/\\*.*?\\*/)"; // comment (res[1])
            rexstr += "|'(.*?)'"; // string (res[2])
            rexstr += "|(("; // ---all--- (res[3,4])
            rexstr += "(,|\\+|-|\\*|/|%|==|!=|>=|<=|>|<)"; // formula and arguments (res[5])
            rexstr += "|" + CML.State.command_rex; // normal commands (res[6])
            rexstr += "|" + CML.Assign.assign_rex; // assign (res[7])
            rexstr += "|&("+this.currentLabelRegExpString+")"; // call sequence or command (res[8])
            rexstr += "|#([A-Za-z_][A-Za-z0-9_]*)\s*\\{"; // labeled sequence definition (res[9])
            rexstr += "|(\\{)"; // non-labeled sequence definition (res[10])
            rexstr += ")\s*" + operandRegExpString + ")"; // argument(res[11,12];prefix, res[13,14];literal, res[15,16];postfix)
            rexstr += "|([a-z]+)"; // error (res[17])
            this._regexp = new RegExp(rexstr, "gm"); // "s" optoin not available on javascript
            this._globalVariables._requestUpdateRegExp = false;
            this._compiledLabelRegExpString = this.currentLabelRegExpString;
        }
        this._regexp.lastIndex = 0;
        return this._regexp;
    }
    // append new formula
    _append_formula(fml, state) {
        if (fml) {
            if (!fml.construct())
                throw Error("in formula");
            state._args = fml._calcStatic();
            if (state._args.some(num=>isNaN(num))) {
                this.listState.push(fml);
                this._update_max_reference(fml.max_reference);
            }
        }
    }
    // append new command
    _append_statement(state) {
        this.listState.push(state);
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
    // (define, null) means non-labeled call "{...}"
    // (null, define) means label call "&abc"
    _new_reference(seq, name) {
        // append "@" or "&" command, when previous command isn't STF_CALLREF.
        if ((this.listState.tail.type & CML.State.STF_CALLREF) == 0) {
            this._append_statement((new CML.State()).setCommand((name)?"&":"@"));
        }
        // create reference 
        return new CML.Refer(seq, name);
    }
    // create new user defined command
    _new_user_defined(str) {
        /**/
        if (!(str in this._globalVariables._mapUsrDefCmd))
            throw Error("&" + str + " ?"); // not defined
        return new CML.UserDefine(this._globalVariables._mapUsrDefCmd[str]);
    }
    // create new assign command
    _new_assign(str) {
        const newAssign = new CML.Assign(str);
        this._update_max_reference(newAssign.max_reference);
        return newAssign;
    }
    // check and update max reference of sequence
    _update_max_reference(max_reference) {
        if (this.childstac[0].require_argc < max_reference) {
            this.childstac[0].require_argc = max_reference;
        }
    }
    // set arguments 
    _check_argument(state, res) {
        const prefix  = res[this.REX_ARG_PREFIX],
              literal = res[this.REX_ARG_LITERAL],
              postfix = res[this.REX_ARG_POSTFIX];
        // no arguments
        if (!literal)
            return null;
        // no arguments
        state._args.push(0);
        const fml = new CML.Formula(state, false);
        fml.pushPrefix(prefix, true);
        fml.pushLiteral(literal);
        fml.pushPostfix(postfix, true);
        return fml;
    }
    // regular expression string of user command. call from CML.Formula
    _userReferenceRegExpString() {
        return Object.keys(this._globalVariables._mapUsrDefRef).concat(CML.FormulaLiteral.defaultReferences)
                .sort((a,b)=>((a>b)?-1:1)).join('|').replace(/\./g, '\\.');
    }
}
