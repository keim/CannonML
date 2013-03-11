//----------------------------------------------------------------------------------------------------
// CML sequence class (head of the statement chain)
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml {
    import org.si.cml.core.*;
    import org.si.cml.namespaces._cml_internal;
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
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
    public class CMLSequence extends CMLState
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        use namespace _cml_fiber_internal;
        
        
        
        
    // variables
    //------------------------------------------------------------
        private  var _label:String = null;
        private  var _childSequence:* = null;
        private  var _parent:CMLSequence = null;
        private  var _non_labeled_count:int = 0;
        private  var _global:Boolean = false;
        /** @private */ 
        _cml_internal var require_argc:int = 0;

        // global sequence
        static private var globalSequences:Array = new Array();
        
        
        
        
    // properties
    //------------------------------------------------------------
        /** dictionary of child sequence, you can access by label */
        public function get childSequence() : * { return _childSequence; }
        
        /** label of this sequence */
        public function get label() : String { return _label; }
        
        /** Flag of global sequence.
         *  <p>
         *  Child sequences of a global sequence are accessable from other sequences.<br/>
         *  </p>
@example
<listing version="3.0">
var seqG:CMLSequence = new CMLSequence("#LABEL_G{...}");

seqG.global = true;
var seqA:CMLSequence = new CMLSequence("&LABEL_G");    // Success; you can refer the LABEL_G.

seqG.global = false;
var seqB:CMLSequence = new CMLSequence("&LABEL_G");    // Error; you cannot refer the LABEL_G.
</listing>
         */
        public function get global() : Boolean { return _global; }
        public function set global(makeGlobal:Boolean) : void
        {
            if (_global == makeGlobal) return;
            _global = makeGlobal;
            if (makeGlobal) {
                globalSequences.unshift(this);
            } else {
                var imax:int = globalSequences.length;
                for (var i:int=0; i<imax; ++i) {
                    if (globalSequences[i] == this) {
                        globalSequences.splice(i, 1);
                        return;
                    }
                }
            }
        }


        /** Is this sequence empty ? */
        public function get isEmpty() : Boolean
        {
            return (next==null || CMLState(next).type==ST_END);
        }
        
        
        
        
    // functions
    //------------------------------------------------------------
        /** Construct new sequence by a String of cannonML or an XML of bulletML.
         *  @param data Sequence data. Intstance of String or XML is available. String data is for CannonML, and XML data is for BulletML.
         *  @param globalSequence Flag of global sequence.
         */
        function CMLSequence(data:* = null, globalSequence:Boolean = false)
        {
            super(ST_NO_LABEL);

            _label  = null;
            _parent = null;
            _childSequence = {};
            _non_labeled_count = 0;
            require_argc = 0;
            _global = false;
            global = globalSequence;

            if (data != null) {
                if (data is XML) BMLParser._parse(this, data);
                else             CMLParser._parse(this, data);
            }
        }
        
        
        /** @private */ 
        protected override function _setCommand(cmd:String) : CMLState
        {
            //_resetParameters(CMLObject._argumentCountOfNew);
            return this;
        }
        
        
        
        
    // statics
    //------------------------------------------------------------
        /** Register user defined variable "$[a-z_]+".
         *  <p>
         *  This function registers the variables that can use in CML-string. <br/>
         *  </p>
         *  @param name The name of variable that appears like "$name" in CML-string.
         *  @param func The callback function when the reference appears in sequence.<br/>
         *  The type of callback is <code>function(fbr:CMLFiber):Number</code>. The argument gives a fiber that execute the sequence.
         *  @see CMLFiber
@example 
<listing version="3.0">
// In the cml-string, you can use "$life" that returns Enemy's life.
CMLSequence.registerUserValiable("life", referLife);

function referLife(fbr:CMLFiber) : Number
{
    // Enemy class is your extention of CMLObject.
    return Enemy(fbr.object).life;
}
</listing>
         */
        static public function registerUserValiable(name:String, func:Function) : void
        {
            CMLParser.userReference(name, func);
        }


        /** Register user defined command "&[a-z_]+".
         *  <p>
         *  This function registers the command that can use in CML string. <br/>
         *  </p>
         *  @param name The name of command that appears like "&name" in CML string.
         *  @param func The callback function when the command appears in sequence.<br/>
         *  The type of callback is <code>function(fbr:CMLFiber, args:Array):void</code>.
         *  The 1st argument gives a reference of the fiber that execute the sequence.
         *  And the 2nd argument gives the arguments of the command.
         *  @param argc The count of argument that this command requires.<br/>
         *  @param requireSequence Specify true if this command require the sequence as the '&', '@' and 'n' commands.
         *  @see CMLFiber
@example 
<listing version="3.0">
// In the cml-string, you can use "&sound[sound_index],[volume]" that plays sound.
CMLSequence.registerUserCommand("sound", playSound, 2);

function playSound(fbr:CMLFiber, args:Array) : void
{
    // function _playSound(index, volume) plays sound.
    if (args.length >= 2) _playSound(args[0], args[1]);
}
</listing>
        */
        static public function registerUserCommand(name:String, func:Function, argc:int=0, requireSequence:Boolean=false) : void
        {
            CMLParser.userCommand(name, func, argc, requireSequence);
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
        public function getParameter(idx:uint) : Number
        {
            return (idx < _args.length) ? Number(_args[idx]) : 0;
        }
        
        
        

    // operations
    //------------------------------------------------------------
        /** Make this sequence empty.
         *  <p>
         *  This function disconnects all statement chains and enable to be caught by GC.
         *  </p>
         */
        override public function clear() : void
        {
            // remove from global list
            global = false;
            
            // disconnect all chains
            var cmd:CMLState, cmd_next:CMLState;
            for (cmd=CMLState(next); cmd!=null; cmd=cmd_next) {
                cmd_next = CMLState(cmd.next);
                cmd.clear();
            }
            
            // clear children
            for (var key:String in _childSequence) {
                _childSequence[key].clear();
                delete _childSequence[key];
            }
            
            // call clear in super class
            super.clear();
        }
        
        
        /** Parse CannonML-String or BulletML-XML.
         *  @param String or XML is avairable. String is for CannonML, and XML is for BulletML.
         */
        public function parse(data:*) : void
        {
            clear();
            if (data is XML) BMLParser._parse(this, data);
            else             CMLParser._parse(this, data);
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
        public function findSequence(label_:String) : CMLSequence
        {
            var idx:int = label_.indexOf(".");
            if (idx == -1) {
                // label_ does not include access operator "."
                if (label_ in _childSequence) return _childSequence[label_];
            } else {
                if (idx == 0) {
                    // first "." means root label
                    var root:CMLSequence = _parent;
                    while (root._parent != null) { root = root._parent; }
                    return root.findSequence(label_.substr(1));
                }
                // label_ includes access operator "."
                var parent_label:String = label_.substr(0, idx);
                if (parent_label in _childSequence) { 
                    var child_label:String = label_.substr(idx+1);
                    return _childSequence[parent_label].findSequence(child_label);
                }
            }
            
            // seek brothers
            return (_parent != null) ? _parent.findSequence(label_) : null;
        }

        
        // seek in global sequence
        private function _findGlobalSequence(label_:String) : CMLSequence
        {
            for each (var seq:CMLSequence in globalSequences) {
                var findseq:CMLSequence = seq.findSequence(label_);
                if (findseq != null) return findseq;
            }
            return null;
        }
        
        
        
       
    // internals
    //------------------------------------------------------------
        // create new child sequence
        /** @private */ 
        _cml_internal function newChildSequence(label_:String) : CMLSequence
        {
            var seq:CMLSequence = new CMLSequence();
            seq.type = (label_ == null) ? ST_NO_LABEL : ST_LABEL;
            seq._label = label_;
            _addChild(seq);
            return seq;
        }
        
        
        // add child.
        private function _addChild(seq:CMLSequence) : void
        {
            if (seq._label == null) {
                // non-labeled sequence
                seq._label = "#" + String(_non_labeled_count);
                ++_non_labeled_count;
            }
            
            if (seq._label in _childSequence) throw Error("sequence label confliction; "+seq._label+" in "+label);
            seq._parent = this;
            _childSequence[seq._label] = seq;
        }


        // verification (call after all parsing)
        /** @private */ 
        _cml_internal function verify() : void
        {
            var cmd:CMLState, cmd_next:CMLState, cmd_verify:CMLState, new_cmd:CMLState;
            
            // verification
            for (cmd=CMLState(next); cmd!=null; cmd=cmd_next) {
                cmd_next = CMLState(cmd.next);
                // solve named reference
                if (cmd.type == CMLState.ST_REFER) {
                    if (CMLRefer(cmd).isLabelUnsolved()) {
                        cmd.jump = findSequence(CMLRefer(cmd)._label);
                        if (cmd.jump == null) {
                            cmd.jump = _findGlobalSequence(CMLRefer(cmd)._label);
                            if (cmd.jump == null) throw Error("Not defined label; " + CMLRefer(cmd)._label);
                        }
                    }
                } else
                // check a sequence after CMLState.STF_CALLREF (&,@,f and n commands).
                if ((cmd.type & CMLState.STF_CALLREF) != 0) {
                    // skip formula command
                    cmd_verify = cmd_next;
                    while (cmd_verify.type == CMLState.ST_FORMULA) {
                        cmd_verify = CMLState(cmd_verify.next);
                    }
                    // if there are no references, ... 
                    if (cmd_verify.type != CMLState.ST_REFER) {
                        if ((cmd.type & CMLState.ST_RESTRICT) != 0) {
                            // throw error
                            throw Error("No sequences after &/@/n ?");
                        } else {
                            // insert reference after call command.
                            new_cmd = new CMLRefer();
                            new_cmd.insert_after(cmd);
                        }
                    } else 
                    // if there are fomulas between call and reference, shift the call command after fomulas.
                    if (cmd_verify != cmd_next) {
                        cmd.remove_from_list();
                        cmd.insert_before(cmd_verify);
                        cmd_next = cmd_verify;
                    }
                } else
                // verify barrage commands
                if (cmd.type == CMLState.ST_BARRAGE) {
                    // insert barrage initialize command first
                    new_cmd = new CMLState(CMLState.ST_BARRAGE);
                    new_cmd.insert_before(cmd);
                    // skip formula and barrage command
                    cmd_verify = cmd_next
                    while (cmd_verify.type == CMLState.ST_FORMULA || cmd_verify.type == CMLState.ST_BARRAGE) {
                        cmd_verify = CMLState(cmd_verify.next)
                    }
                    cmd_next = cmd_verify;
                }
            }
         
            // verify all child sequences
            for each (var seq:CMLSequence in _childSequence) { seq.verify(); }
        }


        // default sequence do nothing. call from CMLFiber
        /** @private */ 
        static internal function newDefaultSequence() : CMLSequence
        {
            var seq:CMLSequence = new CMLSequence();
            seq.next = new CMLState(CMLState.ST_END);
            seq.next.prev = seq;
            CMLState(seq.next).jump = seq;
            seq._setCommand(null);
            return seq;
        }


        // rapid sequence execute rapid sequence. call from CMLFiber
        /** @private */ 
        static internal function newRapidSequence() : CMLSequence
        {
            var seq:CMLSequence = new CMLSequence();
            seq.next = new CMLState(CMLState.ST_RAPID);
            seq.next.prev = seq;
            CMLState(seq.next).jump = seq;
            seq._setCommand(null);
            return seq;
        }


        // sequence to wait for object destruction. call from CMLFiber
        /** @private */ 
        static internal function newWaitDestuctionSequence() : CMLSequence
        {
            var seq:CMLSequence = new CMLSequence();
            seq.next = new CMLState(CMLState.ST_W4D);
            seq.next.prev = seq;
            CMLState(seq.next).jump = seq;
            return seq;
        }
    }
}

