import { ListElem } from "./CMLListElem.js"

//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/** @private
 *  T is the element type. The sentinel term is a T too; every link of a valid list is non-null.
 */
export class List<T extends ListElem<any>> {
    term: T
    constructor() {
        this.term = new ListElem<any>() as unknown as T;
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    clear() {
        this.term.next = this.term;
        this.term.prev = this.term;
    }
    remove<U extends T>(elem: U): U | null {
        if (elem == this.term)
            return null;
        elem.remove_from_list();
        return elem;
    }
    unshift<U extends T>(elem: U): U {
        elem.next = this.term.next;
        elem.prev = this.term;
        this.term.next!.prev = elem;
        this.term.next = elem;
        return elem;
    }
    shift(): T | null {
        const elem = this.term.next!;
        if (elem == this.term)
            return null;
        this.term.next = elem.next;
        this.term.next!.prev = this.term;
        elem.clear();
        return elem;
    }
    push<U extends T>(elem: U): U {
        elem.prev = this.term.prev;
        elem.next = this.term;
        this.term.prev!.next = elem;
        this.term.prev = elem;
        return elem;
    }
    pop(): T | null {
        const elem = this.term.prev!;
        if (elem == this.term)
            return null;
        this.term.prev = elem.prev;
        this.term.prev!.next = this.term;
        elem.clear();
        return elem;
    }
    cut(start: T, end: T) {
        end.next!.prev = start.prev;
        start.prev!.next = end.next;
        start.prev = null;
        end.next = null;
    }
    cat(list: List<T>) {
        if (list.isEmpty())
            return;
        list.head.prev = this.term.prev;
        list.tail.next = this.term;
        this.term.prev!.next = list.head;
        this.term.prev = list.tail;
        list.clear();
    }
    get begin(): T {
        return this.term.next!;
    }
    get end(): T {
        return this.term;
    }
    get head(): T {
        return this.term.next!;
    }
    get tail(): T {
        return this.term.prev!;
    }
    isEmpty() {
        return (this.term.next == this.term);
    }
}
