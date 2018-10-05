//----------------------------------------------------------------------------------------------------
// CML runner class
//  Copyright (c) 2016 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------

import CMLObject from "./core/CMLObject"
import CMLSequence from "./CMLSequence"
import CMLFiber from "./CMLFiber"
import CannonML from "./CannonML"


/** */
export default class CMLRunner extends CMLObject
{
// variables
//------------------------------------------------------------
    /** executing sequence */
    public get sequence():CMLSequence { return this._sequence; }
    /** which command has been called to create this insatance, true="f" command, false="n" command. */
    public get isCreatedByFireCommand():boolean { return this._isCreatedByFireCommand; }
    /** what "this" means in callback function */
    public avater:any = null;

    // CannonML instance that this runner belongs to
    private _core:CannonML = null;
    // executing sequence
    private _sequence:CMLSequence = null;
    // which command has been called to create this insatance, true="f" command, false="n" command.
    private _isCreatedByFireCommand:boolean = false;
    // created by
    private _createdby:CMLRunner = null;

    // callback functions
    private _onCreateNewRunner:(runner:CMLRunner)=>void = null;
    private _onDestroy:(runner:CMLRunner)=>void = null;
    private _onUpdate:(runner:CMLRunner)=>void = null;



// constructor
//------------------------------------------------------------
    /** @private constractor call in CannonML._newCMLRunner() */
    constructor(core_:CannonML)
    {
        super();
        this._core = core_;
    }


    /** @private */
    public _internalInit(avater_:any, createdby_:CMLRunner, sequence_:CMLSequence, isCreatedByFireCommand_:boolean) : CMLRunner
    {
        this.avater = avater_;
        this._createdby = createdby_;
        this._sequence = sequence_;
        this._isCreatedByFireCommand = isCreatedByFireCommand_;
        this._onCreateNewRunner = null;
        this._onDestroy = null;
        this._onUpdate = null;
        return this;
    }


    /** set callback functions 
     *  @param hash Hash indludes callback functions 'onCreateNewRunner', 'onDestroy' and 'onUpdate'. The callback functions give the CMLRunnner insatnace to move your object.
     */
    public setCallbackFunctions(hash:any) : void
    {
        if (hash.onCreateNewRunner) this._onCreateNewRunner = hash.onCreateNewRunner;
        if (hash.onDestroy) this._onDestroy = hash.onDestroy;
        if (hash.onUpdate) this._onUpdate = hash.onUpdate;
    }



// operation
//------------------------------------------------------------
    /** Execute a sequence.
     *  @param seq The sequencye to execute.
     *  @param args The array of arguments to execute sequence.
     *  @param invertFlag The flag to invert execution same as 'm' command.
     *  @return Instance of fiber that execute the sequence.
     */
    public execute(seq:CMLSequence, args:any[]=null, invertFlag:number=0) : CMLFiber
    {
        return CMLFiber._newRootFiber(this, seq, args, invertFlag);
    }


    /** Stop all fibers of object. This function is slow.
     *  If you want to execute faster, keep returned CMLFiber of CMLObject.execute() and call CMLFiber.destroy() wherever possible.
     *  @param obj object to halt motion sequence.
     *  @see CMLRunner#execute()
     *  @see CMLFiber#destroy()
     */
    public halt() : void
    {
        CMLFiber._destroyAllFibers(this);
    }




// callback functions
//------------------------------------------------------------
    /** @private */
    public onCreate() : void
    {
        var parent:CMLRunner = this._createdby;
        if (parent._onCreateNewRunner) {
            parent._onCreateNewRunner.call(parent.avater || this, this);
        }
    }
    
    
    /** @private */
    public onDestroy() : void
    {
        if (this._onDestroy) {
            this._onDestroy.call(this.avater || this, this);
        }
    }
    
    
    /** @private */
    public onUpdate() : void
    {
        if (this._onUpdate) {
            this._onUpdate.call(this.avater || this, this);
        }
    }

    
    /** @private */
    public onNewObject(seq:CMLSequence) : CMLObject
    {
        return this._core._newCMLRunner()._internalInit(this.avater, this, seq, false);
    }

    
    /** @private */
    public onFireObject(seq:CMLSequence) : CMLObject
    {
        return this._core._newCMLRunner()._internalInit(this.avater, this, seq, true);
    }
}