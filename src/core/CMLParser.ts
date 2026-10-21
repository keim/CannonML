import type { Global } from "./CMLGlobal.js"
import { Sequence } from "../CMLSequence.js"
import { Assign } from "./CMLAssign.js"
import { Formula } from "./CMLFormula.js"
import { FormulaLiteral } from "./CMLFormulaLiteral.js"
import { List } from "./CMLList.js"
import { Refer } from "./CMLRefer.js"
import { State } from "./CMLState.js"
import { CMLString } from "./CMLString.js"
import { UserDefine } from "./CMLUserDefine.js"

//----------------------------------------------------------------------------------------------------
// CML parser class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class Parser {
    // constructor
    //------------------------------------------------------------
    // constructor
    listState: List
    loopstac: State[]
    childstac: Sequence[]
    cmdTemp: State | null
    currentLabelRegExpString: string
    _compiledLabelRegExpString: string | null
    _regexp: RegExp | null
    _regexpUserCommand: RegExp | null
    _globalVariables: Global
    // _createCMLRegExp() で設定される正規表現のキャプチャ位置
    REX_COMMENT!: number
    REX_STRING!: number
    REX_FORMULA!: number
    REX_NORMAL!: number
    REX_ASSIGN!: number
    REX_CALLSEQ!: number
    REX_LABELDEF!: number
    REX_NONLABELDEF!: number
    REX_ARG_PREFIX!: number
    REX_ARG_LITERAL!: number
    REX_ARG_POSTFIX!: number
    REX_ERROR!: number
    constructor(globalVariables_: Global) {
        // variables
        //------------------------------------------------------------
        this.listState = new List(); // statement chain
        this.loopstac = []; // loop stac
        this.childstac = []; // child cast "{}" stac
        this.cmdTemp = null; // current parsing statement
        this.currentLabelRegExpString = null!; // labels in current parsing script
        this._compiledLabelRegExpString = null; // labels in current parsing script
        this._regexp = null; // regular expression
        this._regexpUserCommand = null; // regular expression for user commands
        this._globalVariables = globalVariables_;
        Formula._initialize(globalVariables_);
    }
    // parsing
    //------------------------------------------------------------
    _parse(seq: Sequence, cml_string: string) {
        // initialize and create regular expression
        const regexp = this._initialize(seq, cml_string);
        // parsing
        try {
            // execute first matching
            let res = regexp.exec(cml_string);
            while (res != null) {
                //trace(res);
                if (!this._parseFormula(res)) { // parse fomula first
                    this._append_statement(this.cmdTemp); // append previous formula and statement
                    // check the result of matching
                    if (!this._parseStatement(res)) // new normal statement
                        if (!this._parseLabelDefine(res)) // labeled sequence definition
                            if (!this._parseNonLabeledSequenceCall(res)) // non-labeled sequence
                                if (!this._parseSequenceCall(res)) // call sequence
                                    if (!this._parseAssign(res)) // assign 
                                        if (!this._parseComment(res)) // comment
                                            if (!this._parseString(res)) // string
                                            {
                                                // command is not defined
                                                if (res[this.REX_ERROR]) 
                                                    throw Error(res[this.REX_ERROR] + " ?");
                                                else 
                                                    throw Error("BUG!! unknown error in this._parse()");
                                            }
                }
                // check argument
                this._check_argument(this.cmdTemp, res);
                // execute next matching
                res = regexp.exec(cml_string);
            }
            // throw error when stacs are still remain.
            if (this.loopstac.length != 0)
                throw Error("[[...] ?");
            if (this.childstac.length != 1)
                throw Error("{{...} ?");
            this._append_statement(this.cmdTemp); // append previous formula and statement
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
    _initialize(seq_: Sequence, cml_string: string): RegExp {
        this.listState.clear();
        this.listState.push(seq_);
        this.loopstac.length = 0;
        this.childstac.length = 0;
        this.childstac.unshift(seq_);
        this.cmdTemp = null;
        const seqLabels = (cml_string.match(/#[A-Za-z0-9_]+/g) || []).map(l=>l.substr(1)),
              gloLabels = Sequence.globalSequences.reduce<string[]>((acm,seq)=>acm.concat(seq.childLabels), []),
              commands  = Object.keys(this._globalVariables._mapUsrDefCmd);
        this.currentLabelRegExpString = commands.concat(gloLabels, seqLabels).sort((a,b)=>((a>b)?-1:1)).join('|');
        return this._createCMLRegExp();
    }
    _terminate() {
        this._append_statement(new State("$end"));
        this.listState.cut(this.listState.head, this.listState.tail);
    }
    _parseFormula(res: RegExpExecArray): boolean {
        if (!res[this.REX_FORMULA])
            return false;
        if (!this.cmdTemp)
            throw Error("in formula " + res[this.REX_FORMULA]);
        if (!this.cmdTemp.formula.pushOperator(res[this.REX_FORMULA], 2))
            throw Error("in formula " + res[1]);
        return true;
    }
    _parseStatement(res: RegExpExecArray): boolean {
        if (!res[this.REX_NORMAL])
            return false;
        this.cmdTemp = new State(res[this.REX_NORMAL]);     // new command
        let topStac: State;
        // individual operations
        switch (this.cmdTemp.key) {
            case "[":
                topStac = this.cmdTemp;
                topStac.jump = this.cmdTemp;         // set jump pointer -> "["
                this.loopstac.unshift(this.cmdTemp); // push loop stac
                break;
            case "?":
                if (this.listState.tail.type != State.ST_BLOCKSTART && 
                    this.listState.tail.type != State.ST_ELSE)
                    throw Error("? should be after [ or :");
                topStac = this.loopstac.shift()!;      // pop loop stac
                this.cmdTemp.jump = topStac.jump;     // current jump pointer -> "["
                topStac.jump = this.cmdTemp;          // previous jump pointer -> current command
                this.loopstac.unshift(this.cmdTemp);  // push new loop stac
                break;
            case ":":
                if (this.loopstac[0].type != State.ST_IF)
                    throw Error(": should be after ?");
                topStac = this.loopstac.shift()!;      // pop loop stac
                this.cmdTemp.jump = topStac.jump;     // current jump pointer -> "["
                topStac.jump = this.cmdTemp;          // previous jump pointer -> current command
                this.loopstac.unshift(this.cmdTemp);  // push new loop stac
                break;
            case "]":
                if (this.loopstac.length == 0)
                    throw Error("[...]] ?");
                topStac = this.loopstac.shift()!;    // pop loop stac
                this.cmdTemp.jump = topStac.jump;   // set jump pointer -> "["
                topStac.jump = this.cmdTemp;        // previous jump pointer -> current command
                break;
            case "}":
                if (this.childstac.length <= 1)
                    throw Error("{...}} ?");
                this._append_statement(this.cmdTemp);
                this.cmdTemp = this._cut_sequence(this.childstac.shift()!, this.cmdTemp);
                break;
        }
        return true;
    }
    _parseLabelDefine(res: RegExpExecArray): boolean {
        if (!res[this.REX_LABELDEF])
            return false;
        this.cmdTemp = this._new_sequence(res[this.REX_LABELDEF]);
        return true;
    }
    _parseNonLabeledSequenceCall(res: RegExpExecArray): boolean {
        if (!res[this.REX_NONLABELDEF])
            return false;
        const newSeq = this._new_sequence(null);
        const newRef = this._new_reference(newSeq, null);
        this._append_statement(newRef);
        this.cmdTemp = newSeq;
        return true;
    }
    _parseSequenceCall(res: RegExpExecArray): boolean {
        if (!res[this.REX_CALLSEQ])
            return false;
        const name = res[this.REX_CALLSEQ];
        if (name in this._globalVariables._mapUsrDefCmd) 
            this.cmdTemp = new UserDefine(this._globalVariables._mapUsrDefCmd[name]);
        else 
            this.cmdTemp = this._new_reference(null, name); // new reference call
        return true;
    }
    _parseAssign(res: RegExpExecArray): boolean {
        if (!res[this.REX_ASSIGN])
            return false;
        this.cmdTemp = new Assign(res[this.REX_ASSIGN]);
        return true;
    }
    _parseString(res: RegExpExecArray): boolean {
        if (!res[this.REX_STRING])
            return false;
        this.cmdTemp = new CMLString(res[this.REX_STRING]);
        return true;
    }
    _parseComment(res: RegExpExecArray): boolean {
        if (!res[this.REX_COMMENT])
            return false;
        // comment (do nothing)
        return true;
    }
    // create regular expression once
    _createCMLRegExp(): RegExp {
        if (this._globalVariables._requestUpdateRegExp || this._compiledLabelRegExpString != this.currentLabelRegExpString) {
            const literalRegExpString = "(0x[0-9a-f]{1,8}|\\d+\\.?\\d*|\\$(\\?\\?|\\?|" + this._userReferenceRegExpString() + ")[0-9]?)";
            const operandRegExpString = Formula._createOperandRegExpString(literalRegExpString);
            // construct regexp string
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
            rexstr += "(,|\\+|-|\\*|/|%|==|!=|>=|<=|>|<)"; // formula operator (res[5])
            rexstr += "|" + State.command_rex; // normal commands (res[6])
            rexstr += "|l\\$([1-9r][+\\-*/]?)="; // assign (res[7])
            rexstr += "|&(?!\\{)("+this.currentLabelRegExpString+")"; // call sequence or command (res[8])
            rexstr += "|#([A-Za-z0-9_]+)\\s*\\{"; // labeled sequence definition (res[9])
            rexstr += "|&?(\\{)"; // non-labeled sequence call (res[10])
            rexstr += ")\\s*" + operandRegExpString + ")"; // argument(res[11,12];prefix, res[13,14];literal, res[15,16];postfix)
            rexstr += "|([A-Za-z]+)"; // error (res[17])
            this._regexp = new RegExp(rexstr, "gm"); // "s" optoin not available on javascript
            this._globalVariables._requestUpdateRegExp = false;
            this._compiledLabelRegExpString = this.currentLabelRegExpString;
        }
        this._regexp!.lastIndex = 0;
        return this._regexp!;
    }
    // append new command
    _append_statement(state: State | null) {
        if (!state) return;
        if (!state.construct())
            throw Error("in formula");
        this.listState.push(state);
    }
    // cut sequence from the list
    _cut_sequence(start: State, end: State) {
        this.listState.cut(start, end);
        end.jump = start;
        return (start.type == State.ST_NO_LABEL) ? start.prev : null;
    }
    // create new sequence
    _new_sequence(label: string | null): Sequence {
        const newSeq = this.childstac[0].newChildSequence(label);
        this.childstac.unshift(newSeq); // push child stac
        return newSeq;
    }
    // create new reference
    // (seq, null) means non-labeled call "{...}"
    // (null, label) means labeled call "&abc"
    _new_reference(seq: Sequence | null, label: string | null): Refer {
        if ((this.listState.tail.type & State.STF_CALLREF) == 0) {
            this._append_statement(new State((label) ? "$calllabel" : "$nonlabel"));
        }
        // create reference 
        return new Refer(seq, label);
    }
    // set arguments 
    _check_argument(state: State | null, res: RegExpExecArray) {
        if (state && res[this.REX_ARG_LITERAL]) {
            state.formula.pushPrefix(res[this.REX_ARG_PREFIX]);
            state.formula.pushLiteral(res[this.REX_ARG_LITERAL]);
            state.formula.pushPostfix(res[this.REX_ARG_POSTFIX]);
        }
    }
    // regular expression string of user command. call from CML.Formula
    _userReferenceRegExpString() {
        return Object.keys(this._globalVariables._mapUsrDefRef).concat(Object.keys(FormulaLiteral.operators))
                .sort((a,b)=>((a>b)?-1:1)).join('|').replace(/[.?]/g, '\\$&');
    }
}
