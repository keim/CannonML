//----------------------------------------------------------------------------------------------------
// CML fiber class
//  Copyright (c) 2007 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------


package org.si.cml {
    import org.si.cml.core.*;
    import org.si.cml.namespaces._cml_internal;
    import org.si.cml.namespaces._cml_fiber_internal;

    
    /** Class for the fiber (Fiber is called as "micro thread" in some other languages). 
     *  <p>
     *  USAGE<br/>
     *  1) Get the CMLFiber instance from CMLObject.execute().<br/>
     *  2) CMLFiber.destroy(); stops this fiber.<br/>
     *  3) CMLFiber.object; accesses to the CMLObject this fiber controls.<br/>
     *  4) CMLFiber.target; accesses to the CMLObject this fiber targets to.<br/>
     *  </p>
     * @see CMLObject#execute()
     * @see CMLFiber#destroy()
     * @see CMLFiber#object
     * @see CMLFiber#target
     */
    public class CMLFiber extends CMLListElem
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        use namespace _cml_fiber_internal;
        
        
        
        
    // static variables
    //------------------------------------------------------------
        /** @private */
        static _cml_fiber_internal var _defaultTarget:CMLObject = null;        // default target instance
        
        
        
        
    // variables
    //------------------------------------------------------------
        private  var _id       :int       = 0;     // id
        private  var _gene     :int       = 0;     // child generation
        private  var _object   :CMLObject = null;  // running object
        private  var _object_id:int       = 0;     // running object id
        private  var _target   :CMLObject = null;  // target object
        private  var _target_id:int       = 0;     // target object id
        private  var _barrage:CMLBarrage  = new CMLBarrage();      // bullet multiplyer
        /** @private */ _cml_fiber_internal var _pointer  :CMLState  = null;  // executing pointer
        /** @private */ _cml_fiber_internal var _access_id:int       = 0;     // access id
        
        // children list
        private var _listChild:CMLList = new CMLList();
        private var _firstDest:CMLListElem = _listChild.end;  // first destruction fiber

        // setting parameters
        /** @private */ _cml_fiber_internal var fx  :Number = 0;         // fiber position
        /** @private */ _cml_fiber_internal var fy  :Number = 0;
        /** @private */ _cml_fiber_internal var chgt:int    = 0;         // pos/vel/rot changing time
        /** @private */ _cml_fiber_internal var hopt:uint   = HO_AIM;    // head option
        /** @private */ _cml_fiber_internal var hang:Number = 0;         // head angle [degree]
        /** @private */ _cml_fiber_internal var fang:Number = 0;         // previous fired angle (due to the compatiblity with bulletML)
        /** @private */ _cml_fiber_internal var bul :CMLBarrageElem = new CMLBarrageElem();   // primary setting of bullet
        
        /** @private */ _cml_fiber_internal var invt:uint   = 0;         // invertion flag (0=no, 1=x_reverse, 2=y_reverse, 3=xy_reverse)
        /** @private */ _cml_fiber_internal var wtm1:int    = 1;         // waiting time for "w"
        /** @private */ _cml_fiber_internal var wtm2:int    = 1;         // waiting time for "~"
        /** @private */ _cml_fiber_internal var seqSub :CMLSequence = null; // previous calling sequence from "&"
        /** @private */ _cml_fiber_internal var seqExec:CMLSequence = null; // previous calling sequence from "@"
        /** @private */ _cml_fiber_internal var seqNew :CMLSequence = null; // previous calling sequence from "n"
        /** @private */ _cml_fiber_internal var seqFire:CMLSequence = null; // previous calling sequence from "f"

        // runtime parameters
        /** @private */ _cml_fiber_internal var wcnt:int   = 0;            // waiting counter
        /** @private */ _cml_fiber_internal var lcnt:Array = new Array();  // loop counter
        /** @private */ _cml_fiber_internal var jstc:Array = new Array();  // sub routine call stac
        /** @private */ _cml_fiber_internal var istc:Array = new Array();  // invertion flag stac
        /** @private */ _cml_fiber_internal var vars:Array = new Array();  // arguments
        /** @private */ _cml_fiber_internal var varc:Array = new Array();  // argument counts
        
        // head option
        /** @private */ static _cml_fiber_internal const HO_ABS:uint = 0;
        /** @private */ static _cml_fiber_internal const HO_PAR:uint = 1;
        /** @private */ static _cml_fiber_internal const HO_AIM:uint = 2;
        /** @private */ static _cml_fiber_internal const HO_FIX:uint = 3;
        /** @private */ static _cml_fiber_internal const HO_REL:uint = 4;
        /** @private */ static _cml_fiber_internal const HO_VEL:uint = 5;
        /** @private */ static _cml_fiber_internal const HO_SEQ:uint = 6;
        
        // I know these are very nervous implementations ('A`)...
        /** @private */ static private  var seqDefault:CMLSequence = CMLSequence.newDefaultSequence();   // default sequence
        /** @private */ static _cml_fiber_internal var seqRapid  :CMLSequence = CMLSequence.newRapidSequence();     // rapid fire sequence
        
        // statement to wait for object destruction
        /** @private */ private var _stateWaitDest:CMLSequence = null;

        
        
        
        // executable looping max limitation in 1 frame
        /** @private */ static _cml_fiber_internal var _loopmax:int = 1024;
        
        // executable gosub max limitation
        /** @private */ static _cml_fiber_internal var _stacmax:int = 64;
        
        // id not specifyed 
        /** @private */ static _cml_fiber_internal const ID_NOT_SPECIFYED:int = 0;




    // properties
    //------------------------------------------------------------
        /** Maximum limitation of the executable looping count in 1 frame. @default 1024*/
        static public function set maxLoopInFrame(lm:int):void { _loopmax = lm; }
        /** Maximum limitation of the executable gosub nest count. @default 64*/
        static public function set maxStacCount(sc:int):void   { _stacmax = sc; }
            
        /** CMLObject that this fiber controls. */
        public function get object()  : CMLObject  { return _object; }
        /** CMLObject that this fiber targets to. */
        public function get target()  : CMLObject  { return _target; }
        /** CMLBarrage that this fiber uses. */
        public function get barrage() : CMLBarrage { return _barrage; }
        /** Angle of this fiber. The value is set by "h*" commands. */
        public function get angle()   : Number     { return _getAngle(0) + CMLObject.scrollAngle; }
        /** String argument. <br/>
         *  This property is used in callback function of CMLSequence.registerUserCommand().<br/>
         *  When the next statement of user command is not '...', this property shows null.
         *  @example
<listing version="3.0">
    // Register the user command
    CMLSequence.registerUserCommand("print", callbackPrint);

    function callbackPrint(fbr:CMLFiber) {
        // You can refer the string after user command.
        _drawText(fbr.string);
    }

    // String comment after the user command in sequence.
    // In this sequence, you call _drawText('Hello World !!').
    var seq:CMLSequence = new CMLSequence("&print'Hello World !!'");
</listing>
         */
        public function get string()  : String { 
            var stateString:CMLString = _pointer.next as CMLString;
            return (stateString != null) ? stateString._string : null;
        }
        /** Sequence argument. <br/>
         *  This property is used in callback function of CMLSequence.registerUserCommand() with the option 'requireSequence' is true.<br/>
         *  When the next statement of user command is not sequence. outputs parsing error. Or, when the next statement is '{.}', returns null.
         */
        public function get sequence() : CMLSequence {
            var stateRefer:CMLRefer = _pointer.next as CMLRefer;
            return (stateRefer != null) ? ((stateRefer.jump) as CMLSequence) : null;
        }
        /** Is active ? When this property shows false, this fiber is already destroyed. */
        public function get isActive() : Boolean { return (_object != null); }
        /** Is sequence executing ? */
        public function get isExecuting() : Boolean { return (_pointer != null); }
        /** Does this fiber have any children ? */
        public function get isParent() : Boolean { return (!_listChild.isEmpty()); }
        /** Does this fiber have any destruction fiber ? */
        public function get hasDestFiber() : Boolean { return (_firstDest != _listChild.end); }
        
        /** @private */
        public function set target(t:CMLObject) : void { _setTarget((t==null)?_defaultTarget:t); }


        
        
    // constructor
    //------------------------------------------------------------
        /** <b>You cannot create new CMLFiber().</b> You can get CMLFiber instance only from CMLObject.execute().
         *  @see CMLObject#execute()
         */
        function CMLFiber()
        {
            _gene = 0;
        }




    // operations
    //------------------------------------------------------------
        /** Stop the fiber.<br/>
         *  This function stops all child fibers also.
         */
        public function destroy() : void
        {
            if (isActive) _finalize();
        }
        



    // operations to children
    //------------------------------------------------------------
        /** Stop all child fibers. */
        public function destroyAllChildren() : void
        {
            var elem     :CMLListElem;
            var elem_next:CMLListElem;
            var elem_end :CMLListElem = _listChild.end;
            for (elem=_listChild.begin; elem!=elem_end; elem=elem_next) {
                elem_next = elem.next;
                CMLFiber(elem).destroy();
            }
        }
        

        /** Stop child fiber with specifyed id. */
        public function destroyChild(child_id:int) : Boolean
        {
            var fbr:CMLFiber = findChild(child_id);
            if (fbr != null) {
                fbr.destroy();
                return true;
            }
            return false;
        }


        /** Find child fiber with specifyed id. */
        public function findChild(child_id:int) : CMLFiber
        {
            var elem    :CMLListElem;
            var elem_end:CMLListElem = _firstDest;
            for (elem=_listChild.begin; elem!=elem_end; elem=elem.next) {
                if (CMLFiber(elem)._access_id == child_id) return CMLFiber(elem);
            }
            return null;
        }


        /** Find child fiber with specifyed id. @private */
        _cml_fiber_internal function _destroyDestFiber(destructionStatus:int) : void
        {
            if (hasDestFiber) {
                var fbr:CMLFiber = CMLFiber(_firstDest);

                if (fbr._access_id == destructionStatus) {
                    _firstDest = fbr.next;
                    fbr.destroy();
                } else {
                    var elem:CMLListElem, elem_end:CMLListElem = _listChild.end;
                    for (elem=_firstDest.next; elem!=elem_end; elem=elem.next) {
                        if (CMLFiber(elem)._access_id == destructionStatus) {
                            CMLFiber(elem).destroy();
                            return;
                        }
                    }
                }
            }
        }




    // reference
    //------------------------------------------------------------
        /** Get the variables of the sequence "$1...$9". 
         *  @param Index of variable.
         *  @return Value of variable.
         */
        public function getVeriable(idx:int) : Number
        {
            return (idx < varc[0]) ? vars[idx] : 0;
        }


        /** Get the loop counter of this fiber. 
         *  @param Nested loop index. The index of 0 means the most inner loop, and 1 means the loop 1 outside.
         *  @return Loop count. Start at 0, and end at [loop_count]-1.
         */
        public function getLoopCounter(nest:int=0) : int
        {
            return (lcnt.length > nest) ? lcnt[nest] : 0;
        }
        
        
        /** Get the interval value (specifyed by "i" command) of this fiber. 
         *  @return Interval.
         */
        public function getInterval() : int
        {
            return chgt;
        }
        



    // internal functions
    //------------------------------------------------------------
        // initializer (call from CMLState._fiber())
        private function _initialize(parent:CMLFiber, obj:CMLObject, seq:CMLSequence, access_id_:int, invt_:uint=0, args_:Array=null) : Boolean
        {
            _setObject(obj);            // set running object
            _access_id = access_id_;    // access id
            _gene = parent._gene + 1;   // set generation
            _clear_param();             // clear parameters
            invt = invt_;               // set invertion flag

            _pointer = CMLState(seq.next);  // set cml pointer
            wcnt = 0;                       // reset waiting counter
            lcnt.length = 0;                // clear loop counter stac
            jstc.length = 0;                // clear sub-routine call stac
            istc.length = 0;                // clear invertion stac
            
            _firstDest = _listChild.end;    // reset last child
            
            _unshiftArguments(seq._cml_internal::require_argc, args_);  // set argument

            return (_gene < _stacmax);
        }
        
        
        // finalizer 
        private function _finalize() : void
        {
            destroyAllChildren();

            _pointer = null;
            _object = null;
            _target = null;
            ++_id;

            remove_from_list();
            _freeFibers.push(this);
        }


        // set object
        private function _setObject(obj:CMLObject) : void { _object = obj; _object_id = obj.id; }
        private function _setTarget(tgt:CMLObject) : void { _target = tgt; _target_id = tgt.id; }

        
        // clear parameters
        private function _clear_param() : void
        {
            _setTarget(_defaultTarget); // set target object
            
            fx   = 0;       // fiber position
            fy   = 0;
            chgt = 0;       // changing time
            hopt = HO_AIM;  // head option
            hang = 0;       // head angle [degree]
            fang = 0;       // previous fired angle (due to the compatiblity with bulletML)
            
            bul.setSequence(1,0,0,0);
            _barrage.clear();
            
            invt = 0;       // invertion flag
            wtm1 = 1;       // waiting time for "w"
            wtm2 = 1;       // waiting time for "~"
            
            vars.length = 0;
            varc.length = 0;

            seqSub  = seqDefault;
            seqExec = seqDefault;
            seqNew  = seqDefault;
            seqFire = seqDefault;
        }


        // copy parameters
        private function _copy_param(src:CMLFiber) : CMLFiber
        {
            _setTarget(src.target);  // set target object

            fx   = src.fx;      // fiber position
            fy   = src.fy;
            chgt = src.chgt;    // changing time
            hopt = src.hopt;    // head option
            hang = src.hang;    // head angle [degree]
            fang = src.fang;    // previous fired angle (due to the compatiblity with bulletML)
            
            bul.copy(src.bul);
            
            _barrage.appendCopyOf(src._barrage);

            wtm1 = src.wtm1;    // waiting time for "w"
            wtm2 = src.wtm2;    // waiting time for "~"

            seqSub  = src.seqSub;
            seqExec = src.seqExec;
            seqNew  = src.seqNew;
            seqFire = src.seqFire;

            return this;
        }
        
        
        // execution in 1 frame and returns next fiber
        private function _onUpdate() : CMLListElem
        {
            // next fiber
            var nextElem:CMLListElem = next;
            
            // kill fiber, if object was destroyed.
            if (_object.id != _object_id) {
                destroy();
                return nextElem;
            }
            
            // set target to default, if target was destroyed.
            if (_target.id != _target_id) {
                _setTarget(_defaultTarget);
            }
            
            // execution
            CMLState._setInvertionFlag(invt);           // set invertion flag
            if (--wcnt <= 0) {                          // execute only if waiting counte<=0
                var i:int = 0;
                var res:Boolean = true;
                while (res && _pointer!=null) {
                    res = _pointer.func(this);           // execute CMLState function
                    _pointer = CMLState(_pointer.next);  // increment pointer

                    // too many loops error, script may has no wait.
                    if (++i == _loopmax) { throw new Error("CML Exection error. No wait command in the loop ?"); }
                }
            }
            
            // run all children
            var elem     :CMLListElem;
            var elem_end :CMLListElem = _listChild.end;
            for (elem=_listChild.begin; elem!=elem_end;) {
                elem = CMLFiber(elem)._onUpdate();
            }

            // update next fiber
            nextElem = next;
            
            // destroy if no children and no pointer
            if (_pointer==null && _listChild.isEmpty()) {
                destroy();
            }

            // return next fiber
            return nextElem;
        }


        // destroy by object
        private function _destroyByObject(obj:CMLObject) : CMLListElem
        {
            // check all children
            var elem     :CMLListElem;
            var elem_end :CMLListElem = _listChild.end;
            for (elem=_listChild.begin; elem!=elem_end;) {
                elem = CMLFiber(elem)._destroyByObject(obj);
            }

            elem = next;
            if (_object == obj) destroy();
            return elem;
        }
        
        
        
        // push arguments
        /** @private */ 
        _cml_fiber_internal function _unshiftArguments(argCount:int=0, argArray:Array=null) : void
        {
            var i:int;
            
            if (argCount==0 && (argArray==null || argArray.length==0)) {
                varc.unshift(0);
            } else {
                if (argArray!=null) {
                    argCount = (argCount > argArray.length) ? argCount : argArray.length;
                    varc.unshift(argCount);
                    for (i=argCount-1; i>=argArray.length; --i) { vars.unshift(0); }
                    for (; i>=0; --i) { vars.unshift(argArray[i]); }
                } else {
                    varc.unshift(argCount);
                    for (i=argCount-1; i>=0; --i) { vars.unshift(0); }
                }
            }
        }
        
        
        // pop arguments
        /** @private */ 
        _cml_fiber_internal function _shiftArguments() : void
        {
            vars.splice(0, varc.shift());
        }

        
        // push invertion
        /** @private */ 
        _cml_fiber_internal function _unshiftInvertion(invt_:uint) : void
        {
            istc.unshift(invt);
            invt = invt_;
        }

        
        // pop invertion
        /** @private */ 
        _cml_fiber_internal function _shiftInvertion() : void
        {
            invt = istc.shift();
        }
        
        
        // return fiber's head angle (angle in this game's screen, the scroll direction is 0[deg]).
        /** @private */ 
        _cml_fiber_internal function _getAngle(base:Number) : Number
        {
            switch(hopt) {
            case HO_AIM: base = _object.getAimingAngle(_target, fx, fy); break; // based on the angle to the target
            case HO_ABS:                                                        // based on the angle in the absolute coordination
            case HO_FIX: base = 0;                                       break; // based on the fixed angle
            case HO_REL: base = _object.angleOnStage;                    break; // based on the angle of this object
            case HO_PAR: base = _object.angleParentOnStage;              break; // based on the angle of the parent object
            case HO_VEL: base = _object.angleVelocity;                   break; // based on the angle of velocity
            case HO_SEQ:                                                 break; // sequencial do nothing
            default:
                throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
            }
            return base + hang;
        }
        
        
        // return angle for rotation command(r, rc, cd). HO_AIM is aiming angle from the object.
        /** @private */ 
        _cml_fiber_internal function _getAngleForRotationCommand() : Number
        {
            switch(hopt) {
            case HO_AIM: return _object.getAimingAngle(_target) + hang;  // based on the angle to the target
            case HO_ABS:                                                 // based on the angle in the absolute coordination
            case HO_FIX: return hang;                                    // based on the fixed angle
            case HO_REL: return _object.angleOnStage + hang;             // based on the angle of this object
            case HO_PAR: return _object.angleParentOnStage + hang;       // based on the angle of the parent object
            case HO_VEL: return _object.angleVelocity + hang;            // based on the angle of velocity
            case HO_SEQ: return _object.angleOnStage + hang * chgt;      // sequencial
            default:
                throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
            }
            return 0;
        }
        
        
        // rotate object in minimum rotation (call from CMLState.r())
        /** @private */ 
        _cml_fiber_internal function _isShortestRotation() : Boolean
        {
            return (hopt==HO_AIM || hopt==HO_VEL || hopt==HO_FIX);
        }




    // static function
    //------------------------------------------------------------
        static private var _freeFibers:CMLList  = new CMLList();    // free list
        static private var _rootFiber :CMLFiber = new CMLFiber();   // root fiber of active fibers

        /** @private destroy all */
        static _cml_fiber_internal function _deatroyAll() : void
        {
            var activeFibers:CMLList = _rootFiber._listChild;
            if (activeFibers.isEmpty()) return;
            
            var elem    :CMLListElem;
            var elem_end:CMLListElem = activeFibers.end;
            for (elem=activeFibers.begin; elem!=elem_end;) {
                var nextElem:CMLListElem = elem.next;
                CMLFiber(elem)._finalize();
                elem = nextElem 
            }
        }
        

        // 1 frame execution for all fibers
        /** @private */ 
        static _cml_fiber_internal function _onUpdate() : void
        {
            var activeFibers:CMLList = _rootFiber._listChild;
            if (activeFibers.isEmpty()) return;
            
            var elem    :CMLListElem;
            var elem_end:CMLListElem = activeFibers.end;
            for (elem=activeFibers.begin; elem!=elem_end;) {
                elem = CMLFiber(elem)._onUpdate();
            }
        }
        
        
        // new fiber
        /** call only from CMLObject.execute() @private */ 
        static _cml_fiber_internal function _newRootFiber(obj:CMLObject, seq:CMLSequence, args_:Array, invt_:uint) : CMLFiber
        {
            if (seq.isEmpty) return null;
            var fbr:CMLFiber = CMLFiber(_freeFibers.pop() || new CMLFiber());
            fbr.insert_before(_rootFiber._firstDest);                   // child of root
            fbr._initialize(_rootFiber, obj, seq, 0, invt_, args_);     // the generation is counted from root
            return fbr;
        }

        /** call only from the '@' command (CMLState._fiber()) @private */ 
        _cml_fiber_internal function _newChildFiber(seq:CMLSequence, id:int, invt_:uint, args_:Array, copyParam:Boolean) : CMLFiber
        {
            if (id != ID_NOT_SPECIFYED) destroyChild(id);                   // destroy old fiber, when id is obtained
            if (seq.isEmpty) return null;
            var fbr:CMLFiber = CMLFiber(_freeFibers.pop() || new CMLFiber());
            fbr.insert_before(_firstDest);                                  // child of this
            if (!fbr._initialize(this, _object, seq, id, invt_, args_)) {   // the generation is counted from root
                throw new Error("CML Exection error. The '@' command calls depper than stac limit.");
            }
            if (copyParam) fbr._copy_param(this);                           // copy parameters from parent
            return fbr;
        }
        
        /** call only from the '@ko' command (CMLState._fiber_destruction()) @private */
        _cml_fiber_internal function _newDestFiber(seq:CMLSequence, id:int, invt_:uint, args_:Array) : CMLFiber
        {
            _destroyDestFiber(id);                                          // destroy old fiber
            
            if (seq.isEmpty) return null;
            var fbr:CMLFiber = CMLFiber(_freeFibers.pop() || new CMLFiber());
            // set destruction sequence
            fbr._stateWaitDest = fbr._stateWaitDest || CMLSequence.newWaitDestuctionSequence();
            CMLState(fbr._stateWaitDest.next).jump = seq;
            
            fbr.insert_before(_firstDest);                                  // child of this
            _firstDest = fbr;                                               // overwrite first destruction fiber
            if (!fbr._initialize(this, _object, fbr._stateWaitDest, id, invt_, args_)) {
                throw new Error("CML Exection error. The '@ko' command calls depper than stac limit.");
            }
            return fbr;
        }

        /** call from the 'n', 'f' or '@o' command (search in CMLState) @private */ 
        _cml_fiber_internal function _newObjectFiber(obj:CMLObject, seq:CMLSequence, invt_:uint, args_:Array) : CMLFiber
        {
            if (seq.isEmpty) return null;
            var fbr:CMLFiber = CMLFiber(_freeFibers.pop() || new CMLFiber());
            fbr.insert_before(_rootFiber._firstDest);                       // child of root
            if (!fbr._initialize(this, obj, seq, 0, invt_, args_)) {        // the generation is counted from this
                throw new Error("CML Exection error. The 'n', 'f' or '@o' command calls depper than stac limit.");
            }
            return fbr;
        }
        
        
        // destroy all fibers
        /** call from CMLObject.halt() @private */ 
        static _cml_fiber_internal function _destroyAllFibers(obj:CMLObject) : void
        {
            var fibers  :CMLList = _rootFiber._listChild,
                elem    :CMLListElem,
                elem_end:CMLListElem = fibers.end;
            for (elem=fibers.begin; elem!=elem_end;) {
                elem = CMLFiber(elem)._destroyByObject(obj);
            }
        }
    }
}


