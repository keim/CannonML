//--------------------------------------------------
// CML barrage element class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLListElem from "./CMLListElem.js";
/** @private */
export default class CMLBarrageElem extends CMLListElem {
    constructor() {
        super();
        // Quartarnion
        this.count = 1;
        // Result reference
        this.angle = 0;
        this.speed = 1;
        this.interval = 0;
        // internal parameters
        this.counter = 1;
        this.angle_offset = 0;
        this.speed_offset = 0;
        this.angle_step = 0;
        this.speed_step = 0;
        this.random = false;
        // update function
        this.init = this._init;
        this.update = this._update;
    }
    // setting
    //--------------------------------------------------
    // set sequencial step
    setSequence(count_, angle_, speed_, interval_) {
        this.count = (count_ > 0) ? count_ : ((interval_ > 0) ? -1 : 1);
        this.angle = 0;
        this.speed = 1;
        this.counter = this.count;
        this.angle_offset = 0;
        this.speed_offset = 0;
        this.angle_step = angle_;
        this.speed_step = speed_;
        this.interval = (interval_ > 0) ? interval_ : 0;
        this.random = false;
        this.init = this._init;
        this.update = this._update;
        return this;
    }
    // set multiple parameters
    setMultiple(count_, angle_, speed_, interval_) {
        this.count = (count_ > 0) ? count_ : 1;
        this.angle = 0;
        this.speed = 1;
        this.counter = this.count;
        this.angle_offset = -angle_ * 0.5;
        this.speed_offset = -speed_ * 0.5;
        this.angle_step = (angle_ == 360 || angle_ == -360) ? (angle_ / this.count) : ((this.count < 2) ? 0 : angle_ / (this.count - 1));
        this.speed_step = (this.count < 2) ? 0 : speed_ / (this.count - 1);
        this.interval = (interval_ > 0) ? interval_ : 0;
        this.random = false;
        this.init = this._init;
        this.update = this._update;
        return this;
    }
    // set random parameters
    setRandom(count_, angle_, speed_, interval_) {
        this.count = (count_ > 0) ? count_ : ((interval_ > 0) ? -1 : 1);
        this.angle = 0;
        this.speed = 1;
        this.counter = this.count;
        this.angle_offset = 0;
        this.speed_offset = 0;
        this.angle_step = angle_;
        this.speed_step = speed_;
        this.interval = (interval_ > 0) ? interval_ : 0;
        this.random = true;
        this.init = this._init_random;
        this.update = this._update_random;
        return this;
    }
    // copy all parameters
    copy(src) {
        this.count = src.count;
        this.angle = src.angle;
        this.speed = src.speed;
        this.counter = src.counter;
        this.angle_offset = src.angle_offset;
        this.speed_offset = src.speed_offset;
        this.angle_step = src.angle_step;
        this.speed_step = src.speed_step;
        this.interval = src.interval;
        this.random = src.random;
        if (!this.random) {
            this.init = this._init;
            this.update = this._update;
        }
        else {
            this.init = this._init_random;
            this.update = this._update_random;
        }
        return this;
    }
    // set speed step
    setSpeedStep(ss) {
        this.speed_step = ss;
    }
    // check end
    isEnd() {
        return (this.counter == 0);
    }
    // calculation of sequencial bullet
    //--------------------------------------------------
    /** @private initialize */
    _init(parent) {
        this.counter = this.count;
        this.angle = parent.angle + this.angle_offset;
        this.speed = parent.speed + this.speed_offset;
    }
    /** @private initialize random */
    _init_random(parent) {
        this.counter = this.count;
        this.angle_offset = parent.angle - this.angle_step * 0.5;
        this.speed_offset = parent.speed - this.speed_step * 0.5;
        this.angle = this.angle_offset + this.angle_step * CMLBarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * CMLBarrageElem._globalVariables.rand();
    }
    /** @private update */
    _update() {
        this.angle += this.angle_step;
        this.speed += this.speed_step;
        --this.counter;
    }
    /** @private update random */
    _update_random() {
        this.angle = this.angle_offset + this.angle_step * CMLBarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * CMLBarrageElem._globalVariables.rand();
        --this.counter;
    }
}
// global variables
CMLBarrageElem._globalVariables = null;
