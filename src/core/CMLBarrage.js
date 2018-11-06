//--------------------------------------------------
// CML barrage class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.List from "./CML.List.js";
//import CML.BarrageElem from "./CML.BarrageElem.js";
/** The implement of bm/bs/br commands.
 *  <p>
 *  USAGE<br/>
 *  1) Get the barrage setting of fiber by CML.Fiber.barrage.<br/>
 *  2) CML.Barrage.clear(); sets the parameter "bm1,0,0,0".<br/>
 *  3) CML.Barrage.append[Multiple|Sequence|Random](); multiply new barrage shape.
 *  </p>
 * @see CML.Fiber#barrage
 * @see CML.Barrage#clear();
 * @see CML.Barrage#appendMultiple()
 * @see CML.Barrage#appendSequence()
 * @see CML.Barrage#appendRandom()
 */
CML.Barrage = class {
    /** Constructor.
     *  Usually you get CML.Barrage instance by CML.Fiber.barrage.
     *  @default bm1,0,0,0
     *  @see CML.Fiber#barrage
     */
    constructor() {
        // CML.BarrageElem list
        /** @private */
        this.qrtList = new CML.List();
    }
    // setting
    //--------------------------------------------------
    /** @private initialize */
    static _initialize(globalVariables_) {
        CML.BarrageElem._globalVariables = globalVariables_;
    }
    /** Clear all barrage setting.
     *  Reset to "bm1,0,0,0".
     */
    clear() {
        CML.Barrage.freeList.cat(this.qrtList);
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
        this.qrtList.push(CML.Barrage.alloc().setSequence(count_, angle_, speed_, interval_));
    }
    /** Append append new element "bm"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendMultiple(count_, angle_, speed_, interval_) {
        console.log(count_, angle_, speed_, interval_);
        this.qrtList.push(CML.Barrage.alloc().setMultiple(count_, angle_, speed_, interval_));
    }
    /** Append append new element "br"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendRandom(count_, angle_, speed_, interval_) {
        this.qrtList.push(CML.Barrage.alloc().setRandom(count_, angle_, speed_, interval_));
    }
    // append copy of other elements
    /** @private */
    _appendElementCopyOf(src) {
        this.qrtList.push(CML.Barrage.alloc().copy(src));
    }
    static alloc() {
        var qrt = (CML.Barrage.freeList.pop());
        if (qrt == null)
            qrt = new CML.BarrageElem();
        return qrt;
    }
}
// element factroy
//----------------------------------------
CML.Barrage.freeList = new CML.List();
