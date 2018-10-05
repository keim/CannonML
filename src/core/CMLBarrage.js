//--------------------------------------------------
// CML barrage class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLList from "./CMLList";
import CMLBarrageElem from "./CMLBarrageElem";
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
export default class CMLBarrage {
    /** Constructor.
     *  Usually you get CMLBarrage instance by CMLFiber.barrage.
     *  @default bm1,0,0,0
     *  @see CMLFiber#barrage
     */
    constructor() {
        // CMLBarrageElem list
        /** @private */
        this.qrtList = new CMLList();
    }
    // setting
    //--------------------------------------------------
    /** @private initialize */
    static _initialize(globalVariables_) {
        CMLBarrageElem._globalVariables = globalVariables_;
    }
    /** Clear all barrage setting.
     *  Reset to "bm1,0,0,0".
     */
    clear() {
        CMLBarrage.freeList.cat(this.qrtList);
    }
    /** Append copy of other CLMBarrage.
     *  @param copy source.
     */
    appendCopyOf(src) {
        var qrt = src.qrtList.begin;
        while (qrt != src.qrtList.end) {
            this._appendElementCopyOf(qrt);
            qrt = qrt.next;
        }
    }
    /** Append append new element "bs"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendSequence(count_, angle_, speed_, interval_) {
        this.qrtList.push(CMLBarrage.alloc().setSequence(count_, angle_, speed_, interval_));
    }
    /** Append append new element "bm"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendMultiple(count_, angle_, speed_, interval_) {
        this.qrtList.push(CMLBarrage.alloc().setMultiple(count_, angle_, speed_, interval_));
    }
    /** Append append new element "br"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendRandom(count_, angle_, speed_, interval_) {
        this.qrtList.push(CMLBarrage.alloc().setRandom(count_, angle_, speed_, interval_));
    }
    // append copy of other elements
    /** @private */
    _appendElementCopyOf(src) {
        this.qrtList.push(CMLBarrage.alloc().copy(src));
    }
    static alloc() {
        var qrt = (CMLBarrage.freeList.pop());
        if (qrt == null)
            qrt = new CMLBarrageElem();
        return qrt;
    }
}
// element factroy
//----------------------------------------
CMLBarrage.freeList = new CMLList();
