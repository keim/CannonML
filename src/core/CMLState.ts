import { Fiber } from "../CMLFiber.js"
import { Sequence } from "../CMLSequence.js"
import type { BarrageElem } from "./CMLBarrageElem.js"
import type { CMLObject } from "./CMLObject.js"
import type { Global } from "./CMLGlobal.js"
import { Formula } from "./CMLFormula.js"
import { ListElem } from "./CMLListElem.js"

//----------------------------------------------------------------------------------------------------
// CML statement class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** Command executer: returns true to continue to the next statement in the same frame. */
export type StateFunc = (state: State, $: number[], fiber: Fiber, object: CMLObject) => boolean

interface OperatorDef {
    argc: number
    type: number
    func: StateFunc
}

/** @private */
export class State extends ListElem {
    key: string
    /** arguments */
    $: number[]
    func: StateFunc
    type: number
    jump: State | null
    formula: Formula
    constructor(key?: string | null) {
        super();
        if (key) {
            const ope = State.operators[key];
            if (!ope)
                throw Error(key + " command not defined !");
            this.key = key;
            this.$ = new Array(ope.argc).fill(0);
            this.func = ope.func;
            this.type = ope.type;
        } else {
            this.key = "";
            this.$ = [];
            this.func = this._nop;
            this.type = State.ST_NORMAL;
        }
        this.jump = null;
        this.formula = new Formula();
    }
    /*override*/
    clear() {
        this.$.length = 0;
        this.jump = null;
        super.clear();
    }
    /** finalize after all arguments are set */
    construct() {
        if (!this.formula.construct()) return false;
        Object.assign(this.$, this.formula.calcStatic());
        return true;
    }
    /** execute */
    execute(fiber: Fiber) {
        if (!this.formula.isStatic) {
            Object.assign(this.$, this.formula.calcDynamic(fiber));
        }
        return this.func(this, this.$, fiber, fiber.object);
    }
    /** @private initialze call from CannonML first of all */
    static _initialize(globalVariables_: Global) {
        State._globalVariables = globalVariables_;
    }
    // position of fiber
    _setHeadAngle(fiber: Fiber, option: number, angleInDeg: number) {
        const angleInRad = (option == State.HO_SEQ) ?
                            fiber._invertRotation(angleInDeg*0.017453292519943295) :
                            fiber._invertAngle(angleInDeg*0.017453292519943295);
        fiber.headAngleOption = option;
        fiber.headAngle = angleInRad;
    }
    // command executer
    //------------------------------------------------------------
    // no operation or end
    _nop(_state?: State, _$?: number[], _fiber?: Fiber, _object?: CMLObject) {
        return true;
    }
    // initialize interpolation
    _initialize_interplation(fiber: Fiber) {
        const _chgt = fiber.chgt;
        fiber.chgt = 0;
        while (fiber._pointer.next.type & State.STF_BE_INTERPOLATED) {
            fiber._pointer = fiber._pointer.next;
            fiber._pointer.execute(fiber);
        }
        fiber.chgt = _chgt;
        return true;
    }
    // statement for rapid fire
    _rapid_fire(fiber: Fiber) {
        // end
        if (fiber.bul.isEnd())
            return false;
        // create new bullet object and initialize
        this._create_multi_bullet(fiber, fiber.wtm1, Boolean(fiber.wtm2), null);
        // calc bullet and set wait counter
        fiber.bul.update();
        fiber.wcnt = fiber.bul.interval;
        // repeat
        fiber._pointer = Sequence.rapid();
        return false;
    }
    // statement to wait for destruction
    _wait4destruction(state: State, _$: number[], fiber: Fiber, _object: CMLObject) {
        if (fiber.object.destructionStatus == fiber._access_id) {
            fiber._pointer = state.jump!;
            return true;
        }
        return false;
    }
    // run as subroutine
    _gosub(fiber: Fiber) {
        // execution error
        if (fiber.jstc.length > Fiber._stacmax) 
            throw new Error("CML Execution error. '&' call stac overflow.");
        const ref = this.next; // next statement is referential sequence
        fiber.jstc.push(ref);
        fiber._pushInvertion(fiber.invertFlag);
        fiber._pushVariables(ref.$);
        fiber._pointer = ref.jump!;
        return true;
    }
    // run new fiber
    _fiber(fiber: Fiber, fiber_id: number) {
        const ref = this.next; // next statement is referential sequence
        const seq = ref.jump || fiber.seqFiber; // executing sequence
        fiber._newChildFiber(seq, fiber_id, fiber.invertFlag, ref.$, (seq.type == State.ST_NO_LABEL)); // create and initialize fiber
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
        return true;
    }
    // run new destruction fiber
    _fiber_destruction(fiber: Fiber, destStatus: number) {
        const ref = this.next; // next statement is referential sequence
        const seq = ref.jump || fiber.seqFiber; // executing sequence
        fiber._newDestFiber(seq, destStatus, fiber.invertFlag, ref.$); // create and initialize destruction fiber
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
        return true;
    }
    // run new fiber on child object
    _fiber_child(fiber: Fiber, obj: CMLObject, object_id: number) {
        const ref = this.next; // next statement is referential sequence
        const seq = ref.jump || fiber.seqFiber; // executing sequence
        obj.findAllChildren(object_id).forEach((child: CMLObject)=>fiber._newObjectFiber(child, seq, fiber.invertFlag, ref.$));
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
        return true;
    }
    // fire
    _fire(fiber: Fiber, access_id: number, isParts: boolean) {
        // next statement is sequence referene 
        const ref = this.next;
        // update fire pointer, ref.jump shows executing sequence
        if (ref.jump) fiber.seqFired = ref.jump;
        // create multi bullet
        this._create_multi_bullet(fiber, access_id, isParts, ref.$);
        // skip next statement
        fiber._pointer = ref;
    }
    // fire reflective implement
    _create_multi_bullet(fiber: Fiber, access_id: number, isParts: boolean, args: number[] | null) {
        // creating center position
        let cx: number, cy: number;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (isParts) {
            cx = fiber.fx;
            cy = fiber.fy;
        } else {
            const ang = fiber.object.angleOnScreen;
            cx = fiber.object.projected.x + Math.cos(ang) * fiber.fx - Math.sin(ang) * fiber.fy;
            cy = fiber.object.projected.y + Math.sin(ang) * fiber.fx + Math.cos(ang) * fiber.fy;
        }
        // calculate angle
        fiber.firedAngle = fiber._getAngle(fiber.firedAngle);
        // create bullets
        if (fiber.barrage.qrtList.isEmpty()) {
            // create single bullet
            this.__create_bullet(fiber, access_id, isParts, args, cx, cy, fiber.firedAngle + fiber.bul.angle, fiber.bul.speed);
        }
        else {
            // reflexive call
            fiber.bul.next = fiber.barrage.qrtList.head;
            this.__reflexive_call(fiber, access_id, isParts, args, cx, cy, fiber.bul, fiber.barrage.qrtList.end);
        }
    }
    // create object reflexively
    __reflexive_call(fiber: Fiber, access_id: number, isParts: boolean, args: number[] | null, cx: number, cy: number, bul: BarrageElem, end: ListElem) {
        if (bul.next.interval == 0) {
            const b = bul.next;
            if (b.next == end) {
                // create bullet
                for (b.init(bul); !b.isEnd(); b.update()) 
                    this.__create_bullet(fiber, access_id, isParts, args, cx, cy, fiber.firedAngle + b.angle, b.speed);
            }
            else {
                // reflexive call
                for (b.init(bul); !b.isEnd(); b.update()) 
                    this.__reflexive_call(fiber, access_id, isParts, args, cx, cy, b, end);
            }
        }
        else {
            // create new fiber and initialize
            const newfiber = fiber._newChildFiber(Sequence.rapid(), 0, fiber.invertFlag, null, false)!;
            // copy bullet setting and bullet multiplyer
            newfiber.bul.copy(bul.next);
            newfiber.bul.init(bul);
            for (let elem = bul.next.next; elem != end; elem = elem.next) 
                newfiber.barrage._appendElementCopyOf(elem);
            // copy other parameters
            newfiber.fx = fiber.fx;
            newfiber.fy = fiber.fy;
            newfiber.headAngleOption = fiber.headAngleOption;
            newfiber.headAngle = (fiber.headAngleOption == State.HO_SEQ) ? 0 : fiber.headAngle;
            newfiber.firedAngle = fiber.firedAngle;
            newfiber.seqFired = fiber.seqFired;
            newfiber.wtm1 = access_id;
            newfiber.wtm2 = (isParts) ? 1 : 0;
        }
    }
    // internal function to create object
    __create_bullet(fiber: Fiber, access_id: number, isParts: boolean, args: number[] | null, cx: number, cy: number, angle: number, velocity: number) {
        const vx = velocity * Math.cos(angle),
              vy = velocity * Math.sin(angle),
              obj = fiber.object.onFireObject(fiber.seqFired);
        if (!obj) return;
        obj._initialize(fiber.object, isParts, access_id, cx, cy, 0, vx, vy, angle);  // create object
        fiber._newObjectFiber(obj, fiber.seqFired, fiber.invertFlag, args);   // create fiber
    }

