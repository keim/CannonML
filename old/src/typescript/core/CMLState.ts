//----------------------------------------------------------------------------------------------------
// CML statement class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLSequence from "../CMLSequence";
import CMLRefer from "./CMLRefer";
import CMLListElem from "./CMLListElem";
import CMLSinTable from "./CMLSinTable";
import CMLBarrageElem from "./CMLBarrageElem";
import CMLObject from "./CMLObject";
import CMLGlobal from "./CMLGlobal";



/** @private */
export default class CMLState extends CMLListElem
{
// variables
//------------------------------------------------------------
    public type:number;     // statement type
    public func:Function;   // execution function
    public jump:CMLState;   // jump pointer
    public _args:any[];     // arguments array
    
    // Status Types
    /** @private */ public static ST_NORMAL  :number = 0;   // normal command
    /** @private */ public static ST_REFER   :number = 1;   // refer sequence
    /** @private */ public static ST_LABEL   :number = 2;   // labeled sequence define "#*.{...}"
    /** @private */ public static ST_NO_LABEL:number = 3;   // non-labeled sequence define "{...}"
    /** @private */ public static ST_RESTRICT:number = 4;   // restrict to put reference after this command ("&","@*","n*")
    /** @private */ public static ST_LOOP    :number = 5;   // loop "["
    /** @private */ public static ST_IF      :number = 6;   // if "[?"
    /** @private */ public static ST_ELSE    :number = 7;   // else ":"
    /** @private */ public static ST_SELECT  :number = 8;   // select "[s?"
    /** @private */ public static ST_BLOCKEND:number = 9;   // block end "]"
    /** @private */ public static ST_FORMULA :number =10;   // formula 
    /** @private */ public static ST_STRING  :number =11;   // string
    /** @private */ public static ST_END     :number =12;   // end
    /** @private */ public static ST_BARRAGE :number =13;   // multiple barrage
    /** @private */ public static ST_W4D     :number =14;   // wait for destruction
    /** @private */ public static ST_RAPID   :number =16;   // rapid fire sequence
    /** @private */ public static STF_CALLREF:number =32;   // flag to require reference after this command ("&","@*","f*","n*")

    // Head angle Option
    /** @private */ public static HO_ABS:number = 0;    // angle is based on scrolling direction
    /** @private */ public static HO_PAR:number = 1;    // angle is based on direction to parent
    /** @private */ public static HO_AIM:number = 2;    // angle is based on direction to target
    /** @private */ public static HO_FIX:number = 3;    // angle is based on fixed vector
    /** @private */ public static HO_REL:number = 4;    // angle is based on object angle
    /** @private */ public static HO_VEL:number = 5;    // amgle is based on moving direction
    /** @private */ public static HO_SEQ:number = 6;    // angle is calculated from previous frame


    // invert flag
    protected static _invert_flag:number = 0;
    
    // speed ratio
    protected static _speed_ratio:number = 1;
    
    // command regular expressions
    public static command_rex:string = //{
    "(\\[s\\?|\\[\\?|\\[|\\]|\\}|:|\\^&|&|w\\?|w|~|pd|px|py|p|vd|vx|vy|v|ad|ax|ay|a|gp|gt|rc|r|ko|i|m|cd|csa|csr|css|\\^@|@ko|@o|@|\\^n|nc|n|\\^f|fc|f|qx|qy|q|bm|bs|br|bv|hax|ha|hox|ho|hpx|hp|htx|ht|hvx|hv|hs|td|tp|to|kf)";
    
    
    // global variables
    protected static _globalVariables:CMLGlobal = null;
    
    
// functions
//------------------------------------------------------------
    constructor(type_:number = CMLState.ST_NORMAL)
    {
        super();
        this._args = [];
        this.jump = null;
        this.type = type_;

        switch (this.type) {
        case CMLState.ST_RAPID:    this.func = this._rapid_fire;         break;
        case CMLState.ST_BARRAGE:  this.func = this._initialize_barrage; break;
        case CMLState.ST_W4D:
            this.func = this._wait4destruction;
            this.next = this;
            break;
        default:
            this.func = this._nop;
            break;
        }
    }


