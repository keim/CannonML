//--------------------------------------------------
// CML statement for string class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
/*
public function get string():String
*/


package org.si.cml.core {
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    public class CMLString extends CMLState
    {
    // variables
    //------------------------------------------------------------
        _cml_internal var _string:String;
        

    // functions
    //------------------------------------------------------------
        public function CMLString(str:String)
        {
            super(ST_STRING);
            _cml_internal::_string = str;
        }


        protected override function _setCommand(cmd:String) : CMLState
        {
            return this;
        }
    }
}

