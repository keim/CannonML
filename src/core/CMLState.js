//----------------------------------------------------------------------------------------------------
// CML statement class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.Fiber from "../CML.Fiber.js";
//import CML.Sequence from "../CML.Sequence.js";
//import CML.ListElem from "./CML.ListElem.js";
/** @private */
CML.State = class extends CML.ListElem {
    constructor(key) {
        super();
        const ope = CML.State.operators[key];
        if (!ope)
            throw Error(key + " command not defined !");
        this.key = key;
        this.$ = new Array(ope.argc).fill(0);
        this.func = ope.func;
        this.type = ope.type;
        this.jump = null;
        this.formula = new CML.Formula();
    }
    /*override*/ clear() {
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
    execute(fiber) {
        if (!this.formula.isStatic) {
            Object.assign(this.$, this.formula.calcDynamic(fiber));
        }
        return this.func(this, this.$, fiber, fiber.object);
    }
    /** @private initialze call from CannonML first of all */
    static _initialize(globalVariables_) {
        CML.State._globalVariables = globalVariables_;
        CML.State._speed_ratio = globalVariables_.speedRatio;
    }
    // position of fiber
    // invertion
    //--------------------------------------------------
    _invertAngle(ang) {
        if (CML.State._invert_flag & (2 - CML.State._globalVariables.vertical))
            ang = -ang;
        if (CML.State._invert_flag & (1 + CML.State._globalVariables.vertical))
            ang = 180 - ang;
        return ang * 0.017453292519943295;
    }
    _invertRotation(rot) {
        return ((CML.State._invert_flag == 1 || CML.State._invert_flag == 2) ? -rot : rot) * 0.017453292519943295;
    }
    _invertX(x) {
        return (CML.State._invert_flag & (2 - CML.State._globalVariables.vertical)) ? -x : x;
    }
    _invertY(y) {
        return (CML.State._invert_flag & (1 + CML.State._globalVariables.vertical)) ? -y : y;
    }
    // command executer
    //------------------------------------------------------------
    // no operation or end
    _nop(state, $, fiber, object) {
        return true;
    }
    // initialize interpolation
    _initialize_interplation(fiber) {
        const _chgt = fiber.chgt;
        fiber.chgt = 0;
        while (fiber._pointer.next.type & CML.State.STF_BE_INTERPOLATED) {
            fiber._pointer = fiber._pointer.next;
            fiber._pointer.execute(fiber);
        }
        fiber.chgt = _chgt;
        return true;
    }
    // statement for rapid fire
    _rapid_fire(fiber) {
        // end
        if (fiber.bul.isEnd())
            return false;
        // create new bullet object and initialize
        this._create_multi_bullet(fiber, fiber.wtm1, Boolean(fiber.wtm2), null);
        // calc bullet and set wait counter
        fiber.bul.update();
        fiber.wcnt = fiber.bul.interval;
        // repeat
        fiber._pointer = CML.Sequence.rapid();
        return false;
    }
    // statement to wait for destruction
    _wait4destruction(fiber) {
        if (fiber.object.destructionStatus == fiber._access_id) {
            fiber._pointer = this.jump;
            return true;
        }
        return false;
    }
    // run new fiber
    _fiber(fiber, fiber_id) {
        const ref = this.next; // next statement is referential sequence
        const seq = (ref.jump != null) ? ref.jump : (fiber.seqFiber); // executing sequence
        fiber._newChildFiber(seq, fiber_id, CML.State._invert_flag, ref.$, (seq.type == CML.State.ST_NO_LABEL)); // create and initialize fiber
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
    }
    // run new destruction fiber
    _fiber_destruction(fiber, destStatus) {
        const ref = this.next; // next statement is referential sequence
        const seq = (ref.jump != null) ? ref.jump : (fiber.seqFiber); // executing sequence
        fiber._newDestFiber(seq, destStatus, CML.State._invert_flag, ref.$); // create and initialize destruction fiber
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
    }
    // run new fiber on child object
    _fiber_child(fiber, obj, object_id) {
        const ref = this.next; // next statement is referential sequence
        const seq = (ref.jump != null) ? ref.jump : (fiber.seqFiber); // executing sequence
        const idxmax = object_id.length - 1;
        _reflective_fiber_creation(obj, 0); // find child by object_id and create new fiber
        fiber.seqFiber = seq; // update executing sequence
        fiber._pointer = ref; // skip next statement
        // ('A`) chaos...
        function _reflective_fiber_creation(_parent, _idx) {
            this._parent.findAllChildren(object_id[_idx], (_idx == idxmax) ? this.__nof : this.__rfc);
            function __nof(obj) { fiber._newObjectFiber(obj, seq, CML.State._invert_flag, ref.$); return false; }
            function __rfc(obj) { _reflective_fiber_creation(obj, _idx + 1); return false; }
        }
    }
    // fire
    _fire(fiber, access_id, isParts) {
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
    _create_multi_bullet(fiber, access_id, isParts, args) {
        // creating center position
        let cx, cy;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (isParts) {
            cx = fiber.fx;
            cy = fiber.fy;
        } else {
            const sin = CML.State._globalVariables._sin,
                  sang = sin.index(fiber.object.angleOnScreen),
                  cang = sang + sin.cos_shift;
            cx = fiber.object.x + sin[cang] * fiber.fx - sin[sang] * fiber.fy;
            cy = fiber.object.y + sin[sang] * fiber.fx + sin[cang] * fiber.fy;
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
    __reflexive_call(fiber, access_id, isParts, args, cx, cy, bul, end) {
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
            const newfiber = fiber._newChildFiber(CML.Sequence.rapid(), 0, CML.State._invert_flag, null, false);
            // copy bullet setting and bullet multiplyer
            newfiber.bul.copy(bul.next);
            newfiber.bul.init(bul);
            for (let elem = bul.next.next; elem != end; elem = elem.next) 
                newfiber.barrage._appendElementCopyOf(elem);
            // copy other parameters
            newfiber.fx = fiber.fx;
            newfiber.fy = fiber.fy;
            newfiber.hopt = fiber.hopt;
            newfiber.headAngle = (fiber.hopt == CML.State.HO_SEQ) ? 0 : fiber.headAngle;
            newfiber.firedAngle = fiber.firedAngle;
            newfiber.seqFired = fiber.seqFired;
            newfiber.wtm1 = access_id;
            newfiber.wtm2 = (isParts) ? 1 : 0;
        }
    }
    // internal function to create object
    __create_bullet(fiber, access_id, isParts, args, cx, cy, angle, velocity) {
        const sin = CML.State._globalVariables._sin,
              sang = sin.index(angle + CML.State._globalVariables.scrollAngle),
              vx = velocity * sin[sang + sin.cos_shift],
              vy = velocity * sin[sang],
              obj = fiber.object.onFireObject(fiber.seqFired);
        if (!obj) return;
        obj._initialize(fiber.object, isParts, access_id, cx, cy, vx, vy, angle);  // create object
        fiber._newObjectFiber(obj, fiber.seqFired, CML.State._invert_flag, args);   // create fiber
    }
}
// Status Types
/** @private */ CML.State.ST_NORMAL = 0; // normal command
/** @private */ CML.State.ST_REFER = 1; // refer sequence
/** @private */ CML.State.ST_LABEL = 2; // labeled sequence define "#*.{...}"
/** @private */ CML.State.ST_NO_LABEL = 3; // non-labeled sequence define "{...}"
/** @private */ CML.State.ST_RESTRICT = 4; // restrict to put reference after this command ("&","@*","n*")
/** @private */ CML.State.ST_BLOCKSTART = 5; // loop "["
/** @private */ CML.State.ST_IF = 6; // if "?"
/** @private */ CML.State.ST_ELSE = 7; // else ":"
/** @private */ CML.State.ST_BLOCKEND = 8; // block end "]"
/** @private */ CML.State.ST_INTERPOLATE = 9; // interpolate "~"
/** @private */ CML.State.ST_FORMULA = 10; // formula 
/** @private */ CML.State.ST_STRING = 11; // string
/** @private */ CML.State.ST_END = 12; // end
/** @private */ CML.State.ST_BARRAGE = 13; // multiple barrage
/** @private */ CML.State.ST_W4D = 14; // wait for destruction
/** @private */ CML.State.ST_RAPID = 15; // rapid fire sequence
/** @private */ CML.State.ST_INIT4INT = 16; // initialize parameters for interpolation
/** @private */ CML.State.STF_CALLREF = 32; // flag to require reference after this command ("&","@*","f*","n*")
/** @private */ CML.State.STF_BE_INTERPOLATED = 64; // flag under interpolation effect
// Head angle Option
/** @private */ CML.State.HO_ABS = 0; // angle is based on scrolling direction
/** @private */ CML.State.HO_PAR = 1; // angle is based on direction to parent
/** @private */ CML.State.HO_AIM = 2; // angle is based on direction to target
/** @private */ CML.State.HO_REL = 3; // angle is based on object angle
/** @private */ CML.State.HO_VEL = 4; // amgle is based on moving direction
/** @private */ CML.State.HO_SEQ = 5; // angle is calculated from previous frame
// invert flag
CML.State._invert_flag = 0;
// speed ratio
CML.State._speed_ratio = 1;
// command regular expressions
CML.State.command_rex = "(\\[|\\]|\\}|\\?|:|w\\?|w|~|pd|px|py|pz|p|vd|vx|vy|vz|v|ad|ax|ay|az|a|gp|gt|rc|r|k|i|my|mx|cd|csa|csr|css|@k|@o|@|fc|f|qx|qy|q|bm|bs|br|bv|ha|ho|hp|ht|hv|hs|td|tp|to)";
// global variables
CML.State._globalVariables = null;
// operators
CML.State.operators = {
//---- wait
    "w":{ // wait
        argc: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            if (state.formula.answerCount > 0)
                fiber.wtm1 = $[0];
            fiber.wcnt = fiber.wtm1;
            return false;
        }
    },
    "w?":{ // waitif
        argc: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
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
        type: CML.State.ST_END,
        func(state, $, fiber, object) {
            if (fiber.jstc.length > 0) { // pop jump stac
                fiber._popInvertion();
                fiber._popVariables();
                fiber._pointer = fiber.jstc.pop();
            }
            return true;
        }
    },
    "[":{ // block or loop start
        argc: 1,
        type: CML.State.ST_BLOCKSTART,
        func(state, $, fiber, object) {
            fiber.lcnt.unshift(0);
            return true;
        }
    },
    "?":{ // if branch
        argc: 0,
        type: CML.State.ST_IF,
        func(state, $, fiber, object) {
            // loopconter < 0 means branch. true=-1, false=-2
            fiber.lcnt[0] = (state.prev.$[0]) ? -1: -2;
            if (fiber.lcnt[0] == -2) 
                fiber._pointer = state.jump.prev;
            return true;
        }
    },
    ":":{ // else if 
        argc: 1,
        type: CML.State.ST_ELSE,
        func(state, $, fiber, object) {
            if (fiber.lcnt[0] == -1) {
                fiber._pointer = state.jump;
                while (fiber._pointer.type != CML.State.ST_BLOCKEND)
                    fiber._pointer = fiber._pointer.jump;
                fiber._pointer = fiber._pointer.prev;
            } else if (fiber.lcnt[0] == -2 && state.prev.type == CML.State.ST_FORMULA)
                state.prev.execute(fiber);
            return true;
        }
    },
    "]":{ // block or loop end
        argc: 1,
        type: CML.State.ST_BLOCKEND,
        func(state, $, fiber, object) {
            if (fiber.lcnt[0] >= 0)  { // loopconter < 0 means branch
                var lmax = Math.floor($[0] || state.jump.$[0]);
                if (++fiber.lcnt[0] != lmax) { // jump to block_start
                    fiber._pointer = state.jump;
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
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.chgt = Math.floor($[0]);
            fiber.wtm2 = fiber.chgt;
            return true;
        }
    },
    "~":{ // wait with interpolation
        argc: 0,
        type: CML.State.ST_INTERPOLATE,
        func(state, $, fiber, object) {
            while (fiber._pointer.next.type & CML.State.STF_BE_INTERPOLATED) {
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
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            if (state.formula.answerCount == 1) {
                const angle = fiber._getAngle(object.anglePositionOnScreen, false);
                object.setPositionByDirection(angle, $[0], $[1], fiber.chgt);
            } else
                object.setPosition(state._invertX($[0]), state._invertY($[1]), $[2], fiber.chgt);
            return true;
        }
    },
    "px":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setPositionX(state._invertX($[0]), fiber.chgt);
            return true;
        }
    },
    "py":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setPositionY(state._invertY($[0]), fiber.chgt);
            return true;
        }
    },
    "pz":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setPositionZ($[0], fiber.chgt);
            return true;
        }
    },
    "pd":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.anglePositionOnScreen, false);
            object.setPositionByDirection(angle, $[0], $[1], fiber.chgt);
            return true;
        }
    },
