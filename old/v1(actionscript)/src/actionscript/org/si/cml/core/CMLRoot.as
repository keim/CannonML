package org.si.cml.core {
    import org.si.cml.CMLObject;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** @private */
    public class CMLRoot extends CMLObject
    {
        /** scroll angle */
        _cml_internal var _scrollAngle:Number;
        
        /** constructor */
        function CMLRoot()
        {
            _cml_internal::_scrollAngle = -90;
        }
   }
}

