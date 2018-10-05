//----------------------------------------------------------------------------------------------------
// CML sequence class (head of the statement chain)
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLParser from "./core/CMLParser";
import CMLRefer from "./core/CMLRefer";
import CMLState from "./core/CMLState";
/** Class for the sequences created from the cannonML or the bulletML.
 *  <p>
 *  USAGE<br/>
 *  1) CMLSequence(cannonML_String or bulletML_XML); creates a new sequence from certain cannonML/bulletML.<br/>
 *  2) CMLObject.execute(CMLSequence); apply sequence to CMLObject.<br/>
 *  3) CMLSequence.global; makes it global. You can access the child sequences of global sequence from everywhere.<br/>
 *  4) CMLSequence.findSequence(); finds labeled sequence in cannonML/bulletML.<br/>
 *  5) CMLSequence.getParameter(); accesses parameters of sequence.<br/>
 *  6) CMLSequence.registerUserCommand(); registers the function called from cannonML.<br/>
 *  7) CMLSequence.registerUserVariable(); registers the function refered by cannonML.<br/>
 *  </p>
 * @see CMLObject#execute()
 * @see CMLSequence#CMLSequence()
 * @see CMLSequence#global
 * @see CMLSequence#findSequence()
 * @see CMLSequence#getParameter()
 * @see CMLSequence#registerUserCommand()
 * @see CMLSequence#registerUserVariable()
@example Typical usage.
<listing version="3.0">
// Create enemys sequence from "String of cannonML" or "XML of bulletML".
var motion:CMLSequence = new CMLSequence(String or XML);

...

enemy.create(x, y);                                     // Create enemy on the stage.
enemy.execute(motion);                                  // Execute sequence.
</listing>
 */
