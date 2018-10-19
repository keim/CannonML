//----------------------------------------------------------------------------------------------------
// CannonML.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** Cannon Macro Langlage */
class CannonML {
    // constructor
    //------------------------------------------------------------
    /** Create one CannonML instance first of all
     *  @param vertical_ Flag of scrolling direction
     *  @param speedRatio_ Value of (frame rate to calculate speed) / (updating frame rate).
     */
    constructor(vertical_ = true, speedRatio_ = 1, callbacks = {}) {
        if (CannonML._mutex) throw new Error("CannonML is singleton class !!");
        CannonML._mutex = this;

        this.globalVariables = new CML.Global(vertical_, speedRatio_);
        this.rootRunner = new CML.Runner(null, null, false);
        this.rootRunner.setCallbackFunctions(callbacks);

        CML.Fiber._initialize(this.globalVariables);
        CML.Object._initialize(this.globalVariables, this.rootRunner);
        CML.Sequence._initialize(this.globalVariables);
        CML.State._initialize(this.globalVariables);
        CML.Formula._initialize(this.globalVariables);
        CML.Barrage._initialize(this.globalVariables);
        this.setDefaultTarget(CML.Object.root);
    }
    // operations
    //------------------------------------------------------------
    /** <b>Call this function for each frame</b>. This function calls all CML.Object.onUpdate()s. */
    update() {
        CML.Fiber._updateAll();
        CML.Object._updateAll();
    }
    // operations
    //------------------------------------------------------------
    /** create new CML.Runner
     *  @param x x position of new runner
     *  @param y y position of new runner
     *  @param z z position of new runner
     *  @param seq default sequence to execute by new runner
     */
    runner(x=0, y=0, z=0, seq=null) {
        const r = new CML.Runner(null, seq, false);
        r.create(x, y, z);
        return r;
    }
    /** create new CML.Sequence
     *  @param cmlScript cml script presents object motion
     *  @param globalFlag true to enable to refer from another CML.Sequence
     *  @see CML.Sequence#global
     */
    sequence(cmlScript, globalFlag = false) {
        return new CML.Sequence(cmlScript, globalFlag);
    }
    /** set default taget object.
     *  @default CML.Object.root
     *  @param target_ default target objcet.
     */
    setDefaultTarget(target_) {
        CML.Fiber._defaultTarget = target_;
    }
}
// public variables
//------------------------------------------------------------
/** Version information */
CannonML.VERSION = "0.5.0";
/** mutex instance */
CannonML._mutex = null;
