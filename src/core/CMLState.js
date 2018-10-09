//----------------------------------------------------------------------------------------------------
// CML statement class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLFiber from "../CMLFiber.js";
import CMLSequence from "../CMLSequence.js";
import CMLListElem from "./CMLListElem.js";
/** @private */
export default class CMLState extends CMLListElem {
    // functions
    //------------------------------------------------------------
    constructor(type_ = CMLState.ST_NORMAL) {
        super();
        this._args = [];
        this.jump = null;
        this.type = type_;
        switch (this.type) {
            case CMLState.ST_RAPID:
                this.func = this._rapid_fire;
                break;
            case CMLState.ST_BARRAGE:
                this.func = this._initialize_barrage;
                break;
            case CMLState.ST_W4D:
                this.func = this._wait4destruction;
                this.next = this;
                break;
            default:
                this.func = this._nop;
                break;
        }
    }
    /*override*/ clear() {
        this._args.length = 0;
        this.jump = null;
        super.clear();
    }
    setCommand(cmd) { return this._setCommand(cmd); }
    /** @private initialze call from CannonML first of all */
    static _initialize(globalVariables_) {
        CMLState._globalVariables = globalVariables_;
        CMLState._speed_ratio = globalVariables_.speedRatio;
    }
    // private fuctions
    //------------------------------------------------------------
    /** set command by key string @private */
    _setCommand(cmd) {
        var idx;
        switch (cmd) {
            // waiting 
            case "w":
                if (this._args.length == 0) {
                    this.func = this._w0;
                }
                else {
                    this.func = this._w1;
                    if (this._args[0] == 0)
                        this._args[0] = Number.MAX_VALUE;
                }
                break;
            case "~":
                this.func = this._wi;
                break;
            case "w?":
                this.func = this._waitif;
                break;
            // sequence
            case "}":
                this.func = this._ret;
                this.type = CMLState.ST_END;
                break;
            // repeat and branch
            case "[":
                this.func = this._loop_start;
                this.type = CMLState.ST_LOOP;
                this._resetParameters(1);
                break;
            case "[?":
                this.func = this._if_start;
                this.type = CMLState.ST_IF;
                if (this._args.length == 0)
                    throw Error("no arguments in [?");
                break;
            case "[s?":
                this.func = this._level_start;
                this.type = CMLState.ST_SELECT;
                if (this._args.length == 0)
                    throw Error("no arguments in [s?");
                break;
            case ":":
                this.func = this._else_start;
                this.type = CMLState.ST_ELSE;
                this._resetParameters(1);
                break;
            case "]":
                this.func = this._block_end;
                this.type = CMLState.ST_BLOCKEND;
                this._resetParameters(1);
                break;
            // interval
            case "i":
                this.func = this._i;
                this._resetParameters(1);
                break;
            // position
            case "p":
                this.func = this._p;
                this._resetParameters(3);
                break;
            case "px":
                this.func = this._px;
                this._resetParameters(1);
                break;
            case "py":
                this.func = this._py;
                this._resetParameters(1);
                break;
            case "pd":
                this.func = this._pd;
                this._resetParameters(2);
                break;
            // velocity
            case "v":
                this.func = this._v;
                this._resetParameters(3);
                break;
            case "vx":
                this.func = this._vx;
                this._resetParameters(1);
                break;
            case "vy":
                this.func = this._vy;
                this._resetParameters(1);
                break;
            case "vd":
                this.func = this._vd;
                this._resetParameters(2);
                break;
            // accelaration
            case "a":
                this.func = this._a;
                this._resetParameters(3);
                break;
            case "ax":
                this.func = this._ax;
                this._resetParameters(1);
                break;
            case "ay":
                this.func = this._ay;
                this._resetParameters(1);
                break;
            case "ad":
                this.func = this._ad;
                this._resetParameters(2);
                break;
            // rotation
            case "r":
                this.func = this._r;
                this._resetParameters(2);
                break;
            case "rc":
                this.func = this._rc;
                this._resetParameters(1);
                break;
            // gravity
            case "gp":
                this.func = this._gp;
                this._resetParameters(3);
                break;
            // bml
            case "cd":
                this.func = this._cd;
                this._resetParameters(2);
                break;
            case "csa":
                this.func = this._csa;
                this._resetParameters(2);
                break;
            case "csr":
                this.func = this._csr;
                this._resetParameters(2);
                break;
            case "css":
                this.func = this._css;
                this._resetParameters(2);
                break;
            // kill object
            case "ko":
                this.func = this._ko;
                this._resetParameters(1);
                break;
            // sub routine
            case "&":
                this.func = this._gosub;
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "^&":
                this.func = this._fgosub;
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            // fiber
            case "@":
                this.func = this._at;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "@o":
                this.func = this._ato;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "@ko":
                this.func = this._atko;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "^@":
                this.func = this._fat;
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "kf":
                this.func = this._kf;
                break;
            // new
            case "n":
                this.func = this._n;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "nc":
                this.func = this._nc;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            case "^n":
                this.func = this._fn;
                this._resetParameters(1);
                this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF;
                break;
            // fire
            case "f":
                this._resetParameters(2);
                this.func = (isNaN(this._args[0])) ? this._f0 : this._f1;
                this.type = CMLState.STF_CALLREF;
                break;
            case "fc":
                this._resetParameters(2);
                this.func = (isNaN(this._args[0])) ? this._fc0 : this._fc1;
                this.type = CMLState.STF_CALLREF;
                break;
            case "^f":
                this._resetParameters(2);
                this.func = (isNaN(this._args[0])) ? this._ff0 : this._ff1;
                this.type = CMLState.STF_CALLREF;
                break;
            // fiber position
            case "q":
                this.func = this._q;
                this._resetParameters(2);
                break;
            case "qx":
                this.func = this._qx;
                this._resetParameters(1);
                break;
            case "qy":
                this.func = this._qy;
                this._resetParameters(1);
                break;
            // head
            case "ha":
            case "hax":
                this.func = this._ha;
                this._resetParameters(1);
                break;
            case "hp":
                this.func = this._hp;
                this._resetParameters(1);
                break;
            case "ht":
                this.func = this._ht;
                this._resetParameters(1);
                break;
            case "ho":
                this.func = this._ho;
                this._resetParameters(1);
                break;
            case "hv":
                this.func = this._hv;
                this._resetParameters(1);
                break;
            case "hpx":
                this.func = this._hpx;
                this._resetParameters(1);
                break;
            case "htx":
                this.func = this._htx;
                this._resetParameters(1);
                break;
            case "hox":
                this.func = this._hox;
                this._resetParameters(1);
                break;
            case "hvx":
                this.func = this._hvx;
                this._resetParameters(1);
                break;
            case "hs":
                this.func = this._hs;
                this._resetParameters(1);
                break;
            // barrage
            case "bm":
                this.func = this._bm;
                this._resetParameters(4);
                this.type = CMLState.ST_BARRAGE;
                break;
            case "bs":
                this.func = this._bs;
                this._resetParameters(4);
                this.type = CMLState.ST_BARRAGE;
                break;
            case "br":
                this.func = this._br;
                this._resetParameters(4);
                this.type = CMLState.ST_BARRAGE;
                break;
            case "bv":
                this.func = this._bv;
                this._resetParameters(1);
                break;
            // target
            case "td":
                this.func = this._td;
                break;
            case "tp":
                this.func = this._tp;
                break;
            case "to":
                this.func = this._to;
                this._resetParameters(1);
                break;
            // mirror
            case "m":
                this.func = this._m;
                this._resetParameters(1);
                break;
            default:
                throw Error("Unknown command; " + cmd + " ?");
        }
        // set undefined augments to 0.
        for (idx = 0; idx < this._args.length; idx++) {
            if (isNaN(this._args[idx]))
                this._args[idx] = 0;
        }
        return this;
    }
    // set default arguments
    _resetParameters(argc) {
        var ibegin = this._args.length, i;
        if (ibegin < argc) {
            this._args.length = argc;
            for (i = ibegin; i < argc; i++) {
                this._args[i] = Number.NaN;
            }
        }
    }
    // command executer
    //------------------------------------------------------------
    // set invertion flag (call from CMLFiber.execute())
    static _setInvertionFlag(invt_) {
        CMLState._invert_flag = invt_;
    }
    // no operation or end
    _nop(fbr) { return true; }
    // looping, branching
    _loop_start(fbr) {
        fbr.lcnt.unshift(0);
        return true;
    }
    _if_start(fbr) {
        if (this._args[0] == 0)
            fbr._pointer = this.jump;
        return true;
    }
    _level_start(fbr) {
        while (fbr._pointer.jump.type == CMLState.ST_ELSE) {
            if (this._args[0] < fbr._pointer.jump._args[0])
                return true;
            fbr._pointer = fbr._pointer.jump;
        }
        return true;
    }
    _else_start(fbr) {
        do {
            fbr._pointer = fbr._pointer.jump;
        } while (fbr._pointer.type == CMLState.ST_ELSE);
        return true;
    }
    _block_end(fbr) {
        if (this.jump.type == CMLState.ST_LOOP) {
            var lmax = Math.floor(this._args[0] || this.jump._args[0]);
            if (++fbr.lcnt[0] != lmax) {
                fbr._pointer = this.jump;
                return true;
            }
            fbr.lcnt.shift();
        }
        return true;
    }
    // wait
    _w0(fbr) { fbr.wcnt = fbr.wtm1; return false; }
    _w1(fbr) { fbr.wtm1 = this._args[0]; fbr.wcnt = fbr.wtm1; return false; }
    _wi(fbr) { fbr.wcnt = fbr.wtm2; return (fbr.wcnt == 0); }
    // waitif
    _waitif(fbr) {
        if (this._args[0] == 0)
            return true;
        fbr._pointer = (this.prev.type == CMLState.ST_FORMULA) ? this.prev.prev : this.prev;
        return false;
    }
    // interpolation interval
    _i(fbr) {
        fbr.chgt = Math.floor(this._args[0]);
        fbr.wtm2 = fbr.chgt;
        return true;
    }
    // mirroring
    _m(fbr) {
        // invert flag
        CMLState._invert_flag = fbr.invt ^ (((this._args[0]) + 1) >> 0);
        // execute next statement
        fbr._pointer = fbr._pointer.next;
        var res = fbr._pointer.func(fbr);
        // reset flag
        CMLState._invert_flag = fbr.invt;
        return res;
    }
    // position of fiber
    _q(fbr) { fbr.fx = this._invertX(this._args[0]); fbr.fy = this._invertY(this._args[1]); return true; }
    _qx(fbr) { fbr.fx = this._invertX(this._args[0]); return true; }
    _qy(fbr) { fbr.fy = this._invertY(this._args[0]); return true; }
    // position
    _p(fbr) { fbr.object.setPosition(this._invertX(this._args[0]), this._invertY(this._args[1]), this._args[2], fbr.chgt); return true; }
    _px(fbr) { fbr.object.setPosition(this._invertX(this._args[0]), fbr.object._getY(), fbr.object._getZ(), fbr.chgt); return true; }
    _py(fbr) { fbr.object.setPosition(fbr.object._getX(), this._invertY(this._args[0]), fbr.object._getZ(), fbr.chgt); return true; }
    _pz(fbr) { fbr.object.setPosition(fbr.object._getX(), fbr.object._getY(), this._args[0], fbr.chgt); return true; }
    _pd(fbr) {
        var iang, sin = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ)
            iang = sin.index(fbr._getAngleForRotationCommand() + CMLState._globalVariables.scrollAngle);
        else
            iang = sin.index(fbr.object.anglePosition - fbr._getAngleForRotationCommand());
        var c = sin[iang + sin.cos_shift], s = sin[iang];
        fbr.object.setPosition(c * this._args[0] - s * this._args[1], s * this._args[0] + c * this._args[1], fbr.object._getZ(), fbr.chgt);
        return true;
    }
    // velocity
    _v(fbr) { fbr.object.setVelocity(this._invertX(this._args[0] * CMLState._speed_ratio), this._invertY(this._args[1] * CMLState._speed_ratio), this._args[2] * CMLState._speed_ratio, fbr.chgt); return true; }
    _vx(fbr) { fbr.object.setVelocity(this._invertX(this._args[0] * CMLState._speed_ratio), fbr.object.vy, fbr.object.vz, fbr.chgt); return true; }
    _vy(fbr) { fbr.object.setVelocity(fbr.object.vx, this._invertY(this._args[0] * CMLState._speed_ratio), fbr.object.vz, fbr.chgt); return true; }
    _vz(fbr) { fbr.object.setVelocity(fbr.object.vx, fbr.object.vy, this._args[0] * CMLState._speed_ratio, fbr.chgt); return true; }
    _vd(fbr) {
        var iang, sin = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ)
            iang = sin.index(fbr._getAngleForRotationCommand() + CMLState._globalVariables.scrollAngle);
        else
            iang = sin.index(fbr.object.angleVelocity - fbr._getAngle(0));
        var c = sin[iang + sin.cos_shift], s = sin[iang], h = this._args[0] * CMLState._speed_ratio, v = this._args[1] * CMLState._speed_ratio;
        fbr.object.setVelocity(c * h - s * v, s * h + c * v, fbr.object.vz, fbr.chgt);
        return true;
    }
    // acceleration
    _a(fbr) { fbr.object.setAccelaration(this._invertX(this._args[0] * CMLState._speed_ratio), this._invertY(this._args[1] * CMLState._speed_ratio), this._args[1] * CMLState._speed_ratio, 0); return true; }
    _ax(fbr) { fbr.object.setAccelaration(this._invertX(this._args[0] * CMLState._speed_ratio), fbr.object._getAy(), fbr.object._getAz(), 0); return true; }
    _ay(fbr) { fbr.object.setAccelaration(fbr.object._getAx(), this._invertY(this._args[0] * CMLState._speed_ratio), fbr.object._getAz(), 0); return true; }
    _az(fbr) { fbr.object.setAccelaration(fbr.object._getAx(), fbr.object._getAy(), this._args[0] * CMLState._speed_ratio, 0); return true; }
    _ad(fbr) {
        var iang, sin = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ)
            iang = sin.index(fbr._getAngleForRotationCommand() + CMLState._globalVariables.scrollAngle);
        else
            iang = sin.index(fbr.object.angleAccel - fbr._getAngle(0));
        var c = sin[iang + sin.cos_shift], s = sin[iang], h = this._args[0] * CMLState._speed_ratio, v = this._args[1] * CMLState._speed_ratio;
        fbr.object.setAccelaration(c * h - s * v, s * h + c * v, fbr.object._getAz(), 0);
        return true;
    }
    // gravity
    _gp(fbr) {
        fbr.chgt = 0;
        fbr.object.setGravity(this._args[0] * CMLState._speed_ratio, this._args[1] * CMLState._speed_ratio, this._args[2]);
        return true;
    }
    // It's very tough to implement bulletML...('A`)
    _csa(fbr) { fbr.object.setChangeSpeed(this._args[0] * CMLState._speed_ratio, fbr.chgt); return true; }
    _csr(fbr) { fbr.object.setChangeSpeed(this._args[0] * CMLState._speed_ratio + fbr.object.velocity, fbr.chgt); return true; }
    _css(fbr) {
        if (fbr.chgt == 0)
            fbr.object.setChangeSpeed(this._args[0] * CMLState._speed_ratio + fbr.object.velocity, 0);
        else
            fbr.object.setChangeSpeed(this._args[0] * CMLState._speed_ratio * fbr.chgt + fbr.object.velocity, fbr.chgt);
        return true;
    }
    _cd(fbr) {
        fbr.object.setChangeDirection(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0] * CMLState._speed_ratio, fbr._isShortestRotation());
        return true;
    }
    // rotation
    _r(fbr) {
        fbr.object.setRotation(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0], this._args[1], fbr._isShortestRotation());
        return true;
    }
    _rc(fbr) {
        fbr.object.setConstantRotation(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0] * CMLState._speed_ratio, fbr._isShortestRotation());
        return true;
    }
    // kill object
    _ko(fbr) {
        fbr.object.destroy(this._args[0]);
        return false;
    }
    // kill all children fiber
    _kf(fbr) {
        fbr.destroyAllChildren();
        return true;
    }
    // initialize barrage
    _initialize_barrage(fbr) { fbr.barrage.clear(); return true; }
    // multiple barrage
    _bm(fbr) { fbr.barrage.appendMultiple(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]); return true; }
    // sequencial barrage
    _bs(fbr) { fbr.barrage.appendSequence(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]); return true; }
    // random barrage
    _br(fbr) { fbr.barrage.appendRandom(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]); return true; }
    // bullet sequence of verocity
    _bv(fbr) { fbr.bul.setSpeedStep(this._args[0] * CMLState._speed_ratio); return true; }
    // head angle
    _ha(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_ABS; return true; }
    _ho(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_REL; return true; }
    _hp(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_PAR; return true; }
    _ht(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_AIM; return true; }
    _hv(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_VEL; return true; }
    _hox(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_REL; this._fix(fbr); return true; }
    _hpx(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_PAR; this._fix(fbr); return true; }
    _htx(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_AIM; this._fix(fbr); return true; }
    _hvx(fbr) { fbr.hang = this._invertAngle(this._args[0]); fbr.hopt = CMLState.HO_VEL; this._fix(fbr); return true; }
    _hs(fbr) { fbr.hang = this._invertRotation(this._args[0]); fbr.hopt = CMLState.HO_SEQ; return true; }
    _fix(fbr) { fbr.hang = fbr._getAngle(0); fbr.hopt = CMLState.HO_FIX; }
    // set target
    _td(fbr) { fbr.target = null; return true; }
    _tp(fbr) { fbr.target = fbr.object.parent; return true; }
    _to(fbr) { fbr.target = fbr.object.findChild(this._args[0] >> 0); return true; }
    // call sequence (create new fiber directry)
    // gosub
    _gosub(fbr) {
        // execution error
        if (fbr.jstc.length > CMLFiber._stacmax) {
            throw new Error("CML Execution error. The '&' command calls deeper than stac limit.");
        }
        // next statement is referential sequence
        var ref = (this.next);
        var seq = (ref.jump != null) ? ref.jump : (fbr.seqSub);
        fbr.jstc.push(ref);
        fbr._unshiftInvertion(CMLState._invert_flag);
        fbr._unshiftArguments(seq.require_argc, ref._args);
        fbr._pointer = seq;
        return true;
    }
    // fake gosub
    _fgosub(fbr) {
        if (this.next.jump != null)
            fbr.seqSub = this.next.jump;
        return true;
    }
    // return
    _ret(fbr) {
        // pop jump stac
        if (fbr.jstc.length > 0) {
            fbr._shiftArguments();
            fbr._shiftInvertion();
            fbr._pointer = fbr.jstc.pop();
            fbr.seqSub = this.jump;
        }
        return true;
    }
    // execute new fiber, fiber on child
    _at(fbr) { this._fiber(fbr, this._args[0]); return true; }
    _ato(fbr) { this._fiber_child(fbr, fbr.object, this._args); return true; }
    _fat(fbr) { if (this.next.jump != null)
        fbr.seqExec = this.next.jump; return true; }
    _atko(fbr) { this._fiber_destruction(fbr, this._args[0]); return true; }
    // new
    _n(fbr) { this._new(fbr, Math.floor(this._args[0]), false); return true; }
    _nc(fbr) { this._new(fbr, Math.floor(this._args[0]), true); return true; }
    _fn(fbr) { if (this.next.jump != null)
        fbr.seqNew = this.next.jump; return true; }
    // fire
    _f0(fbr) { this._fire(fbr, Math.floor(this._args[1]), false); fbr.bul.update(); return true; }
    _f1(fbr) { fbr.bul.speed = this._args[0] * CMLState._speed_ratio; this._fire(fbr, Math.floor(this._args[1]), false); fbr.bul.update(); return true; }
    _fc0(fbr) { this._fire(fbr, Math.floor(this._args[1]), true); fbr.bul.update(); return true; }
    _fc1(fbr) { fbr.bul.speed = this._args[0] * CMLState._speed_ratio; this._fire(fbr, Math.floor(this._args[1]), true); fbr.bul.update(); return true; }
    // fake fire
    _ff0(fbr) {
        var refer = this.next;
        if (refer.jump != null)
            fbr.seqFire = refer.jump;
        fbr.fang = fbr._getAngle(fbr.fang);
        fbr._pointer = refer;
        fbr.bul.update();
        return true;
    }
    _ff1(fbr) {
        fbr.bul.speed = this._args[0] * CMLState._speed_ratio;
        return this._ff0(fbr);
    }
    // statement for rapid fire
    _rapid_fire(fbr) {
        // end
        if (fbr.bul.isEnd())
            return false;
        // create new bullet object and initialize
        this._create_multi_bullet(fbr, fbr.wtm1, Boolean(fbr.wtm2), null);
        // calc bullet and set wait counter
        fbr.bul.update();
        fbr.wcnt = fbr.bul.interval;
        // repeat
        fbr._pointer = CMLSequence.rapid();
        return false;
    }
    // statement to wait for destruction
    _wait4destruction(fbr) {
        if (fbr.object.destructionStatus == fbr._access_id) {
            fbr._pointer = this.jump;
            return true;
        }
        return false;
    }
    // invertion
    //--------------------------------------------------
    _invertAngle(ang) {
        if (CMLState._invert_flag & (2 - CMLState._globalVariables.vertical))
            ang = -ang;
        if (CMLState._invert_flag & (1 + CMLState._globalVariables.vertical))
            ang = 180 - ang;
        return ang;
    }
    _invertRotation(rot) {
        return (CMLState._invert_flag == 1 || CMLState._invert_flag == 2) ? -rot : rot;
    }
    _invertX(x) {
        return (CMLState._invert_flag & (2 - CMLState._globalVariables.vertical)) ? -x : x;
    }
    _invertY(y) {
        return (CMLState._invert_flag & (1 + CMLState._globalVariables.vertical)) ? -y : y;
    }
    // creating routine
    //--------------------------------------------------
    // run new fiber
    _fiber(fbr, fiber_id) {
        var ref = this.next; // next statement is referential sequence
        var seq = (ref.jump != null) ? ref.jump : (fbr.seqExec); // executing sequence
        fbr._newChildFiber(seq, fiber_id, CMLState._invert_flag, ref._args, (seq.type == CMLState.ST_NO_LABEL)); // create and initialize fiber
        fbr.seqExec = seq; // update executing sequence
        fbr._pointer = ref; // skip next statement
    }
    // run new destruction fiber
    _fiber_destruction(fbr, destStatus) {
        var ref = this.next; // next statement is referential sequence
        var seq = (ref.jump != null) ? ref.jump : (fbr.seqExec); // executing sequence
        fbr._newDestFiber(seq, destStatus, CMLState._invert_flag, ref._args); // create and initialize destruction fiber
        fbr.seqExec = seq; // update executing sequence
        fbr._pointer = ref; // skip next statement
    }
    // run new fiber on child object
    _fiber_child(fbr, obj, object_id) {
        var ref = this.next; // next statement is referential sequence
        var seq = (ref.jump != null) ? ref.jump : (fbr.seqExec); // executing sequence
        var idxmax = object_id.length - 1;
        _reflective_fiber_creation(obj, 0); // find child by object_id and create new fiber
        fbr.seqExec = seq; // update executing sequence
        fbr._pointer = ref; // skip next statement
        // ('A`) chaos...
        function _reflective_fiber_creation(_parent, _idx) {
            this._parent.findAllChildren(object_id[_idx], (_idx == idxmax) ? this.__nof : this.__rfc);
            function __nof(obj) { fbr._newObjectFiber(obj, seq, CMLState._invert_flag, ref._args); return false; }
            function __rfc(obj) { _reflective_fiber_creation(obj, _idx + 1); return false; }
        }
    }
    // new
    _new(fbr, access_id, isParts) {
        var sin = CMLState._globalVariables._sin, sang, cang, x, y;
        // next statement is referential sequence
        var ref = this.next;
        // update new pointer, ref.jump shows executing sequence            
        if (ref.jump != null)
            fbr.seqNew = ref.jump;
        // creating center position
        x = fbr.fx;
        y = fbr.fy;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (!isParts) {
            sang = sin.index(fbr.object.angleOnStage),
                cang = sang + sin.cos_shift;
            x = fbr.object.x + sin[cang] * fbr.fx - sin[sang] * fbr.fy;
            y = fbr.object.y + sin[sang] * fbr.fx + sin[cang] * fbr.fy;
        }
        // create object
        var childObject = fbr.object.onNewObject(fbr.seqNew);
        if (childObject == null)
            return;
        childObject._initialize(fbr.object, isParts, access_id, x, y, 0, 0, 0);
        // create fiber
        fbr._newObjectFiber(childObject, fbr.seqNew, CMLState._invert_flag, ref._args);
        // skip next statement
        fbr._pointer = ref;
    }
    // fire
    _fire(fbr, access_id, isParts) {
        // next statement is referential sequence
        var ref = this.next;
        // update fire pointer, ref.jump shows executing sequence
        if (ref.jump != null)
            fbr.seqFire = ref.jump;
        // create multi bullet
        this._create_multi_bullet(fbr, access_id, isParts, ref._args);
        // skip next statement
        fbr._pointer = ref;
    }
    // fire reflective implement
    _create_multi_bullet(fbr, access_id, isParts, arg) {
        var sin = CMLState._globalVariables._sin, sang, cang, x, y;
        // creating center position
        x = fbr.fx;
        y = fbr.fy;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (!isParts) {
            sang = sin.index(fbr.object.angleOnStage);
            cang = sang + sin.cos_shift;
            x = fbr.object.x + sin[cang] * fbr.fx - sin[sang] * fbr.fy;
            y = fbr.object.y + sin[sang] * fbr.fx + sin[cang] * fbr.fy;
        }
        // calculate angle
        fbr.fang = fbr._getAngle(fbr.fang);
        // create bullets
        if (fbr.barrage.qrtList.isEmpty()) {
            // create single bullet
            __create_bullet(fbr.fang + fbr.bul.angle, fbr.bul.speed);
        }
        else {
            // reflexive call
            fbr.bul.next = fbr.barrage.qrtList.head;
            __reflexive_call(fbr.bul, fbr.barrage.qrtList.end);
        }
        function __reflexive_call(qrt, end) {
            var qrt_next = (qrt.next);
            if (qrt_next.interval == 0) {
                if (qrt_next.next == end) {
                    // create bullet
                    qrt_next.init(qrt);
                    while (!qrt_next.isEnd()) {
                        __create_bullet(fbr.fang + qrt_next.angle, qrt_next.speed);
                        qrt_next.update();
                    }
                }
                else {
                    // reflexive call
                    qrt_next.init(qrt);
                    while (!qrt_next.isEnd()) {
                        __reflexive_call(qrt_next, end);
                        qrt_next.update();
                    }
                }
            }
            else {
                // create new fiber and initialize
                var childFiber = fbr._newChildFiber(CMLSequence.rapid(), 0, CMLState._invert_flag, null, false), elem;
                // copy bullet setting and bullet multiplyer
                childFiber.bul.copy(qrt_next);
                childFiber.bul.init(qrt);
                elem = qrt_next.next;
                while (elem != end) {
                    childFiber.barrage._appendElementCopyOf((elem));
                    elem = elem.next;
                }
                // copy other parameters
                childFiber.fx = fbr.fx;
                childFiber.fy = fbr.fy;
                childFiber.hopt = fbr.hopt;
                childFiber.hang = (fbr.hopt == CMLState.HO_SEQ) ? 0 : fbr.hang;
                childFiber.fang = fbr.fang;
                childFiber.seqFire = fbr.seqFire;
                childFiber.wtm1 = access_id;
                childFiber.wtm2 = (isParts) ? 1 : 0;
            }
        }
        // internal function to create object
        function __create_bullet(a, v) {
            var childObject = fbr.object.onFireObject(fbr.seqFire), // create object
            sin = CMLState._globalVariables._sin;
            if (childObject == null)
                return;
            sang = sin.index(a + CMLState._globalVariables.scrollAngle); // initialize object
            childObject._initialize(fbr.object, isParts, access_id, x, y, sin[sang + sin.cos_shift] * v, sin[sang] * v, a);
            fbr._newObjectFiber(childObject, fbr.seqFire, CMLState._invert_flag, arg); // create fiber
        }
    }
}
// Status Types
/** @private */ CMLState.ST_NORMAL = 0; // normal command
/** @private */ CMLState.ST_REFER = 1; // refer sequence
/** @private */ CMLState.ST_LABEL = 2; // labeled sequence define "#*.{...}"
/** @private */ CMLState.ST_NO_LABEL = 3; // non-labeled sequence define "{...}"
/** @private */ CMLState.ST_RESTRICT = 4; // restrict to put reference after this command ("&","@*","n*")
/** @private */ CMLState.ST_LOOP = 5; // loop "["
/** @private */ CMLState.ST_IF = 6; // if "[?"
/** @private */ CMLState.ST_ELSE = 7; // else ":"
/** @private */ CMLState.ST_SELECT = 8; // select "[s?"
/** @private */ CMLState.ST_BLOCKEND = 9; // block end "]"
/** @private */ CMLState.ST_FORMULA = 10; // formula 
/** @private */ CMLState.ST_STRING = 11; // string
/** @private */ CMLState.ST_END = 12; // end
/** @private */ CMLState.ST_BARRAGE = 13; // multiple barrage
/** @private */ CMLState.ST_W4D = 14; // wait for destruction
/** @private */ CMLState.ST_RAPID = 16; // rapid fire sequence
/** @private */ CMLState.STF_CALLREF = 32; // flag to require reference after this command ("&","@*","f*","n*")
// Head angle Option
/** @private */ CMLState.HO_ABS = 0; // angle is based on scrolling direction
/** @private */ CMLState.HO_PAR = 1; // angle is based on direction to parent
/** @private */ CMLState.HO_AIM = 2; // angle is based on direction to target
/** @private */ CMLState.HO_FIX = 3; // angle is based on fixed vector
/** @private */ CMLState.HO_REL = 4; // angle is based on object angle
/** @private */ CMLState.HO_VEL = 5; // amgle is based on moving direction
/** @private */ CMLState.HO_SEQ = 6; // angle is calculated from previous frame
// invert flag
CMLState._invert_flag = 0;
// speed ratio
CMLState._speed_ratio = 1;
// command regular expressions
CMLState.command_rex = "(\\[s\\?|\\[\\?|\\[|\\]|\\}|:|\\^&|&|w\\?|w|~|pd|px|py|p|vd|vx|vy|v|ad|ax|ay|a|gp|gt|rc|r|ko|i|m|cd|csa|csr|css|\\^@|@ko|@o|@|\\^n|nc|n|\\^f|fc|f|qx|qy|q|bm|bs|br|bv|hax|ha|hox|ho|hpx|hp|htx|ht|hvx|hv|hs|td|tp|to|kf)";
// global variables
CMLState._globalVariables = null;
