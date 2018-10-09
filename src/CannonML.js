//----------------------------------------------------------------------------------------------------
// CannonML.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLFiber from "./CMLFiber.js";
import CMLSequence from "./CMLSequence.js";
import CMLRunner from "./CMLRunner.js";
import CMLObject from "./core/CMLObject.js";
import CMLState from "./core/CMLState.js";
import CMLFormula from "./core/CMLFormula.js";
import CMLBarrage from "./core/CMLBarrage.js";
import CMLGlobal from "./core/CMLGlobal.js";
/** Cannon Macro Langlage */
export default class CannonML extends CMLGlobal {
    // constructor
    //------------------------------------------------------------
    /** Create one CannonML instance first of all
     *  @param vertical_ Flag of scrolling direction
     *  @param speedRatio_ Value of (frame rate to calculate speed) / (updating frame rate).
     */
    constructor(vertical_ = true, speedRatio_ = 1) {
        super(vertical_, speedRatio_);
        CMLFiber._initialize(this);
        CMLObject._initialize(this);
        CMLSequence._initialize(this);
        CMLState._initialize(this);
        CMLFormula._initialize(this);
        CMLBarrage._initialize(this);
        this.setDefaultTarget(CMLObject.root);
        this._freeList = new Array();
        this._defaultCallbacks = new CMLRunner(this);
    }
    // operations
    //------------------------------------------------------------
    /** <b>Call this function for each frame</b>. This function calls all CMLObject.onUpdate()s. */
    update() {
        CMLFiber._updateAll();
        CMLObject._updateAll();
    }
    // operations
    //------------------------------------------------------------
    /** create new CMLRunner
     *  @param x_
     *  @param y_
     */
    newRunner(x_ = 0, y_ = 0) {
        var r = this._newCMLRunner()._internalInit(null, this._defaultCallbacks, null, false);
        r.create(x_, y_);
        return r;
    }
    /** create new CMLSequence
     *  @param cmlScript cml script presents object motion
     *  @param globalFlag true to enable to refer from another CMLSequence
     *  @see CMLSequence#global
     */
    newSequence(cmlScript, globalFlag = false) {
        return new CMLSequence(cmlScript, globalFlag);
    }
    /** Set default callback functions @see */
    setDefaultCallbacks(hash) {
        this._defaultCallbacks.setCallbackFunctions(hash);
    }
    /** set default taget object.
     *  @default CMLObject.root
     *  @param target_ default target objcet.
     */
    setDefaultTarget(target_) {
        CMLFiber._defaultTarget = target_;
    }
    /** @private create new CMLRunner or pick up from free instance pool if it is there */
    _newCMLRunner() {
        return this._freeList.pop() || new CMLRunner(this);
    }
}
// public variables
//------------------------------------------------------------
/** Version information */
CannonML.VERSION = "0.5.0";
