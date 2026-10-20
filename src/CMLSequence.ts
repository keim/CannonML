import type { Global } from "./core/CMLGlobal.js"
import { Parser } from "./core/CMLParser.js"
import { Refer } from "./core/CMLRefer.js"
import { State } from "./core/CMLState.js"

//----------------------------------------------------------------------------------------------------
// CML sequence class (head of the statement chain)
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** Class for the sequences created from the cannonML or the bulletML.
 *  <p>
 *  USAGE<br/>
 *  1) CML.Sequence(cannonML_String or bulletML_XML); creates a new sequence from certain cannonML/bulletML.<br/>
 *  2) CML.Object.execute(CML.Sequence); apply sequence to CML.Object.<br/>
 *  3) CML.Sequence.global; makes it global. You can access the child sequences of global sequence from everywhere.<br/>
 *  4) CML.Sequence.findSequence(); finds labeled sequence in cannonML/bulletML.<br/>
 *  5) CML.Sequence.getParameter(); accesses parameters of sequence.<br/>
 *  6) cml.globalVariables.registerUserCommand(); registers the function called from cannonML.<br/>
 *  7) cml.globalVariables.registerUserVariable(); registers the function refered by cannonML.<br/>
 *  </p>
 * @see CML.Object#execute()
 * @see CML.Sequence#CML.Sequence()
 * @see CML.Sequence#global
 * @see CML.Sequence#findSequence()
 * @see CML.Sequence#getParameter()
 * @see CML.Global#registerUserCommand()
 * @see CML.Global#registerUserVariable()
@example Typical usage.
<listing version="3.0">
// Create enemys sequence from "String of cannonML" or "XML of bulletML".
var motion:CML.Sequence = new CML.Sequence(String or XML);

...

enemy.create(x, y);                                     // Create enemy on the stage.
enemy.execute(motion);                                  // Execute sequence.
</listing>
 */
