//--------------------------------------------------
// CML barrage class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLList from "./CMLList"
import CMLListElem from "./CMLListElem"
import CMLBarrageElem from "./CMLBarrageElem"
import CMLGlobal from "./CMLGlobal"

/** The implement of bm/bs/br commands.
 *  <p>
 *  USAGE<br/>
 *  1) Get the barrage setting of fiber by CMLFiber.barrage.<br/>
 *  2) CMLBarrage.clear(); sets the parameter "bm1,0,0,0".<br/>
 *  3) CMLBarrage.append[Multiple|Sequence|Random](); multiply new barrage shape.
 *  </p>
 * @see CMLFiber#barrage
 * @see CMLBarrage#clear();
 * @see CMLBarrage#appendMultiple()
 * @see CMLBarrage#appendSequence()
 * @see CMLBarrage#appendRandom()
 */
export default class CMLBarrage
{
    // CMLBarrageElem list
    /** @private */
    public qrtList:CMLList = new CMLList();


    /** Constructor.
     *  Usually you get CMLBarrage instance by CMLFiber.barrage.
     *  @default bm1,0,0,0
     *  @see CMLFiber#barrage
     */
    constructor()
    {
    }
    



// setting
//--------------------------------------------------
    /** @private initialize */
    public static _initialize(globalVariables_:CMLGlobal) : void
    {
        CMLBarrageElem._globalVariables = globalVariables_;
    }


    /** Clear all barrage setting. 
     *  Reset to "bm1,0,0,0".
     */
    public clear() : void
    {
        CMLBarrage.freeList.cat(this.qrtList);
    }
    
    
    /** Append copy of other CLMBarrage.
     *  @param copy source.
     */
    public appendCopyOf(src:CMLBarrage) : void
    {
        var qrt:CMLListElem = src.qrtList.begin;
        while (qrt != src.qrtList.end) {
            this._appendElementCopyOf(<CMLBarrageElem>qrt);
            qrt = qrt.next;
        }
    }
    

    /** Append append new element "bs"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    public appendSequence(count_:number, angle_:number, speed_:number, interval_:number) : void
    {
        this.qrtList.push(CMLBarrage.alloc().setSequence(count_, angle_, speed_, interval_));
    }
    
    
    /** Append append new element "bm"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    public appendMultiple(count_:number, angle_:number, speed_:number, interval_:number) : void
    {
        this.qrtList.push(CMLBarrage.alloc().setMultiple(count_, angle_, speed_, interval_));
    }
    
    
    /** Append append new element "br"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    public appendRandom(count_:number, angle_:number, speed_:number, interval_:number) : void
    {
        this.qrtList.push(CMLBarrage.alloc().setRandom(count_, angle_, speed_, interval_));
    }
    
    
    // append copy of other elements
    /** @private */
    public _appendElementCopyOf(src:CMLBarrageElem) : void
    {
        this.qrtList.push(CMLBarrage.alloc().copy(src));
    }




// element factroy
//----------------------------------------
    private static freeList:CMLList = new CMLList();
    private static alloc() : CMLBarrageElem
    {
        var qrt:CMLBarrageElem = <CMLBarrageElem>(CMLBarrage.freeList.pop());
        if (qrt == null) qrt = new CMLBarrageElem();
        return qrt;
    }
}