//---- velocity
    "v":{
        argc: 3,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const r = CML.State._speed_ratio;
            if (state.formula.answerCount == 1) {
                const angle = fiber._getAngle(object.angleVelocityOnScreen, false);
                object.setVelocityByDirection(angle, $[0]*r, $[1]*r, fiber.chgt);
            } else
                object.setVelocity(state._invertX($[0]*r), state._invertY($[1]*r), $[2]*r, fiber.chgt);
            return true;
        }
    },
    "vx":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setVelocityX(state._invertX($[0]*CML.State._speed_ratio), fiber.chgt);
            return true;
        }
    },
    "vy":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setVelocityY(state._invertY($[0]*CML.State._speed_ratio), fiber.chgt);
            return true;
        }
    },
    "vz":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setVelocityZ($[0]*CML.State._speed_ratio, fiber.chgt);
            return true;
        }
    },
    "vd":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.angleVelocityOnScreen, false),
                  r = CML.State._speed_ratio;
            object.setVelocityByDirection(angle, $[0]*r, $[1]*r, fiber.chgt);
            return true;
        }
    },
//---- accelaration
    "a":{
        argc: 3,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const r = CML.State._speed_ratio;
            if (state.formula.answerCount == 1) {
                const angle = fiber._getAngle(object.angleAccelOnScreen, false);
                object.setAccelByDirection(angle, $[0]*r, $[1]*r);
            } else
                object.setAccel(state._invertX($[0]*r), state._invertY($[1]*r), $[2]*r);
            return true;
        }
    },
    "ax":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setAccelX(state._invertX($[0]*CML.State._speed_ratio));
            return true;
        }
    },
    "ay":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setAccelY(state._invertY($[0]*CML.State._speed_ratio));
            return true;
        }
    },
    "az":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setAccelZ($[0]*CML.State._speed_ratio);
            return true;
        }
    },
    "ad":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.angleAccelOnScreen, false),
                  r = CML.State._speed_ratio;
            object.setAccelByDirection(angle, $[0]*r, $[1]*r);
            return true;
        }
    },
