//----------------------------------------------------------------------------------------------------
// Literal class of formula
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


import CMLFiber from "../CMLFiber";
import CMLParser from "./CMLParser";
import CMLFormulaElem from "./CMLFormulaElem";


/** @private */
export default class CMLFormulaLiteral extends CMLFormulaElem
{
    // Refer from CMLParser._userReferenceRegExp() to sort all reference names.
    public static defaultReferences:any[] = [
        'i', 'r', 'l', 'x', 'y', 'sx', 'sy', 'v', 'vx', 'vy', 'ho', 'td', 'o', 
        'p.x', 'p.y', 'p.sx', 'p.sy', 'p.v', 'p.vx', 'p.vy', 'p.ho', 'p.td', 'p.o', 
        't.x', 't.y', 't.sx', 't.sy', 't.v', 't.vx', 't.vy', 't.ho', 't.td', 't.o'
    ];

    public func:Function = null;
    public num: number   = 0;
    public name:string   = "";

    constructor()
    {
        super();
        this.func = this.ltrl;
    }
    
    public parseLiteral(opr:string="") : number
    {
        var ret:number = 0;

        // Numbers
        if (opr.charAt(0) != "$") {
            this.func = this.ltrl;
            this.num = parseFloat(opr);
            return 0;
        }
        
        
        // Variables
        this.num = parseFloat(opr.charAt(opr.length-1));
        if (isNaN(this.num)) {
            this.num = 0;
        } else {
            opr = opr.substr(0, opr.length-1);
        }
        
        
        switch (opr) {
        case "$":
            this.func = this.vars;
            ret = this.num;
            if (this.num == 0) throw new Error('$0 is not available, $[1-9] only.');
            this.num--;
            break;

        case "$?":    this.func = this.rand;    break;
        case "$??":   this.func = this.rands;   break;
        case "$i":    this.func = this.refer_i; break;
        case "$r":    this.func = (this.num==0) ? this.rank : this.rankg; break;
        case "$l":    this.func = this.loop;    break;

        case "$x":    this.func = this.posx; break;
        case "$y":    this.func = this.posy; break;
        case "$sx":   this.func = this.sgnx; break;
        case "$sy":   this.func = this.sgny; break;
        case "$v":    this.func = this.vell; break;
        case "$vx":   this.func = this.velx; break;
        case "$vy":   this.func = this.vely; break;
        case "$ho":   this.func = this.objh; break;
        case "$td":   this.func = this.dist; break;
        case "$o":    this.func = (this.num==0) ? this.cnta : this.cntc; break;
        
        case "$p.x":  this.func = this.prt_posx; break;
        case "$p.y":  this.func = this.prt_posy; break;
        case "$p.sx": this.func = this.prt_sgnx; break;
        case "$p.sy": this.func = this.prt_sgny; break;
        case "$p.v":  this.func = this.prt_vell; break;
        case "$p.vx": this.func = this.prt_velx; break;
        case "$p.vy": this.func = this.prt_vely; break;
        case "$p.ho": this.func = this.prt_objh; break;
        case "$p.td": this.func = this.prt_dist; break;
        case "$p.o":  this.func = (this.num==0) ? this.prt_cnta : this.prt_cntc; break;

        case "$t.x":  this.func = this.tgt_posx; break;
        case "$t.y":  this.func = this.tgt_posy; break;
        case "$t.sx": this.func = this.tgt_sgnx; break;
        case "$t.sy": this.func = this.tgt_sgny; break;
        case "$t.v":  this.func = this.tgt_vell; break;
        case "$t.vx": this.func = this.tgt_velx; break;
        case "$t.vy": this.func = this.tgt_vely; break;
        case "$t.ho": this.func = this.tgt_objh; break;
        case "$t.td": this.func = this.ltrl; this.num = 0; break;
        case "$t.o":  this.func = (this.num==0) ? this.tgt_cnta : this.tgt_cntc; break;

        default:
            this.func = CMLFormulaElem._globalVariables._mapUsrDefRef[opr.substr(1)];
            if (this.func == null) throw Error(opr +" ?");
        }

        
        return ret;
    }


