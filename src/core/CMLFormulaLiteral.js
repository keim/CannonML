//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLFormulaElem from "./CMLFormulaElem.js";
/** @private */
export default class CMLFormulaLiteral extends CMLFormulaElem {
    constructor() {
        super();
        this.func = null;
        this.num = 0;
        this.name = "";
        this.func = this.ltrl;
    }
    parseLiteral(opr = "") {
        var ret = 0;
        // Numbers
        if (opr.charAt(0) != "$") {
            this.func = this.ltrl;
            this.num = parseFloat(opr);
            return 0;
        }
        // Variables
        this.num = parseFloat(opr.charAt(opr.length - 1));
        if (isNaN(this.num)) {
            this.num = 0;
        }
        else {
            opr = opr.substr(0, opr.length - 1);
        }
        switch (opr) {
            case "$":
                this.func = this.vars;
                ret = this.num;
                if (this.num == 0)
                    throw new Error('$0 is not available, $[1-9] only.');
                this.num--;
                break;
            case "$?":
                this.func = this.rand;
                break;
            case "$??":
                this.func = this.rands;
                break;
            case "$i":
                this.func = this.refer_i;
                break;
            case "$r":
                this.func = (this.num == 0) ? this.rank : this.rankg;
                break;
            case "$l":
                this.func = this.loop;
                break;
            case "$x":
                this.func = this.posx;
                break;
            case "$y":
                this.func = this.posy;
                break;
            case "$sx":
                this.func = this.sgnx;
                break;
            case "$sy":
                this.func = this.sgny;
                break;
            case "$v":
                this.func = this.vell;
                break;
            case "$vx":
                this.func = this.velx;
                break;
            case "$vy":
                this.func = this.vely;
                break;
            case "$ho":
                this.func = this.objh;
                break;
            case "$td":
                this.func = this.dist;
                break;
            case "$o":
                this.func = (this.num == 0) ? this.cnta : this.cntc;
                break;
            case "$p.x":
                this.func = this.prt_posx;
                break;
            case "$p.y":
                this.func = this.prt_posy;
                break;
            case "$p.sx":
                this.func = this.prt_sgnx;
                break;
            case "$p.sy":
                this.func = this.prt_sgny;
                break;
            case "$p.v":
                this.func = this.prt_vell;
                break;
            case "$p.vx":
                this.func = this.prt_velx;
                break;
            case "$p.vy":
                this.func = this.prt_vely;
                break;
            case "$p.ho":
                this.func = this.prt_objh;
                break;
            case "$p.td":
                this.func = this.prt_dist;
                break;
            case "$p.o":
                this.func = (this.num == 0) ? this.prt_cnta : this.prt_cntc;
                break;
            case "$t.x":
                this.func = this.tgt_posx;
                break;
            case "$t.y":
                this.func = this.tgt_posy;
                break;
            case "$t.sx":
                this.func = this.tgt_sgnx;
                break;
            case "$t.sy":
                this.func = this.tgt_sgny;
                break;
            case "$t.v":
                this.func = this.tgt_vell;
                break;
            case "$t.vx":
                this.func = this.tgt_velx;
                break;
            case "$t.vy":
                this.func = this.tgt_vely;
                break;
            case "$t.ho":
                this.func = this.tgt_objh;
                break;
            case "$t.td":
                this.func = this.ltrl;
                this.num = 0;
                break;
            case "$t.o":
                this.func = (this.num == 0) ? this.tgt_cnta : this.tgt_cntc;
                break;
            default:
                this.func = CMLFormulaElem._globalVariables._mapUsrDefRef[opr.substr(1)];
                if (this.func == null)
                    throw Error(opr + " ?");
        }
        return ret;
    }
    calc(fbr) {
        return this.func(fbr);
    }
    ltrl(fbr) { return this.num; }
    rand(fbr) { return CMLFormulaElem._globalVariables.rand(); }
    rands(fbr) { return CMLFormulaElem._globalVariables.rand() * 2 - 1; }
    rank(fbr) { return fbr.object.rank; }
    rankg(fbr) { return CMLFormulaElem._globalVariables.getRank(this.num); }
    vars(fbr) { return fbr.getVeriable(this.num); }
    loop(fbr) { return fbr.getLoopCounter(this.num); }
    posx(fbr) { return fbr.object.x; }
    posy(fbr) { return fbr.object.y; }
    sgnx(fbr) { return (fbr.object.x < 0) ? -1 : 1; }
    sgny(fbr) { return (fbr.object.y < 0) ? -1 : 1; }
    velx(fbr) { return fbr.object.vx; }
    vely(fbr) { return fbr.object.vy; }
    vell(fbr) { return fbr.object.velocity; }
    objh(fbr) { return fbr.object.angleOnStage; }
    dist(fbr) { return fbr.object.getDistance(fbr.target); }
    cnta(fbr) { return fbr.object.countAllIDedChildren(); }
    cntc(fbr) { return fbr.object.countIDedChildren(this.num); }
    prt_posx(fbr) { return fbr.object.parent.x; }
    prt_posy(fbr) { return fbr.object.parent.y; }
    prt_sgnx(fbr) { return (fbr.object.parent.x < 0) ? -1 : 1; }
    prt_sgny(fbr) { return (fbr.object.parent.y < 0) ? -1 : 1; }
    prt_velx(fbr) { return fbr.object.parent.vx; }
    prt_vely(fbr) { return fbr.object.parent.vy; }
    prt_vell(fbr) { return fbr.object.parent.velocity; }
    prt_objh(fbr) { return fbr.object.parent.angleOnStage; }
    prt_dist(fbr) { return fbr.object.parent.getDistance(fbr.target); }
    prt_cnta(fbr) { return fbr.object.parent.countAllIDedChildren(); }
    prt_cntc(fbr) { return fbr.object.parent.countIDedChildren(this.num); }
    tgt_posx(fbr) { return fbr.target.x; }
    tgt_posy(fbr) { return fbr.target.y; }
    tgt_sgnx(fbr) { return (fbr.target.x < 0) ? -1 : 1; }
    tgt_sgny(fbr) { return (fbr.target.y < 0) ? -1 : 1; }
    tgt_velx(fbr) { return fbr.target.vx; }
    tgt_vely(fbr) { return fbr.target.vy; }
    tgt_vell(fbr) { return fbr.target.velocity; }
    tgt_objh(fbr) { return fbr.target.angleOnStage; }
    tgt_cnta(fbr) { return fbr.target.countAllIDedChildren(); }
    tgt_cntc(fbr) { return fbr.target.countIDedChildren(this.num); }
    refer_i(fbr) { return fbr.getInterval(); }
}
// Refer from CMLParser._userReferenceRegExp() to sort all reference names.
CMLFormulaLiteral.defaultReferences = [
    'i', 'r', 'l', 'x', 'y', 'sx', 'sy', 'v', 'vx', 'vy', 'ho', 'td', 'o',
    'p.x', 'p.y', 'p.sx', 'p.sy', 'p.v', 'p.vx', 'p.vy', 'p.ho', 'p.td', 'p.o',
    't.x', 't.y', 't.sx', 't.sy', 't.v', 't.vx', 't.vy', 't.ho', 't.td', 't.o'
];
