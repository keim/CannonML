//--------------------------------------------------
// CML barrage class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.namespaces._cml_internal;
    
    
    /** The implement of bm/bs/br commands.
     *  <p>
     *  USAGE<br/>
     *  1) Get the barrage setting of fiber by CMLFiber.barrage.<br/>
     *  2) CMLBarrage.clear(); sets the parameter "bm1,0,0,0".<br/>
     *  3) CMLBarrage.append[Multiple|Sequence|Random](); multiply new barrage shape.
     *  </p>
     * @see CMLFiber#barrage
     * @see CMLBarrage#clear();
     * @see CMLBarrage#appendMultiple()
     * @see CMLBarrage#appendSequence()
     * @see CMLBarrage#appendRandom()
     */
    public class CMLBarrage
    {
        // CMLBarrageElem list
        /** @private */
        internal var qrtList:CMLList = new CMLList();


        /** Constructor.
         *  Usually you get CMLBarrage instance by CMLFiber.barrage.
         *  @default bm1,0,0,0
         *  @see CMLFiber#barrage
         */
        function CMLBarrage()
        {
        }
        



    // setting
    //--------------------------------------------------
        /** Clear all barrage setting. 
         *  Reset to "bm1,0,0,0".
         */
        public function clear() : void
        {
            freeList.cat(qrtList);
        }
        
        
        /** Append copy of other CLMBarrage.
         *  @param copy source.
         */
        public function appendCopyOf(src:CMLBarrage) : void
        {
            var qrt:CMLListElem;
            for (qrt=src.qrtList.begin; qrt!=src.qrtList.end; qrt=qrt.next) {
                _appendElementCopyOf(CMLBarrageElem(qrt));
            }
        }
        

        /** Append append new element "bs"
         *  @param count_ bullet count.
         *  @param angle_ center angle of fan-shaped barrage.
         *  @param speed_ speed difference of barrage.
         *  @param interval_ rapid interval frame.
         */
        public function appendSequence(count_:int, angle_:Number, speed_:Number, interval_:Number) : void
        {
            qrtList.push(alloc()._cml_internal::setSequence(count_, angle_, speed_, interval_));
        }
        
        
        /** Append append new element "bm"
         *  @param count_ bullet count.
         *  @param angle_ center angle of fan-shaped barrage.
         *  @param speed_ speed difference of barrage.
         *  @param interval_ rapid interval frame.
         */
        public function appendMultiple(count_:int, angle_:Number, speed_:Number, interval_:Number) : void
        {
            qrtList.push(alloc().setMultiple(count_, angle_, speed_, interval_));
        }
        
        
        /** Append append new element "br"
         *  @param count_ bullet count.
         *  @param angle_ center angle of fan-shaped barrage.
         *  @param speed_ speed difference of barrage.
         *  @param interval_ rapid interval frame.
         */
        public function appendRandom(count_:int, angle_:Number, speed_:Number, interval_:Number) : void
        {
            qrtList.push(alloc().setRandom(count_, angle_, speed_, interval_));
        }
        
        
        // append copy of other elements
        /** @private */
        internal function _appendElementCopyOf(src:CMLBarrageElem) : void
        {
            qrtList.push(alloc()._cml_internal::copy(src));
        }




    // element factroy
    //----------------------------------------
        static private var freeList:CMLList = new CMLList();
        static private function alloc() : CMLBarrageElem
        {
            var qrt:CMLBarrageElem = CMLBarrageElem(freeList.pop());
            if (qrt == null) qrt = new CMLBarrageElem();
            return qrt;
        }
    }
}


