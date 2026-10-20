import type { Fiber } from "../CMLFiber.js"
import { Formula } from "./CMLFormula.js"
import type { FormulaNode } from "./CMLFormulaOperator.js"
import type { UserVariableFunc } from "./CMLGlobal.js"

//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class FormulaLiteral implements FormulaNode {
    idx: number
    num: number
    func: UserVariableFunc
    isStatic: boolean
    constructor(opr: string) {
        const m = opr.match(/\$(.*?)(\d)?$/);
        if (!m) {
            this.idx = 0;
            this.num = parseFloat(opr);
            this.func = ()=>this.num;
            this.isStatic = true;
        } else {
            this.idx = Number(m[2]||0);
            this.num = 0;
            this.func = FormulaLiteral.operators[m[1]] || Formula._globalVariables._mapUsrDefRef[m[1]];
            this.isStatic = false;
            if (!this.func)
                throw Error(opr + " ?");
        }
    }
    calcDynamic(_resultStac: number[], fbr: Fiber): number {
        return this.func(fbr, this.idx);
    }
    calcStatic(_resultStac: number[]): number {
        return this.num;
    }

    /** Refer from Parser._userReferenceRegExpString() to sort all reference names. */
    static operators: Record<string, UserVariableFunc> = {
        "": (fbr, idx)=>((idx) ? fbr.getVariable(idx-1) : fbr.getVariable(0)),
        "?": ()=>Formula._globalVariables.rand(),
        "??": ()=>(Formula._globalVariables.rand() * 2 - 1),
        "i": (fbr)=>fbr.getInterval(),
        "r": (fbr, idx)=>((idx) ? Formula._globalVariables.getRank(idx) : fbr.object.rank),
        "l": (fbr, idx)=>fbr.getLoopCounter(idx),
        "x": (fbr)=>fbr.object.pos.x,
        "y": (fbr)=>fbr.object.pos.y,
        "z": (fbr)=>fbr.object.pos.z,
        "sx": (fbr)=>((fbr.object.pos.x < 0) ? -1 : 1),
        "sy": (fbr)=>((fbr.object.pos.y < 0) ? -1 : 1),
        "sz": (fbr)=>((fbr.object.pos.z < 0) ? -1 : 1),
        "v": (fbr)=>fbr.object.velocity,
        "vx": (fbr)=>fbr.object.vel.x,
        "vy": (fbr)=>fbr.object.vel.y,
        "vz": (fbr)=>fbr.object.vel.z,
        "ho": (fbr)=>fbr.object.angleOnScreen,
        "td": (fbr)=>fbr.object.getDistance(fbr.target),
        "o": (fbr, idx)=>((idx) ? fbr.object.countIDedChildren(idx) : fbr.object.countAllIDedChildren()),
        "p.x": (fbr)=>fbr.object.parent.pos.x,
        "p.y": (fbr)=>fbr.object.parent.pos.y,
        "p.z": (fbr)=>fbr.object.parent.pos.z,
        "p.sx": (fbr)=>((fbr.object.parent.pos.x < 0) ? -1 : 1),
        "p.sy": (fbr)=>((fbr.object.parent.pos.y < 0) ? -1 : 1),
        "p.sz": (fbr)=>((fbr.object.parent.pos.z < 0) ? -1 : 1),
        "p.v": (fbr)=>fbr.object.parent.velocity,
        "p.vx": (fbr)=>fbr.object.parent.vel.x,
        "p.vy": (fbr)=>fbr.object.parent.vel.y,
        "p.vz": (fbr)=>fbr.object.parent.vel.z,
        "p.ho": (fbr)=>fbr.object.parent.angleOnScreen,
        "p.td": (fbr)=>fbr.object.parent.getDistance(fbr.target),
        "p.o": (fbr, idx)=>((idx) ? fbr.object.parent.countIDedChildren(idx) : fbr.object.parent.countAllIDedChildren()),
        "t.x": (fbr)=>fbr.target.pos.x,
        "t.y": (fbr)=>fbr.target.pos.y,
        "t.z": (fbr)=>fbr.target.pos.z,
        "t.sx": (fbr)=>((fbr.target.pos.x < 0) ? -1 : 1),
        "t.sy": (fbr)=>((fbr.target.pos.y < 0) ? -1 : 1),
        "t.sz": (fbr)=>((fbr.target.pos.z < 0) ? -1 : 1),
        "t.v": (fbr)=>fbr.target.velocity,
        "t.vx": (fbr)=>fbr.target.vel.x,
        "t.vy": (fbr)=>fbr.target.vel.y,
        "t.vz": (fbr)=>fbr.target.vel.z,
        "t.ho": (fbr)=>fbr.target.angleOnScreen,
        "t.td": ()=>0,
        "t.o": (fbr, idx)=>((idx) ? fbr.target.countIDedChildren(idx) : fbr.target.countAllIDedChildren()),
    };

}