    // Status Types
    /** @private */
    static ST_NORMAL = 0; // normal command
    /** @private */
    static ST_REFER = 1; // refer sequence
    /** @private */
    static ST_LABEL = 2; // labeled sequence define "#*.{...}"
    /** @private */
    static ST_NO_LABEL = 3; // non-labeled sequence define "{...}"
    /** @private */
    static ST_RESTRICT = 4; // restrict to put reference after this command ("&","@*","n*")
    /** @private */
    static ST_BLOCKSTART = 5; // loop "["
    /** @private */
    static ST_IF = 6; // if "?"
    /** @private */
    static ST_ELSE = 7; // else ":"
    /** @private */
    static ST_BLOCKEND = 8; // block end "]"
    /** @private */
    static ST_INTERPOLATE = 9; // interpolate "~"
    /** @private */
    static ST_STRING = 11; // string
    /** @private */
    static ST_END = 12; // end
    /** @private */
    static ST_BARRAGE = 13; // multiple barrage
    /** @private */
    static ST_W4D = 14; // wait for destruction
    /** @private */
    static ST_RAPID = 15; // rapid fire sequence
    /** @private */
    static ST_INIT4INT = 16; // initialize parameters for interpolation
    /** @private */
    static STF_CALLREF = 32; // flag to require reference after this command ("&","@*","f*","n*")
    /** @private */
    static STF_BE_INTERPOLATED = 64; // flag under interpolation effect
    // Head angle Option
    /** @private */
    static HO_ABS = 0; // angle is based on scrolling direction
    /** @private */
    static HO_PAR = 1; // angle is based on direction to parent
    /** @private */
    static HO_AIM = 2; // angle is based on direction to target
    /** @private */
    static HO_REL = 3; // angle is based on object angle
    /** @private */
    static HO_VEL = 4; // amgle is based on moving direction
    /** @private */
    static HO_SEQ = 5; // angle is calculated from previous frame
    // command regular expressions
    static command_rex: string = "(\\[|\\]|\\}|\\?|:|w\\?|w|~|pd|px|py|pz|p|vd|vx|vy|vz|v|ad|ax|ay|az|a|rc|r|kf|ko|i|my|mx|cd|cs|@ko|@o|fc|f|qx|qy|q|bm|bs|br|bv|ha|ho|hp|ht|hv|hs|td|tp|to)";
    // global variables
    static _globalVariables: Global = null!;
    // operators
    static operators: Record<string, OperatorDef> = {
    //---- wait
        "w":{ // wait
            argc: 1,
            type: State.ST_NORMAL,
            func(state, $, fiber) {
                if (state.formula.answerCount > 0)
                    fiber.wtm1 = $[0];
                fiber.wcnt = fiber.wtm1;
                return false;
            }
        },
        "w?":{ // waitif
            argc: 1,
            type: State.ST_NORMAL,
            func(state, $, fiber) {
                if ($[0]) { // wait if $[0] != 0
                    fiber._pointer = state.prev;
                    return false;
                }
                return true;
            }
        },
    //---- sequence operation
        "}":{ // return
            argc: 0,
            type: State.ST_END,
            func(_state, _$, fiber) {
                if (fiber.jstc.length > 0) { // pop jump stac
                    fiber._popInvertion();
                    fiber._popVariables();
                    fiber._pointer = fiber.jstc.pop()!;
                }
                return true;
            }
        },
        "[":{ // block or loop start
            argc: 1,
            type: State.ST_BLOCKSTART,
            func(_state, _$, fiber) {
                fiber.lcnt.unshift(0);
                return true;
            }
        },
        "?":{ // if branch
            argc: 1,
            type: State.ST_IF,
            func(state, _$, fiber) {
                // loopconter < 0 means branch. true=-1, false=-2
                fiber.lcnt[0] = (state.prev.$[0]) ? -1: -2;
                if (fiber.lcnt[0] == -2) 
                    fiber._pointer = state.jump!.prev;
                return true;
            }
        },
        ":":{ // else if 
            argc: 1,
            type: State.ST_ELSE,
            func(state, _$, fiber) {
                if (fiber.lcnt[0] == -1) {
                    fiber._pointer = state.jump!;
                    while (fiber._pointer.type != State.ST_BLOCKEND)
                        fiber._pointer = fiber._pointer.jump!;
                    fiber._pointer = fiber._pointer.prev;
                } else 
                if (fiber.lcnt[0] == -2) {
                    if (state.formula.answerCount > 0) {
                        // loopconter < 0 means branch. true=-1, false=-2
                        fiber.lcnt[0] = (state.prev.$[0]) ? -1: -2;
                        if (fiber.lcnt[0] == -2) 
                            fiber._pointer = state.jump!.prev;
                    }
                }
                return true;
            }
        },
        "]":{ // block or loop end
            argc: 1,
            type: State.ST_BLOCKEND,
            func(state, $, fiber) {
                if (fiber.lcnt[0] >= 0)  { // loopconter < 0 means branch
                    var lmax = Math.floor($[0] || state.jump!.$[0]);
                    if (++fiber.lcnt[0] != lmax) { // jump to block_start
                        fiber._pointer = state.jump!;
                        return true;
                    }
                }
                fiber.lcnt.shift();
                return true;
            }
        },
    //---- interpolation
        "i":{ // interpolating frames
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, fiber) {
                fiber.chgt = Math.floor($[0]);
                fiber.wtm2 = fiber.chgt;
                return true;
            }
        },
        "~":{ // wait with interpolation
            argc: 0,
            type: State.ST_INTERPOLATE,
            func(_state, _$, fiber) {
                while (fiber._pointer.next.type & State.STF_BE_INTERPOLATED) {
                    fiber._pointer = fiber._pointer.next;
                    fiber._pointer.execute(fiber);
                }
                fiber.wcnt = fiber.wtm2;
                return (fiber.wcnt == 0);
            }
        },
    //---- position
        "p":{
            argc: 3,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber, object) {
                if (state.formula.answerCount == 1) {
                    const angle = fiber._getAngle(object.anglePositionOnScreen, false);
                    object.setPositionByDirection(angle, $[0], $[1], fiber.chgt);
                } else
                    object.setPosition(fiber._invertX($[0]), fiber._invertY($[1]), $[2], fiber.chgt);
                return true;
            }
        },
        "px":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setPositionX(fiber._invertX($[0]), fiber.chgt);
                return true;
            }
        },
        "py":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setPositionY(fiber._invertY($[0]), fiber.chgt);
                return true;
            }
        },
        "pz":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setPositionZ($[0], fiber.chgt);
                return true;
            }
        },
        "pd":{
            argc: 2,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.anglePositionOnScreen, false);
                object.setPositionByDirection(angle, $[0], $[1], fiber.chgt);
                return true;
            }
        },
    //---- velocity
        "v":{
            argc: 3,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber, object) {
                if (state.formula.answerCount == 1) {
                    const angle = fiber._getAngle(object.angleVelocityOnScreen, false);
                    object.setVelocityByDirection(angle, $[0], $[1], fiber.chgt);
                } else
                    object.setVelocity(fiber._invertX($[0]), fiber._invertY($[1]), $[2], fiber.chgt);
                return true;
            }
        },
        "vx":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setVelocityX(fiber._invertX($[0]), fiber.chgt);
                return true;
            }
        },
        "vy":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setVelocityY(fiber._invertY($[0]), fiber.chgt);
                return true;
            }
        },
        "vz":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setVelocityZ($[0], fiber.chgt);
                return true;
            }
        },
        "vd":{
            argc: 2,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.angleVelocityOnScreen, false);
                object.setVelocityByDirection(angle, $[0], $[1], fiber.chgt);
                return true;
            }
        },
    //---- accelaration
        "a":{
            argc: 3,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber, object) {
                if (state.formula.answerCount == 1) {
                    const angle = fiber._getAngle(object.angleAccelOnScreen, false);
                    object.setAccelByDirection(angle, $[0], $[1]);
                } else
                    object.setAccel(fiber._invertX($[0]), fiber._invertY($[1]), $[2]);
                return true;
            }
        },
        "ax":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setAccelX(fiber._invertX($[0]));
                return true;
            }
        },
        "ay":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setAccelY(fiber._invertY($[0]));
                return true;
            }
        },
        "az":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, _fiber, object) {
                object.setAccelZ($[0]);
                return true;
            }
        },
        "ad":{
            argc: 2,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.angleAccelOnScreen, false);
                object.setAccelByDirection(angle, $[0], $[1]);
                return true;
            }
        },
    //---- rotation
        "r":{
            argc: 2,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.angleOnScreen, false);
                object.setRotation(angle, fiber.chgt, $[0], $[1], fiber._isShortestRotation());
                return true;
            }
        },
        "rc":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.angleOnScreen, false);
                object.setConstantRotation(angle, fiber.chgt, $[0]*0.017453292519943295, fiber._isShortestRotation());
                return true;
            }
        },
    //---- bulletml based
        "cd":{ // changeDirection
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                const angle = fiber._getAngle(object.angleOnScreen, false);
                object.setChangeDirection(angle, fiber.chgt, $[0]*0.017453292519943295, fiber._isShortestRotation());
                return true;
            }
        },
        "cs":{ // changeSpeed
            argc: 2,
            type: State.STF_BE_INTERPOLATED,
            func(_state, $, fiber, object) {
                object.setChangeSpeed($[0], fiber.chgt);
                return true;
            }
        },
    //---- kill object or fibers
        "ko":{
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, _fiber, object) {
                object.destroy($[0]);
                return true;
            }
        },
        "kf":{
            argc: 0,
            type: State.ST_NORMAL,
            func(_state, _$, fiber) {
                fiber.destroyAllChildren();
                return true;
            }
        },
    //---- call reference fiber
        "@o":{
            argc: 1,
            type: State.ST_RESTRICT | State.STF_CALLREF,
            func(state, $, fiber, object) {
                return state._fiber_child(fiber, object, $[0]);
            }
        },
        "@ko":{
            argc: 1,
            type: State.ST_RESTRICT | State.STF_CALLREF,
            func(state, $, fiber) {
                return state._fiber_destruction(fiber, $[0]);
            }
        },
    //---- create new object (fire bullet)
        "f":{
            argc: 2,
            type: State.STF_CALLREF,
            func(state, $, fiber) {
                if (state.formula.answerCount > 0) 
                    fiber.bul.speed = $[0];
                state._fire(fiber, Math.floor($[1]), false);
                fiber.bul.update();
                return true;
            }
        },
        "fc":{
            argc: 2,
            type: State.STF_CALLREF,
            func(state, $, fiber) {
                if (state.formula.answerCount > 0) 
                    fiber.bul.speed = $[0];
                state._fire(fiber, Math.floor($[1]), true);
                fiber.bul.update();
                return true;
            }
        },
    //---- fiber center
        "q":{
            argc: 2,
            type: State.ST_NORMAL,
            func(_state, $, fiber) {
                fiber.fx = fiber._invertX($[0]);
                fiber.fy = fiber._invertY($[1]);
                return true;
            }
        },
        "qx":{
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, fiber) {
                fiber.fx = fiber._invertX($[0]);
                return true;
            }
        },
        "qy":{
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, fiber) {
                fiber.fy = fiber._invertY($[0]);
                return true;
            }
        },
    //---- head angle options
        "ha":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_ABS, $[0]);
                return true;
            }
        },
        "hp":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_PAR, $[0]);
                return true;
            }
        },
        "ht":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_AIM, $[0]);
                return true;
            }
        },
        "ho":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_REL, $[0]);
                return true;
            }
        },
        "hv":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_VEL, $[0]);
                return true;
            }
        },
        "hs":{
            argc: 1,
            type: State.STF_BE_INTERPOLATED,
            func(state, $, fiber) {
                state._setHeadAngle(fiber, State.HO_SEQ,$[0]);
                return true;
            }
        },
    //---- barrage setting
        "bm":{
            argc: 4,
            type: State.ST_BARRAGE,
            func(_state, $, fiber) {
                fiber.barrage.appendMultiple($[0], fiber._invertRotation($[1]), $[2], $[3]); 
                return true;
            }
        },
        "bs":{
            argc: 4,
            type: State.ST_BARRAGE,
            func(_state, $, fiber) {
                fiber.barrage.appendSequence($[0], fiber._invertRotation($[1]), $[2], $[3]);
                return true;
            }
        },
        "br":{
            argc: 4,
            type: State.ST_BARRAGE,
            func(_state, $, fiber) {
                fiber.barrage.appendRandom($[0], fiber._invertRotation($[1]), $[2], $[3]); 
                return true;
            }
        },
        "bv":{
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, fiber) {
                fiber.bul.setSpeedStep($[0]);
                return true;
            }
        },
    //---- target change
        "td":{ // set target to degault
            argc: 0,
            type: State.ST_NORMAL,
            func(_state, _$, fiber) {
                fiber.target = null;
                return true;
            }
        },
        "tp":{ // set target to parent
            argc: 0,
            type: State.ST_NORMAL,
            func(_state, _$, fiber, object) {
                fiber.target = object.parent;
                return true;
            }
        },
        "to":{ // set target to child object
            argc: 1,
            type: State.ST_NORMAL,
            func(_state, $, fiber, object) {
                fiber.target = object.findChild($[0] >> 0) ?? null;
                return true;
            }
        },
    //---- mirror
        "mx":{
            argc: 0,
            type: State.ST_NORMAL,
            func(_state, _$, fiber) {
                fiber.invertFlag = fiber.invertFlag ^ 1;
                return true;
            }
        },
        "my":{
            argc: 0,
            type: State.ST_NORMAL,
            func(_state, _$, fiber) {
                fiber.invertFlag = fiber.invertFlag ^ 2;
                return true;
            }
        },
    //---- internal command
        "$calllabel":{
            argc: 0,
            type: State.STF_CALLREF,
            func(state, _$, fiber) {
                return state._gosub(fiber);
            }
        },
        "$nonlabel":{
            argc: 1,
            type: State.STF_CALLREF,
            func(state, $, fiber) {
                return state._fiber(fiber, $[0]); 
            }
        },
        "$rapid":{
            argc: 0,
            type:  State.ST_RAPID,
            func(state, _$, fiber) {
                return state._rapid_fire(fiber);
            }
        },
        "$init4barrage":{
            argc: 0,
            type: State.ST_BARRAGE,
            func(_state, _$, fiber) {
                fiber.barrage.clear(); 
                return true; 
            }
        },
        "$init4int":{
            argc: 0,
            type: State.ST_INIT4INT,
            func(state, _$, fiber) {
                return state._initialize_interplation(fiber);
            }
        },
        "$w4d":{
            argc: 0,
            type: State.ST_W4D,
            func(state, $, fiber, object) {
                return state._wait4destruction(state, $, fiber, object);
            }
        },
        "$end":{
            argc: 0,
            type: State.ST_END,
            func() {
                return true;
            }
        }
    };

}