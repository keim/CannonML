import { Fiber } from "./CMLFiber.js"
import { Runner, type RunnerCallbacks } from "./CMLRunner.js"
import { Sequence } from "./CMLSequence.js"
import { Barrage } from "./core/CMLBarrage.js"
import { Formula } from "./core/CMLFormula.js"
import { Global } from "./core/CMLGlobal.js"
import { CMLObject } from "./core/CMLObject.js"
import { State } from "./core/CMLState.js"

//----------------------------------------------------------------------------------------------------
// CannonML.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** Cannon Macro Langlage */
export class CannonML {
    // constructor
    //------------------------------------------------------------
    /** Create one CannonML instance first of all
     *  @param vertical_ Flag of scrolling direction
     *  @param callbacks callback functions
     */
    globalVariables: Global
    rootRunner: Runner
    constructor(vertical_ = true, callbacks: RunnerCallbacks = {}) {
        if (CannonML._mutex) throw new Error("CannonML is singleton class !!");
        CannonML._mutex = this;

        this.globalVariables = new Global(vertical_);
        this.rootRunner = new Runner(null, null);
        this.rootRunner.setCallbackFunctions(callbacks);

        Fiber._initialize(this.globalVariables);
        CMLObject._initialize(this.globalVariables, this.rootRunner);
        Sequence._initialize(this.globalVariables);
        State._initialize(this.globalVariables);
        Formula._initialize(this.globalVariables);
        Barrage._initialize(this.globalVariables);
        this.setDefaultTarget(CMLObject.root);
    }
    // operations
    //------------------------------------------------------------
    /** <b>Call this function for each frame</b>. This function calls all CML.Object.onUpdate()s. */
    update() {
        Fiber._updateAll();
        CMLObject._updateAll();
    }
    // operations
    //------------------------------------------------------------
    /** create new CML.Runner
     *  @param x x position of new runner
     *  @param y y position of new runner
     *  @param z z position of new runner
     *  @param seq default sequence to execute by new runner
     */
    runner(x=0, y=0, z=0, seq: Sequence | null = null, invFlag=0): Runner {
        const r = new Runner(null, seq);
        r.create(x, y, z);
        if (seq) r.execute(seq, invFlag);
        return r;
    }
    /** create new CML.Sequence
     *  @param cmlScript cml script presents object motion
     *  @param globalFlag true to enable to refer from another CML.Sequence
     *  @see CML.Sequence#global
     */
    sequence(cmlScript: string, globalFlag = false): Sequence {
        return new Sequence(cmlScript, globalFlag);
    }
    /** set default taget object.
     *  @default CML.Object.root
     *  @param target_ default target objcet.
     */
    setDefaultTarget(target_: CMLObject) {
        Fiber._defaultTarget = target_;
    }
    /** set screen size (escaped when Runners are out of screen size) and bias */
    setScreenSize(width: number, height: number, bias=0) {
        this.globalVariables._halfScreenWidth = width / 2 + bias;
        this.globalVariables._halfScreenHeight = height / 2 + bias;
    }

    // public variables
    //------------------------------------------------------------
    /** Version information */
    static VERSION: string = "0.5.0";
    /** mutex instance */
    static _mutex: CannonML | null = null;

}