//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.ListElem from "./CML.ListElem.js";
/** @private */
CML.List = class {
    constructor() {
        this.term = new CML.ListElem();
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    clear() {
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    remove(elem) {
        if (elem == this.term)
            return null;
        elem.remove_from_list();
        return elem;
    }
    unshift(elem) {
        elem.next = this.term.next;
        elem.prev = this.term;
        this.term.next.prev = elem;
        this.term.next = elem;
        return elem;
    }
    shift() {
        var elem = this.term.next;
        if (elem == this.term)
            return null;
        this.term.next = elem.next;
        this.term.next.prev = this.term;
        elem.clear();
        return elem;
    }
    push(elem) {
        elem.prev = this.term.prev;
        elem.next = this.term;
        this.term.prev.next = elem;
        this.term.prev = elem;
        return elem;
    }
    pop() {
        var elem = this.term.prev;
        if (elem == this.term)
            return null;
        this.term.prev = elem.prev;
        this.term.prev.next = this.term;
        elem.clear();
        return elem;
    }
    cut(start, end) {
        end.next.prev = start.prev;
        start.prev.next = end.next;
        start.prev = null;
        end.next = null;
    }
    cat(list) {
        if (list.isEmpty())
            return;
        list.head.prev = this.term.prev;
        list.tail.next = this.term;
        this.term.prev.next = list.head;
        this.term.prev = list.tail;
        list.clear();
    }
    get begin() {
        return this.term.next;
    }
    get end() {
        return this.term;
    }
    get head() {
        return this.term.next;
    }
    get tail() {
        return this.term.prev;
    }
    isEmpty() {
        return (this.term.next == this.term);
    }
}
