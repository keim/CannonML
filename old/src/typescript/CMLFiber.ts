//----------------------------------------------------------------------------------------------------
// CML fiber class
//  Copyright (c) 2007 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------


import CMLSequence from "./CMLSequence"
import CMLObject from "./core/CMLObject"
import CMLBarrage from "./core/CMLBarrage"
import CMLBarrageElem from "./core/CMLBarrageElem"
import CMLList from "./core/CMLList"
import CMLListElem from "./core/CMLListElem"
import CMLRefer from "./core/CMLRefer"
import CMLState from "./core/CMLState"
import CMLString from "./core/CMLString"
import CMLGlobal from "./core/CMLGlobal"


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
export default class CMLFiber extends CMLListElem
{
// static variables
//------------------------------------------------------------
    /** @private _cml_fiber_internal default target instance */
    public static _defaultTarget:CMLObject = null;


    
    
// variables
//------------------------------------------------------------
    private _id: number         = 0;     // idstatic
    private _gene:number        = 0;     // child generation
    private _object:CMLObject   = null;  // running object
    private _object_id:number   = 0;     // running object id
    private _target:CMLObject   = null;  // target object
    private _target_id:number   = 0;     // target object id
    private _barrage:CMLBarrage = new CMLBarrage(); // bullet multiplyer
    private _seqWaitDest:CMLSequence = null;        // sequence to wait for object destruction

    /** @private _cml_fiber_internal */ public _pointer:CMLState = null; // executing pointer
    /** @private _cml_fiber_internal */ public _access_id:number = 0;       // access id
    
    // children list
    private _listChild:CMLList = new CMLList();
    private _firstDest:CMLListElem = this._listChild.end;  // first destruction fiber

    // setting parameters
    /** @private _cml_fiber_internal */ public fx  :number = 0;         // fiber position
    /** @private _cml_fiber_internal */ public fy  :number = 0;
    /** @private _cml_fiber_internal */ public chgt:number    = 0;         // pos/vel/rot changing time
    /** @private _cml_fiber_internal */ public hopt:number   = CMLState.HO_AIM;    // head option
    /** @private _cml_fiber_internal */ public hang:number = 0;         // head angle [degree]
    /** @private _cml_fiber_internal */ public fang:number = 0;         // previous fired angle (due to the compatiblity with bulletML)
    /** @private _cml_fiber_internal */ public bul :CMLBarrageElem = new CMLBarrageElem();   // primary setting of bullet
    
    /** @private _cml_fiber_internal */ public invt:number   = 0;         // invertion flag (0=no, 1=x_reverse, 2=y_reverse, 3=xy_reverse)
    /** @private _cml_fiber_internal */ public wtm1:number    = 1;         // waiting time for "w"
    /** @private _cml_fiber_internal */ public wtm2:number    = 1;         // waiting time for "~"
    /** @private _cml_fiber_internal */ public seqSub :CMLSequence = null; // previous calling sequence from "&"
    /** @private _cml_fiber_internal */ public seqExec:CMLSequence = null; // previous calling sequence from "@"
    /** @private _cml_fiber_internal */ public seqNew :CMLSequence = null; // previous calling sequence from "n"
    /** @private _cml_fiber_internal */ public seqFire:CMLSequence = null; // previous calling sequence from "f"

    // runtime parameters
    /** @private _cml_fiber_internal */ public wcnt:number   = 0;            // waiting counter
    /** @private _cml_fiber_internal */ public lcnt:any[] = new Array();  // loop counter
    /** @private _cml_fiber_internal */ public jstc:any[] = new Array();  // sub routine call stac
    /** @private _cml_fiber_internal */ public istc:any[] = new Array();  // invertion flag stac
    /** @private _cml_fiber_internal */ public vars:any[] = new Array();  // arguments
    /** @private _cml_fiber_internal */ public varc:any[] = new Array();  // argument counts
    
    // executable looping max limitation in 1 frame
    /** @private _cml_fiber_internal */ public static _loopmax:number = 1024;

    // executable gosub max limitation
    /** @private _cml_fiber_internal */ public static _stacmax:number = 64;

    // id not specifyed 
    /** @private _cml_fiber_internal */ public static ID_NOT_SPECIFYED:number = 0;

