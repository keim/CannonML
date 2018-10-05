//--------------------------------------------------
// list structure element for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export default class CMLListElem {
    constructor() {
    }
    clear() {
        this.prev = null;
        this.next = null;
    }
    remove_from_list() {
        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.prev = null;
        this.next = null;
    }
    insert_before(next_) {
        this.next = next_;
        this.prev = next_.prev;
        next_.prev.next = this;
        next_.prev = this;
    }
    insert_after(prev_) {
        this.prev = prev_;
        this.next = prev_.next;
        prev_.next.prev = this;
        prev_.next = this;
    }
}
