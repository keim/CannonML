//----------------------------------------------------------------------------------------------------
// Factory class of Actors.
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.extensions {
    import org.si.cml.extensions.Actor;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** Factory class of Actors.
@example basic usage.
<listing version="3.0">
public class Bullet extends Actor {
}
    ...
    
var bulletFactory:ActorFactory = new ActorFactory(Bullet);

    ...
    
var newBullet:Bullet = bulletFactory.newInstance();
</listing>
     */
    public class ActorFactory
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        
        
        
        
    // variables
    //--------------------------------------------------
        /** @private */
        internal var _freeList:Actor   = null;
        /** @private */
        internal var _actorClass:Class = null;
        /** @private */
        internal var _instanceCount:int = 0;
        /** @private */
        internal var _countMaxLimit:int = 0;
        /** @private */
        internal var _defaultEvalIDNumber:int = 0;
        /** @private */
        internal var _defaultDrawPriority:int = 0;
        
        
        
        
    // properties
    //--------------------------------------------------
        /** id number for hitting evaluation. */
        public function get evalIDNumber() : int 
        {
            return _defaultEvalIDNumber;
        }
        
        
        /** drawing priority, young number drawing first. */
        public function get drawPriority() : int 
        {
            return _defaultDrawPriority;
        }
        
        
        
        
    // constructor
    //--------------------------------------------------
        /** create new Actor factory. 
         *  @param actorClass class to create new instance
         *  @param countMaxLimit maximum limit of instance count
         *  @param evalIDNumber id nubmer for hitting evaluation. Must be >= 0. Negative value to apply number automatically.
         *  @param drawPriority drawing priority number, young number drawing first. Must be >= 0. Negative value to apply number automatically.
         */
        function ActorFactory(actorClass:Class=null, countMaxLimit:int=0, evalIDNumber:int=-1, drawPriority:int=-1) 
        {
            _freeList      = new Actor();
            _actorClass    = actorClass;
            _countMaxLimit = (countMaxLimit==0) ? 999999 : countMaxLimit;
            _instanceCount = 0;
            _defaultEvalIDNumber = (evalIDNumber>=0) ? evalIDNumber : Actor._evalLayers.length;
            _defaultDrawPriority = (drawPriority>=0) ? drawPriority : Actor._drawLayers.length;
            if (!Actor._evalLayers[_defaultEvalIDNumber]) Actor._evalLayers[_defaultEvalIDNumber] = new Actor();
            if (!Actor._drawLayers[_defaultDrawPriority]) Actor._drawLayers[_defaultDrawPriority] = new Actor();
        }
        
        
        /** <b>Get new instance from free list. You CANNOT create the new instance of registered class by "new" operator. </b> 
         *  @return new instance
         */
        public function newInstance() : *
        {
            var act:Actor = _freeList;
            if (act == act._prevEval) {
                if (++_instanceCount > _countMaxLimit) {
                    throw new Error("ActorFactory Execution Exception. The number of " + String(_actorClass) + " achieves to the maximum limit.");
                    return null;
                }
                act = new _actorClass();
                act._factory = this;
            } else {
                // remove from freeList
                act = act._prevEval;
                act._prevEval._nextEval = act._nextEval;
                act._nextEval._prevEval = act._prevEval;
            }
            return act;
        }
    }
}




