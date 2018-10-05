//--------------------------------------------------
// CML barrage element class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLListElem from "./CMLListElem";
import CMLGlobal from "./CMLGlobal"


/** @private */
export default class CMLBarrageElem extends CMLListElem
{
    // Quartarnion
    private count:number = 1;
    
    // Result reference
    public angle   :number = 0;
    public speed   :number = 1;
    public interval:number = 0;
    
    // internal parameters
    private counter     :number    = 1;
    private angle_offset:number = 0;
    private speed_offset:number = 0;
    private angle_step  :number = 0;
    private speed_step  :number = 0;
    private random      :boolean = false;

    // update function
    public init  :Function = this._init;
    public update:Function = this._update;

    // global variables
    public static _globalVariables:CMLGlobal = null;

    
    constructor()
    {
        super();
    }



    
// setting
//--------------------------------------------------
    // set sequencial step
    public setSequence(count_:number, angle_:number, speed_:number, interval_:number) : CMLBarrageElem
    {
        this.count = (count_>0) ? count_ : ((interval_>0) ? -1 : 1);
        this.angle = 0;
        this.speed = 1;
        
        this.counter      = this.count;
        this.angle_offset = 0;
        this.speed_offset = 0;
        this.angle_step   = angle_;
        this.speed_step   = speed_;
        this.interval     = (interval_>0) ? interval_ : 0;
        this.random       = false;
        
        this.init   = this._init;
        this.update = this._update;
        
        return this;
    }

    
    // set multiple parameters
    public setMultiple(count_:number, angle_:number, speed_:number, interval_:number) : CMLBarrageElem
    {
        this.count = (count_>0) ? count_ : 1;
        this.angle = 0;
        this.speed = 1;
        
        this.counter      = this.count;
        this.angle_offset = -angle_ * 0.5;
        this.speed_offset = -speed_ * 0.5;
        this.angle_step   = (angle_ == 360 || angle_ == -360) ? (angle_/this.count) : ((this.count < 2) ? 0 : angle_/(this.count-1));
        this.speed_step   = (this.count < 2) ? 0 : speed_/(this.count-1);
        this.interval     = (interval_>0) ? interval_ : 0;
        this.random       = false;
        
        this.init   = this._init;
        this.update = this._update;
        
        return this;
    }
    
    
    // set random parameters
    public setRandom(count_:number, angle_:number, speed_:number, interval_:number) : CMLBarrageElem
    {
        this.count = (count_>0) ? count_ : ((interval_>0) ? -1 : 1);
        this.angle = 0;
        this.speed = 1;
        
        this.counter      = this.count;
        this.angle_offset = 0;
        this.speed_offset = 0;
        this.angle_step   = angle_;
        this.speed_step   = speed_;
        this.interval     = (interval_>0) ? interval_ : 0;
        this.random       = true;
        
        this.init   = this._init_random;
        this.update = this._update_random;
        
        return this;
    }
    
    
    // copy all parameters
    public copy(src:CMLBarrageElem) : CMLBarrageElem
    {
        this.count = src.count;
        this.angle = src.angle;
        this.speed = src.speed;
        
        this.counter      = src.counter;
        this.angle_offset = src.angle_offset;
        this.speed_offset = src.speed_offset;
        this.angle_step   = src.angle_step;
        this.speed_step   = src.speed_step;
        this.interval     = src.interval;
        this.random       = src.random;

        if (!this.random) {
            this.init   = this._init;
            this.update = this._update;
        } else {
            this.init   = this._init_random;
            this.update = this._update_random;
        }

        return this;
    }
    
    
    // set speed step
    public setSpeedStep(ss:number) : void
    {
        this.speed_step = ss;
    }


    // check end
    public isEnd() : boolean
    {
        return (this.counter == 0);
    }




// calculation of sequencial bullet
//--------------------------------------------------
    /** @private initialize */
    public _init(parent:CMLBarrageElem) : void
    {
        this.counter = this.count;
        this.angle   = parent.angle + this.angle_offset;
        this.speed   = parent.speed + this.speed_offset;
    }
    
    /** @private initialize random */
    public _init_random(parent:CMLBarrageElem) : void
    {
        this.counter = this.count;
        this.angle_offset = parent.angle - this.angle_step * 0.5;
        this.speed_offset = parent.speed - this.speed_step * 0.5;
        this.angle = this.angle_offset + this.angle_step * CMLBarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * CMLBarrageElem._globalVariables.rand();
    }

    /** @private update */
    public _update() : void
    {
        this.angle += this.angle_step;
        this.speed += this.speed_step;
        --this.counter;
    }
    
    /** @private update random */
    public _update_random() : void
    {
        this.angle = this.angle_offset + this.angle_step * CMLBarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * CMLBarrageElem._globalVariables.rand();
        --this.counter;
    }
}
