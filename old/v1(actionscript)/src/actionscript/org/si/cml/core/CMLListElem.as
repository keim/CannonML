//--------------------------------------------------
// list structure element for CML
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    public class CMLListElem
    {
        static protected var sin:CMLSinTable = new CMLSinTable();
        
        public var prev:CMLListElem;
        public var next:CMLListElem;
        
        function CMLListElem()
        {
        }
        
        public function clear() : void
        {
            prev = null;
            next = null;
        }
        
        public function remove_from_list() : void
        {
            prev.next = next;
            next.prev = prev;
            prev = null;
            next = null;
        }
        
        public function insert_before(next_:CMLListElem) : void
        {
            next = next_;
            prev = next_.prev;
            next_.prev.next = this;
            next_.prev = this;
        }
        
        public function insert_after(prev_:CMLListElem) : void
        {
            prev = prev_;
            next = prev_.next;
            prev_.next.prev = this;
            prev_.next = this;
        }
    }
}



