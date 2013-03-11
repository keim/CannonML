//----------------------------------------------------------------------------------------------------
// CML statement class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLFiber;
    import org.si.cml.CMLObject;
    import org.si.cml.CMLSequence;
    import org.si.cml.namespaces._cml_internal;
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
    /** @private */
    public class CMLState extends CMLListElem
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        use namespace _cml_fiber_internal;
        
        
        
        
    // variables
    //------------------------------------------------------------
        _cml_fiber_internal var type:uint;     // statement type
        _cml_fiber_internal var func:Function; // execution function
        _cml_fiber_internal var jump:CMLState; // jump pointer
        _cml_fiber_internal var _args:Array;   // arguments array
        
        static public const ST_NORMAL  :uint = 0;   // normal command
        static public const ST_REFER   :uint = 1;   // refer sequence
        static public const ST_LABEL   :uint = 2;   // labeled sequence define "#*.{...}"
        static public const ST_NO_LABEL:uint = 3;   // non-labeled sequence define "{...}"
        static public const ST_RESTRICT:uint = 4;   // restrict to put reference after this command ("&","@*","n*")
        static public const ST_LOOP    :uint = 5;   // loop "["
        static public const ST_IF      :uint = 6;   // if "[?"
        static public const ST_ELSE    :uint = 7;   // else ":"
        static public const ST_SELECT  :uint = 8;   // select "[s?"
        static public const ST_BLOCKEND:uint = 9;   // block end "]"
        static public const ST_FORMULA :uint =10;   // formula 
        static public const ST_STRING  :uint =11;   // string
        static public const ST_END     :uint =12;   // end
        static public const ST_BARRAGE :uint =13;   // multiple barrage
        static public const ST_W4D     :uint =14;   // wait for destruction
        static public const ST_RAPID   :uint =16;   // rapid fire sequence
        static public const STF_CALLREF:uint =32;   // flag to require reference after this command ("&","@*","f*","n*")

        // invert flag
        static protected var _invert_flag:uint = 0;
        
        // speed ratio
        static protected var _speed_ratio:Number = 1;
        
        // command regular expressions
        static _cml_internal var command_rex:String = //{
        "(\\[s\\?|\\[\\?|\\[|\\]|\\}|:|\\^&|&|w\\?|w|~|pd|px|py|p|vd|vx|vy|v|ad|ax|ay|a|gp|gt|rc|r|ko|i|m|cd|csa|csr|css|\\^@|@ko|@o|@|\\^n|nc|n|\\^f|fc|f|qx|qy|q|bm|bs|br|bv|hax|ha|hox|ho|hpx|hp|htx|ht|hvx|hv|hs|td|tp|to|kf)";
        
        
        
        
    // functions
    //------------------------------------------------------------
        function CMLState(type_:uint = ST_NORMAL)
        {
            _args = [];
            jump = null;
            type = type_;

            switch (type) {
            case ST_RAPID:    func = _rapid_fire;         break;
            case ST_BARRAGE:  func = _initialize_barrage; break;
            case ST_W4D:
                func = _wait4destruction;
                next = this;
                break;
            default:          func = _nop;                break;
            }
        }
    
    
        override public function clear() : void
        {
            _args.length = 0;
            jump = null;
            super.clear();
        }

        
        static _cml_internal function set speedRatio(r:Number) : void { _speed_ratio = r; }
        static _cml_internal function get speedRatio() : Number { return _speed_ratio; }
        
        _cml_internal function setCommand(cmd:String) : CMLState { return _setCommand(cmd); }
        
        
        
        
    // private fuctions
    //------------------------------------------------------------
        /** set command by key string @private */
        protected function _setCommand(cmd:String) : CMLState
        {
            switch (cmd) {
            // waiting 
            case "w":
                if (_args.length == 0) {
                    func = _w0;
                } else {
                    func = _w1;
                    if (_args[0]==0) _args[0]=int.MAX_VALUE;
                }
                break;
            case "~":   func = _wi;      break;
            case "w?":  func = _waitif;  break;
            // sequence
            case "}":   func = _ret;         type = ST_END;      break;
            // repeat and branch
            case "[":   func = _loop_start;  type = ST_LOOP;     _resetParameters(1); break;
            case "[?":  func = _if_start;    type = ST_IF;       if (_args.length==0) throw Error("no arguments in [?");  break;
            case "[s?": func = _level_start; type = ST_SELECT;   if (_args.length==0) throw Error("no arguments in [s?"); break;
            case ":":   func = _else_start;  type = ST_ELSE;     _resetParameters(1); break;
            case "]":   func = _block_end;   type = ST_BLOCKEND; _resetParameters(1); break;
            // interval
            case "i":   func = _i;  _resetParameters(1); break;
            // position
            case "p":   func = _p;  _resetParameters(2); break;
            case "px":  func = _px; _resetParameters(1); break;
            case "py":  func = _py; _resetParameters(1); break;
            case "pd":  func = _pd; _resetParameters(2); break;
            // velocity
            case "v":   func = _v;  _resetParameters(2); break;
            case "vx":  func = _vx; _resetParameters(1); break;
            case "vy":  func = _vy; _resetParameters(1); break;
            case "vd":  func = _vd; _resetParameters(2); break;
            // accelaration
            case "a":   func = _a;  _resetParameters(2); break;
            case "ax":  func = _ax; _resetParameters(1); break;
            case "ay":  func = _ay; _resetParameters(1); break;
            case "ad":  func = _ad; _resetParameters(2); break;
            // rotation
            case "r":   func = _r;  _resetParameters(2); break; 
            case "rc":  func = _rc; _resetParameters(1); break; 
            // gravity
            case "gp":  func = _gp; _resetParameters(3); break;
            // bml
            case "cd":  func = _cd;  _resetParameters(2); break;
            case "csa": func = _csa; _resetParameters(2); break;
            case "csr": func = _csr; _resetParameters(2); break;
            case "css": func = _css; _resetParameters(2); break;
            // kill object
            case "ko":  func = _ko;  _resetParameters(1); break; 
            // sub routine
            case "&":   func = _gosub;                     type = ST_RESTRICT | STF_CALLREF; break;
            case "^&":  func = _fgosub;                    type = ST_RESTRICT | STF_CALLREF; break;
            // fiber
            case "@":   func = _at;   _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            case "@o":  func = _ato;  _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            case "@ko": func = _atko; _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            case "^@":  func = _fat;                       type = ST_RESTRICT | STF_CALLREF; break;
            case "kf":  func = _kf; break;
            // new
            case "n":   func = _n;    _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            case "nc":  func = _nc;   _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            case "^n":  func = _fn;   _resetParameters(1); type = ST_RESTRICT | STF_CALLREF; break;
            // fire
            case "f":   _resetParameters(2); func = (isNaN(_args[0])) ? _f0  : _f1;  type = STF_CALLREF; break;
            case "fc":  _resetParameters(2); func = (isNaN(_args[0])) ? _fc0 : _fc1; type = STF_CALLREF; break;
            case "^f":  _resetParameters(2); func = (isNaN(_args[0])) ? _ff0 : _ff1; type = STF_CALLREF; break;
            // fiber position
            case "q":   func = _q;  _resetParameters(2); break;
            case "qx":  func = _qx; _resetParameters(1); break;
            case "qy":  func = _qy; _resetParameters(1); break;
            // head
            case "ha":
            case "hax": func = _ha;  _resetParameters(1); break; 
            case "hp":  func = _hp;  _resetParameters(1); break; 
            case "ht":  func = _ht;  _resetParameters(1); break; 
            case "ho":  func = _ho;  _resetParameters(1); break; 
            case "hv":  func = _hv;  _resetParameters(1); break; 
            case "hpx": func = _hpx; _resetParameters(1); break; 
            case "htx": func = _htx; _resetParameters(1); break; 
            case "hox": func = _hox; _resetParameters(1); break; 
            case "hvx": func = _hvx; _resetParameters(1); break; 
            case "hs":  func = _hs;  _resetParameters(1); break; 
            // barrage
            case "bm": func = _bm; _resetParameters(4); type = ST_BARRAGE; break;
            case "bs": func = _bs; _resetParameters(4); type = ST_BARRAGE; break;
            case "br": func = _br; _resetParameters(4); type = ST_BARRAGE; break;
            case "bv": func = _bv; _resetParameters(1); break; 
            // target
            case "td": func = _td; break; 
            case "tp": func = _tp; break; 
            case "to": func = _to; _resetParameters(1); break;
            // mirror
            case "m":  func = _m;  _resetParameters(1); break;
            
            default:
                throw Error("Unknown command; " + cmd + " ?");
            }
            
            // set undefined augments to 0.
            for (var idx:int=0; idx<_args.length; idx++) {
                if (isNaN(_args[idx])) _args[idx] = 0;
            }

            return this;
        }
        
        // set default arguments
        protected function _resetParameters(argc:int) : void
        {
            var ibegin:int = _args.length;
            if (ibegin < argc) {
                _args.length = argc;
                for (var i:int=ibegin; i<argc; i++) {
                    _args[i] = Number.NaN;
                }
            }
        }

        
        
        
    // command executer
    //------------------------------------------------------------
        // set invertion flag (call from CMLFiber.execute())
        static _cml_internal function _setInvertionFlag(invt_:uint) : void
        {
            _invert_flag = invt_;
        }
        
        // no operation or end
        protected function _nop(fbr:CMLFiber) : Boolean { return true; }
        
        // looping, branching
        private function _loop_start(fbr:CMLFiber) : Boolean {
            fbr.lcnt.unshift(int(0));
            return true;
        }
        private function _if_start(fbr:CMLFiber) : Boolean {
            if (_args[0]==0) fbr._pointer = jump;
            return true;
        }
        private function _level_start(fbr:CMLFiber) : Boolean {
            while (fbr._pointer.jump.type == ST_ELSE) {
                if (_args[0] < fbr._pointer.jump._args[0]) return true;
                fbr._pointer = fbr._pointer.jump;
            }
            return true;
        }
        private function _else_start(fbr:CMLFiber) : Boolean {
            do {
                fbr._pointer = fbr._pointer.jump;
            } while (fbr._pointer.type == ST_ELSE);
            return true;
        }
        private function _block_end(fbr:CMLFiber) : Boolean {
            if (jump.type == ST_LOOP) {
                var lmax:int = int(_args[0] || jump._args[0]);
                if (++fbr.lcnt[0] != lmax) {
                    fbr._pointer = jump;
                    return true;
                }
                fbr.lcnt.shift();
            }
            return true;
        }

        // wait
        private function _w0(fbr:CMLFiber) : Boolean {                      fbr.wcnt = fbr.wtm1; return false; }
        private function _w1(fbr:CMLFiber) : Boolean { fbr.wtm1 = _args[0]; fbr.wcnt = fbr.wtm1; return false; }
        private function _wi(fbr:CMLFiber) : Boolean {                      fbr.wcnt = fbr.wtm2; return (fbr.wcnt == 0); }
        
        // waitif
        private function _waitif(fbr:CMLFiber) : Boolean {
            if (_args[0] == 0) return true;
            fbr._pointer = (CMLState(prev).type == ST_FORMULA) ? CMLState(prev.prev) : CMLState(prev);
            return false;
        }
        
        // interpolation interval
        private function _i(fbr:CMLFiber) : Boolean { 
            fbr.chgt = int(_args[0]);
            fbr.wtm2 = fbr.chgt;
            return true;
        }
        
        // mirroring
        private function _m(fbr:CMLFiber) : Boolean {
            // invert flag
            _invert_flag = fbr.invt ^ (uint(_args[0]) + 1);
            // execute next statement
            fbr._pointer = CMLState(fbr._pointer.next);
            var res:Boolean = CMLState(fbr._pointer).func(fbr);
            // reset flag
            _invert_flag = fbr.invt;
            return res;
        }

        // position of fiber
        private function _q(fbr:CMLFiber)  : Boolean { fbr.fx=_invertX(_args[0]); fbr.fy=_invertY(_args[1]); return true; }
        private function _qx(fbr:CMLFiber) : Boolean { fbr.fx=_invertX(_args[0]); return true; }
        private function _qy(fbr:CMLFiber) : Boolean { fbr.fy=_invertY(_args[0]); return true; }

        // position
        private function _p(fbr:CMLFiber)  : Boolean { fbr.object.setPosition(_invertX(_args[0]), _invertY(_args[1]), fbr.chgt); return true; }
        private function _px(fbr:CMLFiber) : Boolean { fbr.object.setPosition(_invertX(_args[0]), fbr.object._getY(), fbr.chgt); return true; }
        private function _py(fbr:CMLFiber) : Boolean { fbr.object.setPosition(fbr.object._getX(), _invertY(_args[0]), fbr.chgt); return true; }
        private function _pd(fbr:CMLFiber) : Boolean {
            var iang:int;
            if (fbr.hopt != CMLFiber.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLObject.scrollAngle);
            else                             iang = sin.index(fbr.object.anglePosition-fbr._getAngleForRotationCommand());
            var c:Number = sin[iang+sin.cos_shift],
                s:Number = sin[iang];
            fbr.object.setPosition(c*_args[0]-s*_args[1], s*_args[0]+c*_args[1], fbr.chgt);
            return true;
        }

        // velocity
        private function _v(fbr:CMLFiber)  : Boolean { fbr.object.setVelocity(_invertX(_args[0]*_speed_ratio), _invertY(_args[1]*_speed_ratio), fbr.chgt); return true; }
        private function _vx(fbr:CMLFiber) : Boolean { fbr.object.setVelocity(_invertX(_args[0]*_speed_ratio), fbr.object.vy,                   fbr.chgt); return true; }
        private function _vy(fbr:CMLFiber) : Boolean { fbr.object.setVelocity(fbr.object.vx,                   _invertY(_args[0]*_speed_ratio), fbr.chgt); return true; }
        private function _vd(fbr:CMLFiber) : Boolean {
            var iang:int;
            if (fbr.hopt != CMLFiber.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLObject.scrollAngle);
            else                             iang = sin.index(fbr.object.angleVelocity-fbr._getAngle(0));
            var c:Number = sin[iang+sin.cos_shift],
                s:Number = sin[iang],
                h:Number = _args[0] * _speed_ratio,
                v:Number = _args[1] * _speed_ratio;
            fbr.object.setVelocity(c*h-s*v, s*h+c*v, fbr.chgt);
            return true;
        }

        // acceleration
        private function _a(fbr:CMLFiber)  : Boolean { fbr.object.setAccelaration(_invertX(_args[0]*_speed_ratio), _invertY(_args[1]*_speed_ratio), 0); return true; }
        private function _ax(fbr:CMLFiber) : Boolean { fbr.object.setAccelaration(_invertX(_args[0]*_speed_ratio), fbr.object._getAy(),            0); return true; }
        private function _ay(fbr:CMLFiber) : Boolean { fbr.object.setAccelaration(fbr.object._getAx(),            _invertY(_args[0]*_speed_ratio), 0); return true; }
        private function _ad(fbr:CMLFiber) : Boolean {
            var iang:int;
            if (fbr.hopt != CMLFiber.HO_SEQ) iang = sin.index(fbr._getAngleForRotationCommand()+CMLObject.scrollAngle);
            else                             iang = sin.index(fbr.object.angleAccel-fbr._getAngle(0));
            var c:Number = sin[iang+sin.cos_shift],
                s:Number = sin[iang],
                h:Number = _args[0] * _speed_ratio,
                v:Number = _args[1] * _speed_ratio;
            fbr.object.setAccelaration(c*h-s*v, s*h+c*v, 0);
            return true;
        }

        // gravity
        private function _gp(fbr:CMLFiber) : Boolean {
            fbr.chgt = 0;
            fbr.object.setGravity(_args[0] * _speed_ratio, _args[1] * _speed_ratio, _args[2]);
            return true;
        }
        
        // It's very tough to implement bulletML...('A`)
        private function _csa(fbr:CMLFiber) : Boolean { fbr.object.setChangeSpeed(_args[0]*_speed_ratio,                     fbr.chgt); return true; }
        private function _csr(fbr:CMLFiber) : Boolean { fbr.object.setChangeSpeed(_args[0]*_speed_ratio+fbr.object.velocity, fbr.chgt); return true; }
        private function _css(fbr:CMLFiber) : Boolean { 
            if (fbr.chgt == 0) fbr.object.setChangeSpeed(_args[0]*_speed_ratio+fbr.object.velocity,          0);
            else               fbr.object.setChangeSpeed(_args[0]*_speed_ratio*fbr.chgt+fbr.object.velocity, fbr.chgt);
            return true; 
        }
        private function _cd(fbr:CMLFiber) : Boolean { 
            fbr.object.setChangeDirection(fbr._getAngleForRotationCommand(), fbr.chgt, _args[0]*_speed_ratio, fbr._isShortestRotation());
            return true;
        }
        // rotation
        private function _r(fbr:CMLFiber)  : Boolean {
            fbr.object.setRotation(fbr._getAngleForRotationCommand(), fbr.chgt, _args[0], _args[1], fbr._isShortestRotation());
            return true;
        }
        private function _rc(fbr:CMLFiber) : Boolean {
            fbr.object.setConstantRotation(fbr._getAngleForRotationCommand(), fbr.chgt, _args[0]*_speed_ratio, fbr._isShortestRotation());
            return true;
        }

        // kill object
        private function _ko(fbr:CMLFiber) : Boolean {
            fbr.object.destroy(_args[0]);
            return false;
        }
        // kill all children fiber
        private function _kf(fbr:CMLFiber) : Boolean {
            fbr.destroyAllChildren();
            return true;
        }
        
        // initialize barrage
        private function _initialize_barrage(fbr:CMLFiber)  : Boolean { fbr.barrage.clear(); return true; }
        // multiple barrage
        private function _bm(fbr:CMLFiber) : Boolean { fbr.barrage.appendMultiple(_args[0], _invertRotation(_args[1]), _args[2], _args[3]); return true; }
        // sequencial barrage
        private function _bs(fbr:CMLFiber) : Boolean { fbr.barrage.appendSequence(_args[0], _invertRotation(_args[1]), _args[2], _args[3]); return true; }
        // random barrage
        private function _br(fbr:CMLFiber) : Boolean { fbr.barrage.appendRandom(_args[0], _invertRotation(_args[1]), _args[2], _args[3]);   return true; }
        
        // bullet sequence of verocity
        private function _bv(fbr:CMLFiber) : Boolean { fbr.bul.setSpeedStep(_args[0]*_speed_ratio); return true; }

        // head angle
        private function _ha(fbr:CMLFiber)  : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_ABS; return true; }
        private function _ho(fbr:CMLFiber)  : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_REL; return true; }
        private function _hp(fbr:CMLFiber)  : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_PAR; return true; }
        private function _ht(fbr:CMLFiber)  : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_AIM; return true; }
        private function _hv(fbr:CMLFiber)  : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_VEL; return true; }
        private function _hox(fbr:CMLFiber) : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_REL; _fix(fbr); return true; }
        private function _hpx(fbr:CMLFiber) : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_PAR; _fix(fbr); return true; }
        private function _htx(fbr:CMLFiber) : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_AIM; _fix(fbr); return true; }
        private function _hvx(fbr:CMLFiber) : Boolean { fbr.hang=_invertAngle(_args[0]); fbr.hopt=CMLFiber.HO_VEL; _fix(fbr); return true; }
        private function _hs(fbr:CMLFiber)  : Boolean { fbr.hang=_invertRotation(_args[0]); fbr.hopt=CMLFiber.HO_SEQ; return true; }
        private function _fix(fbr:CMLFiber) : void { fbr.hang=fbr._getAngle(0); fbr.hopt=CMLFiber.HO_FIX; }

        // set target
        private function _td(fbr:CMLFiber) : Boolean { fbr.target = null; return true; }
        private function _tp(fbr:CMLFiber) : Boolean { fbr.target = fbr.object.parent; return true; }
        private function _to(fbr:CMLFiber) : Boolean { fbr.target = fbr.object.findChild(int(_args[0])); return true; }
        
        // call sequence (create new fiber directry)
        // gosub
        private function _gosub(fbr:CMLFiber) : Boolean {
            // execution error
            if (fbr.jstc.length > CMLFiber._stacmax) {
                throw new Error("CML Execution error. The '&' command calls deeper than stac limit.");
            }
            
            // next statement is referential sequence
            var ref:CMLRefer = CMLRefer(next);
            var seq:CMLSequence  = (ref.jump != null) ? CMLSequence(ref.jump) : (fbr.seqSub);
            fbr.jstc.push(ref);
            fbr._unshiftInvertion(_invert_flag);
            fbr._unshiftArguments(seq._cml_internal::require_argc, ref._args);
            fbr._pointer = seq;
            return true;
        }
        // fake gosub
        private function _fgosub(fbr:CMLFiber) : Boolean {
            if (CMLState(next).jump != null) fbr.seqSub = CMLSequence(CMLState(next).jump);
            return true;
        }
        
        // return
        private function _ret(fbr:CMLFiber) : Boolean {
            // pop jump stac
            if (fbr.jstc.length > 0) {
                fbr._shiftArguments();
                fbr._shiftInvertion();
                fbr._pointer = fbr.jstc.pop();
                fbr.seqSub = CMLSequence(jump);
            }
            return true;
        }
        
        // execute new fiber, fiber on child
        private function _at(fbr:CMLFiber)   : Boolean { _fiber(fbr, _args[0]); return true; }
        private function _ato(fbr:CMLFiber)  : Boolean { _fiber_child(fbr, fbr.object, _args); return true; }
        private function _fat(fbr:CMLFiber)  : Boolean { if (CMLState(next).jump != null) fbr.seqExec = CMLSequence(CMLState(next).jump); return true; }
        private function _atko(fbr:CMLFiber) : Boolean { _fiber_destruction(fbr, _args[0]); return true; }

        // new
        private function _n(fbr:CMLFiber)  : Boolean { _new(fbr, int(_args[0]), false); return true; }
        private function _nc(fbr:CMLFiber) : Boolean { _new(fbr, int(_args[0]), true);  return true; }
        private function _fn(fbr:CMLFiber) : Boolean { if (CMLState(next).jump != null) fbr.seqNew = CMLSequence(CMLState(next).jump); return true; }
        
        // fire
        private function _f0(fbr:CMLFiber)  : Boolean {                                        _fire(fbr, int(_args[1]), false); fbr.bul.update(); return true; }
        private function _f1(fbr:CMLFiber)  : Boolean { fbr.bul.speed = _args[0]*_speed_ratio; _fire(fbr, int(_args[1]), false); fbr.bul.update(); return true; }
        private function _fc0(fbr:CMLFiber) : Boolean {                                        _fire(fbr, int(_args[1]), true);  fbr.bul.update(); return true; }
        private function _fc1(fbr:CMLFiber) : Boolean { fbr.bul.speed = _args[0]*_speed_ratio; _fire(fbr, int(_args[1]), true);  fbr.bul.update(); return true; }

        // fake fire
        private function _ff0(fbr:CMLFiber) : Boolean { 
            var refer:CMLRefer = CMLRefer(next);
            if (refer.jump != null) fbr.seqFire = CMLSequence(refer.jump);
            fbr.fang = fbr._getAngle(fbr.fang);
            fbr._pointer = refer;
            fbr.bul.update();
            return true;
        }
        private function _ff1(fbr:CMLFiber) : Boolean {
            fbr.bul.speed = _args[0]*_speed_ratio;
            return _ff0(fbr);
        }
        
        // statement for rapid fire
        private function _rapid_fire(fbr:CMLFiber) : Boolean {
            // end
            if (fbr.bul.isEnd()) return false;

            // create new bullet object and initialize
            _create_multi_bullet(fbr, fbr.wtm1, Boolean(fbr.wtm2), null);
            
            // calc bullet and set wait counter
            fbr.bul.update();
            fbr.wcnt = fbr.bul.interval;
            
            // repeat
            fbr._pointer = CMLFiber.seqRapid;
            
            return false;
        }
        
        // statement to wait for destruction
        private function _wait4destruction(fbr:CMLFiber) : Boolean {
            if (fbr.object.destructionStatus == fbr._access_id) {
                fbr._pointer = jump;
                return true;
            }
            return false;
        }
        
        
        
        
    // invertion
    //--------------------------------------------------
        private function _invertAngle(ang:Number) : Number
        {
            if (_invert_flag&(2-CMLObject.vertical)) ang = -ang;
            if (_invert_flag&(1+CMLObject.vertical)) ang = 180-ang;
            return ang;
        }

        
        private function _invertRotation(rot:Number) : Number
        {
            return (_invert_flag==1 || _invert_flag==2) ? -rot : rot;
        }

        
        private function _invertX(x:Number) : Number
        {
            return (_invert_flag&(2-CMLObject.vertical)) ? -x : x;
        }
        

        private function _invertY(y:Number) : Number
        {
            return (_invert_flag&(1+CMLObject.vertical)) ? -y : y;
        }

        
        

    // creating routine
    //--------------------------------------------------
        // run new fiber
        private function _fiber(fbr:CMLFiber, fiber_id:int) : void
        {
            var ref:CMLRefer = CMLRefer(next);                                                      // next statement is referential sequence
            var seq:CMLSequence  = (ref.jump != null) ? CMLSequence(ref.jump) : (fbr.seqExec);      // executing sequence
            fbr._newChildFiber(seq, fiber_id, _invert_flag, ref._args, (seq.type==ST_NO_LABEL));    // create and initialize fiber
            fbr.seqExec = seq;                                                                      // update executing sequence
            fbr._pointer = ref;                                                                     // skip next statement
        }
        

        // run new destruction fiber
        private function _fiber_destruction(fbr:CMLFiber, destStatus:int) : void
        {
            var ref:CMLRefer = CMLRefer(next);                                                      // next statement is referential sequence
            var seq:CMLSequence = (ref.jump != null) ? CMLSequence(ref.jump) : (fbr.seqExec);       // executing sequence
            fbr._newDestFiber(seq, destStatus, _invert_flag, ref._args);                            // create and initialize destruction fiber
            fbr.seqExec = seq;                                                                      // update executing sequence
            fbr._pointer = ref;                                                                     // skip next statement
        }


        // run new fiber on child object
        private function _fiber_child(fbr:CMLFiber, obj:CMLObject, object_id:Array) : void
        {
            var ref:CMLRefer = CMLRefer(next);                                                  // next statement is referential sequence
            var seq:CMLSequence = (ref.jump != null) ? CMLSequence(ref.jump) : (fbr.seqExec);   // executing sequence
            var idxmax:int = object_id.length-1;
            
            _reflective_fiber_creation(obj, 0);                                                 // find child by object_id and create new fiber
            
            fbr.seqExec = seq;                                                                  // update executing sequence
            fbr._pointer = ref;                                                                 // skip next statement

            // ('A`) chaos...
            function _reflective_fiber_creation(_parent:CMLObject, _idx:int) : void {
                _parent.findAllChildren(object_id[_idx], (_idx == idxmax) ? __nof : __rfc);
                function __nof(obj:CMLObject):Boolean { fbr._newObjectFiber(obj, seq, _invert_flag, ref._args); return false; }
                function __rfc(obj:CMLObject):Boolean { _reflective_fiber_creation(obj, _idx+1);                return false; }
            }
        }


        // new
        private function _new(fbr:CMLFiber, access_id:int, isParts:Boolean) : void
        {
            // next statement is referential sequence
            var ref:CMLRefer = CMLRefer(next);
            
            // update new pointer, ref.jump shows executing sequence            
            if (ref.jump != null) fbr.seqNew = CMLSequence(ref.jump);

            // creating center position
            var x:Number = fbr.fx,
                y:Number = fbr.fy;
            // calculate fiber position on absolute coordinate, when it's not relative creation.
            if (!isParts) {
                var sang:int = sin.index(fbr.object.angleOnStage),
                    cang:int = sang + sin.cos_shift;
                x = fbr.object.x + sin[cang]*fbr.fx - sin[sang]*fbr.fy;
                y = fbr.object.y + sin[sang]*fbr.fx + sin[cang]*fbr.fy;
            }

            // create object
            var childObject:CMLObject = fbr.object.onNewObject(fbr.seqNew._args);
            if (childObject == null) return;
            childObject._initialize(fbr.object, isParts, access_id, x, y, 0, 0, 0);

            // create fiber
            fbr._newObjectFiber(childObject, fbr.seqNew, _invert_flag, ref._args);

            // skip next statement
            fbr._pointer = ref;
        }

        
        // fire
        private function _fire(fbr:CMLFiber, access_id:int, isParts:Boolean) : void
        {
            // next statement is referential sequence
            var ref:CMLRefer = CMLRefer(next);
            
            // update fire pointer, ref.jump shows executing sequence
            if (ref.jump != null) fbr.seqFire = CMLSequence(ref.jump);

            // create multi bullet
            _create_multi_bullet(fbr, access_id, isParts, ref._args);

            // skip next statement
            fbr._pointer = ref;
        }

        
        // fire reflective implement
        private function _create_multi_bullet(fbr:CMLFiber, access_id:int, isParts:Boolean, arg:Array) : void
        {
            // multipurpose
            var sang:int, cang:int;

            // creating center position
            var x:Number = fbr.fx,
                y:Number = fbr.fy;
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
                var qrt_next:CMLBarrageElem = CMLBarrageElem(qrt.next);
                
                if (qrt_next.interval == 0) {
                    if (qrt_next.next == end) {
                        // create bullet
                        for (qrt_next.init(qrt); !qrt_next.isEnd(); qrt_next.update()) {
                            __create_bullet(fbr.fang + qrt_next.angle, qrt_next.speed);
                        }
                    } else {
                        // reflexive call
                        for (qrt_next.init(qrt); !qrt_next.isEnd(); qrt_next.update()) {
                            __reflexive_call(qrt_next, end);
                        }
                    }
                } else {
                    // create new fiber and initialize
                    var childFiber:CMLFiber = fbr._newChildFiber(CMLFiber.seqRapid, 0, _invert_flag, null, false);

                    // copy bullet setting and bullet multiplyer
                    childFiber.bul.copy(qrt_next);
                    childFiber.bul.init(qrt);
                    for (var elem:CMLListElem = qrt_next.next; elem!=end; elem=elem.next) {
                        childFiber.barrage._appendElementCopyOf(CMLBarrageElem(elem));
                    }

                    // copy other parameters
                    childFiber.fx = fbr.fx;
                    childFiber.fy = fbr.fy;
                    childFiber.hopt = fbr.hopt;
                    childFiber.hang = (fbr.hopt==CMLFiber.HO_SEQ) ? 0 : fbr.hang;
                    childFiber.fang = fbr.fang;
                    childFiber.seqFire = fbr.seqFire;
                    childFiber.wtm1 = access_id;
                    childFiber.wtm2 = int(isParts);
                }
            }

            // internal function to create object
            function __create_bullet(a:Number, v:Number) : void
            {
                var childObject:CMLObject = fbr.object.onFireObject(fbr.seqFire._args);             // create object
                if (childObject == null) return;
                sang = sin.index(a+CMLObject.scrollAngle);                                          // initialize object
                childObject._initialize(fbr.object, isParts, access_id, x, y, sin[sang+sin.cos_shift]*v, sin[sang]*v, a);
                fbr._newObjectFiber(childObject, fbr.seqFire, _invert_flag, arg);                   // create fiber
            }
        }
    }
}

