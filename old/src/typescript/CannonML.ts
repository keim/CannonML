//----------------------------------------------------------------------------------------------------
// CannonML.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "./CMLFiber"
import CMLSequence from "./CMLSequence"
import CMLRunner from "./CMLRunner"
import CMLObject from "./core/CMLObject"
import CMLState from "./core/CMLState"
import CMLFormula from "./core/CMLFormula"
import CMLBarrage from "./core/CMLBarrage"
import CMLGlobal from "./core/CMLGlobal"


/** Cannon Macro Langlage */
export default class CannonML extends CMLGlobal {
// public variables
//------------------------------------------------------------
    /** Version information */
    public static VERSION:string = "0.5.0";

    /** @private */
    private _freeList:CMLRunner[];

    /** @private */
    private _defaultCallbacks:CMLRunner;



// constructor
//------------------------------------------------------------
    /** Create one CannonML instance first of all
     *  @param vertical_ Flag of scrolling direction
     *  @param speedRatio_ Value of (frame rate to calculate speed) / (updating frame rate).
     */
    constructor(vertical_:boolean=true, speedRatio_:number=1) {
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
    public update() : void
    {
        CMLFiber._updateAll();
        CMLObject._updateAll();
    }




// operations
//------------------------------------------------------------
    /** create new CMLRunner 
     *  @param x_ 
     *  @param y_ 
     */
    public newRunner(x_:number=0, y_:number=0) : CMLRunner
    {
        var r:CMLRunner = this._newCMLRunner()._internalInit(null, this._defaultCallbacks, null, false);
        r.create(x_, y_);
        return r;
    }


    /** create new CMLSequence 
     *  @param cmlScript cml script presents object motion
     *  @param globalFlag true to enable to refer from another CMLSequence
     *  @see CMLSequence#global
     */
    public newSequence(cmlScript:string, globalFlag:boolean=false) : CMLSequence
    {
        return new CMLSequence(cmlScript, globalFlag);
    }


    /** Set default callback functions @see */
    public setDefaultCallbacks(hash:any) : void
    {
        this._defaultCallbacks.setCallbackFunctions(hash);
    }


    /** set default taget object.
     *  @default CMLObject.root
     *  @param target_ default target objcet.
     */
    public setDefaultTarget(target_:CMLObject) : void
    {
        CMLFiber._defaultTarget = target_;
    }


    /** @private create new CMLRunner or pick up from free instance pool if it is there */
    public _newCMLRunner() : CMLRunner
    {
        return this._freeList.pop() || new CMLRunner(this);
    }
}
