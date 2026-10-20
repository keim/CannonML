import type { Global } from "./CMLGlobal.js"
import { BarrageElem } from "./CMLBarrageElem.js"
import { List } from "./CMLList.js"

//--------------------------------------------------
// CML barrage class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
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
export class Barrage {
    /** Constructor.
     *  Usually you get CML.Barrage instance by CML.Fiber.barrage.
     *  @default bm1,0,0,0
     *  @see CML.Fiber#barrage
     */
    qrtList: List
    constructor() {
        // CML.BarrageElem list
        /** @private */
        this.qrtList = new List();
    }
    // setting
    //--------------------------------------------------
    /** @private initialize */
    static _initialize(globalVariables_: Global) {
        BarrageElem._globalVariables = globalVariables_;
    }
    /** Clear all barrage setting.
     *  Reset to "bm1,0,0,0".
     */
    clear() {
        Barrage.freeList.cat(this.qrtList);
    }
    /** Append copy of other CLMBarrage.
     *  @param copy source.
     */
    appendCopyOf(src: Barrage) {
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
    appendSequence(count_: number, angle_: number, speed_: number, interval_: number) {
        this.qrtList.push(Barrage.alloc().setSequence(count_, angle_, speed_, interval_));
    }
    /** Append append new element "bm"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendMultiple(count_: number, angle_: number, speed_: number, interval_: number) {
        this.qrtList.push(Barrage.alloc().setMultiple(count_, angle_, speed_, interval_));
    }
    /** Append append new element "br"
     *  @param count_ bullet count.
     *  @param angle_ center angle of fan-shaped barrage.
     *  @param speed_ speed difference of barrage.
     *  @param interval_ rapid interval frame.
     */
    appendRandom(count_: number, angle_: number, speed_: number, interval_: number) {
        this.qrtList.push(Barrage.alloc().setRandom(count_, angle_, speed_, interval_));
    }
    // append copy of other elements
    /** @private */
    _appendElementCopyOf(src: BarrageElem) {
        this.qrtList.push(Barrage.alloc().copy(src));
    }
    static alloc(): BarrageElem {
        let qrt = (Barrage.freeList.pop());
        if (qrt == null)
            qrt = new BarrageElem();
        return qrt;
    }

    // element factroy
    //----------------------------------------
    static freeList: List = new List();

}