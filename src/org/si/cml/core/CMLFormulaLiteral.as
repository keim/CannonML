//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLFiber;
    import org.si.cml.CMLObject;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    internal class CMLFormulaLiteral extends CMLFormulaElem
    {
        // Refer from CMLParser._userReferenceRegExp() to sort all reference names.
        static internal var defaultReferences:Array = [
            'i', 'r', 'l', 'x', 'y', 'sx', 'sy', 'v', 'vx', 'vy', 'ho', 'td', 'o', 
            'p.x', 'p.y', 'p.sx', 'p.sy', 'p.v', 'p.vx', 'p.vy', 'p.ho', 'p.td', 'p.o', 
            't.x', 't.y', 't.sx', 't.sy', 't.v', 't.vx', 't.vy', 't.ho', 't.td', 't.o'
        ];
        
        // Initialize all statics (call from CMLParser._createCMLRegExp())
        static private var _literal_rex:String = null;
        static internal function get literal_rex() : String {
            if (_literal_rex == null) {
                _literal_rex = "(0x[0-9a-f]{1,8}|\\d+\\.?\\d*|\\$(\\?\\?|\\?|" + CMLParser._userReferenceRegExp + "|)[0-9]?)";
            }
            return _literal_rex;
        }

        internal var func:Function = null;
        internal var num: Number   = 0;
        internal var name:String   = "";

        function CMLFormulaLiteral()
        {
            func = ltrl;
        }
        
        internal function parseLiteral(opr:String="") : int
        {
            var ret:int = 0;

            // Numbers
            if (opr.charAt(0) != "$") {
                func = ltrl;
                num = Number(opr);
                return 0;
            }
            
            
            // Variables
            num = Number(opr.charAt(opr.length-1));
            if (isNaN(num)) {
                num = 0;
            } else {
                opr = opr.substr(0, opr.length-1);
            }
            
            
            switch (opr) {
            case "$":
                func = vars;
                ret = num;
                if (num == 0) throw new Error('$0 is not available, $[1-9] only.');
                num--;
                break;

            case "$?":    func = rand;    break;
            case "$??":   func = rands;   break;
            case "$i":    func = refer_i; break;
            case "$r":    func = (num==0) ? rank : rankg; break;
            case "$l":    func = loop;    break;

            case "$x":    func = posx; break;
            case "$y":    func = posy; break;
            case "$sx":   func = sgnx; break;
            case "$sy":   func = sgny; break;
            case "$v":    func = vell; break;
            case "$vx":   func = velx; break;
            case "$vy":   func = vely; break;
            case "$ho":   func = objh; break;
            case "$td":   func = dist; break;
            case "$o":    func = (num==0) ? cnta : cntc; break;
            
            case "$p.x":  func = prt_posx; break;
            case "$p.y":  func = prt_posy; break;
            case "$p.sx": func = prt_sgnx; break;
            case "$p.sy": func = prt_sgny; break;
            case "$p.v":  func = prt_vell; break;
            case "$p.vx": func = prt_velx; break;
            case "$p.vy": func = prt_vely; break;
            case "$p.ho": func = prt_objh; break;
            case "$p.td": func = prt_dist; break;
            case "$p.o":  func = (num==0) ? prt_cnta : prt_cntc; break;

            case "$t.x":  func = tgt_posx; break;
            case "$t.y":  func = tgt_posy; break;
            case "$t.sx": func = tgt_sgnx; break;
            case "$t.sy": func = tgt_sgny; break;
            case "$t.v":  func = tgt_vell; break;
            case "$t.vx": func = tgt_velx; break;
            case "$t.vy": func = tgt_vely; break;
            case "$t.ho": func = tgt_objh; break;
            case "$t.td": func = ltrl; num = 0; break;
            case "$t.o":  func = (num==0) ? tgt_cnta : tgt_cntc; break;

            default:
                func = CMLParser._getUserReference(opr.substr(1));
                if (func == null) throw Error(opr +" ?");
            }

            
            return ret;
        }


        internal override function calc(fbr:CMLFiber) : Number
        {
            return func(fbr);
        }


        private function ltrl(fbr:CMLFiber): Number { return num; }
        
        private function rand(fbr:CMLFiber): Number { return CMLObject.rand(); }
        private function rands(fbr:CMLFiber):Number { return CMLObject.rand()*2-1; }
        private function rank(fbr:CMLFiber): Number { return fbr.object.rank; }
        private function rankg(fbr:CMLFiber):Number { return CMLObject._cml_internal::_globalRank[num]; }
        private function vars(fbr:CMLFiber): Number { return fbr.getVeriable(num); }
        private function loop(fbr:CMLFiber): Number { return fbr.getLoopCounter(num); }
        
        private function posx(fbr:CMLFiber): Number { return fbr.object.x; }
        private function posy(fbr:CMLFiber): Number { return fbr.object.y; }
        private function sgnx(fbr:CMLFiber): Number { return (fbr.object.x<0) ? -1 : 1; }
        private function sgny(fbr:CMLFiber): Number { return (fbr.object.y<0) ? -1 : 1; }
        private function velx(fbr:CMLFiber): Number { return fbr.object.vx; }
        private function vely(fbr:CMLFiber): Number { return fbr.object.vy; }
        private function vell(fbr:CMLFiber): Number { return fbr.object.velocity; }
        private function objh(fbr:CMLFiber): Number { return fbr.object.angleOnStage; }
        private function dist(fbr:CMLFiber): Number { return fbr.object.getDistance(fbr.target); }
        private function cnta(fbr:CMLFiber): Number { return fbr.object.countAllIDedChildren(); }
        private function cntc(fbr:CMLFiber): Number { return fbr.object.countIDedChildren(num); }

        private function prt_posx(fbr:CMLFiber): Number { return fbr.object.parent.x; }
        private function prt_posy(fbr:CMLFiber): Number { return fbr.object.parent.y; }
        private function prt_sgnx(fbr:CMLFiber): Number { return (fbr.object.parent.x<0) ? -1 : 1; }
        private function prt_sgny(fbr:CMLFiber): Number { return (fbr.object.parent.y<0) ? -1 : 1; }
        private function prt_velx(fbr:CMLFiber): Number { return fbr.object.parent.vx; }
        private function prt_vely(fbr:CMLFiber): Number { return fbr.object.parent.vy; }
        private function prt_vell(fbr:CMLFiber): Number { return fbr.object.parent.velocity; }
        private function prt_objh(fbr:CMLFiber): Number { return fbr.object.parent.angleOnStage; }
        private function prt_dist(fbr:CMLFiber): Number { return fbr.object.parent.getDistance(fbr.target); }
        private function prt_cnta(fbr:CMLFiber): Number { return fbr.object.parent.countAllIDedChildren(); }
        private function prt_cntc(fbr:CMLFiber): Number { return fbr.object.parent.countIDedChildren(num); }

        private function tgt_posx(fbr:CMLFiber): Number { return fbr.target.x; }
        private function tgt_posy(fbr:CMLFiber): Number { return fbr.target.y; }
        private function tgt_sgnx(fbr:CMLFiber): Number { return (fbr.target.x<0) ? -1 : 1; }
        private function tgt_sgny(fbr:CMLFiber): Number { return (fbr.target.y<0) ? -1 : 1; }
        private function tgt_velx(fbr:CMLFiber): Number { return fbr.target.vx; }
        private function tgt_vely(fbr:CMLFiber): Number { return fbr.target.vy; }
        private function tgt_vell(fbr:CMLFiber): Number { return fbr.target.velocity; }
        private function tgt_objh(fbr:CMLFiber): Number { return fbr.target.angleOnStage; }
        private function tgt_cnta(fbr:CMLFiber): Number { return fbr.target.countAllIDedChildren(); }
        private function tgt_cntc(fbr:CMLFiber): Number { return fbr.target.countIDedChildren(num); }

        private function refer_i(fbr:CMLFiber): Number { return fbr.getInterval(); }
    }
}

