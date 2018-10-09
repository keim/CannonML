//----------------------------------------------------------------------------------------------------
// CML fiber class
//  Copyright (c) 2007 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------
import CMLSequence from "./CMLSequence.js";
import CMLBarrage from "./core/CMLBarrage.js";
import CMLBarrageElem from "./core/CMLBarrageElem.js";
import CMLList from "./core/CMLList.js";
import CMLListElem from "./core/CMLListElem.js";
import CMLState from "./core/CMLState.js";
/** CMLFiber rewrites parameters of CMLObject according to CMLSequence (Fiber is called as "micro thread" in some other languages.)
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
export default class CMLFiber extends CMLListElem {
    // constructor
    //------------------------------------------------------------
    /** <b>You cannot create new CMLFiber().</b> You can get CMLFiber instance only from CMLObject.execute().
     *  @see CMLObject#execute()
     */
    constructor() {
        super();
        // variables
        //------------------------------------------------------------
        this._id = 0; // idstatic
        this._gene = 0; // child generation
        this._object = null; // running object
        this._object_id = 0; // running object id
        this._target = null; // target object
        this._target_id = 0; // target object id
        this._barrage = new CMLBarrage(); // bullet multiplyer
        this._seqWaitDest = null; // sequence to wait for object destruction
        /** @private _cml_fiber_internal */ this._pointer = null; // executing pointer
        /** @private _cml_fiber_internal */ this._access_id = 0; // access id
        // children list
        this._listChild = new CMLList();
        this._firstDest = this._listChild.end; // first destruction fiber
        // setting parameters
        /** @private _cml_fiber_internal */ this.fx = 0; // fiber position
        /** @private _cml_fiber_internal */ this.fy = 0;
        /** @private _cml_fiber_internal */ this.chgt = 0; // pos/vel/rot changing time
        /** @private _cml_fiber_internal */ this.hopt = CMLState.HO_AIM; // head option
        /** @private _cml_fiber_internal */ this.hang = 0; // head angle [degree]
        /** @private _cml_fiber_internal */ this.fang = 0; // previous fired angle (due to the compatiblity with bulletML)
        /** @private _cml_fiber_internal */ this.bul = new CMLBarrageElem(); // primary setting of bullet
        /** @private _cml_fiber_internal */ this.invt = 0; // invertion flag (0=no, 1=x_reverse, 2=y_reverse, 3=xy_reverse)
        /** @private _cml_fiber_internal */ this.wtm1 = 1; // waiting time for "w"
        /** @private _cml_fiber_internal */ this.wtm2 = 1; // waiting time for "~"
        /** @private _cml_fiber_internal */ this.seqSub = null; // previous calling sequence from "&"
        /** @private _cml_fiber_internal */ this.seqExec = null; // previous calling sequence from "@"
        /** @private _cml_fiber_internal */ this.seqNew = null; // previous calling sequence from "n"
        /** @private _cml_fiber_internal */ this.seqFire = null; // previous calling sequence from "f"
        // runtime parameters
        /** @private _cml_fiber_internal */ this.wcnt = 0; // waiting counter
        /** @private _cml_fiber_internal */ this.lcnt = new Array(); // loop counter
        /** @private _cml_fiber_internal */ this.jstc = new Array(); // sub routine call stac
        /** @private _cml_fiber_internal */ this.istc = new Array(); // invertion flag stac
        /** @private _cml_fiber_internal */ this.vars = new Array(); // arguments
        /** @private _cml_fiber_internal */ this.varc = new Array(); // argument counts
        this._gene = 0;
    }
    // properties
    //------------------------------------------------------------
    /** Maximum limitation of the executable looping count in 1 frame. @default 1024*/
    static set maxLoopInFrame(lm) { CMLFiber._loopmax = lm; }
    /** Maximum limitation of the executable gosub nest count. @default 64*/
    static set maxStacCount(sc) { CMLFiber._stacmax = sc; }
    /** CMLObject that this fiber controls. */
    get object() { return this._object; }
    /** CMLObject that this fiber targets to. */
    get target() { return this._target; }
    /** CMLBarrage that this fiber uses. */
    get barrage() { return this._barrage; }
    /** Angle of this fiber. The value is set by "h*" commands. */
    get angle() { return this._getAngle(0) + CMLFiber._globalVariables.scrollAngle; }
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
var seq:CMLSequence = new CMLSequence("&amp;print'Hello World !!'");
</listing>
     */
    get string() {
        var stateString = this._pointer.next;
        return (stateString != null) ? stateString._string : null;
    }
    /** Sequence argument. <br/>
     *  This property is used in callback function of CMLSequence.registerUserCommand() with the option 'requireSequence' is true.<br/>
     *  When the next statement of user command is not sequence. outputs parsing error. Or, when the next statement is '{.}', returns null.
     */
    get sequence() {
        var stateRefer = this._pointer.next;
        return (stateRefer != null) ? (stateRefer.jump) : null;
    }
    /** Is active ? When this property shows false, this fiber is already destroyed. */
    get isActive() { return (this._object != null); }
    /** Is sequence executing ? */
    get isExecuting() { return (this._pointer != null); }
    /** Does this fiber have any children ? */
    get isParent() { return (!this._listChild.isEmpty()); }
    /** Does this fiber have any destruction fiber ? */
    get hasDestFiber() { return (this._firstDest != this._listChild.end); }
    /** @private */
    set target(t) { this._setTarget((t == null) ? CMLFiber._defaultTarget : t); }
    // operations
    //------------------------------------------------------------
    /** Stop the fiber.<br/>
     *  This function stops all child fibers also.
     */
    destroy() {
        if (this.isActive)
            this._finalize();
    }
    // operations to children
    //------------------------------------------------------------
    /** Stop all child fibers. */
    destroyAllChildren() {
        var elem = this._listChild.begin, elem_end = this._listChild.end, elem_next;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem.destroy();
            elem = elem_next;
        }
    }
    /** Stop child fiber with specifyed id. */
    destroyChild(child_id) {
        var fbr = this.findChild(child_id);
        if (fbr != null) {
            fbr.destroy();
            return true;
        }
        return false;
    }
    /** Find child fiber with specifyed id. */
    findChild(child_id) {
        var elem = this._listChild.begin, elem_end = this._firstDest;
        while (elem != elem_end) {
            if (elem._access_id == child_id)
                return elem;
            elem = elem.next;
        }
        return null;
    }
    /** kill destruction fiber with specifyed id. @private */
    _killDestFiber(destructionStatus) {
        if (this.hasDestFiber) {
            var fbr = this._firstDest;
            if (fbr._access_id == destructionStatus) {
                this._firstDest = fbr.next;
                fbr.destroy();
            }
            else {
                var elem = this._firstDest.next, elem_end = this._listChild.end;
                while (elem != elem_end) {
                    if (elem._access_id == destructionStatus) {
                        elem.destroy();
                        return;
                    }
                    elem = elem.next;
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
    getVeriable(idx) {
        return (idx < this.varc[0]) ? this.vars[idx] : 0;
    }
    /** Get the loop counter of this fiber.
     *  @param Nested loop index. The index of 0 means the most inner loop, and 1 means the loop 1 outside.
     *  @return Loop count. Start at 0, and end at [loop_count]-1.
     */
    getLoopCounter(nest = 0) {
        return (this.lcnt.length > nest) ? this.lcnt[nest] : 0;
    }
    /** Get the interval value (specifyed by "i" command) of this fiber.
     *  @return Interval.
     */
    getInterval() {
        return this.chgt;
    }
    // internal functions
    //------------------------------------------------------------
    // initializer (call from CMLState._fiber())
    _initialize(parent, obj, seq, access_id_, invt_ = 0, args_ = null) {
        this._setObject(obj); // set running object
        this._access_id = access_id_; // access id
        this._gene = parent._gene + 1; // set generation
        this._clear_param(); // clear parameters
        this.invt = invt_; // set invertion flag
        this._pointer = seq.next; // set cml pointer
        this.wcnt = 0; // reset waiting counter
        this.lcnt.length = 0; // clear loop counter stac
        this.jstc.length = 0; // clear sub-routine call stac
        this.istc.length = 0; // clear invertion stac
        this._firstDest = this._listChild.end; // reset last child
        this._unshiftArguments(seq.require_argc, args_); // set argument
        return (this._gene < CMLFiber._stacmax);
    }
    // finalizer 
    _finalize() {
        this.destroyAllChildren();
        this._pointer = null;
        this._object = null;
        this._target = null;
        ++this._id;
        this.remove_from_list();
        CMLFiber._freeFibers.push(this);
    }
    // set object
    _setObject(obj) { this._object = obj; this._object_id = obj.id; }
    _setTarget(tgt) { this._target = tgt; this._target_id = tgt.id; }
    // clear parameters
    _clear_param() {
        this._setTarget(CMLFiber._defaultTarget); // set target object
        this.fx = 0; // fiber position
        this.fy = 0;
        this.chgt = 0; // changing time
        this.hopt = CMLState.HO_AIM; // head option
        this.hang = 0; // head angle [degree]
        this.fang = 0; // previous fired angle (due to the compatiblity with bulletML)
        this.bul.setSequence(1, 0, 0, 0);
        this._barrage.clear();
        this.invt = 0; // invertion flag
        this.wtm1 = 1; // waiting time for "w"
        this.wtm2 = 1; // waiting time for "~"
        this.vars.length = 0;
        this.varc.length = 0;
        var nop = CMLSequence.nop();
        this.seqSub = nop;
        this.seqExec = nop;
        this.seqNew = nop;
        this.seqFire = nop;
    }
    // copy parameters
    _copy_param(src) {
        this._setTarget(src.target); // set target object
        this.fx = src.fx; // fiber position
        this.fy = src.fy;
        this.chgt = src.chgt; // changing time
        this.hopt = src.hopt; // head option
        this.hang = src.hang; // head angle [degree]
        this.fang = src.fang; // previous fired angle (due to the compatiblity with bulletML)
        this.bul.copy(src.bul);
        this._barrage.appendCopyOf(src._barrage);
        this.wtm1 = src.wtm1; // waiting time for "w"
        this.wtm2 = src.wtm2; // waiting time for "~"
        this.seqSub = src.seqSub;
        this.seqExec = src.seqExec;
        this.seqNew = src.seqNew;
        this.seqFire = src.seqFire;
        return this;
    }
    // execution in 1 frame and returns next fiber
    _onUpdate() {
        // next fiber
        var nextElem = this.next;
        // kill fiber, if object was destroyed.
        if (this._object.id != this._object_id) {
            this.destroy();
            return nextElem;
        }
        // set target to default, if target was destroyed.
        if (this._target.id != this._target_id) {
            this._setTarget(CMLFiber._defaultTarget);
        }
        // execution
        CMLState._setInvertionFlag(this.invt); // set invertion flag
        if (--this.wcnt <= 0) { // execute only if waiting counte<=0
            var i = 0;
            var res = true;
            while (res && this._pointer != null) {
                res = this._pointer.func(this); // execute CMLState function
                this._pointer = this._pointer.next; // increment pointer
                // too many loops error, script may has no wait.
                if (++i == CMLFiber._loopmax) {
                    throw new Error("CML Exection error. No wait command in the loop ?");
                }
            }
        }
        // run all children
        var elem = this._listChild.begin, elem_end = this._listChild.end;
        while (elem != elem_end) {
            elem = elem._onUpdate();
        }
        // update next fiber
        nextElem = this.next;
        // destroy if no children and no pointer
        if (this._pointer == null && this._listChild.isEmpty()) {
            this.destroy();
        }
        // return next fiber
        return nextElem;
    }
    // destroy by object
    _destroyByObject(obj) {
        // check all children
        var elem = this._listChild.begin, elem_end = this._listChild.end;
        while (elem != elem_end) {
            elem = elem._destroyByObject(obj);
        }
        elem = this.next;
        if (this._object === obj)
            this.destroy();
        return elem;
    }
    // push arguments
    /** @private _cml_fiber_internal */
    _unshiftArguments(argCount = 0, argArray = null) {
        var i, imax;
        if (argCount == 0 && (argArray == null || argArray.length == 0)) {
            this.varc.unshift(0);
        }
        else {
            if (argArray != null) {
                argCount = (argCount > argArray.length) ? argCount : argArray.length;
                this.varc.unshift(argCount);
                imax = this.vars.length;
                this.vars.length = imax + argCount;
                for (i = 0; i < imax; i++) {
                    this.vars[i + argCount] = this.vars[i];
                }
                for (i = 0; i < argCount; i++) {
                    this.vars[i] = (i < argArray.length) ? argArray[i] : 0;
                }
            }
            else {
                this.varc.unshift(argCount);
                imax = this.vars.length;
                this.vars.length = imax + argCount;
                for (i = 0; i < imax; i++) {
                    this.vars[i + argCount] = this.vars[i];
                }
                for (i = 0; i < argCount; i++) {
                    this.vars[i] = 0;
                }
            }
        }
    }
    // pop arguments
    /** @private _cml_fiber_internal */
    _shiftArguments() {
        this.vars.splice(0, this.varc.shift());
    }
    // push invertion
    /** @private _cml_fiber_internal */
    _unshiftInvertion(invt_) {
        this.istc.unshift(this.invt);
        this.invt = invt_;
    }
    // pop invertion
    /** @private _cml_fiber_internal */
    _shiftInvertion() {
        this.invt = this.istc.shift();
    }
    // return fiber's head angle (angle in this game's screen, the scroll direction is 0[deg]).
    /** @private _cml_fiber_internal */
    _getAngle(base) {
        switch (this.hopt) {
            case CMLState.HO_AIM:
                base = this._object.getAimingAngle(this._target, this.fx, this.fy);
                break; // based on the angle to the target
            case CMLState.HO_ABS:
                base = 0;
                break; // based on the angle in the absolute coordination
            case CMLState.HO_FIX:
                base = 0;
                break; // based on the fixed angle
            case CMLState.HO_REL:
                base = this._object.angleOnStage;
                break; // based on the angle of this object
            case CMLState.HO_PAR:
                base = this._object.angleParentOnStage;
                break; // based on the angle of the parent object
            case CMLState.HO_VEL:
                base = this._object.angleVelocity;
                break; // based on the angle of velocity
            case CMLState.HO_SEQ: break; // sequencial do nothing
            default:
                throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
        }
        return base + this.hang;
    }
    // return angle for rotation command(r, rc, cd). HO_AIM is aiming angle from the object.
    /** @private _cml_fiber_internal */
    _getAngleForRotationCommand() {
        switch (this.hopt) {
            case CMLState.HO_AIM: return this._object.getAimingAngle(this._target) + this.hang; // based on the angle to the target
            case CMLState.HO_ABS: return this.hang; // based on the angle in the absolute coordination
            case CMLState.HO_FIX: return this.hang; // based on the fixed angle
            case CMLState.HO_REL: return this._object.angleOnStage + this.hang; // based on the angle of this object
            case CMLState.HO_PAR: return this._object.angleParentOnStage + this.hang; // based on the angle of the parent object
            case CMLState.HO_VEL: return this._object.angleVelocity + this.hang; // based on the angle of velocity
            case CMLState.HO_SEQ: return this._object.angleOnStage + this.hang * this.chgt; // sequencial
            default:
                throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
        }
        //return 0;
    }
    // rotate object in minimum rotation (call from CMLState.r())
    /** @private _cml_fiber_internal */
    _isShortestRotation() {
        return (this.hopt == CMLState.HO_AIM || this.hopt == CMLState.HO_VEL || this.hopt == CMLState.HO_FIX);
    }
    // static function
    //------------------------------------------------------------
    /** @private _cml_fiber_internal destroy all */
    static _destroyAll() {
        var activeFibers = CMLFiber._rootFiber._listChild;
        if (activeFibers.isEmpty())
            return;
        var elem = activeFibers.begin, elem_end = activeFibers.end, elem_next;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem._finalize();
            elem = elem_next;
        }
    }
    // initialize, call from CannonML first
    /** @private */
    static _initialize(globalVariables_) {
        CMLFiber._globalVariables = globalVariables_;
        CMLFiber._destroyAll();
    }
    // 1 frame execution for all fibers
    /** @private _cml_fiber_internal */
    static _updateAll() {
        var activeFibers = CMLFiber._rootFiber._listChild;
        if (activeFibers.isEmpty())
            return;
        var elem = activeFibers.begin, elem_end = activeFibers.end;
        while (elem != elem_end) {
            elem = elem._onUpdate();
        }
    }
    // new fiber
    /** @private _cml_fiber_internal call only from CMLObject.execute() */
    static _newRootFiber(obj, seq, args_, invt_) {
        if (seq.isEmpty)
            return null;
        var fbr = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(CMLFiber._rootFiber._firstDest); // child of root
        fbr._initialize(CMLFiber._rootFiber, obj, seq, 0, invt_, args_); // the generation is counted from root
        return fbr;
    }
    /** @private _cml_fiber_internal call only from the '&#64;' command (CMLState._fiber()) */
    _newChildFiber(seq, id, invt_, args_, copyParam) {
        if (id != CMLFiber.ID_NOT_SPECIFYED)
            this.destroyChild(id); // destroy old fiber, when id is obtained
        if (seq.isEmpty)
            return null;
        var fbr = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(this._firstDest); // child of this
        if (!fbr._initialize(this, this._object, seq, id, invt_, args_)) { // the generation is counted from root
            throw new Error("CML Exection error. The '@' command calls depper than stac limit.");
        }
        if (copyParam)
            fbr._copy_param(this); // copy parameters from parent
        return fbr;
    }
    /** @private _cml_fiber_internal call only from the '&#64;ko' command (CMLState._fiber_destruction()) */
    _newDestFiber(seq, id, invt_, args_) {
        this._killDestFiber(id); // destroy old fiber
        if (seq.isEmpty)
            return null;
        var fbr = CMLFiber._freeFibers.pop() || new CMLFiber();
        // set destruction sequence
        fbr._seqWaitDest = fbr._seqWaitDest || CMLSequence.newWaitDestruction();
        fbr._seqWaitDest.next.jump = seq;
        fbr.insert_before(this._firstDest); // child of this
        this._firstDest = fbr; // overwrite first destruction fiber
        if (!fbr._initialize(this, this._object, fbr._seqWaitDest, id, invt_, args_)) {
            throw new Error("CML Exection error. The '@ko' command calls deeper than stac limit.");
        }
        return fbr;
    }
    /** @private _cml_fiber_internal call from the 'n', 'f' or '&#64;o' command (search in CMLState) */
    _newObjectFiber(obj, seq, invt_, args_) {
        if (seq.isEmpty)
            return null;
        var fbr = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(CMLFiber._rootFiber._firstDest); // child of root
        if (!fbr._initialize(this, obj, seq, 0, invt_, args_)) { // the generation is counted from this
            throw new Error("CML Exection error. The 'n', 'f' or '@o' command calls deeper than stac limit.");
        }
        return fbr;
    }
    // destroy all fibers
    /** @private _cml_fiber_internal call from CMLObject.halt() */
    static _destroyAllFibers(obj) {
        var fibers = CMLFiber._rootFiber._listChild, elem = fibers.begin, elem_end = fibers.end;
        while (elem != elem_end) {
            elem = elem._destroyByObject(obj);
        }
    }
}
// static variables
//------------------------------------------------------------
/** @private _cml_fiber_internal default target instance */
CMLFiber._defaultTarget = null;
// executable looping max limitation in 1 frame
/** @private _cml_fiber_internal */ CMLFiber._loopmax = 1024;
// executable gosub max limitation
/** @private _cml_fiber_internal */ CMLFiber._stacmax = 64;
// id not specifyed 
/** @private _cml_fiber_internal */ CMLFiber.ID_NOT_SPECIFYED = 0;
// global variables
CMLFiber._globalVariables = null;
CMLFiber._freeFibers = new CMLList(); // free list
CMLFiber._rootFiber = new CMLFiber(); // root fiber of active fibers
