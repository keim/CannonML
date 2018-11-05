//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.FormulaElem from "./CML.FormulaElem.js";
/** @private */
CML.FormulaLiteral = class extends CML.FormulaElem {
    constructor(form) {
        super(form);
        this.func = null;
        this.num = Number.NaN;
        this.idx = Number.NaN;
        this.name = "";
        this.func = this.ltrl;
    }
    parseLiteral(opr = "") {
        var maxReference = 0;
        // Numbers
        if (opr.charAt(0) != "$") {
            this.func = this.ltrl;
            this.num = parseFloat(opr);
            return 0;
        }
        // Variables
        this.idx = parseFloat(opr.charAt(opr.length - 1));
        if (isNaN(this.idx)) 
            this.idx = 0;
        else 
            opr = opr.substr(0, opr.length - 1);
        switch (opr) {
            case "$":
                this.func = this.vars;
                if (isNaN(this.idx) || this.idx == 0)
                    throw new Error('$0 is not available, $[1-9] only.');
                maxReference = this.idx;
                this.idx--;
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
                this.func = (this.idx == 0) ? this.rank : this.rankg;
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
            case "$z":
                this.func = this.posz;
                break;
            case "$sx":
                this.func = this.sgnx;
                break;
            case "$sy":
                this.func = this.sgny;
                break;
            case "$sz":
                this.func = this.sgnz;
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
            case "$vz":
                this.func = this.velz;
                break;
            case "$ho":
                this.func = this.objh;
                break;
            case "$td":
                this.func = this.dist;
                break;
            case "$o":
                this.func = (this.idx == 0) ? this.cnta : this.cntc;
                break;
            case "$p.x":
                this.func = this.prt_posx;
                break;
            case "$p.y":
                this.func = this.prt_posy;
                break;
            case "$p.z":
                this.func = this.prt_posz;
                break;
            case "$p.sx":
                this.func = this.prt_sgnx;
                break;
            case "$p.sy":
                this.func = this.prt_sgny;
                break;
            case "$p.sz":
                this.func = this.prt_sgnz;
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
            case "$p.vz":
                this.func = this.prt_velz;
                break;
            case "$p.ho":
                this.func = this.prt_objh;
                break;
            case "$p.td":
                this.func = this.prt_dist;
                break;
            case "$p.o":
                this.func = (this.idx == 0) ? this.prt_cnta : this.prt_cntc;
                break;
            case "$t.x":
                this.func = this.tgt_posx;
                break;
            case "$t.y":
                this.func = this.tgt_posy;
                break;
            case "$t.z":
                this.func = this.tgt_posz;
                break;
            case "$t.sx":
                this.func = this.tgt_sgnx;
                break;
            case "$t.sy":
                this.func = this.tgt_sgny;
                break;
            case "$t.sz":
                this.func = this.tgt_sgnz;
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
            case "$t.vz":
                this.func = this.tgt_velz;
                break;
            case "$t.ho":
                this.func = this.tgt_objh;
                break;
            case "$t.td":
                this.func = this.ltrl;
                this.idx = 0;
                break;
            case "$t.o":
                this.func = (this.idx == 0) ? this.tgt_cnta : this.tgt_cntc;
                break;
            default:
                this.func = CML.FormulaElem._globalVariables._mapUsrDefRef[opr.substr(1)];
                if (this.func == null)
                    throw Error(opr + " ?");
        }
        return maxReference;
    }
    calc(fbr) {
        return this.func(fbr);
    }
    calcStatic() {
        return this.num;
    }
    ltrl(fbr) { return this.num; }
    rand(fbr) { return CML.FormulaElem._globalVariables.rand(); }
    rands(fbr) { return CML.FormulaElem._globalVariables.rand() * 2 - 1; }
    rank(fbr) { return fbr.object.rank; }
    rankg(fbr) { return CML.FormulaElem._globalVariables.getRank(this.idx); }
    vars(fbr) { return fbr.getVeriable(this.idx); }
    loop(fbr) { return fbr.getLoopCounter(this.idx); }
    posx(fbr) { return fbr.object.x; }
    posy(fbr) { return fbr.object.y; }
    posz(fbr) { return fbr.object.z; }
    sgnx(fbr) { return (fbr.object.x < 0) ? -1 : 1; }
    sgny(fbr) { return (fbr.object.y < 0) ? -1 : 1; }
    sgnz(fbr) { return (fbr.object.z < 0) ? -1 : 1; }
    velx(fbr) { return fbr.object.vx; }
    vely(fbr) { return fbr.object.vy; }
    velz(fbr) { return fbr.object.vz; }
    vell(fbr) { return fbr.object.velocity; }
    objh(fbr) { return fbr.object.angleOnScreen; }
    dist(fbr) { return fbr.object.getDistance(fbr.target); }
    cnta(fbr) { return fbr.object.countAllIDedChildren(); }
    cntc(fbr) { return fbr.object.countIDedChildren(this.idx); }
    prt_posx(fbr) { return fbr.object.parent.x; }
    prt_posy(fbr) { return fbr.object.parent.y; }
    prt_posz(fbr) { return fbr.object.parent.z; }
    prt_sgnx(fbr) { return (fbr.object.parent.x < 0) ? -1 : 1; }
    prt_sgny(fbr) { return (fbr.object.parent.y < 0) ? -1 : 1; }
    prt_sgnz(fbr) { return (fbr.object.parent.z < 0) ? -1 : 1; }
    prt_velx(fbr) { return fbr.object.parent.vx; }
    prt_vely(fbr) { return fbr.object.parent.vy; }
    prt_velz(fbr) { return fbr.object.parent.vz; }
    prt_vell(fbr) { return fbr.object.parent.velocity; }
    prt_objh(fbr) { return fbr.object.parent.angleOnScreen; }
    prt_dist(fbr) { return fbr.object.parent.getDistance(fbr.target); }
    prt_cnta(fbr) { return fbr.object.parent.countAllIDedChildren(); }
    prt_cntc(fbr) { return fbr.object.parent.countIDedChildren(this.idx); }
    tgt_posx(fbr) { return fbr.target.x; }
    tgt_posy(fbr) { return fbr.target.y; }
    tgt_posz(fbr) { return fbr.target.z; }
    tgt_sgnx(fbr) { return (fbr.target.x < 0) ? -1 : 1; }
    tgt_sgny(fbr) { return (fbr.target.y < 0) ? -1 : 1; }
    tgt_sgnz(fbr) { return (fbr.target.z < 0) ? -1 : 1; }
    tgt_velx(fbr) { return fbr.target.vx; }
    tgt_vely(fbr) { return fbr.target.vy; }
    tgt_velz(fbr) { return fbr.target.vz; }
    tgt_vell(fbr) { return fbr.target.velocity; }
    tgt_objh(fbr) { return fbr.target.angleOnScreen; }
    tgt_cnta(fbr) { return fbr.target.countAllIDedChildren(); }
    tgt_cntc(fbr) { return fbr.target.countIDedChildren(this.idx); }
    refer_i(fbr) { return fbr.getInterval(); }
}
// Refer from CML.Parser._userReferenceRegExp() to sort all reference names.
CML.FormulaLiteral.defaultReferences = [
    '', 'i', 'r', 'l', 'x', 'y', 'z', 'sx', 'sy', 'sz', 'v', 'vx', 'vy', 'vz', 'ho', 'td', 'o',
    'p.x', 'p.y', 'p.z', 'p.sx', 'p.sy', 'p.sz', 'p.v', 'p.vx', 'p.vy', 'p.vz', 'p.ho', 'p.td', 'p.o',
    't.x', 't.y', 't.z', 't.sx', 't.sy', 't.sz', 't.v', 't.vx', 't.vy', 't.vz', 't.ho', 't.td', 't.o'
];