//---- rotation
    "r":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.angleOnScreen, false);
            object.setRotation(state._invertRotation(angle), fiber.chgt, $[0], $[1], fiber._isShortestRotation());
            return true;
        }
    },
    "rc":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.angleOnScreen, false);
            object.setConstantRotation(state._invertRotation(angle), fiber.chgt, $[0] * CML.State._speed_ratio, fiber._isShortestRotation());
            return true;
        }
    },
//---- gravity motion
    "gp":{
        argc: 3,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.chgt = 0;
            object.setGravity($[0] * CML.State._speed_ratio, $[1] * CML.State._speed_ratio, $[2]);
            return true;
        }
    },
//---- bulletml based
    "cd":{
        argc: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            const angle = fiber._getAngle(object.angleOnScreen, false);
            object.setChangeDirection(angle, fiber.chgt, $[0] * CML.State._speed_ratio, fiber._isShortestRotation());
            return true;
        }
    },
    "csa":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setChangeSpeed($[0] * CML.State._speed_ratio, fiber.chgt);
            return true;
        }
    },
    "csr":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            object.setChangeSpeed($[0] * CML.State._speed_ratio + object.velocity, fiber.chgt);
            return true;
        }
    },
    "css":{
        argc: 2,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            if (fiber.chgt == 0)
                object.setChangeSpeed($[0] * CML.State._speed_ratio + object.velocity, 0);
            else
                object.setChangeSpeed($[0] * CML.State._speed_ratio * fiber.chgt + object.velocity, fiber.chgt);
            return true;
        }
    },
