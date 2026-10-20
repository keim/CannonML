//--------------------------------------------------
// CML statement class for reference of sequence
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
    /** @private */
    public class CMLRefer extends CMLState
    {
    // variables
    //------------------------------------------------------------
        _cml_fiber_internal var _label:String = null;
    
        // meaning of reference
        // label=null,   jump=null   means previous call "{.}"
        // label=null,   jump=define means non-labeled call
        // label=define, jump=null   means unsolved label call
        // label=define, jump=define means solved label call

        
    // functions
    //------------------------------------------------------------
        function CMLRefer(pointer:CMLState=null, label_:String=null)
        {
            super(ST_REFER);

            _cml_fiber_internal::jump = pointer;
            _cml_fiber_internal::_label = label_;
        }
        
        
        protected override function _setCommand(cmd:String) : CMLState
        {
            return this;
        }
        
        
        _cml_fiber_internal function isLabelUnsolved() : Boolean
        {
            return (_cml_fiber_internal::jump==null && _cml_fiber_internal::_label!=null);
        }
    }
}

