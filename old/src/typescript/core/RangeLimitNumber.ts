//----------------------------------------------------------------------------------------------------
// Translator from BulletML to CannonML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


/** @private */
export default class RangeLimitNumber
{
    public min:number;
    public max:number;
    private _val:number;

    constructor(val:number=0, min:number=0, max:number=0) {
        this._val = val;
        this.min = min;
        this.max = max;
    }

    public set val(val:number) {
        if (this.max > this.min) {
            if (this.min > val) {
                this._val = this.min;
            } else
            if (this.max < val) {
                this._val = this.max;
            } else {
                this._val = val;
            }
        } else {
            this._val = val;
        }
    }

    public get val() : number {
        return this._val;
    }
}
