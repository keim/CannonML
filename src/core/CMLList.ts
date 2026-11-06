import { ListElem } from "./CMLListElem.js"

//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private
 *  Ring list of T with a sentinel term (term.next === term when empty). Every link is non-null.
 *  Walk it with `while (elem != list.end)`; an unlinked element is a ring of its own and never reaches end.
 */
export class List<T extends ListElem<T>> {
    term: T
    constructor() {
        this.term = new ListElem<T>() as unknown as T; // self-linked: an empty ring
    }
    clear() {
        this.term.clear();
    }
    remove<U extends T>(elem: U): U {
        if (elem === this.term)
            throw new Error("List sentinel cannot be removed.");
        elem.remove_from_list();
        return elem;
    }
    unshift<U extends T>(elem: U): U {
        if (elem.is_linked())
            throw new Error("ListElem is already linked.");
        elem.next = this.term.next;
        elem.prev = this.term;
        this.term.next.prev = elem;
        this.term.next = elem;
        return elem;
    }
    /** Remove and return the first element. Throws when the list is empty: check isEmpty() first. */
    shift(): T {
        if (this.isEmpty())
            throw new Error("List is empty.");
        const elem = this.term.next;
        this.term.next = elem.next;
        this.term.next.prev = this.term;
        elem.clear();
        return elem;
    }
    push<U extends T>(elem: U): U {
        if (elem.is_linked())
            throw new Error("ListElem is already linked.");
        elem.prev = this.term.prev;
        elem.next = this.term;
        this.term.prev.next = elem;
        this.term.prev = elem;
        return elem;
    }
    /** Remove and return the last element. Throws when the list is empty: check isEmpty() first. */
    pop(): T {
        if (this.isEmpty())
            throw new Error("List is empty.");
        const elem = this.term.prev;
        this.term.prev = elem.prev;
        this.term.prev.next = this.term;
        elem.clear();
        return elem;
    }
    /** Cut [start .. end] out of its list and close it as a ring of its own. */
    cut(start: T, end: T) {
        end.next.prev = start.prev;
        start.prev.next = end.next;
        start.prev = end;
        end.next = start;
    }
    cat(list: List<T>) {
        if (list.isEmpty())
            return;
        list.head.prev = this.term.prev;
        list.tail.next = this.term;
        this.term.prev.next = list.head;
        this.term.prev = list.tail;
        list.clear();
    }
    get begin(): T {
        return this.term.next;
    }
    get end(): T {
        return this.term;
    }
    get head(): T {
        return this.term.next;
    }
    get tail(): T {
        return this.term.prev;
    }
    isEmpty() {
        return (this.term.next === this.term);
    }
}
