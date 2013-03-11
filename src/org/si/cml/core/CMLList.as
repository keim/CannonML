//--------------------------------------------------
// list structure for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    public class CMLList
    {
        private var term:CMLListElem = new CMLListElem();
        
        function CMLList()
        {
            term.next = term;
            term.prev = term;
        }

        public function clear() : void
        {
            term.next = term;
            term.prev = term;
        }
        
        public function remove(elem:CMLListElem) : CMLListElem
        {
            if (elem == term) return null;
            elem.remove_from_list();
            return elem;
        }

        public function unshift(elem:CMLListElem) : CMLListElem
        {
            elem.next = term.next;
            elem.prev = term;
            term.next.prev = elem;
            term.next      = elem;
            return elem;
        }

        public function shift() : CMLListElem
        {
            var elem:CMLListElem = term.next;
            if (elem == term) return null;
            term.next = elem.next;
            term.next.prev = term;
            elem.clear();
            return elem;
        }

        public function push(elem:CMLListElem) : CMLListElem
        {
            elem.prev = term.prev;
            elem.next = term;
            term.prev.next = elem;
            term.prev      = elem;
            return elem;
        }
        
        public function pop() : CMLListElem
        {
            var elem:CMLListElem = term.prev;
            if (elem == term) return null;
            term.prev = elem.prev;
            term.prev.next = term;
            elem.clear();
            return elem;
        }
        
        public function cut(start:CMLListElem, end:CMLListElem) : void
        {
            end.next.prev = start.prev;
            start.prev.next = end.next;
            start.prev = null;
            end.next = null;
        }
        
        public function cat(list:CMLList) : void
        {
            if (list.isEmpty()) return;
            list.head.prev = term.prev;
            list.tail.next = term;
            term.prev.next = list.head;
            term.prev      = list.tail;
            list.clear();
        }
        
        public function get begin() : CMLListElem
        {
            return term.next;
        }

        public function get end() : CMLListElem
        {
            return term;
        }
        
        public function get head() : CMLListElem
        {
            return term.next;
        }
        
        public function get tail() : CMLListElem
        {
            return term.prev;
        }
        
        public function isEmpty() : Boolean
        {
            return (term.next == term);
        }
    }
}


