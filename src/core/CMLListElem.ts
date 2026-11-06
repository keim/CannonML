//--------------------------------------------------
// list structure element for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private
 *  T is the element type (the subclass itself). Unlinked elements have prev / next null.
 */
export class ListElem<T extends ListElem<any>> {
    prev: T | null = null
    next: T | null = null
    clear() {
        this.prev = null;
        this.next = null;
    }
    remove_from_list() {
        // linked elements always have both neighbours (List keeps a sentinel term)
        const prev = this.prev!, next = this.next!;
        prev.next = next;
        next.prev = prev;
        this.prev = null;
        this.next = null;
    }
    insert_before(next_: T) {
        const self = this as unknown as T; // this is an instance of T in every subclass
        this.next = next_;
        this.prev = next_.prev;
        next_.prev!.next = self;
        next_.prev = self;
    }
    insert_after(prev_: T) {
        const self = this as unknown as T;
        this.prev = prev_;
        this.next = prev_.next;
        prev_.next!.prev = self;
        prev_.next = self;
    }
}