export class Sequence extends State {
    // functions
    //------------------------------------------------------------
    /** Construct new sequence by a String of cannonML or an XML of bulletML.
     *  @param data Sequence data. Intstance of String or XML is available. String data is for CannonML, and XML data is for BulletML.
     *  @param globalSequence Flag of global sequence.
     */
    _label: string | null
    _parent: Sequence | null
    _non_labeled_count: number
    _childSequences: Record<string, Sequence>
    _global: boolean
    constructor(data: string | null = null, globalSequence = false) {
        super(null);
        // variables
        //------------------------------------------------------------
        this._label = null;
        this._parent = null;
        this._non_labeled_count = 0;
        this._childSequences = {};
        this._global = false;
        this.global = globalSequence;
        if (data) Sequence._parser._parse(this, data);
    }
    // properties
    //------------------------------------------------------------
    /** root sequence */
    get root() { let r: Sequence = this; while(r._parent){r=r._parent;} return r; }
    /** dictionary of child sequence, you can access by label */
    get childSequences() { return this._childSequences; }
    /** label of this sequence */
    get label() { return this._label; }
    /** labels of child sequences */
    get childLabels() { return Object.keys(this._childSequences).filter(l=>!/^#/.test(l)); }
    /** Flag of global sequence.
     *  <p>
     *  Child sequences of a global sequence are accessable from other sequences.<br/>
     *  </p>
@example
<listing version="3.0">
var seqG:CML.Sequence = new CML.Sequence("#LABEL_G{...}");

seqG.global = true;
var seqA:CML.Sequence = new CML.Sequence("&amp;LABEL_G");    // Success; you can refer the LABEL_G.

seqG.global = false;
var seqB:CML.Sequence = new CML.Sequence("&amp;LABEL_G");    // Error; you cannot refer the LABEL_G.
</listing>
     */
    get global() { return this._global; }
    set global(makeGlobal: boolean) {
        if (this._global == makeGlobal) return;
        this._global = makeGlobal;
        if (makeGlobal) 
            Sequence.globalSequences.unshift(this);
        else 
            Sequence.globalSequences = Sequence.globalSequences.filter(seq=>!(seq===this));
    }
    /** Is this sequence empty ? */
    get isEmpty() {
        var cmd = this.next;
        return (this.next == null || cmd.type == State.ST_END);
    }
    // static functions
    //------------------------------------------------------------
    /** @private */
    static _initialize(globalVariables_: Global) {
        Sequence._parser = new Parser(globalVariables_);
    }
    // references
    //------------------------------------------------------------
    /** Get parameter of this sequence.
     *  <p>
     *  This function gives the parameters of this sequence.<br/>
     *  Parameters of a sequence are shown like "#LABEL{0,1,2 ... }" in cml-string.
     *  </p>
     *  @param  Index of argument.
     *  @return Value of argument.
@example
<listing version='3.0'>
var seq:CML.Sequence = new CML.Sequence("#A{10,20 v0,2[w30f3]}");
var seqA:CML.Sequence = seq.findSequence("A");
trace(seqA.getParameter(0), seqA.getParameter(1), seqA.getParameter(2));    // 10, 20, 0
</listing>
     */
    getParameter(idx: number): number {
        return (idx < this.$.length) ? Number(this.$[idx]) : 0;
    }
    // operations
    //------------------------------------------------------------
    /** Make this sequence empty.
     *  <p>
     *  This function disconnects all statement chains and enable to be caught by GC.
     *  </p>
     */
    /*override*/ clear() {
        // remove from global list
        this.global = false;
        // disconnect all chains
        let cmd = this.next, cmd_next;
        while (cmd != null) {
            cmd_next = cmd.next;
            cmd.clear();
            cmd = cmd_next;
        }
        // clear children
        for (let key in this._childSequences) {
            this._childSequences[key].clear();
            delete this._childSequences[key];
        }
        // call clear in super class
        super.clear();
    }
    /** Parse CannonML-String or BulletML-XML.
     *  @param String or XML is avairable. String is for CannonML, and XML is for BulletML.
     */
    parse(data: string) {
        this.clear();
        Sequence._parser._parse(this, data);
    }
    /** Find child sequence that has specifyed label.
     *  @param Label to find.
     *  @return Found sequence.
@example
<listing version="3.0">
// You can access the child sequence.
var seq:CML.Sequence = new CML.Sequence("#A{v0,2[w30f3]}");
var seqA:CML.Sequence = seq.findSequence("A");       // seqA is "v0,2[w30f]".

// You can use the access operator.
var seq:CML.Sequence = new CML.Sequence("#A{ #B{v0,2[w30f4]} #C{v0,4[w10f2]} }");
var seqAB:CML.Sequence = seq.findSequence("A.B");    // seqAB is "v0,2[w30f4]". Same as seq.findSequence("A").findSequence("B")
var seqAC:CML.Sequence = seq.findSequence("A.C");    // seqAB is "v0,4[w10f2]". Same as seq.findSequence("A").findSequence("C")
</listing>
     */
    findSequence(label_: string): Sequence | null {
        const idx = label_.indexOf(".");
        if (idx == -1) {
            // label_ does not include access operator "."
            if (label_ in this._childSequences)
                return this._childSequences[label_];
        }
        else {
            // first "." means root
            if (idx == 0) 
                return this.root.findSequence(label_.substr(1));
            // label_ includes access operator "."
            const parent_label = label_.substr(0, idx);
            if (parent_label in this._childSequences) {
                const child_label = label_.substr(idx + 1);
                return this._childSequences[parent_label].findSequence(child_label);
            }
        }
        // seek brothers
        return (this._parent != null) ? this._parent.findSequence(label_) : null;
    }
    // seek in global sequence
    _findGlobalSequence(label_: string): Sequence | null {
        for (let key in Sequence.globalSequences) {
            const seq = Sequence.globalSequences[key];
            const findseq = seq.findSequence(label_);
            if (findseq) return findseq;
        }
        return null;
    }
    // internals
    //------------------------------------------------------------
    // create new child sequence
    /** @private _cml_internal */
    newChildSequence(label_: string | null): Sequence {
        const seq = new Sequence();
        seq.type = (label_) ? State.ST_LABEL : State.ST_NO_LABEL;
        seq._label = label_;
        this._addChild(seq);
        return seq;
    }
    // add child.
    _addChild(seq: Sequence) {
        if (seq._label == null) {
            // non-labeled sequence
            seq._label = "#" + String(this._non_labeled_count);
            ++this._non_labeled_count;
        }
        if (seq._label in this._childSequences)
            throw Error("sequence label confliction; " + seq._label + " in " + this.label);
        seq._parent = this;
        this._childSequences[seq._label] = seq;
    }
    // verification (call after all parsing)
    /** @private _cml_internal */
    verify() {
        let cmd, cmd_next, cmd_verify, new_cmd;
        // verification
        cmd = this.next;
        while (cmd != null) {
            cmd_next = cmd.next;
            // solve named reference
            if (cmd.type == State.ST_REFER) {
                if (cmd.isLabelUnsolved()) {
                    cmd.jump = this.findSequence(cmd._label) || this._findGlobalSequence(cmd._label);
                    if (!cmd.jump)
                        throw Error("Not defined label; " + cmd._label);
                }
            }
            else 
            // check a sequence after CML.State.STF_CALLREF (@ko, @o, f commands).
            if (cmd.type & State.STF_CALLREF) {
                // if there are no references, ... 
                if (cmd.next.type != State.ST_REFER) {
                    if ((cmd.type & State.ST_RESTRICT) != 0) {
                        // throw error
                        throw Error("No sequences after @ ?");
                    }
                    else {
                        // insert reference after call command.
                        new_cmd = new Refer();
                        new_cmd.insert_after(cmd);
                    }
                }
            }
            else 
            // verify interplation
            if (cmd.type == State.ST_INTERPOLATE) {
                // search bark command
                cmd_verify = cmd.prev;
                while (cmd_verify.type & State.STF_BE_INTERPOLATED) 
                    cmd_verify = cmd_verify.prev;
                if (cmd_verify.type != State.ST_INTERPOLATE) {
                    // insert interpolation initialize command first of all
                    new_cmd = new State("$init4int");
                    new_cmd.insert_after(cmd_verify);
                }
            }
            else
            // verify barrage commands
            if (cmd.type == State.ST_BARRAGE) {
                // insert barrage initialize command first
                new_cmd = new State("$init4barrage");
                new_cmd.insert_before(cmd);
                // skip barrage command
                while (cmd_next.type == State.ST_BARRAGE) 
                    cmd_next = cmd_next.next;
            }
            cmd = cmd_next;
        }
        // verify all child sequences
        let seq: Sequence, key: string;
        for (key in this._childSequences) {
            seq = this._childSequences[key];
            seq.verify();
        }
    }
    // default sequence do nothing. call from CML.Fiber
    /** @private */
    static nop() {
        if (!Sequence._nop) {
            var cmdNop = new State("$end");
            Sequence._nop = new Sequence();
            Sequence._nop.next = cmdNop;
            cmdNop.prev = Sequence._nop;
            cmdNop.jump = Sequence._nop;
        }
        return Sequence._nop;
    }
    // rapid sequence execute rapid sequence. call from CML.Fiber
    /** @private */
    static rapid() {
        if (!Sequence._rapid) {
            var rap = new State("$rapid");
            Sequence._rapid = new Sequence();
            Sequence._rapid.next = rap;
            rap.prev = Sequence._rapid;
            rap.jump = Sequence._rapid;
        }
        return Sequence._rapid;
    }
    // sequence to wait for object destruction. call from CML.Fiber
    /** @private */
    static newWaitDestruction() {
        var seq = new Sequence(), cmd = new State("$w4d");
        seq.next = cmd;
        cmd.prev = seq;
        cmd.jump = seq;
        cmd.next = cmd;
        return seq;
    }

    // lazily created shared sequences (see nop() / rapid())
    static _nop?: Sequence
    static _rapid?: Sequence
    // Cannon ML Parser
    static _parser: Parser = null!;
    // global sequence
    static globalSequences: Sequence[] = [];

}