export default class CMLSequence extends CMLState {
    // functions
    //------------------------------------------------------------
    /** Construct new sequence by a String of cannonML or an XML of bulletML.
     *  @param data Sequence data. Intstance of String or XML is available. String data is for CannonML, and XML data is for BulletML.
     *  @param globalSequence Flag of global sequence.
     */
    constructor(data = null, globalSequence = false) {
        super(CMLState.ST_NO_LABEL);
        // variables
        //------------------------------------------------------------
        this._label = null;
        this._childSequence = null;
        this._parent = null;
        this._non_labeled_count = 0;
        this._global = false;
        /** @private _cml_internal */
        this.require_argc = 0;
        this._label = null;
        this._parent = null;
        this._childSequence = {};
        this._non_labeled_count = 0;
        this.require_argc = 0;
        this._global = false;
        this.global = globalSequence;
        if (data != null) {
            CMLSequence._parser._parse(this, data);
        }
    }
    // properties
    //------------------------------------------------------------
    /** dictionary of child sequence, you can access by label */
    get childSequence() { return this._childSequence; }
    /** label of this sequence */
    get label() { return this._label; }
    /** Flag of global sequence.
     *  <p>
     *  Child sequences of a global sequence are accessable from other sequences.<br/>
     *  </p>
@example
<listing version="3.0">
var seqG:CMLSequence = new CMLSequence("#LABEL_G{...}");

seqG.global = true;
var seqA:CMLSequence = new CMLSequence("&amp;LABEL_G");    // Success; you can refer the LABEL_G.

seqG.global = false;
var seqB:CMLSequence = new CMLSequence("&amp;LABEL_G");    // Error; you cannot refer the LABEL_G.
</listing>
     */
    get global() { return this._global; }
    set global(makeGlobal) {
        if (this._global == makeGlobal)
            return;
        this._global = makeGlobal;
        if (makeGlobal) {
            CMLSequence.globalSequences.unshift(this);
        }
        else {
            var i, imax = CMLSequence.globalSequences.length;
            for (i = 0; i < imax; ++i) {
                if (CMLSequence.globalSequences[i] == this) {
                    CMLSequence.globalSequences.splice(i, 1);
                    return;
                }
            }
        }
    }
    /** Is this sequence empty ? */
    get isEmpty() {
        var cmd = this.next;
        return (this.next == null || cmd.type == CMLState.ST_END);
    }
    /** @private */
    _setCommand(cmd) {
        //_resetParameters(CMLObject._argumentCountOfNew);
        return this;
    }
    // static functions
    //------------------------------------------------------------
    /** @private */
    static _initialize(globalValiables_) {
        CMLSequence._parser = new CMLParser(globalValiables_);
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
var seq:CMLSequence = new CMLSequence("#A{10,20 v0,2[w30f3]}");
var seqA:CMLSequence = seq.findSequence("A");
trace(seqA.getParameter(0), seqA.getParameter(1), seqA.getParameter(2));    // 10, 20, 0
</listing>
     */
    getParameter(idx) {
        return (idx < this._args.length) ? Number(this._args[idx]) : 0;
    }
    // operations
    //------------------------------------------------------------
    /** Make this sequence empty.
     *  <p>
     *  This function disconnects all statement chains and enable to be caught by GC.
     *  </p>
     */
    /*override*/ clear() {
        var key;
        // remove from global list
        this.global = false;
        // disconnect all chains
        var cmd = this.next, cmd_next;
        while (cmd != null) {
            cmd_next = cmd.next;
            cmd.clear();
            cmd = cmd_next;
        }
        // clear children
        for (key in this._childSequence) {
            this._childSequence[key].clear();
            delete this._childSequence[key];
        }
        // call clear in super class
        super.clear();
    }
    /** Parse CannonML-String or BulletML-XML.
     *  @param String or XML is avairable. String is for CannonML, and XML is for BulletML.
     */
    parse(data) {
        this.clear();
        CMLSequence._parser._parse(this, data);
    }
    /** Find child sequence that has specifyed label.
     *  @param Label to find.
     *  @return Found sequence.
@example
<listing version="3.0">
// You can access the child sequence.
var seq:CMLSequence = new CMLSequence("#A{v0,2[w30f3]}");
var seqA:CMLSequence = seq.findSequence("A");       // seqA is "v0,2[w30f]".

// You can use the access operator.
var seq:CMLSequence = new CMLSequence("#A{ #B{v0,2[w30f4]} #C{v0,4[w10f2]} }");
var seqAB:CMLSequence = seq.findSequence("A.B");    // seqAB is "v0,2[w30f4]". Same as seq.findSequence("A").findSequence("B")
var seqAC:CMLSequence = seq.findSequence("A.C");    // seqAB is "v0,4[w10f2]". Same as seq.findSequence("A").findSequence("C")
</listing>
     */
    findSequence(label_) {
        var idx = label_.indexOf(".");
        if (idx == -1) {
            // label_ does not include access operator "."
            if (label_ in this._childSequence)
                return this._childSequence[label_];
        }
        else {
            if (idx == 0) {
                // first "." means root label
                var root = this._parent;
                while (root._parent != null) {
                    root = root._parent;
                }
                return root.findSequence(label_.substr(1));
            }
            // label_ includes access operator "."
            var parent_label = label_.substr(0, idx);
            if (parent_label in this._childSequence) {
                var child_label = label_.substr(idx + 1);
                return this._childSequence[parent_label].findSequence(child_label);
            }
        }
        // seek brothers
        return (this._parent != null) ? this._parent.findSequence(label_) : null;
    }
    // seek in global sequence
    _findGlobalSequence(label_) {
        var key;
        for (key in CMLSequence.globalSequences) {
            var seq = CMLSequence.globalSequences[key];
            var findseq = seq.findSequence(label_);
            if (findseq != null)
                return findseq;
        }
        return null;
    }
    // internals
    //------------------------------------------------------------
    // create new child sequence
    /** @private _cml_internal */
    newChildSequence(label_) {
        var seq = new CMLSequence();
        seq.type = (label_ == null) ? CMLState.ST_NO_LABEL : CMLState.ST_LABEL;
        seq._label = label_;
        this._addChild(seq);
        return seq;
    }
    // add child.
    _addChild(seq) {
        if (seq._label == null) {
            // non-labeled sequence
            seq._label = "#" + String(this._non_labeled_count);
            ++this._non_labeled_count;
        }
        if (seq._label in this._childSequence)
            throw Error("sequence label confliction; " + seq._label + " in " + this.label);
        seq._parent = this;
        this._childSequence[seq._label] = seq;
    }
    // verification (call after all parsing)
    /** @private _cml_internal */
    verify() {
        var cmd, cmd_next, cmd_verify, new_cmd;
        // verification
        cmd = this.next;
        while (cmd != null) {
            cmd_next = cmd.next;
            // solve named reference
            if (cmd.type == CMLState.ST_REFER) {
                if (cmd.isLabelUnsolved()) {
                    cmd.jump = this.findSequence(cmd._label);
                    if (cmd.jump == null) {
                        cmd.jump = this._findGlobalSequence(cmd._label);
                        if (cmd.jump == null)
                            throw Error("Not defined label; " + cmd._label);
                    }
                }
            }
            else 
            // check a sequence after CMLState.STF_CALLREF (&,@,f and n commands).
            if ((cmd.type & CMLState.STF_CALLREF) != 0) {
                // skip formula command
                cmd_verify = cmd_next;
                while (cmd_verify.type == CMLState.ST_FORMULA) {
                    cmd_verify = cmd_verify.next;
                }
                // if there are no references, ... 
                if (cmd_verify.type != CMLState.ST_REFER) {
                    if ((cmd.type & CMLState.ST_RESTRICT) != 0) {
                        // throw error
                        throw Error("No sequences after &/@/n ?");
                    }
                    else {
                        // insert reference after call command.
                        new_cmd = new CMLRefer();
                        new_cmd.insert_after(cmd);
                    }
                }
                else 
                // if there are fomulas between call and reference, shift the call command after fomulas.
                if (cmd_verify != cmd_next) {
                    cmd.remove_from_list();
                    cmd.insert_before(cmd_verify);
                    cmd_next = cmd_verify;
                }
            }
            else 
            // verify barrage commands
            if (cmd.type == CMLState.ST_BARRAGE) {
                // insert barrage initialize command first
                new_cmd = new CMLState(CMLState.ST_BARRAGE);
                new_cmd.insert_before(cmd);
                // skip formula and barrage command
                cmd_verify = cmd_next;
                while (cmd_verify.type == CMLState.ST_FORMULA || cmd_verify.type == CMLState.ST_BARRAGE) {
                    cmd_verify = cmd_verify.next;
                }
                cmd_next = cmd_verify;
            }
            cmd = cmd_next;
        }
        // verify all child sequences
        var seq, key;
        for (key in this._childSequence) {
            seq = this._childSequence[key];
            seq.verify();
        }
    }
    // default sequence do nothing. call from CMLFiber
    /** @private */
    static nop() {
        if (CMLSequence._nop === null) {
            var cmd = new CMLState(CMLState.ST_END);
            CMLSequence._nop = new CMLSequence();
            CMLSequence._nop.next = cmd;
            cmd.prev = CMLSequence._nop;
            cmd.jump = CMLSequence._nop;
            CMLSequence._nop._setCommand(null);
        }
        return CMLSequence._nop;
    }
    // rapid sequence execute rapid sequence. call from CMLFiber
    /** @private */
    static rapid() {
        if (CMLSequence._rapid === null) {
            var rap = new CMLState(CMLState.ST_RAPID);
            CMLSequence._rapid = new CMLSequence();
            CMLSequence._rapid.next = rap;
            rap.prev = CMLSequence._rapid;
            rap.jump = CMLSequence._rapid;
            CMLSequence._rapid._setCommand(null);
        }
        return CMLSequence._rapid;
    }
    // sequence to wait for object destruction. call from CMLFiber
    /** @private */
    static newWaitDestruction() {
        var seq = new CMLSequence(), cmd = new CMLState(CMLState.ST_W4D);
        seq.next = cmd;
        cmd.prev = seq;
        cmd.jump = seq;
        return seq;
    }
}
// Cannon ML Parser
CMLSequence._parser = null;
// global sequence
CMLSequence.globalSequences = new Array();
