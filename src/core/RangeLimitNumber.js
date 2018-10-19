//----------------------------------------------------------------------------------------------------
// Translator from BulletML to CannonML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
CML.RangeLimitNumber = class {
    constructor(val = 0, min = 0, max = 0) {
        this._val = val;
        this.min = min;
        this.max = max;
    }
    set val(val) {
        if (this.max > this.min) {
            if (this.min > val) {
                this._val = this.min;
            }
            else if (this.max < val) {
                this._val = this.max;
            }
            else {
                this._val = val;
            }
        }
        else {
            this._val = val;
        }
    }
    get val() {
        return this._val;
    }
}
