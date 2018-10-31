//----------------------------------------------------------------------------------------------------
// CMLGlobal.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import RangeLimitNumber from "./RangeLimitNumber.js";
//import CMLSinTable from "./CMLSinTable.js";
/** @private Global variables, accessable from all classes. */
CML.Global = class {
    // constructor
    //------------------------------------------------------------
    /** Global variables, accessable from all classes.
     *  @param vertical_ Flag of scrolling direction
     *  @param speedRatio_ Value of (frame rate to calculate speed) / (updating frame rate).
     */
    constructor(vertical_, speedRatio_) {
        /** @private user defined variables refer from CML.Parser */
        this._mapUsrDefRef = {};
        /** @private user defined commands refer from CML.Parser */
        this._mapUsrDefCmd = {};
        this._globalRank = new Array(10);
        for (let i=0; i<this._globalRank.length; i++) {
            this._globalRank[i] = new CML.RangeLimitNumber();
        }
        this._globalRank[0].max = 1;
        this._sin = new CML.SinTable();
        this._funcRand = Math.random;
        this._requestUpdateRegExp = true;
        this._speedRatio = speedRatio_;
        this._halfScreenWidth = 0;
        this._halfScreenHeight = 0;
        this.vertical = vertical_ ? 1 : 0;
    }
    // public variables
    //------------------------------------------------------------
    /** Scrolling angle (vertical=-90, horizontal=180). */
    get scrollAngle() { return this._scrollAngle; }
    /** Value of (frame rate to calculate speed) / (update frame rate). */
    get speedRatio() { return this._speedRatio; }
    /** Flag for scrolling direction (vertical=1, horizontal=0). */
    get vertical() { return (this._scrollAngle == -90) ? 1 : 0; }
    set vertical(v) { this._scrollAngle = (v) ? -90 : 180; }
    /** Function for "$?/$??" variable, The type is function():Number. @default Math.random() */
    get funcRand() { return this._funcRand; }
    set funcRand(func) { this._funcRand = func; }
    /** The return value is from funcRand. Call funcRand internally.
     *  @return The random number between 0-1.
     *  @see #funcRand
     */
    rand() {
        return this._funcRand();
    }
    /** get rank value */
    getRank(index) { return this._globalRank[index].val; }
    /** set rank value */
    setRank(index, value) { this._globalRank[index].val = value; }
    /** Set the range of globalRank. The global rank value is limited in this range. */
    setGlobalRankRange(index, min, max) {
        const rank = this._globalRank[index];
        rank.min = min;
        rank.max = max;
        rank.val = rank.val;
    }
    /** Register user defined variable "$[a-z_]+".
     *  <p>
     *  This function registers the variables that can use in CML-string. <br/>
     *  </p>
     *  @param name The name of variable that appears like "$name" in CML-string.
     *  @param func The callback function when the reference appears in sequence.<br/>
     *  The type of callback is <code>function(fbr:CML.Fiber):Number</code>. The argument gives a fiber that execute the sequence.
     *  @see CML.Fiber
@example
<listing version="3.0">
// In the cml-string, you can use "$life" that returns Enemy's life.
CML.Sequence.registerUserValiable("life", referLife);

function referLife(fbr:CML.Fiber) : Number
{
// Enemy class is your extention of CML.Object.
return Enemy(fbr.object).life;
}
</listing>
     */
    registerUserValiable(name, func) {
        this._mapUsrDefRef[name] = func;
        this._requestUpdateRegExp = true;
    }
    /** Register user defined command "&amp;[a-z_]+".
     *  <p>
     *  This function registers the command that can use in CML string. <br/>
     *  </p>
     *  @param name The name of command that appears like "&amp;name" in CML string.
     *  @param func The callback function when the command appears in sequence.<br/>
     *  The type of callback is <code>function(fbr:CML.Fiber, args:Array):void</code>.
     *  The 1st argument gives a reference of the fiber that execute the sequence.
     *  And the 2nd argument gives the arguments of the command.
     *  @param argc The count of argument that this command requires.<br/>
     *  @param requireSequence Specify true if this command require the sequence as the '&amp;', '&#64;' and 'n' commands.
     *  @see CML.Fiber
@example
<listing version="3.0">
// In the cml-string, you can use "&amp;sound[sound_index],[volume]" that plays sound.
CML.Sequence.registerUserCommand("sound", playSound, 2);

function playSound(fbr:CML.Fiber, args:Array) : void
{
// function _playSound(index, volume) plays sound.
if (args.length >= 2) _playSound(args[0], args[1]);
}
</listing>
    */
    registerUserCommand(name, func, argc, requireSequence) {
        this._mapUsrDefCmd[name] = { func: func, argc: argc, reqseq: requireSequence };
        this._requestUpdateRegExp = true;
    }
}