    public /*override*/ calc(fbr:CMLFiber) : number
    {
        return this.func(fbr);
    }


    private ltrl(fbr:CMLFiber): number { return this.num; }
    
    private rand(fbr:CMLFiber): number { return CMLFormulaElem._globalVariables.rand(); }
    private rands(fbr:CMLFiber):number { return CMLFormulaElem._globalVariables.rand()*2-1; }
    private rank(fbr:CMLFiber): number { return fbr.object.rank; }
    private rankg(fbr:CMLFiber):number { return CMLFormulaElem._globalVariables.getRank(this.num); }
    private vars(fbr:CMLFiber): number { return fbr.getVeriable(this.num); }
    private loop(fbr:CMLFiber): number { return fbr.getLoopCounter(this.num); }
    
    private posx(fbr:CMLFiber): number { return fbr.object.x; }
    private posy(fbr:CMLFiber): number { return fbr.object.y; }
    private sgnx(fbr:CMLFiber): number { return (fbr.object.x<0) ? -1 : 1; }
    private sgny(fbr:CMLFiber): number { return (fbr.object.y<0) ? -1 : 1; }
    private velx(fbr:CMLFiber): number { return fbr.object.vx; }
    private vely(fbr:CMLFiber): number { return fbr.object.vy; }
    private vell(fbr:CMLFiber): number { return fbr.object.velocity; }
    private objh(fbr:CMLFiber): number { return fbr.object.angleOnStage; }
    private dist(fbr:CMLFiber): number { return fbr.object.getDistance(fbr.target); }
    private cnta(fbr:CMLFiber): number { return fbr.object.countAllIDedChildren(); }
    private cntc(fbr:CMLFiber): number { return fbr.object.countIDedChildren(this.num); }

    private prt_posx(fbr:CMLFiber): number { return fbr.object.parent.x; }
    private prt_posy(fbr:CMLFiber): number { return fbr.object.parent.y; }
    private prt_sgnx(fbr:CMLFiber): number { return (fbr.object.parent.x<0) ? -1 : 1; }
    private prt_sgny(fbr:CMLFiber): number { return (fbr.object.parent.y<0) ? -1 : 1; }
    private prt_velx(fbr:CMLFiber): number { return fbr.object.parent.vx; }
    private prt_vely(fbr:CMLFiber): number { return fbr.object.parent.vy; }
    private prt_vell(fbr:CMLFiber): number { return fbr.object.parent.velocity; }
    private prt_objh(fbr:CMLFiber): number { return fbr.object.parent.angleOnStage; }
    private prt_dist(fbr:CMLFiber): number { return fbr.object.parent.getDistance(fbr.target); }
    private prt_cnta(fbr:CMLFiber): number { return fbr.object.parent.countAllIDedChildren(); }
    private prt_cntc(fbr:CMLFiber): number { return fbr.object.parent.countIDedChildren(this.num); }

    private tgt_posx(fbr:CMLFiber): number { return fbr.target.x; }
    private tgt_posy(fbr:CMLFiber): number { return fbr.target.y; }
    private tgt_sgnx(fbr:CMLFiber): number { return (fbr.target.x<0) ? -1 : 1; }
    private tgt_sgny(fbr:CMLFiber): number { return (fbr.target.y<0) ? -1 : 1; }
    private tgt_velx(fbr:CMLFiber): number { return fbr.target.vx; }
    private tgt_vely(fbr:CMLFiber): number { return fbr.target.vy; }
    private tgt_vell(fbr:CMLFiber): number { return fbr.target.velocity; }
    private tgt_objh(fbr:CMLFiber): number { return fbr.target.angleOnStage; }
    private tgt_cnta(fbr:CMLFiber): number { return fbr.target.countAllIDedChildren(); }
    private tgt_cntc(fbr:CMLFiber): number { return fbr.target.countIDedChildren(this.num); }

    private refer_i(fbr:CMLFiber): number { return fbr.getInterval(); }
}

