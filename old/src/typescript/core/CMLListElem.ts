//--------------------------------------------------
// list structure element for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


/** @private */
export default class CMLListElem
{
    public prev:CMLListElem;
    public next:CMLListElem;
    
    constructor()
    {
    }
    
    public clear() : void
    {
        this.prev = null;
        this.next = null;
    }
    
    public remove_from_list() : void
    {
        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.prev = null;
        this.next = null;
    }
    
    public insert_before(next_:CMLListElem) : void
    {
        this.next = next_;
        this.prev = next_.prev;
        next_.prev.next = this;
        next_.prev = this;
    }
    
    public insert_after(prev_:CMLListElem) : void
    {
        this.prev = prev_;
        this.next = prev_.next;
        prev_.next.prev = this;
        prev_.next = this;
    }
}