    /*override*/ public clear() : void
    {
        this._args.length = 0;
        this.jump = null;
        super.clear();
    }

    
    public setCommand(cmd:string) : CMLState { return this._setCommand(cmd); }
    
    
    /** @private initialze call from CannonML first of all */
    public static _initialize(globalVariables_:CMLGlobal) : void
    {
        CMLState._globalVariables = globalVariables_;
        CMLState._speed_ratio = globalVariables_.speedRatio;
    }
    
    
// private fuctions
//------------------------------------------------------------
    /** set command by key string @private */
    protected _setCommand(cmd:string) : CMLState
    {
        var idx:number;

        switch (cmd) {
        // waiting 
        case "w":
            if (this._args.length == 0) {
                this.func = this._w0;
            } else {
                this.func = this._w1;
                if (this._args[0]==0) this._args[0]=Number.MAX_VALUE;
            }
            break;
        case "~":   this.func = this._wi;      break;
        case "w?":  this.func = this._waitif;  break;
        // sequence
        case "}":   this.func = this._ret;         this.type = CMLState.ST_END;      break;
        // repeat and branch
        case "[":   this.func = this._loop_start;  this.type = CMLState.ST_LOOP;     this._resetParameters(1); break;
        case "[?":  this.func = this._if_start;    this.type = CMLState.ST_IF;       if (this._args.length==0) throw Error("no arguments in [?");  break;
        case "[s?": this.func = this._level_start; this.type = CMLState.ST_SELECT;   if (this._args.length==0) throw Error("no arguments in [s?"); break;
        case ":":   this.func = this._else_start;  this.type = CMLState.ST_ELSE;     this._resetParameters(1); break;
        case "]":   this.func = this._block_end;   this.type = CMLState.ST_BLOCKEND; this._resetParameters(1); break;
        // interval
        case "i":   this.func = this._i;  this._resetParameters(1); break;
        // position
        case "p":   this.func = this._p;  this._resetParameters(3); break;
        case "px":  this.func = this._px; this._resetParameters(1); break;
        case "py":  this.func = this._py; this._resetParameters(1); break;
        case "pd":  this.func = this._pd; this._resetParameters(2); break;
        // velocity
        case "v":   this.func = this._v;  this._resetParameters(3); break;
        case "vx":  this.func = this._vx; this._resetParameters(1); break;
        case "vy":  this.func = this._vy; this._resetParameters(1); break;
        case "vd":  this.func = this._vd; this._resetParameters(2); break;
        // accelaration
        case "a":   this.func = this._a;  this._resetParameters(3); break;
        case "ax":  this.func = this._ax; this._resetParameters(1); break;
        case "ay":  this.func = this._ay; this._resetParameters(1); break;
        case "ad":  this.func = this._ad; this._resetParameters(2); break;
        // rotation
        case "r":   this.func = this._r;  this._resetParameters(2); break; 
        case "rc":  this.func = this._rc; this._resetParameters(1); break; 
        // gravity
        case "gp":  this.func = this._gp; this._resetParameters(3); break;
        // bml
        case "cd":  this.func = this._cd;  this._resetParameters(2); break;
        case "csa": this.func = this._csa; this._resetParameters(2); break;
        case "csr": this.func = this._csr; this._resetParameters(2); break;
        case "css": this.func = this._css; this._resetParameters(2); break;
        // kill object
        case "ko":  this.func = this._ko;  this._resetParameters(1); break; 
        // sub routine
        case "&":   this.func = this._gosub;  this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "^&":  this.func = this._fgosub; this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        // fiber
        case "@":   this.func = this._at;   this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "@o":  this.func = this._ato;  this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "@ko": this.func = this._atko; this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "^@":  this.func = this._fat;                            this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "kf":  this.func = this._kf; break;
        // new
        case "n":   this.func = this._n;    this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "nc":  this.func = this._nc;   this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        case "^n":  this.func = this._fn;   this._resetParameters(1); this.type = CMLState.ST_RESTRICT | CMLState.STF_CALLREF; break;
        // fire
        case "f":   this._resetParameters(2); this.func = (isNaN(this._args[0])) ? this._f0  : this._f1;  this.type = CMLState.STF_CALLREF; break;
        case "fc":  this._resetParameters(2); this.func = (isNaN(this._args[0])) ? this._fc0 : this._fc1; this.type = CMLState.STF_CALLREF; break;
        case "^f":  this._resetParameters(2); this.func = (isNaN(this._args[0])) ? this._ff0 : this._ff1; this.type = CMLState.STF_CALLREF; break;
        // fiber position
        case "q":   this.func = this._q;  this._resetParameters(2); break;
        case "qx":  this.func = this._qx; this._resetParameters(1); break;
        case "qy":  this.func = this._qy; this._resetParameters(1); break;
        // head
        case "ha":
        case "hax": this.func = this._ha;  this._resetParameters(1); break; 
        case "hp":  this.func = this._hp;  this._resetParameters(1); break; 
        case "ht":  this.func = this._ht;  this._resetParameters(1); break; 
        case "ho":  this.func = this._ho;  this._resetParameters(1); break; 
        case "hv":  this.func = this._hv;  this._resetParameters(1); break; 
        case "hpx": this.func = this._hpx; this._resetParameters(1); break; 
        case "htx": this.func = this._htx; this._resetParameters(1); break; 
        case "hox": this.func = this._hox; this._resetParameters(1); break; 
        case "hvx": this.func = this._hvx; this._resetParameters(1); break; 
        case "hs":  this.func = this._hs;  this._resetParameters(1); break; 
        // barrage
        case "bm": this.func = this._bm; this._resetParameters(4); this.type = CMLState.ST_BARRAGE; break;
        case "bs": this.func = this._bs; this._resetParameters(4); this.type = CMLState.ST_BARRAGE; break;
        case "br": this.func = this._br; this._resetParameters(4); this.type = CMLState.ST_BARRAGE; break;
        case "bv": this.func = this._bv; this._resetParameters(1); break; 
        // target
        case "td": this.func = this._td; break; 
        case "tp": this.func = this._tp; break; 
        case "to": this.func = this._to; this._resetParameters(1); break;
        // mirror
        case "m":  this.func = this._m;  this._resetParameters(1); break;
        
        default:
            throw Error("Unknown command; " + cmd + " ?");
        }
        
        // set undefined augments to 0.
        for (idx=0; idx<this._args.length; idx++) {
            if (isNaN(this._args[idx])) this._args[idx] = 0;
        }

        return this;
    }
    
