//----------------------------------------------------------------------------------------------------
// CML runner class
//  Copyright (c) 2016 kei mesuda(keim) ALL RIGHTS RESERVED.
//  This code is under BSD-style(license.txt) licenses.
//----------------------------------------------------------------------------------------------------
import CMLObject from "./core/CMLObject.js";
import CMLFiber from "./CMLFiber.js";
/** */
export default class CMLRunner extends CMLObject {
    // constructor
    //------------------------------------------------------------
    /** @private constractor call in CannonML._newCMLRunner() */
    constructor(core_) {
        super();
        /** what "this" means in callback function */
        this.avatar = null;
        // CannonML instance that this runner belongs to
        this._core = null;
        // executing sequence
        this._sequence = null;
        // which command has been called to create this insatance, true="f" command, false="n" command.
        this._isCreatedByFireCommand = false;
        // created by
        this._createdby = null;
        // callback functions
        this._onCreateNewRunner = null;
        this._onDestroy = null;
        this._onUpdate = null;
        this._core = core_;
    }
    // variables
    //------------------------------------------------------------
    /** executing sequence */
    get sequence() { return this._sequence; }
    /** which command has been called to create this insatance, true="f" command, false="n" command. */
    get isCreatedByFireCommand() { return this._isCreatedByFireCommand; }
    /** @private */
    _internalInit(avatar_, createdby_, sequence_, isCreatedByFireCommand_) {
        this.avatar = avatar_;
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
    setCallbackFunctions(hash) {
        if (hash.onCreateNewRunner)
            this._onCreateNewRunner = hash.onCreateNewRunner;
        if (hash.onDestroy)
            this._onDestroy = hash.onDestroy;
        if (hash.onUpdate)
            this._onUpdate = hash.onUpdate;
    }
    // operation
    //------------------------------------------------------------
    /** Execute a sequence.
     *  @param seq The sequencye to execute.
     *  @param args The array of arguments to execute sequence.
     *  @param invertFlag The flag to invert execution same as 'm' command.
     *  @return Instance of fiber that execute the sequence.
     */
    execute(seq, args = null, invertFlag = 0) {
        return CMLFiber._newRootFiber(this, seq, args, invertFlag);
    }
    /** Stop all fibers of object. This function is slow.
     *  If you want to execute faster, keep returned CMLFiber of CMLObject.execute() and call CMLFiber.destroy() wherever possible.
     *  @param obj object to halt motion sequence.
     *  @see CMLRunner#execute()
     *  @see CMLFiber#destroy()
     */
    halt() {
        CMLFiber._destroyAllFibers(this);
    }
    // callback functions
    //------------------------------------------------------------
    /** @private */
    onCreate() {
        var parent = this._createdby;
        if (parent._onCreateNewRunner) {
            parent._onCreateNewRunner.call(parent.avatar || this, this);
        }
    }
    /** @private */
    onDestroy() {
        if (this._onDestroy) {
            this._onDestroy.call(this.avatar || this, this);
        }
    }
    /** @private */
    onUpdate() {
        if (this._onUpdate) {
            this._onUpdate.call(this.avatar || this, this);
        }
    }
    /** @private */
    onNewObject(seq) {
        return this._core._newCMLRunner()._internalInit(this.avatar, this, seq, false);
    }
    /** @private */
    onFireObject(seq) {
        return this._core._newCMLRunner()._internalInit(this.avatar, this, seq, true);
    }
}
