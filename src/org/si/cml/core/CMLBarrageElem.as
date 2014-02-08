//--------------------------------------------------
// CML barrage element class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLObject;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    public class CMLBarrageElem extends CMLListElem
    {
        // Quartarnion
        private var count:int = 1;
        
        // Result reference
        internal var angle   :Number = 0;
        internal var speed   :Number = 1;
        internal var interval:Number = 0;
        
        // internal parameters
        private var counter     :int    = 1;
        private var angle_offset:Number = 0;
        private var speed_offset:Number = 0;
        private var angle_step  :Number = 0;
        private var speed_step  :Number = 0;
        private var random      :Boolean = false;

        // update function
        internal var init  :Function = _init;
        internal var update:Function = _update;
        
        
        function CMLBarrageElem()
        {
        }



        
    // setting
    //--------------------------------------------------
        // set sequencial step
        _cml_internal function setSequence(count_:int, angle_:Number, speed_:Number, interval_:Number) : CMLBarrageElem
        {
            count = (count_>0) ? count_ : ((interval_>0) ? -1 : 1);
            angle = 0;
            speed = 1;
            
            counter      = count;
            angle_offset = 0;
            speed_offset = 0;
            angle_step   = angle_;
            speed_step   = speed_;
            interval     = (interval_>0) ? interval_ : 0;
            random       = false;
            
            init   = _init;
            update = _update;
            
            return this;
        }

        
        // set multiple parameters
        internal function setMultiple(count_:int, angle_:Number, speed_:Number, interval_:Number) : CMLBarrageElem
        {
            count = (count_>0) ? count_ : 1;
            angle = 0;
            speed = 1;
            
            counter      = count;
            angle_offset = -angle_ * 0.5;
            speed_offset = -speed_ * 0.5;
            angle_step   = (angle_ == 360 || angle_ == -360) ? (angle_/count) : ((count < 2) ? 0 : angle_/(count-1));
            speed_step   = (count < 2) ? 0 : speed_/(count-1);
            interval     = (interval_>0) ? interval_ : 0;
            random       = false;
            
            init   = _init;
            update = _update;
            
            return this;
        }
        
        
        // set random parameters
        internal function setRandom(count_:int, angle_:Number, speed_:Number, interval_:Number) : CMLBarrageElem
        {
            count = (count_>0) ? count_ : ((interval_>0) ? -1 : 1);
            angle = 0;
            speed = 1;
            
            counter      = count;
            angle_offset = 0;
            speed_offset = 0;
            angle_step   = angle_;
            speed_step   = speed_;
            interval     = (interval_>0) ? interval_ : 0;
            random       = true;
            
            init   = _init_random;
            update = _update_random;
            
            return this;
        }
        
        
        // copy all parameters
        _cml_internal function copy(src:CMLBarrageElem) : CMLBarrageElem
        {
            count = src.count;
            angle = src.angle;
            speed = src.speed;
            
            counter      = src.counter;
            angle_offset = src.angle_offset;
            speed_offset = src.speed_offset;
            angle_step   = src.angle_step;
            speed_step   = src.speed_step;
            interval     = src.interval;
            random       = src.random;

            if (!random) {
                init   = _init;
                update = _update;
            } else {
                init   = _init_random;
                update = _update_random;
            }

            return this;
        }
        
        
        // set speed step
        internal function setSpeedStep(ss:Number) : void
        {
            speed_step = ss;
        }


        // check end
        internal function isEnd() : Boolean
        {
            return (counter == 0);
        }




    // calculation of sequencial bullet
    //--------------------------------------------------
        /** @private initialize */
        public function _init(parent:CMLBarrageElem) : void
        {
            counter = count;
            angle   = parent.angle + angle_offset;
            speed   = parent.speed + speed_offset;
        }
        
        /** @private initialize random */
        public function _init_random(parent:CMLBarrageElem) : void
        {
            counter = count;
            angle_offset = parent.angle - angle_step * 0.5;
            speed_offset = parent.speed - speed_step * 0.5;
            angle = angle_offset + angle_step * CMLObject.rand();
            speed = speed_offset + speed_step * CMLObject.rand();
        }

        /** @private update */
        public function _update() : void
        {
            angle += angle_step;
            speed += speed_step;
            --counter;
        }
        
        /** @private update random */
        public function _update_random() : void
        {
            angle = angle_offset + angle_step * CMLObject.rand();
            speed = speed_offset + speed_step * CMLObject.rand();
            --counter;
        }
    }
}