    // global variables
    private static _globalVariables:CMLGlobal = null;
    private static _freeFibers:CMLList  = new CMLList();    // free list
    private static _rootFiber:CMLFiber = new CMLFiber();    // root fiber of active fibers




// properties
//------------------------------------------------------------
    /** Maximum limitation of the executable looping count in 1 frame. @default 1024*/
    public static set maxLoopInFrame(lm:number) { CMLFiber._loopmax = lm; }
    /** Maximum limitation of the executable gosub nest count. @default 64*/
    public static set maxStacCount(sc:number)   { CMLFiber._stacmax = sc; }

    /** CMLObject that this fiber controls. */
    public get object()  : CMLObject  { return this._object; }
    /** CMLObject that this fiber targets to. */
    public get target()  : CMLObject  { return this._target; }
    /** CMLBarrage that this fiber uses. */
    public get barrage() : CMLBarrage { return this._barrage; }
    /** Angle of this fiber. The value is set by "h*" commands. */
    public get angle()   : number     { return this._getAngle(0) + CMLFiber._globalVariables.scrollAngle; }
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
    public get string()  : string { 
        var stateString:CMLString = <CMLString>this._pointer.next ;
        return (stateString != null) ? stateString._string : null;
    }
    /** Sequence argument. <br/>
     *  This property is used in callback function of CMLSequence.registerUserCommand() with the option 'requireSequence' is true.<br/>
     *  When the next statement of user command is not sequence. outputs parsing error. Or, when the next statement is '{.}', returns null.
     */
    public get sequence() : CMLSequence {
        var stateRefer:CMLRefer = <CMLRefer>this._pointer.next ;
        return (stateRefer != null) ? (<CMLSequence>(stateRefer.jump) ) : null;
    }
    /** Is active ? When this property shows false, this fiber is already destroyed. */
    public get isActive() : boolean { return (this._object != null); }
    /** Is sequence executing ? */
    public get isExecuting() : boolean { return (this._pointer != null); }
    /** Does this fiber have any children ? */
    public get isParent() : boolean { return (!this._listChild.isEmpty()); }
    /** Does this fiber have any destruction fiber ? */
    public get hasDestFiber() : boolean { return (this._firstDest != this._listChild.end); }
    
