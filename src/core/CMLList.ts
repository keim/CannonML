import { ListElem } from "./CMLListElem.js"

//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private */
export class List {
    term: ListElem
    constructor() {
        this.term = new ListElem();
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    clear() {
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    remove<T extends ListElem>(elem: T): T | null {
        if (elem == this.term)
            return null;
        elem.remove_from_list();
        return elem;
    }
    unshift<T extends ListElem>(elem: T): T {
        elem.next = this.term.next;
        elem.prev = this.term;
        this.term.next.prev = elem;
        this.term.next = elem;
        return elem;
    }
    shift(): any {
        const elem = this.term.next;
        if (elem == this.term)
            return null;
        this.term.next = elem.next;
        this.term.next.prev = this.term;
        elem.clear();
        return elem;
    }
    push<T extends ListElem>(elem: T): T {
        elem.prev = this.term.prev;
        elem.next = this.term;
        this.term.prev.next = elem;
        this.term.prev = elem;
        return elem;
    }
    pop(): any {
        const elem = this.term.prev;
        if (elem == this.term)
            return null;
        this.term.prev = elem.prev;
        this.term.prev.next = this.term;
        elem.clear();
        return elem;
    }
    cut(start: ListElem, end: ListElem) {
        end.next.prev = start.prev;
        start.prev.next = end.next;
        start.prev = null;
        end.next = null;
    }
    cat(list: List) {
        if (list.isEmpty())
            return;
        list.head.prev = this.term.prev;
        list.tail.next = this.term;
        this.term.prev.next = list.head;
        this.term.prev = list.tail;
        list.clear();
    }
    get begin(): any {
        return this.term.next;
    }
    get end(): any {
        return this.term;
    }
    get head(): any {
        return this.term.next;
    }
    get tail(): any {
        return this.term.prev;
    }
    isEmpty() {
        return (this.term.next == this.term);
    }
}
