//----------------------------------------------------------------------------------------------------
// Operator class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLFiber;
    import org.si.cml.CMLObject;
    
    
    /** @private */
    internal class CMLFormulaOperator extends CMLFormulaElem
    {
        static private  var sin:CMLSinTable = new CMLSinTable();
        
        static internal var prefix_rex :String = "([-!(]|\\$sin|\\$cos|\\$tan|\\$asn|\\$acs|\\$atn|\\$sqr|\\$i\\?|\\$i\\?\\?|\\$int|\\$abs)";
        static internal var postfix_rex:String = "(\\))";

        internal var priorL:Number = 0;
        internal var priorR:Number = 0;
        internal var oprcnt:int   = 0;
        internal var opr0:CMLFormulaElem = null;
        internal var opr1:CMLFormulaElem = null;
        private  var func:Function = null;
        
        
        function CMLFormulaOperator(opr:String="", isSingle:Boolean=false)
        {
            if (opr.length == 0) return;
            
            if (isSingle) {
                oprcnt = 1;
                if (opr == "(") { func=null; priorL=1; priorR=99; } else
                if (opr == ")") { func=null; priorL=99; priorR=1; } else
                if (opr == "-") { func=neg;  priorL=10; priorR=11; } else
                if (opr == "!") { func=not;  priorL=10; priorR=11; } else
                if (opr == "$sin") { func=snd;  priorL=10; priorR=11; } else
                if (opr == "$cos") { func=csd;  priorL=10; priorR=11; } else
                if (opr == "$tan") { func=tnd;  priorL=10; priorR=11; } else
                if (opr == "$asn") { func=asn;  priorL=10; priorR=11; } else
                if (opr == "$acs") { func=acs;  priorL=10; priorR=11; } else
                if (opr == "$atn") { func=atn;  priorL=10; priorR=11; } else
                if (opr == "$sqr") { func=sqr;  priorL=10; priorR=11; } else 
                if (opr == "$int") { func=ind;  priorL=10; priorR=11; } else
                if (opr == "$abs") { func=abs;  priorL=10; priorR=11; } else
                if (opr == "$i?")  { func=ird;  priorL=10; priorR=11; } else
                if (opr == "$i??") { func=srd;  priorL=10; priorR=11; } 
            } else {
                oprcnt = 2;
                if (opr == "+")  { func=add; priorL=7; priorR=6; } else 
                if (opr == "-")  { func=sub; priorL=7; priorR=6; } else 
                if (opr == "*")  { func=mul; priorL=9; priorR=8; } else 
                if (opr == "/")  { func=div; priorL=9; priorR=8; } else 
                if (opr == "%")  { func=sup; priorL=9; priorR=8; } else 
                if (opr == ">")  { func=grt; priorL=5; priorR=4; } else 
                if (opr == ">=") { func=geq; priorL=5; priorR=4; } else 
                if (opr == "<")  { func=les; priorL=5; priorR=4; } else 
                if (opr == "<=") { func=leq; priorL=5; priorR=4; } else 
                if (opr == "==") { func=eqr; priorL=5; priorR=4; } else 
                if (opr == "!=") { func=neq; priorL=5; priorR=4; } 
            }
        }
        
        
        internal override function calc(fbr:CMLFiber) : Number
        {
            return func(opr0.calc(fbr), (oprcnt==2) ? (opr1.calc(fbr)) : 0);
        }
        
        
        static private function add(r0:Number, r1:Number) : Number { return r0+r1; }
        static private function sub(r0:Number, r1:Number) : Number { return r0-r1; }
        static private function mul(r0:Number, r1:Number) : Number { return r0*r1; }
        static private function div(r0:Number, r1:Number) : Number { return r0/r1; }
        static private function sup(r0:Number, r1:Number) : Number { return r0%r1; }
        static private function neg(r0:Number, r1:Number) : Number { return -r0; }
        static private function not(r0:Number, r1:Number) : Number { return (r0==0)?1:0; }
        static private function snd(r0:Number, r1:Number) : Number { return sin[sin.index(r0)]; }
        static private function csd(r0:Number, r1:Number) : Number { return sin[sin.index(r0)+sin.cos_shift]; }
        static private function tnd(r0:Number, r1:Number) : Number { return Math.tan(r0*0.017453292519943295); }
        static private function asn(r0:Number, r1:Number) : Number { return Math.asin(r0)*57.29577951308232; }
        static private function acs(r0:Number, r1:Number) : Number { return Math.acos(r0)*57.29577951308232; }
        static private function atn(r0:Number, r1:Number) : Number { return Math.atan(r0)*57.29577951308232; }
        static private function sqr(r0:Number, r1:Number) : Number { return Math.sqrt(r0); }
        static private function ind(r0:Number, r1:Number) : Number { return Number(int(r0)); }
        static private function abs(r0:Number, r1:Number) : Number { return (r0<0)?(-r0):(r0); }
        static private function ird(r0:Number, r1:Number) : Number { return Number(int(CMLObject.rand()*r0)); }
        static private function srd(r0:Number, r1:Number) : Number { return Number(int(CMLObject.rand()*(r0*2+1))-r0); }
        static private function grt(r0:Number, r1:Number) : Number { return (r0>r1)?1:0; }
        static private function geq(r0:Number, r1:Number) : Number { return (r0>=r1)?1:0; }
        static private function les(r0:Number, r1:Number) : Number { return (r0<r1)?1:0; }
        static private function leq(r0:Number, r1:Number) : Number { return (r0<=r1)?1:0; }
        static private function neq(r0:Number, r1:Number) : Number { return (r0!=r1)?1:0; }
        static private function eqr(r0:Number, r1:Number) : Number { return (r0==r1)?1:0; }
    }
}

