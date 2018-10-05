//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------

import CMLListElem from "./CMLListElem";


/** @private */
export default class CMLList
{
    private term:CMLListElem;
    
    constructor()
    {
        this.term = new CMLListElem();
        this.term.next = this.term;
        this.term.prev = this.term;
    }

    public clear() : void
    {
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    
    public remove(elem:CMLListElem) : CMLListElem
    {
        if (elem == this.term) return null;
        elem.remove_from_list();
        return elem;
    }

    public unshift(elem:CMLListElem) : CMLListElem
    {
        elem.next = this.term.next;
        elem.prev = this.term;
        this.term.next.prev = elem;
        this.term.next      = elem;
        return elem;
    }

    public shift() : CMLListElem
    {
        var elem:CMLListElem = this.term.next;
        if (elem == this.term) return null;
        this.term.next = elem.next;
        this.term.next.prev = this.term;
        elem.clear();
        return elem;
    }

    public push(elem:CMLListElem) : CMLListElem
    {
        elem.prev = this.term.prev;
        elem.next = this.term;
        this.term.prev.next = elem;
        this.term.prev      = elem;
        return elem;
    }
    
    public pop() : CMLListElem
    {
        var elem:CMLListElem = this.term.prev;
        if (elem == this.term) return null;
        this.term.prev = elem.prev;
        this.term.prev.next = this.term;
        elem.clear();
        return elem;
    }
    
    public cut(start:CMLListElem, end:CMLListElem) : void
    {
        end.next.prev = start.prev;
        start.prev.next = end.next;
        start.prev = null;
        end.next = null;
    }
    
    public cat(list:CMLList) : void
    {
        if (list.isEmpty()) return;
        list.head.prev = this.term.prev;
        list.tail.next = this.term;
        this.term.prev.next = list.head;
        this.term.prev      = list.tail;
        list.clear();
    }
    
    public get begin() : CMLListElem
    {
        return this.term.next;
    }

    public get end() : CMLListElem
    {
        return this.term;
    }
    
    public get head() : CMLListElem
    {
        return this.term.next;
    }
    
    public get tail() : CMLListElem
    {
        return this.term.prev;
    }
    
    public isEmpty() : boolean
    {
        return (this.term.next == this.term);
    }
}


