//--------------------------------------------------
// list structure element for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private
 *  Element of a ring list (List keeps a sentinel term). T is the element type (the subclass itself).
 *  prev / next are never null: an element that is not in a List points to itself (next === prev === this).
 */
export class ListElem<T extends ListElem<T>> {
    prev: T = this as unknown as T
    next: T = this as unknown as T
    /** Is this element registered in a List ? (a pooled element in a free list is linked too) */
    is_linked(): boolean {
        return this.next !== (this as unknown as T);
    }
    /** Make this element unlinked. The neighbours are not updated: use remove_from_list() to leave a List. */
    clear() {
        this.prev = this as unknown as T;
        this.next = this as unknown as T;
    }
    remove_from_list() {
        if (!this.is_linked())
            throw new Error("ListElem is not linked.");
        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.clear();
    }
    insert_before(next_: T) {
        if (this.is_linked())
            throw new Error("ListElem is already linked.");
        const self = this as unknown as T; // this is an instance of T in every subclass
        this.next = next_;
        this.prev = next_.prev;
        next_.prev.next = self;
        next_.prev = self;
    }
    insert_after(prev_: T) {
        if (this.is_linked())
            throw new Error("ListElem is already linked.");
        const self = this as unknown as T;
        this.prev = prev_;
        this.next = prev_.next;
        prev_.next.prev = self;
        prev_.next = self;
    }
}
