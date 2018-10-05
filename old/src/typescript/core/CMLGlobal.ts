//----------------------------------------------------------------------------------------------------
// CMLGlobal.ts
//  Copyright (c) 2016 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------

import RangeLimitNumber from "./RangeLimitNumber"
import CMLSinTable from "./CMLSinTable"

/** @private Global variables, accessable from all classes. */
export default class CMLGlobal {
// public variables
//------------------------------------------------------------
    /** Scrolling angle (vertical=-90, horizontal=180). */
    public get scrollAngle() : number { return this._scrollAngle; }

    /** Value of (frame rate to calculate speed) / (update frame rate). */
    public get speedRatio() : number { return this._speedRatio; }

    /** Flag for scrolling direction (vertical=1, horizontal=0). */
    public get vertical() : number { return (this._scrollAngle==-90) ? 1 : 0; }
    public set vertical(v:number) { this._scrollAngle = (v) ? -90 : 180; }
    
    /** Function for "$?/$??" variable, The type is function():Number. @default Math.random() */
    public get funcRand() : Function { return this._funcRand; }
    public set funcRand(func:Function) { this._funcRand = func; }

    /** @private sine table */
    public _sin:CMLSinTable;

    /** @private */
    public _globalRank:RangeLimitNumber[]; // globalRank value refered by '$r'

    private _speedRatio:number;         // Value of (frame rate to calculate speed) / (update frame rate).
    private _scrollAngle:number;        // scroll angle, the direction(1,0) is 0 degree.
    private _funcRand:Function;         // random function

    /** @private user defined variables refer from CMLParser */
    public _mapUsrDefRef:any = {};
    /** @private user defined commands refer from CMLParser */
    public _mapUsrDefCmd:any = {};
    /** @private flag to refresh parser's RegExp refer from CMLParser */
    public _requestUpdateRegExp:boolean;



// constructor
//------------------------------------------------------------
    /** Global variables, accessable from all classes.
     *  @param vertical_ Flag of scrolling direction
     *  @param speedRatio_ Value of (frame rate to calculate speed) / (updating frame rate).
     */
    constructor(vertical_:boolean, speedRatio_:number) {
        var i:number;
        this._globalRank = new Array(10);
        for (i=0; i<this._globalRank.length; i++) {
            this._globalRank[i] = new RangeLimitNumber();
        }
        this._globalRank[0].max = 1;

        this._sin = new CMLSinTable();
        this._funcRand = Math.random;
        this._requestUpdateRegExp = true;
        this._speedRatio = speedRatio_;
        this.vertical = vertical_ ? 1 : 0;
    }



    
    /** The return value is from funcRand. Call funcRand internally.
     *  @return The random number between 0-1. 
     *  @see #funcRand
     */
    public rand() : number {
        return this._funcRand();
    }


    /** get rank value */
    public getRank(index:number) : number { return this._globalRank[index].val; }

    /** set rank value */
    public setRank(index:number, value:number) : void { this._globalRank[index].val = value; }

    /** Set the range of globalRank. The global rank value is limited in this range. */
    public setGlobalRankRange(index:number, min:number, max:number) : void
    {
        var rank:RangeLimitNumber = this._globalRank[index];
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
     *  The type of callback is <code>function(fbr:CMLFiber):Number</code>. The argument gives a fiber that execute the sequence.
     *  @see CMLFiber
@example 
<listing version="3.0">
// In the cml-string, you can use "$life" that returns Enemy's life.
CMLSequence.registerUserValiable("life", referLife);

function referLife(fbr:CMLFiber) : Number
{
// Enemy class is your extention of CMLObject.
return Enemy(fbr.object).life;
}
</listing>
     */
    public registerUserValiable(name:string, func:Function) : void
    {
        this._mapUsrDefRef[name] = func;
        this._requestUpdateRegExp = true;
    }


    /** Register user defined command "&amp;[a-z_]+".
     *  <p>
     *  This function registers the command that can use in CML string. <br/>
     *  </p>
     *  @param name The name of command that appears like "&amp;name" in CML string.
     *  @param func The callback function when the command appears in sequence.<br/>
     *  The type of callback is <code>function(fbr:CMLFiber, args:Array):void</code>.
     *  The 1st argument gives a reference of the fiber that execute the sequence.
     *  And the 2nd argument gives the arguments of the command.
     *  @param argc The count of argument that this command requires.<br/>
     *  @param requireSequence Specify true if this command require the sequence as the '&amp;', '&#64;' and 'n' commands.
     *  @see CMLFiber
@example 
<listing version="3.0">
// In the cml-string, you can use "&amp;sound[sound_index],[volume]" that plays sound.
CMLSequence.registerUserCommand("sound", playSound, 2);

function playSound(fbr:CMLFiber, args:Array) : void
{
// function _playSound(index, volume) plays sound.
if (args.length >= 2) _playSound(args[0], args[1]);
}
</listing>
    */
    public registerUserCommand(name:string, func:Function, argc:number, requireSequence:boolean) : void
    {
        this._mapUsrDefRef[name] = {func:func, argc:argc, reqseq:requireSequence};
        this._requestUpdateRegExp = true;
    }
}


