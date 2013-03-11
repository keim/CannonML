//----------------------------------------------------------------------------------------------------
// Extention of CMLObject
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.extensions {
    import org.si.cml.*;
    import org.si.cml.namespaces._cml_internal;
    
    
    /** Extension of CMLObject that implements scope, life, hit test, drawing priority and management of instances. <br/>
     *  You have to call Actor.initialize() first, and you have to call CMLObject.update() and Actor.draw() for each frame.<br/>
     *  Actor.initialize() registers some user define commands as below,
     *  <ul>
     *  <li>$life; Refers the value of Actor.life.</li>
     *  <li>&scon; Enables the available scope.</li>
     *  <li>&scoff; Disables the available scope.</li>
     *  <li>&prior; Changes the drawing priority. Specify the priority (posi/nega value) in argument.</li>
     *  </ul>
     */
    public class Actor extends ScopeLimitObject
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        
        
        
        
    // public variables
    //----------------------------------------
        /** @private */
        static _cml_internal var _evalLayers:Array = [];
        /** @private */
        static _cml_internal var _drawLayers:Array = [];
        
        
        /** Life, you can use this as you like. */
        public var life:Number = 1;
        /** Size to use in hit test */
        public var size:Number = 0;
        
        /** @private */
        _cml_internal var _factory:ActorFactory  = null;
        /** @private */
        _cml_internal var _nextEval:Actor = null;
        /** @private */
        _cml_internal var _prevEval:Actor = null;
        /** @private */
        _cml_internal var _nextDraw:Actor  = null;
        /** @private */
        _cml_internal var _prevDraw:Actor  = null;
        /** @private */
        _cml_internal var _evalIDNumber:int = 0;
        /** @private */
        _cml_internal var _drawPriority:int = 0;
        
        
        
        
    // public properties
    //----------------------------------------
        /** Enable/disable the hit test. @default true */
        public function get evalEnabled() : Boolean { return (_nextEval != this) };
        public function set evalEnabled(enable:Boolean) : void
        {
            _prevEval._nextEval = _nextEval;
            _nextEval._prevEval = _prevEval;
            if (enable) {
                var evalLayer:Actor = _evalLayers[_evalIDNumber];
                _prevEval = evalLayer._prevEval;
                _nextEval = evalLayer;
                _prevEval._nextEval = this;
                _nextEval._prevEval = this;
            } else {
                _nextEval = _prevEval = this;
            }
        }
        
        
        /** Set the drawing priority. -1 to reset as default priority */
        public function get drawPriority() : int { return _drawPriority; }
        public function set drawPriority(prior:int) : void
        {
            _drawPriority = (prior == -1 && _factory) ? _factory._defaultDrawPriority : prior;
            var layer:Actor = _drawLayers[_drawPriority];
            if (!layer) _drawLayers[_drawPriority] = layer = new Actor();
            if (isActive) {
                _nextDraw._prevDraw = _prevDraw;
                _prevDraw._nextDraw = _nextDraw;
                _prevDraw = layer._prevDraw;
                _nextDraw = layer;
                _prevDraw._nextDraw = this;
                _nextDraw._prevDraw = this;
            }
        }
        
        
        /** Set the devaluation ID number. -1 to reset as default priority */
        public function get evalIDNumber() : int { return _evalIDNumber; }
        public function set evalIDNumber(id:int) : void
        {
            _evalIDNumber = (id == -1 && _factory) ? _factory._defaultEvalIDNumber : id;
            var layer:Actor = _evalLayers[_evalIDNumber];
            if (!layer) _evalLayers[_evalIDNumber] = layer = new Actor();
            if (isActive) {
                _nextDraw._prevDraw = _prevDraw;
                _prevDraw._nextDraw = _nextDraw;
                _prevDraw = layer._prevDraw;
                _nextDraw = layer;
                _prevDraw._nextDraw = this;
                _nextDraw._prevDraw = this;
            }
        }
        
        
        /** Factory class */
        public function get actorFactory() : ActorFactory
        {
            return _factory;
        }
        
        
        
        
    // constructor
    //----------------------------------------
        /** Constructor */
        public function Actor()
        {
            _nextDraw = this;
            _prevDraw = this;
            _nextEval = this;
            _prevEval = this;
            _evalIDNumber = 0;
            _drawPriority = 0;
        }
        
        
        
        
    // callback functions
    //----------------------------------------
        /** @inheritDoc */
        override public function onCreate() : void { }
        
        /** @inheritDoc */
        override public function onDestroy() : void { }
        
        /** @inheritDoc */
        override public function onNewObject(args:Array) : CMLObject { return null; }

        /** @inheritDoc */
        override public function onFireObject(args:Array) : CMLObject { return null; }
        
        /** @inheritDoc */
        override public function onUpdate() : void {
            // basic operation to check escaping
            if (isEscaped) destroy(0);
        }
        
        /** Callback function to draw. This function is called in the order of the property drawPriority. */
        public function onDraw() : void { }

        /** Callback function from Actor.test() when the hit test is true. */
        public function onHit(act:Actor) : void { }
        
        
        
        
    // override
    //----------------------------------------
        /** @private */
        override public function _initialize(parent_:CMLObject, isParts_:Boolean, access_id_:int, x_:Number, y_:Number, vx_:Number, vy_:Number, head_:Number) : CMLObject
        {
            _register();
            life = 1;
            return super._initialize(parent_, isParts_, access_id_, x_, y_, vx_, vy_, head_);
        }
        
        
        /** @private */
        override public function _finalize() : void
        {
            _unregister();
            super._finalize();
        }
        
        
        

    // operation for Actor list
    //----------------------------------------
        /** Register this object on the actor list. */
        protected function _register() : void
        {
            if (_factory) {
                _evalIDNumber = _factory._defaultEvalIDNumber;
                _drawPriority = _factory._defaultDrawPriority;
            }
            var evalLayer:Actor = _evalLayers[_evalIDNumber],
                drawLayer:Actor = _drawLayers[_drawPriority];
            _prevEval = evalLayer._prevEval;
            _nextEval = evalLayer;
            _prevEval._nextEval = this;
            _nextEval._prevEval = this;
            _prevDraw = drawLayer._prevDraw;
            _nextDraw = drawLayer;
            _prevDraw._nextDraw = this;
            _nextDraw._prevDraw = this;
        }

        
        /** Unregister this object from the actor list. */
        protected function _unregister() : void
        {
            _nextDraw._prevDraw = _prevDraw;
            _prevDraw._nextDraw = _nextDraw;
            _prevDraw = null;
            _nextDraw = null;
            _prevEval._nextEval = _nextEval;
            _nextEval._prevEval = _prevEval;
            if (_factory) {
                _prevEval = _factory._freeList._prevEval;
                _nextEval = _factory._freeList;
                _prevEval._nextEval = this;
                _nextEval._prevEval = this;
            }
        }




    // operation for Actor list
    //----------------------------------------
        /** <b>Call this function first of all</b> instead of CMLObject.initialize(). 
         *  @param vertical_ Flag of scrolling direction
         *  @return The root object.
         *  @see Actor#onPreCreate()
         */
        static public function initialize(vertical_:Boolean=true) : CMLObject
        {
            if (CMLObject.root == null) {
                CMLSequence.registerUserValiable("life",  function(f:CMLFiber)          : Number { return Actor(f.object).life; });
                CMLSequence.registerUserCommand ("prior", function(f:CMLFiber, a:Array) : void   { Actor(f.object).drawPriority = a[0]; }, 1);
            }
            return ScopeLimitObject.initialize(vertical_);
        }
        
        
        /** <b>Call this function for each frame</b> to call all onDraw()s. */
        static public function draw() : void
        {
            var i:int, imax:int = _drawLayers.length, layer:Actor, act:Actor;
            for (i=0; i<imax; i++) {
                layer = _drawLayers[i];
                if (layer) {
                    for (act=layer._nextDraw;  act!=layer; act=act._nextDraw) act.onDraw();
                }
            }
        }

        
        /** Hit test of 2 instances. Each Actor.onHit() is called when hit test is success.
         *  @param evalID0 evaluation ID number of 1st target ActorFactory. Optimum for slower actor.
         *  @param evalID1 evaluation ID number of 2nd target ActorFactory. Optimum for faster actor.
         *  @see ActorFactory#evalIDNumber
         */
        static public function test(evalID0:int, evalID1:int) : void
        {
            var dx:Number, dy:Number, dot:Number, sz:Number, dln2:Number, vln2:Number, dist:Number,
                act0:Actor, act1:Actor, act0_id:int,
                list0:Actor = _evalLayers[evalID0],
                list1:Actor = _evalLayers[evalID1];

            for (act0=list0._nextEval; act0!=list0; act0=act0._nextEval) {
                act0_id = act0.id;
                for (act1=list1._nextEval; act1!=list1; act1=act1._nextEval) {
                    dx = act0.x - act1.x;
                    dy = act0.y - act1.y;
                    dot = -dx * act1.vx - dy * act1.vy;
                    sz = act0.size + act1.size;
                    dln2 = dx * dx + dy * dy;
                    if (dot<0) {
                        if (dln2 > sz*sz) continue;
                    } else {
                        vln2 = act1.vx*act1.vx+act1.vy*act1.vy;
                        dot *= dot;
                        if (dot > vln2) continue;
                        dist = dln2 - dot/vln2;
                        if (dist>=0 && dist <= sz*sz) continue;
                    }
                    act0.onHit(act1);
                    act1.onHit(act0);
                    if (act0_id != act0.id) break;
                }
            }
        }
        
        
        /** Hit test of 2 instances, lazyer and faster. Each Actor.onHit() is called when hit test is success.
         *  @param evalID0 evaluation ID number of 1st target ActorFactory. 
         *  @param evalID1 evaluation ID number of 2nd target ActorFactory. 
         *  @see ActorFactory#evalIDNumber
         */
        static public function testf(evalID0:int, evalID1:int) : void
        {
            var dx:Number, dy:Number, dist:Number, act0:Actor, act1:Actor, act0_id:int,
                list0:Actor = _evalLayers[evalID0],
                list1:Actor = _evalLayers[evalID1];

            for (act0=list0._nextEval; act0!=list0; act0=act0._nextEval) {
                act0_id = act0.id;
                for (act1=list1._nextEval; act1!=list1; act1=act1._nextEval) {
/*
                    dx = (act0.x < act1.x) ? (act1.x - act0.x) : (act0.x - act1.x);
                    dy = (act0.y < act1.y) ? (act1.y - act0.y) : (act0.y - act1.y);
                    dist = (dx > dy) ? (dx + dy * 0.2928932188134524) : (dy + dx * 0.2928932188134524);
                    if (dist <= act0.size+act1.size) 
*/
                    dx = act1.x - act0.x;
                    dy = act1.y - act0.y;
                    dist = act0.size + act1.size;
                    if (dist*dist > dx*dx+dy*dy) {
                        act0.onHit(act1);
                        act1.onHit(act0);
                        if (act0_id != act0.id) break;
                    }
                }
            }
        }
        
        
        /** apply function to all */
        static public function eval(evalID:int, func:Function) : void
        {
            var act:Actor, list:Actor = _evalLayers[evalID];
            for (act=list._nextEval; act!=list; act=act._nextEval) func(act);
        }
    }
}