//---- kill object
    "k":{
        args: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            object.destroy($[0]);
            return true;
        }
    },
//---- call reference fiber
    "&":{
        args: 0,
        type: CML.State.STF_CALLREF,
        func(state, $, fiber, object) {
            // execution error
            if (fiber.jstc.length > CML.Fiber._stacmax) 
                throw new Error("CML Execution error. '&' call stac overflow.");
            // next statement is referential sequence
            const ref = state.next;
            fiber.jstc.push(ref);
            fiber._pushInvertion(CML.State._invert_flag);
            fiber._pushVariables(ref.$);
            fiber._pointer = ref.jump;
            return true;
        }
    },
    "@":{
        args: 1,
        type: CML.State.ST_RESTRICT | CML.State.STF_CALLREF;
        func(state, $, fiber, object) {
            state._fiber(fiber, $[0]); 
            return true;
        }
    },
    "@o":{
        args: 1,
        type: CML.State.ST_RESTRICT | CML.State.STF_CALLREF,
        func(state, $, fiber, object) {
            state._fiber_child(fiber, object, $[0]);
            return true;
        }
    },
    "@k":{
        args: 1,
        type: CML.State.ST_RESTRICT | CML.State.STF_CALLREF,
        func(state, $, fiber, object) {
            state._fiber_destruction(fiber, $[0]);
            return true;
        }
    },