    // set default arguments
    protected _resetParameters(argc:number) : void
    {
        var ibegin:number = this._args.length, i:number;
        if (ibegin < argc) {
            this._args.length = argc;
            for (i=ibegin; i<argc; i++) {
                this._args[i] = Number.NaN;
            }
        }
    }

    
    
    
// command executer
//------------------------------------------------------------
    // set invertion flag (call from CMLFiber.execute())
    public static _setInvertionFlag(invt_:number) : void
    {
        CMLState._invert_flag = invt_;
    }
    
    // no operation or end
    protected _nop(fbr:CMLFiber) : boolean { return true; }
    
    // looping, branching
    private _loop_start(fbr:CMLFiber) : boolean {
        fbr.lcnt.unshift(0);
        return true;
    }
    private _if_start(fbr:CMLFiber) : boolean {
        if (this._args[0]==0) fbr._pointer = this.jump;
        return true;
    }
    private _level_start(fbr:CMLFiber) : boolean {
        while (fbr._pointer.jump.type == CMLState.ST_ELSE) {
            if (this._args[0] < fbr._pointer.jump._args[0]) return true;
            fbr._pointer = fbr._pointer.jump;
        }
        return true;
    }
    private _else_start(fbr:CMLFiber) : boolean {
        do {
            fbr._pointer = fbr._pointer.jump;
        } while (fbr._pointer.type == CMLState.ST_ELSE);
        return true;
    }
    private _block_end(fbr:CMLFiber) : boolean {
        if (this.jump.type == CMLState.ST_LOOP) {
            var lmax:number = Math.floor(this._args[0] || this.jump._args[0]);
            if (++fbr.lcnt[0] != lmax) {
                fbr._pointer = this.jump;
                return true;
            }
            fbr.lcnt.shift();
        }
        return true;
    }

    // wait
    private _w0(fbr:CMLFiber) : boolean { fbr.wcnt = fbr.wtm1; return false; }
    private _w1(fbr:CMLFiber) : boolean { fbr.wtm1 = this._args[0]; fbr.wcnt = fbr.wtm1; return false; }
    private _wi(fbr:CMLFiber) : boolean { fbr.wcnt = fbr.wtm2; return (fbr.wcnt == 0); }
    
    // waitif
    private _waitif(fbr:CMLFiber) : boolean {
        if (this._args[0] == 0) return true;
        fbr._pointer = ((<CMLState>this.prev).type == CMLState.ST_FORMULA) ? (<CMLState>this.prev.prev) : (<CMLState>this.prev);
        return false;
    }
    
    // interpolation interval
    private _i(fbr:CMLFiber) : boolean { 
        fbr.chgt = Math.floor(this._args[0]);
        fbr.wtm2 = fbr.chgt;
        return true;
    }
    