    /** @private */
    public set target(t:CMLObject) { this._setTarget((t==null)?CMLFiber._defaultTarget:t); }


    
    
// constructor
//------------------------------------------------------------
    /** <b>You cannot create new CMLFiber().</b> You can get CMLFiber instance only from CMLObject.execute().
     *  @see CMLObject#execute()
     */
    constructor()
    {
        super();
        this._gene = 0;
    }




// operations
//------------------------------------------------------------
    /** Stop the fiber.<br/>
     *  This function stops all child fibers also.
     */
    public destroy() : void
    {
        if (this.isActive) this._finalize();
    }
    



// operations to children
//------------------------------------------------------------
    /** Stop all child fibers. */
    public destroyAllChildren() : void
    {
        var elem     :any = this._listChild.begin,
            elem_end :any = this._listChild.end,
            elem_next:any;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem.destroy();
            elem = elem_next;
        }
    }
    

    /** Stop child fiber with specifyed id. */
    public destroyChild(child_id:number) : boolean
    {
        var fbr:CMLFiber = this.findChild(child_id);
        if (fbr != null) {
            fbr.destroy();
            return true;
        }
        return false;
    }


    /** Find child fiber with specifyed id. */
    public findChild(child_id:number) : CMLFiber
    {
        var elem    :any = this._listChild.begin,
            elem_end:any = this._firstDest;
        while (elem != elem_end) {
            if (elem._access_id == child_id) return elem;
            elem = elem.next;
        }
        return null;
    }


    /** kill destruction fiber with specifyed id. @private */
    private _killDestFiber(destructionStatus:number) : void
    {
        if (this.hasDestFiber) {
            var fbr:any = this._firstDest;

            if (fbr._access_id == destructionStatus) {
                this._firstDest = fbr.next;
                fbr.destroy();
            } else {
                var elem    :any = this._firstDest.next, 
                    elem_end:any = this._listChild.end;
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
    public getVeriable(idx:number) : number
    {
        return (idx < this.varc[0]) ? this.vars[idx] : 0;
    }


    /** Get the loop counter of this fiber. 
     *  @param Nested loop index. The index of 0 means the most inner loop, and 1 means the loop 1 outside.
     *  @return Loop count. Start at 0, and end at [loop_count]-1.
     */
    public getLoopCounter(nest:number=0) : number
    {
        return (this.lcnt.length > nest) ? this.lcnt[nest] : 0;
    }
    
    
    /** Get the interval value (specifyed by "i" command) of this fiber. 
     *  @return Interval.
     */
    public getInterval() : number
    {
        return this.chgt;
    }
    



// internal functions
//------------------------------------------------------------
    // initializer (call from CMLState._fiber())
    private _initialize(parent:CMLFiber, obj:CMLObject, seq:CMLSequence, access_id_:number, invt_:number=0, args_:any=null) : boolean
    {
        this._setObject(obj);            // set running object
        this._access_id = access_id_;    // access id
        this._gene = parent._gene + 1;   // set generation
        this._clear_param();             // clear parameters
        this.invt = invt_;               // set invertion flag

        this._pointer = <CMLState>seq.next;        // set cml pointer
        this.wcnt = 0;                       // reset waiting counter
        this.lcnt.length = 0;                // clear loop counter stac
        this.jstc.length = 0;                // clear sub-routine call stac
        this.istc.length = 0;                // clear invertion stac
        
        this._firstDest = this._listChild.end;    // reset last child
        
        this._unshiftArguments(seq.require_argc, args_);  // set argument

        return (this._gene < CMLFiber._stacmax);
    }
    
    
    // finalizer 
    private _finalize() : void
    {
        this.destroyAllChildren();

        this._pointer = null;
        this._object = null;
        this._target = null;
        ++this._id;

        this.remove_from_list();
        CMLFiber._freeFibers.push(this);
    }


    // set object
    private _setObject(obj:CMLObject) : void { this._object = obj; this._object_id = obj.id; }
    private _setTarget(tgt:CMLObject) : void { this._target = tgt; this._target_id = tgt.id; }

    
    // clear parameters
    private _clear_param() : void
    {
        this._setTarget(CMLFiber._defaultTarget); // set target object
        
        this.fx   = 0;       // fiber position
        this.fy   = 0;
        this.chgt = 0;       // changing time
        this.hopt = CMLState.HO_AIM;  // head option
        this.hang = 0;       // head angle [degree]
        this.fang = 0;       // previous fired angle (due to the compatiblity with bulletML)
        
        this.bul.setSequence(1,0,0,0);
        this._barrage.clear();
        
        this.invt = 0;       // invertion flag
        this.wtm1 = 1;       // waiting time for "w"
        this.wtm2 = 1;       // waiting time for "~"
        
        this.vars.length = 0;
        this.varc.length = 0;

        var nop:CMLSequence = CMLSequence.nop();
        this.seqSub  = nop;
        this.seqExec = nop;
        this.seqNew  = nop;
        this.seqFire = nop;
    }


    // copy parameters
    private _copy_param(src:CMLFiber) : CMLFiber
    {
        this._setTarget(src.target);  // set target object

        this.fx   = src.fx;      // fiber position
        this.fy   = src.fy;
        this.chgt = src.chgt;    // changing time
        this.hopt = src.hopt;    // head option
        this.hang = src.hang;    // head angle [degree]
        this.fang = src.fang;    // previous fired angle (due to the compatiblity with bulletML)
        
        this.bul.copy(src.bul);
        
        this._barrage.appendCopyOf(src._barrage);

        this.wtm1 = src.wtm1;    // waiting time for "w"
        this.wtm2 = src.wtm2;    // waiting time for "~"

        this.seqSub  = src.seqSub;
        this.seqExec = src.seqExec;
        this.seqNew  = src.seqNew;
        this.seqFire = src.seqFire;

        return this;
    }
    
    
    // execution in 1 frame and returns next fiber
    private _onUpdate() : CMLListElem
    {
        // next fiber
        var nextElem:CMLListElem = this.next;
        
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
        CMLState._setInvertionFlag(this.invt);           // set invertion flag
        if (--this.wcnt <= 0) {                          // execute only if waiting counte<=0
            var i:number = 0;
            var res:boolean = true;
            while (res && this._pointer!=null) {
                res = this._pointer.func(this);                 // execute CMLState function
                this._pointer = <CMLState>this._pointer.next;   // increment pointer

                // too many loops error, script may has no wait.
                if (++i == CMLFiber._loopmax) { throw new Error("CML Exection error. No wait command in the loop ?"); }
            }
        }
        
        // run all children
        var elem    :any = this._listChild.begin,
            elem_end:any = this._listChild.end;
        while (elem!=elem_end) {
            elem = elem._onUpdate();
        }

        // update next fiber
        nextElem = this.next;
        
        // destroy if no children and no pointer
        if (this._pointer==null && this._listChild.isEmpty()) {
            this.destroy();
        }

        // return next fiber
        return nextElem;
    }


    // destroy by object
    private _destroyByObject(obj:CMLObject) : CMLListElem
    {
        // check all children
        var elem    :any = this._listChild.begin,
            elem_end:any = this._listChild.end;
        while (elem!=elem_end) {
            elem = elem._destroyByObject(obj);
        }

        elem = this.next;
        if (this._object === obj) this.destroy();
        return elem;
    }
    
    
    
    // push arguments
    /** @private _cml_fiber_internal */ 
    public _unshiftArguments(argCount:number=0, argArray:any[]=null) : void
    {
        var i:number, imax:number;
        
        if (argCount==0 && (argArray==null || argArray.length==0)) {
            this.varc.unshift(0);
        } else {
            if (argArray!=null) {
                argCount = (argCount > argArray.length) ? argCount : argArray.length;
                this.varc.unshift(argCount);
                imax = this.vars.length;
                this.vars.length = imax + argCount;
                for (i=0; i<imax; i++) { this.vars[i+argCount] = this.vars[i]; }
                for (i=0; i<argCount; i++) { this.vars[i] = (i < argArray.length) ? argArray[i] : 0; }
            } else {
                this.varc.unshift(argCount);
                imax = this.vars.length;
                this.vars.length = imax + argCount;
                for (i=0; i<imax; i++) { this.vars[i+argCount] = this.vars[i]; }
                for (i=0; i<argCount; i++) { this.vars[i] = 0; }
            }
        }
    }
    
    
    // pop arguments
    /** @private _cml_fiber_internal */ 
    public _shiftArguments() : void
    {
        this.vars.splice(0, this.varc.shift());
    }

    
    // push invertion
    /** @private _cml_fiber_internal */ 
    public _unshiftInvertion(invt_:number) : void
    {
        this.istc.unshift(this.invt);
        this.invt = invt_;
    }

    
    // pop invertion
    /** @private _cml_fiber_internal */ 
    public _shiftInvertion() : void
    {
        this.invt = this.istc.shift();
    }
    
    
    // return fiber's head angle (angle in this game's screen, the scroll direction is 0[deg]).
    /** @private _cml_fiber_internal */ 
    public _getAngle(base:number) : number
    {
        switch(this.hopt) {
        case CMLState.HO_AIM: base = this._object.getAimingAngle(this._target, this.fx, this.fy); break; // based on the angle to the target
        case CMLState.HO_ABS: base = 0;                                       break; // based on the angle in the absolute coordination
        case CMLState.HO_FIX: base = 0;                                       break; // based on the fixed angle
        case CMLState.HO_REL: base = this._object.angleOnStage;               break; // based on the angle of this object
        case CMLState.HO_PAR: base = this._object.angleParentOnStage;         break; // based on the angle of the parent object
        case CMLState.HO_VEL: base = this._object.angleVelocity;              break; // based on the angle of velocity
        case CMLState.HO_SEQ:                                                 break; // sequencial do nothing
        default:
            throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
        }
        return base + this.hang;
    }
    
    
    // return angle for rotation command(r, rc, cd). HO_AIM is aiming angle from the object.
    /** @private _cml_fiber_internal */ 
    public _getAngleForRotationCommand() : number
    {
        switch(this.hopt) {
        case CMLState.HO_AIM: return this._object.getAimingAngle(this._target) + this.hang;  // based on the angle to the target
        case CMLState.HO_ABS: return this.hang;                                         // based on the angle in the absolute coordination
        case CMLState.HO_FIX: return this.hang;                                         // based on the fixed angle
        case CMLState.HO_REL: return this._object.angleOnStage + this.hang;             // based on the angle of this object
        case CMLState.HO_PAR: return this._object.angleParentOnStage + this.hang;       // based on the angle of the parent object
        case CMLState.HO_VEL: return this._object.angleVelocity + this.hang;            // based on the angle of velocity
        case CMLState.HO_SEQ: return this._object.angleOnStage + this.hang * this.chgt; // sequencial
        default:
            throw new Error("BUG!! unknown error in CMLFiber._getAngle()"); // ???
        }
        //return 0;
    }
    
    
    // rotate object in minimum rotation (call from CMLState.r())
    /** @private _cml_fiber_internal */ 
    public _isShortestRotation() : boolean
    {
        return (this.hopt==CMLState.HO_AIM || this.hopt==CMLState.HO_VEL || this.hopt==CMLState.HO_FIX);
    }




// static function
//------------------------------------------------------------
    /** @private _cml_fiber_internal destroy all */
    public static _destroyAll() : void
    {
        var activeFibers:CMLList = CMLFiber._rootFiber._listChild;
        if (activeFibers.isEmpty()) return;
        
        var elem     :any = activeFibers.begin,
            elem_end :any = activeFibers.end,
            elem_next:any;
        while (elem != elem_end) {
            elem_next = elem.next;
            elem._finalize();
            elem = elem_next 
        }
    }

    // initialize, call from CannonML first
    /** @private */
    public static _initialize(globalVariables_:CMLGlobal) : void
    {
        CMLFiber._globalVariables = globalVariables_;
        CMLFiber._destroyAll();
    }
    

    // 1 frame execution for all fibers
    /** @private _cml_fiber_internal */
    public static _updateAll() : void
    {
        var activeFibers:CMLList = CMLFiber._rootFiber._listChild;
        if (activeFibers.isEmpty()) return;
        
        var elem    :any = activeFibers.begin,
            elem_end:any = activeFibers.end;
        while (elem != elem_end) {
            elem = elem._onUpdate();
        }
    }

    
    // new fiber
    /** @private _cml_fiber_internal call only from CMLObject.execute() */
    public static _newRootFiber(obj:CMLObject, seq:CMLSequence,  args_:any[],  invt_:number) : CMLFiber
    {
        if (seq.isEmpty) return null;
        var fbr:any = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(CMLFiber._rootFiber._firstDest);                   // child of root
        fbr._initialize(CMLFiber._rootFiber, obj, seq, 0, invt_, args_);     // the generation is counted from root
        return fbr;
    }


    /** @private _cml_fiber_internal call only from the '&#64;' command (CMLState._fiber()) */ 
    public _newChildFiber(seq:CMLSequence, id:number, invt_:number, args_:any[], copyParam:boolean) : CMLFiber
    {
        if (id != CMLFiber.ID_NOT_SPECIFYED) this.destroyChild(id);                   // destroy old fiber, when id is obtained
        if (seq.isEmpty) return null;
        var fbr:any = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(this._firstDest);                                  // child of this
        if (!fbr._initialize(this, this._object, seq, id, invt_, args_)) {   // the generation is counted from root
            throw new Error("CML Exection error. The '@' command calls depper than stac limit.");
        }
        if (copyParam) fbr._copy_param(this);                           // copy parameters from parent
        return fbr;
    }
    

    /** @private _cml_fiber_internal call only from the '&#64;ko' command (CMLState._fiber_destruction()) */
    public _newDestFiber(seq:CMLSequence, id:number, invt_:number, args_:any[]) : CMLFiber
    {
        this._killDestFiber(id);                                          // destroy old fiber
        
        if (seq.isEmpty) return null;
        var fbr:any = CMLFiber._freeFibers.pop() || new CMLFiber();
        // set destruction sequence
        fbr._seqWaitDest = fbr._seqWaitDest || CMLSequence.newWaitDestruction();
        fbr._seqWaitDest.next.jump = seq;
        
        fbr.insert_before(this._firstDest);                                  // child of this
        this._firstDest = fbr;                                               // overwrite first destruction fiber
        if (!fbr._initialize(this, this._object, fbr._seqWaitDest, id, invt_, args_)) {
            throw new Error("CML Exection error. The '@ko' command calls deeper than stac limit.");
        }
        return fbr;
    }


    /** @private _cml_fiber_internal call from the 'n', 'f' or '&#64;o' command (search in CMLState) */ 
    public _newObjectFiber(obj:CMLObject, seq:CMLSequence, invt_:number, args_:any[]) : CMLFiber
    {
        if (seq.isEmpty) return null;
        var fbr:any = CMLFiber._freeFibers.pop() || new CMLFiber();
        fbr.insert_before(CMLFiber._rootFiber._firstDest);                       // child of root
        if (!fbr._initialize(this, obj, seq, 0, invt_, args_)) {        // the generation is counted from this
            throw new Error("CML Exection error. The 'n', 'f' or '@o' command calls deeper than stac limit.");
        }
        return fbr;
    }
    
    
    // destroy all fibers
    /** @private _cml_fiber_internal call from CMLObject.halt() */
    public static _destroyAllFibers(obj:CMLObject) : void
    {
        var fibers  :CMLList = CMLFiber._rootFiber._listChild,
            elem    :any = fibers.begin,
            elem_end:any = fibers.end;
        while (elem != elem_end) {
            elem = elem._destroyByObject(obj);
        }
    }
}