//---- create new object (fire bullet)
    "f":{
        args: 2,
        type: CML.State.STF_CALLREF,
        func(state, $, fiber, object) {
            if (state.forumla.answerCount > 0) 
                fiber.bul.speed = $[0] * CML.State._speed_ratio;
            state._fire(fiber, Math.floor($[1]), false);
            fiber.bul.update();
            return true;
        }
    },
    "fc":{
        args: 2,
        type: CML.State.STF_CALLREF,
        func(state, $, fiber, object) {
            if (state.forumla.answerCount > 0) 
                fiber.bul.speed = $[0] * CML.State._speed_ratio;
            state._fire(fiber, Math.floor($[1]), true);
            fiber.bul.update();
            return true;
        }
    },
//---- fiber center
    "q":{
        args: 2,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.fx = state._invertX($[0]);
            fiber.fy = state._invertY($[1]);
            return true;
        }
    },
    "qx":{
        args: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.fx = state._invertX($[0]);
            return true;
        }
    },
    "qy":{
        args: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.fy = state._invertY($[0]);
            return true;
        }
    },
//---- head angle options
    "ha":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_ABS, state._invertAngle($[0]));
            return true;
        }
    },
    "hp":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_PAR, state._invertAngle($[0]));
            return true;
        }
    },
    "ht":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_AIM, state._invertAngle($[0]));
            return true;
        }
    },
    "ho":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_REL, state._invertAngle($[0]));
            return true;
        }
    },
    "hv":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_VEL, state._invertAngle($[0]));
            return true;
        }
    },
    "hs":{
        args: 1,
        type: CML.State.STF_BE_INTERPOLATED,
        func(state, $, fiber, object) {
            fiber._setHeadAngle(CML.State.HO_SEQ, state._invertRotation($[0]));
            return true;
        }
    },
//---- barrage setting
    "bm":{
        args: 4,
        type: CML.State.ST_BARRAGE,
        func(state, $, fiber, object) {
            fiber.barrage.appendMultiple($[0], state._invertRotation($[1]), $[2] * CML.State._speed_ratio, $[3]); 
            return true;
        }
    },
    "bs":{
        args: 4,
        type: CML.State.ST_BARRAGE,
        func(state, $, fiber, object) {
            fiber.barrage.appendSequence($[0], state._invertRotation($[1]), $[2] * CML.State._speed_ratio, $[3]);
            return true;
        }
    },
    "br":{
        args: 4,
        type: CML.State.ST_BARRAGE,
        func(state, $, fiber, object) {
            fiber.barrage.appendRandom($[0], state._invertRotation($[1]), $[2] * CML.State._speed_ratio, $[3]); 
            return true;
        }
    },
    "bv":{
        args: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.bul.setSpeedStep($[0] * CML.State._speed_ratio);
            return true;
        }
    },
//---- target change
    "td":{ // set target to degault
        args: 0,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.target = null;
            return true;
        }
    },
    "tp":{ // set target to parent
        args: 0,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.target = object.parent;
            return true;
        }
    },
    "to":{ // set target to child object
        args: 1,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            fiber.target = object.findChild($[0] >> 0);
            return true;
        }
    },
//---- mirror
    "mx":{
        args: 0,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            CML.State._invert_flag = fiber.invt ^ 1;
            fiber._pointer = fiber._pointer.next;
            const res = fiber._pointer.execute(fiber);
            CML.State._invert_flag = fiber.invt;
            return true;
        }
    },
    "my":{
        args: 0,
        type: CML.State.ST_NORMAL,
        func(state, $, fiber, object) {
            CML.State._invert_flag = fiber.invt ^ 2;
            fiber._pointer = fiber._pointer.next;
            const res = fiber._pointer.execute(fiber);
            CML.State._invert_flag = fiber.invt;
            return true;
        }
    },
//---- internal command
    "$rapid":{
        args: 0,
        type:  CML.State.ST_RAPID,
        func(state, $, fiber, object) {
            return state._rapid_fire(fiber);
        }
    },
    "$barrage":{
        args: 0,
        type: CML.State.ST_BARRAGE,
        func(state, $, fiber, object) {
            fiber.barrage.clear(); 
            return true; 
        }
    },
    "$init4int":{
        args: 0,
        type: CML.State.ST_INIT4INT,
        func(state, $, fiber, object) {
            return state._initialize_interplation(fiber);
        }
    },
    "$w4d":{
        args: 0,
        type: CML.State.ST_W4D,
        func(state, $, fiber, object) {
            return state._wait4destruction(state, $, fiber, object);
        }
    },
    "$end":{
        args: 0,
        type: CML.State.ST_END,
        func(state, $, fiber, object) {
            return true;
        }
    }
};