    // mirroring
    private _m(fbr:CMLFiber) : boolean {
        // invert flag
        CMLState._invert_flag = fbr.invt ^ (((this._args[0]) + 1) >> 0);
        // execute next statement
        fbr._pointer = (<CMLState>fbr._pointer.next);
        var res:boolean = (<CMLState>fbr._pointer).func(fbr);
        // reset flag
        CMLState._invert_flag = fbr.invt;
        return res;
    }

    // position of fiber
    private _q(fbr:CMLFiber)  : boolean { fbr.fx=this._invertX(this._args[0]); fbr.fy=this._invertY(this._args[1]); return true; }
    private _qx(fbr:CMLFiber) : boolean { fbr.fx=this._invertX(this._args[0]); return true; }
    private _qy(fbr:CMLFiber) : boolean { fbr.fy=this._invertY(this._args[0]); return true; }

    // position
    private _p(fbr:CMLFiber)  : boolean { fbr.object.setPosition(this._invertX(this._args[0]), this._invertY(this._args[1]), this._args[2], fbr.chgt); return true; }
    private _px(fbr:CMLFiber) : boolean { fbr.object.setPosition(this._invertX(this._args[0]), fbr.object._getY(), fbr.object._getZ(), fbr.chgt); return true; }
    private _py(fbr:CMLFiber) : boolean { fbr.object.setPosition(fbr.object._getX(), this._invertY(this._args[0]), fbr.object._getZ(), fbr.chgt); return true; }
    private _pz(fbr:CMLFiber) : boolean { fbr.object.setPosition(fbr.object._getX(), fbr.object._getY(), this._args[0], fbr.chgt); return true; }
    private _pd(fbr:CMLFiber) : boolean {
        var iang:number, sin:CMLSinTable = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLState._globalVariables.scrollAngle);
        else                             iang = sin.index(fbr.object.anglePosition-fbr._getAngleForRotationCommand());
        var c:number = sin[iang+sin.cos_shift],
            s:number = sin[iang];
        fbr.object.setPosition(c*this._args[0]-s*this._args[1], s*this._args[0]+c*this._args[1], fbr.object._getZ(), fbr.chgt);
        return true;
    }

    // velocity
    private _v(fbr:CMLFiber)  : boolean { fbr.object.setVelocity(this._invertX(this._args[0]*CMLState._speed_ratio), this._invertY(this._args[1]*CMLState._speed_ratio), this._args[2]*CMLState._speed_ratio, fbr.chgt); return true; }
    private _vx(fbr:CMLFiber) : boolean { fbr.object.setVelocity(this._invertX(this._args[0]*CMLState._speed_ratio), fbr.object.vy,                   fbr.object.vz,         fbr.chgt); return true; }
    private _vy(fbr:CMLFiber) : boolean { fbr.object.setVelocity(fbr.object.vx,                   this._invertY(this._args[0]*CMLState._speed_ratio), fbr.object.vz,         fbr.chgt); return true; }
    private _vz(fbr:CMLFiber) : boolean { fbr.object.setVelocity(fbr.object.vx,                   fbr.object.vy,                   this._args[0]*CMLState._speed_ratio, fbr.chgt); return true; }
    private _vd(fbr:CMLFiber) : boolean {
        var iang:number, sin:CMLSinTable = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLState._globalVariables.scrollAngle);
        else                             iang = sin.index(fbr.object.angleVelocity-fbr._getAngle(0));
        var c:number = sin[iang+sin.cos_shift],
            s:number = sin[iang],
            h:number = this._args[0] * CMLState._speed_ratio,
            v:number = this._args[1] * CMLState._speed_ratio;
        fbr.object.setVelocity(c*h-s*v, s*h+c*v, fbr.object.vz, fbr.chgt);
        return true;
    }

    // acceleration
    private _a(fbr:CMLFiber)  : boolean { fbr.object.setAccelaration(this._invertX(this._args[0]*CMLState._speed_ratio), this._invertY(this._args[1]*CMLState._speed_ratio), this._args[1]*CMLState._speed_ratio, 0); return true; }
    private _ax(fbr:CMLFiber) : boolean { fbr.object.setAccelaration(this._invertX(this._args[0]*CMLState._speed_ratio), fbr.object._getAy(),             fbr.object._getAz(),   0); return true; }
    private _ay(fbr:CMLFiber) : boolean { fbr.object.setAccelaration(fbr.object._getAx(),             this._invertY(this._args[0]*CMLState._speed_ratio), fbr.object._getAz(),   0); return true; }
    private _az(fbr:CMLFiber) : boolean { fbr.object.setAccelaration(fbr.object._getAx(),             fbr.object._getAy(),             this._args[0]*CMLState._speed_ratio, 0); return true; }
    private _ad(fbr:CMLFiber) : boolean {
        var iang:number, sin:CMLSinTable = CMLState._globalVariables._sin;
        if (fbr.hopt != CMLState.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLState._globalVariables.scrollAngle);
        else                             iang = sin.index(fbr.object.angleAccel-fbr._getAngle(0));
        var c:number = sin[iang+sin.cos_shift],
            s:number = sin[iang],
            h:number = this._args[0] * CMLState._speed_ratio,
            v:number = this._args[1] * CMLState._speed_ratio;
        fbr.object.setAccelaration(c*h-s*v, s*h+c*v, fbr.object._getAz(), 0);
        return true;
    }

    // gravity
    private _gp(fbr:CMLFiber) : boolean {
        fbr.chgt = 0;
        fbr.object.setGravity(this._args[0] * CMLState._speed_ratio, this._args[1] * CMLState._speed_ratio, this._args[2]);
        return true;
    }
    
    // It's very tough to implement bulletML...('A`)
    private _csa(fbr:CMLFiber) : boolean { fbr.object.setChangeSpeed(this._args[0]*CMLState._speed_ratio,                     fbr.chgt); return true; }
    private _csr(fbr:CMLFiber) : boolean { fbr.object.setChangeSpeed(this._args[0]*CMLState._speed_ratio+fbr.object.velocity, fbr.chgt); return true; }
    private _css(fbr:CMLFiber) : boolean { 
        if (fbr.chgt == 0) fbr.object.setChangeSpeed(this._args[0]*CMLState._speed_ratio+fbr.object.velocity,          0);
        else               fbr.object.setChangeSpeed(this._args[0]*CMLState._speed_ratio*fbr.chgt+fbr.object.velocity, fbr.chgt);
        return true; 
    }
    private _cd(fbr:CMLFiber) : boolean { 
        fbr.object.setChangeDirection(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0]*CMLState._speed_ratio, fbr._isShortestRotation());
        return true;
    }
    // rotation
    private _r(fbr:CMLFiber)  : boolean {
        fbr.object.setRotation(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0], this._args[1], fbr._isShortestRotation());
        return true;
    }
    private _rc(fbr:CMLFiber) : boolean {
        fbr.object.setConstantRotation(fbr._getAngleForRotationCommand(), fbr.chgt, this._args[0]*CMLState._speed_ratio, fbr._isShortestRotation());
        return true;
    }

    // kill object
    private _ko(fbr:CMLFiber) : boolean {
        fbr.object.destroy(this._args[0]);
        return false;
    }
    // kill all children fiber
    private _kf(fbr:CMLFiber) : boolean {
        fbr.destroyAllChildren();
        return true;
    }
    
    // initialize barrage
    private _initialize_barrage(fbr:CMLFiber)  : boolean { fbr.barrage.clear(); return true; }
    // multiple barrage
    private _bm(fbr:CMLFiber) : boolean { fbr.barrage.appendMultiple(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]); return true; }
    // sequencial barrage
    private _bs(fbr:CMLFiber) : boolean { fbr.barrage.appendSequence(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]); return true; }
    // random barrage
    private _br(fbr:CMLFiber) : boolean { fbr.barrage.appendRandom(this._args[0], this._invertRotation(this._args[1]), this._args[2], this._args[3]);   return true; }
    
    // bullet sequence of verocity
    private _bv(fbr:CMLFiber) : boolean { fbr.bul.setSpeedStep(this._args[0]*CMLState._speed_ratio); return true; }

    // head angle
    private _ha(fbr:CMLFiber)  : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_ABS; return true; }
    private _ho(fbr:CMLFiber)  : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_REL; return true; }
    private _hp(fbr:CMLFiber)  : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_PAR; return true; }
    private _ht(fbr:CMLFiber)  : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_AIM; return true; }
    private _hv(fbr:CMLFiber)  : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_VEL; return true; }
    private _hox(fbr:CMLFiber) : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_REL; this._fix(fbr); return true; }
    private _hpx(fbr:CMLFiber) : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_PAR; this._fix(fbr); return true; }
    private _htx(fbr:CMLFiber) : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_AIM; this._fix(fbr); return true; }
    private _hvx(fbr:CMLFiber) : boolean { fbr.hang=this._invertAngle(this._args[0]); fbr.hopt=CMLState.HO_VEL; this._fix(fbr); return true; }
    private _hs(fbr:CMLFiber)  : boolean { fbr.hang=this._invertRotation(this._args[0]); fbr.hopt=CMLState.HO_SEQ; return true; }
    private _fix(fbr:CMLFiber) : void { fbr.hang=fbr._getAngle(0); fbr.hopt=CMLState.HO_FIX; }

    // set target
    private _td(fbr:CMLFiber) : boolean { fbr.target = null; return true; }
    private _tp(fbr:CMLFiber) : boolean { fbr.target = fbr.object.parent; return true; }
    private _to(fbr:CMLFiber) : boolean { fbr.target = fbr.object.findChild(this._args[0]>>0); return true; }
    
    // call sequence (create new fiber directry)
    // gosub
    private _gosub(fbr:CMLFiber) : boolean {
        // execution error
        if (fbr.jstc.length > CMLFiber._stacmax) {
            throw new Error("CML Execution error. The '&' command calls deeper than stac limit.");
        }
        
        // next statement is referential sequence
        var ref:CMLRefer = <CMLRefer>(this.next);
        var seq:CMLSequence  = (ref.jump != null) ? (<CMLSequence>ref.jump) : (fbr.seqSub);
        fbr.jstc.push(ref);
        fbr._unshiftInvertion(CMLState._invert_flag);
        fbr._unshiftArguments(seq.require_argc, ref._args);
        fbr._pointer = seq;
        return true;
    }
    // fake gosub
    private _fgosub(fbr:CMLFiber) : boolean {
        if ((<CMLState>this.next).jump != null) fbr.seqSub = (<CMLSequence>(<CMLState>this.next).jump);
        return true;
    }
    
    // return
    private _ret(fbr:CMLFiber) : boolean {
        // pop jump stac
        if (fbr.jstc.length > 0) {
            fbr._shiftArguments();
            fbr._shiftInvertion();
            fbr._pointer = fbr.jstc.pop();
            fbr.seqSub = (<CMLSequence>this.jump);
        }
        return true;
    }
    
    // execute new fiber, fiber on child
    private _at(fbr:CMLFiber)   : boolean { this._fiber(fbr, this._args[0]); return true; }
    private _ato(fbr:CMLFiber)  : boolean { this._fiber_child(fbr, fbr.object, this._args); return true; }
    private _fat(fbr:CMLFiber)  : boolean { if ((<CMLState>this.next).jump != null) fbr.seqExec = (<CMLSequence>(<CMLState>this.next).jump); return true; }
    private _atko(fbr:CMLFiber) : boolean { this._fiber_destruction(fbr, this._args[0]); return true; }

    // new
    private _n(fbr:CMLFiber)  : boolean { this._new(fbr, Math.floor(this._args[0]), false); return true; }
    private _nc(fbr:CMLFiber) : boolean { this._new(fbr, Math.floor(this._args[0]), true);  return true; }
    private _fn(fbr:CMLFiber) : boolean { if ((<CMLState>this.next).jump != null) fbr.seqNew = (<CMLSequence>(<CMLState>this.next).jump); return true; }
    
    // fire
    private _f0(fbr:CMLFiber)  : boolean {                                                      this._fire(fbr, Math.floor(this._args[1]), false); fbr.bul.update(); return true; }
    private _f1(fbr:CMLFiber)  : boolean { fbr.bul.speed = this._args[0]*CMLState._speed_ratio; this._fire(fbr, Math.floor(this._args[1]), false); fbr.bul.update(); return true; }
    private _fc0(fbr:CMLFiber) : boolean {                                                      this._fire(fbr, Math.floor(this._args[1]), true);  fbr.bul.update(); return true; }
    private _fc1(fbr:CMLFiber) : boolean { fbr.bul.speed = this._args[0]*CMLState._speed_ratio; this._fire(fbr, Math.floor(this._args[1]), true);  fbr.bul.update(); return true; }

    // fake fire
    private _ff0(fbr:CMLFiber) : boolean { 
        var refer:CMLRefer = (<CMLRefer>this.next);
        if (refer.jump != null) fbr.seqFire = (<CMLSequence>refer.jump);
        fbr.fang = fbr._getAngle(fbr.fang);
        fbr._pointer = refer;
        fbr.bul.update();
        return true;
    }
    private _ff1(fbr:CMLFiber) : boolean {
        fbr.bul.speed = this._args[0]*CMLState._speed_ratio;
        return this._ff0(fbr);
    }
    
    // statement for rapid fire
    private _rapid_fire(fbr:CMLFiber) : boolean {
        // end
        if (fbr.bul.isEnd()) return false;

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
    private _wait4destruction(fbr:CMLFiber) : boolean {
        if (fbr.object.destructionStatus == fbr._access_id) {
            fbr._pointer = this.jump;
            return true;
        }
        return false;
    }
    
    
    
    
// invertion
//--------------------------------------------------
    private _invertAngle(ang:number) : number
    {
        if (CMLState._invert_flag&(2-CMLState._globalVariables.vertical)) ang = -ang;
        if (CMLState._invert_flag&(1+CMLState._globalVariables.vertical)) ang = 180-ang;
        return ang;
    }

    
    private _invertRotation(rot:number) : number
    {
        return (CMLState._invert_flag==1 || CMLState._invert_flag==2) ? -rot : rot;
    }

    
    private _invertX(x:number) : number
    {
        return (CMLState._invert_flag&(2-CMLState._globalVariables.vertical)) ? -x : x;
    }
    

    private _invertY(y:number) : number
    {
        return (CMLState._invert_flag&(1+CMLState._globalVariables.vertical)) ? -y : y;
    }

    
    

// creating routine
//--------------------------------------------------
    // run new fiber
    private _fiber(fbr:CMLFiber, fiber_id:number) : void
    {
        var ref:CMLRefer = (<CMLRefer>this.next);                                                      // next statement is referential sequence
        var seq:CMLSequence  = (ref.jump != null) ? (<CMLSequence>ref.jump) : (fbr.seqExec);      // executing sequence
        fbr._newChildFiber(seq, fiber_id, CMLState._invert_flag, ref._args, (seq.type==CMLState.ST_NO_LABEL));    // create and initialize fiber
        fbr.seqExec = seq;                                                                      // update executing sequence
        fbr._pointer = ref;                                                                     // skip next statement
    }
    

    // run new destruction fiber
    private _fiber_destruction(fbr:CMLFiber, destStatus:number) : void
    {
        var ref:CMLRefer = (<CMLRefer>this.next);                                                      // next statement is referential sequence
        var seq:CMLSequence = (ref.jump != null) ? (<CMLSequence>ref.jump) : (fbr.seqExec);       // executing sequence
        fbr._newDestFiber(seq, destStatus, CMLState._invert_flag, ref._args);                            // create and initialize destruction fiber
        fbr.seqExec = seq;                                                                      // update executing sequence
        fbr._pointer = ref;                                                                     // skip next statement
    }


    // run new fiber on child object
    private _fiber_child(fbr:CMLFiber, obj:CMLObject, object_id:any[]) : void
    {
        var ref:CMLRefer = (<CMLRefer>this.next);                                                  // next statement is referential sequence
        var seq:CMLSequence = (ref.jump != null) ? (<CMLSequence>ref.jump) : (fbr.seqExec);   // executing sequence
        var idxmax:number = object_id.length-1;
        
        _reflective_fiber_creation(obj, 0);                                                 // find child by object_id and create new fiber
        
        fbr.seqExec = seq;                                                                  // update executing sequence
        fbr._pointer = ref;                                                                 // skip next statement

        // ('A`) chaos...
        function _reflective_fiber_creation(_parent:CMLObject, _idx:number) : void {
            this._parent.findAllChildren(object_id[_idx], (_idx == idxmax) ? this.__nof : this.__rfc);
            function __nof(obj:CMLObject):boolean { fbr._newObjectFiber(obj, seq, CMLState._invert_flag, ref._args); return false; }
            function __rfc(obj:CMLObject):boolean { _reflective_fiber_creation(obj, _idx+1);                return false; }
        }
    }


    // new
    private _new(fbr:CMLFiber, access_id:number, isParts:boolean) : void
    {
        var sin:CMLSinTable = CMLState._globalVariables._sin,
            sang:number, cang:number, x:number, y:number;

        // next statement is referential sequence
        var ref:CMLRefer = (<CMLRefer>this.next);
        
        // update new pointer, ref.jump shows executing sequence            
        if (ref.jump != null) fbr.seqNew = (<CMLSequence>ref.jump);

        // creating center position
        x = fbr.fx;
        y = fbr.fy;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (!isParts) {
            sang = sin.index(fbr.object.angleOnStage),
            cang = sang + sin.cos_shift;
            x = fbr.object.x + sin[cang]*fbr.fx - sin[sang]*fbr.fy;
            y = fbr.object.y + sin[sang]*fbr.fx + sin[cang]*fbr.fy;
        }

        // create object
        var childObject:CMLObject = fbr.object.onNewObject(fbr.seqNew);
        if (childObject == null) return;
        childObject._initialize(fbr.object, isParts, access_id, x, y, 0, 0, 0);

        // create fiber
        fbr._newObjectFiber(childObject, fbr.seqNew, CMLState._invert_flag, ref._args);

        // skip next statement
        fbr._pointer = ref;
    }

    
    // fire
    private _fire(fbr:CMLFiber, access_id:number, isParts:boolean) : void
    {
        // next statement is referential sequence
        var ref:CMLRefer = (<CMLRefer>this.next);
        
        // update fire pointer, ref.jump shows executing sequence
        if (ref.jump != null) fbr.seqFire = (<CMLSequence>ref.jump);

        // create multi bullet
        this._create_multi_bullet(fbr, access_id, isParts, ref._args);

        // skip next statement
        fbr._pointer = ref;
    }

    
    // fire reflective implement
    private _create_multi_bullet(fbr:CMLFiber, access_id:number, isParts:boolean, arg:any[]) : void
    {
        var sin:CMLSinTable = CMLState._globalVariables._sin,
            sang:number, cang:number, x:number, y:number;

        // creating center position
        x = fbr.fx;
        y = fbr.fy;
        // calculate fiber position on absolute coordinate, when it's not relative creation.
        if (!isParts) {
            sang = sin.index(fbr.object.angleOnStage);
            cang = sang + sin.cos_shift;
            x = fbr.object.x + sin[cang]*fbr.fx - sin[sang]*fbr.fy;
            y = fbr.object.y + sin[sang]*fbr.fx + sin[cang]*fbr.fy;
        }

        // calculate angle
        fbr.fang = fbr._getAngle(fbr.fang);

        // create bullets
        if (fbr.barrage.qrtList.isEmpty()) {
            // create single bullet
            __create_bullet(fbr.fang + fbr.bul.angle, fbr.bul.speed);
        } else {
            // reflexive call
            fbr.bul.next = fbr.barrage.qrtList.head;
            __reflexive_call(fbr.bul, fbr.barrage.qrtList.end);
        }

        function __reflexive_call(qrt:CMLBarrageElem, end:CMLListElem) : void
        {
            var qrt_next:CMLBarrageElem = <CMLBarrageElem>(qrt.next);
            
            if (qrt_next.interval == 0) {
                if (qrt_next.next == end) {
                    // create bullet
                    qrt_next.init(qrt);
                    while (!qrt_next.isEnd()) {
                        __create_bullet(fbr.fang + qrt_next.angle, qrt_next.speed);
                        qrt_next.update();
                    }
                } else {
                    // reflexive call
                    qrt_next.init(qrt);
                    while (!qrt_next.isEnd()) {
                        __reflexive_call(qrt_next, end);
                        qrt_next.update();
                    }
                }
            } else {
                // create new fiber and initialize
                var childFiber:CMLFiber = fbr._newChildFiber(CMLSequence.rapid(), 0, CMLState._invert_flag, null, false),
                    elem:CMLListElem;

                // copy bullet setting and bullet multiplyer
                childFiber.bul.copy(qrt_next);
                childFiber.bul.init(qrt);
                elem = qrt_next.next;
                while (elem != end) {
                    childFiber.barrage._appendElementCopyOf(<CMLBarrageElem>(elem));
                    elem = elem.next
                }

                // copy other parameters
                childFiber.fx = fbr.fx;
                childFiber.fy = fbr.fy;
                childFiber.hopt = fbr.hopt;
                childFiber.hang = (fbr.hopt==CMLState.HO_SEQ) ? 0 : fbr.hang;
                childFiber.fang = fbr.fang;
                childFiber.seqFire = fbr.seqFire;
                childFiber.wtm1 = access_id;
                childFiber.wtm2 = (isParts) ? 1 : 0;
            }
        }

        // internal function to create object
        function __create_bullet(a:number, v:number) : void
        {
            var childObject:CMLObject = fbr.object.onFireObject(fbr.seqFire),     // create object
                sin:CMLSinTable = CMLState._globalVariables._sin;
            if (childObject == null) return;
            sang = sin.index(a+CMLState._globalVariables.scrollAngle);                  // initialize object
            childObject._initialize(fbr.object, isParts, access_id, x, y, sin[sang+sin.cos_shift]*v, sin[sang]*v, a);
            fbr._newObjectFiber(childObject, fbr.seqFire, CMLState._invert_flag, arg);  // create fiber
        }
    }
}
