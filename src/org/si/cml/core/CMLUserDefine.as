//--------------------------------------------------
// CML statement class for user defined function
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.core {
    import org.si.cml.CMLFiber;
    import org.si.cml.namespaces._cml_fiber_internal;
    

    /** @private */
    internal class CMLUserDefine extends CMLState
    {
    // variables
    //------------------------------------------------------------
        private var _funcUserDefine:Function;
        private var _argumentCount:int;
        private var _requireSequence:Boolean;


    // functions
    //------------------------------------------------------------
        function CMLUserDefine(obj:*)
        {
            super(ST_NORMAL);
            _funcUserDefine  = obj.func;
            _argumentCount   = obj.argc;
            _requireSequence = obj.reqseq;
            if (_requireSequence) _cml_fiber_internal::type = ST_RESTRICT | STF_CALLREF;
            _cml_fiber_internal::func = _call;
        }


        protected override function _setCommand(cmd:String) : CMLState
        {
            _resetParameters(_argumentCount);
            return this;
        }


        private function _call(fbr:CMLFiber): Boolean
        {
            _funcUserDefine(fbr, _cml_fiber_internal::_args);
            return true;
        }
    }
}

