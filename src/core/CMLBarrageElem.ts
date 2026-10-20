import type { Global } from "./CMLGlobal.js"
import { ListElem } from "./CMLListElem.js"

//--------------------------------------------------
// CML barrage element class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class BarrageElem extends ListElem {
    count: number
    angle: number
    speed: number
    interval: number
    counter: number
    angle_offset: number
    speed_offset: number
    angle_step: number
    speed_step: number
    random: boolean
    init: (parent: BarrageElem) => void
    update: () => void
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
    setSequence(count_: number, angle_: number, speed_: number, interval_: number): this {
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
    setMultiple(count_: number, angle_: number, speed_: number, interval_: number): this {
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
    setRandom(count_: number, angle_: number, speed_: number, interval_: number): this {
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
    copy(src: BarrageElem): this {
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
    setSpeedStep(ss: number) {
        this.speed_step = ss;
    }
    // check end
    isEnd(): boolean {
        return (this.counter == 0);
    }
    // calculation of sequencial bullet
    //--------------------------------------------------
    /** @private initialize */
    _init(parent: BarrageElem) {
        this.counter = this.count;
        this.angle = parent.angle + this.angle_offset;
        this.speed = parent.speed + this.speed_offset;
    }
    /** @private initialize random */
    _init_random(parent: BarrageElem) {
        this.counter = this.count;
        this.angle_offset = parent.angle - this.angle_step * 0.5;
        this.speed_offset = parent.speed - this.speed_step * 0.5;
        this.angle = this.angle_offset + this.angle_step * BarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * BarrageElem._globalVariables.rand();
    }
    /** @private update */
    _update() {
        this.angle += this.angle_step;
        this.speed += this.speed_step;
        --this.counter;
    }
    /** @private update random */
    _update_random() {
        this.angle = this.angle_offset + this.angle_step * BarrageElem._globalVariables.rand();
        this.speed = this.speed_offset + this.speed_step * BarrageElem._globalVariables.rand();
        --this.counter;
    }

    // global variables
    static _globalVariables: Global = null!;

}