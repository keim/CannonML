//----------------------------------------------------------------------------------------------------
// Bullet Runner
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml.extensions {
    import flash.events.Event;
    import flash.display.Shape;
    import flash.utils.Dictionary;
    import org.si.cml.*;
    import org.si.cml.core.CMLList;
    
    
    /** The BulletRunner is simple class to apply CannonML. 
@example basic usage.
<listing version="3.0">
// apply bullet runner to your own instance with callback functions
var br:BulletRunner = BulletRunner.apply(yourInstance, {"onCreate":onCreate...})
// and run sequence on bullet runner
br.runSequence("cml text", bml_xml or CMLSequence);
</listing>
     */
    public class BulletRunner extends ScopeLimitObject
    {
    // variables
    //------------------------------------------------------------
        /** target property name of x */
        public var xPropertyName:String;
        /** target property name of y */
        public var yPropertyName:String;
        /** target property name of angle */
        public var anglePropertyName:String;
        
        /** callback when the CML object is created on CML stage */
        public var atCreate:Function = null;
        /** callback when the CML object is updated */
        public var atUpdate:Function = null;
        /** callback when the CML object is destroyed on CML stage */
        public var atDestroy:Function = null;
        /** callback when the CML object is required by "n*" commands */
        public var atNewObject:Function = null;
        /** callback when the CML object is required by "f*" commands  */
        public var atFireObject:Function = null;
        
        /** target property name of x */
        static public var defaultXPropertyName:String = "x";
        /** target property name of y */
        static public var defaultYPropertyName:String = "y";
        /** target property name of angle */
        static public var defaultAnglePropertyName:String = "rotation";
        
        // default target
        static private var _bulletRunnerDefaultTarget:CMLObject = new CMLObject();
        
        
        
        
    // properties
    //------------------------------------------------------------
        /** parent object, returns null when this BulletRunner is created by aplly() or the parent is destructed. */
        public function get parentActor() : * { 
            var brParent:BulletRunner = parent as BulletRunner;
            return (brParent) ? brParent.actor : null;
        }
        
        
        /** set callback functions. The key of "onCreate", "onUpdate", "onDestroy", "onNew" and "onFire" are available.<br/>
         *  The function format of onCreate, onUpdate and onDestroy are function(br:BulletRunner) : Boolean. <br/>
         *  The function format of onNew and onFire are function(args:Array) : BulletRunner. You have to return your new actor by "n" or "f" command. The sequrence parameters are passed by arguments.<br/>
         */
        public function get callbacks() : * { return {"onCreate":atCreate, "onUpdate":atUpdate, "onDestroy":atDestroy, "onNew":atNewObject, "onFire":atFireObject}; }
        public function set callbacks(functions:*) : void {
            if (functions == null) {
                atCreate = null;
                atUpdate = null;
                atDestroy = null;
                atNewObject = null;
                atFireObject = null;
            } else {
                if ("onCreate" in functions) atCreate = functions["onCreate"];
                if ("onUpdate" in functions) atUpdate = functions["onUpdate"];
                if ("onDestroy" in functions) atDestroy = functions["onDestroy"];
                if ("onNew" in functions) atNewObject = functions["onNew"];
                if ("onFire" in functions) atFireObject = functions["onFire"];
            }
        }
        
        
        /** actor property name to control. "x", "y" and "angle" is available. */
        public function get propertyNames() : * { return {"x":xPropertyName, "y":yPropertyName, "angle":anglePropertyName}; }
        public function set propertyNames(names:*) : void {
            if (names == null) {
                xPropertyName = defaultXPropertyName;
                yPropertyName = defaultYPropertyName;
                anglePropertyName = defaultAnglePropertyName;
            } else {
                if ("x" in names) xPropertyName = names["x"];
                if ("y" in names) yPropertyName = names["y"];
                if ("angle" in names) anglePropertyName = names["angle"];
            }
        }
        
        
        /** default actor property name to control. "x", "y" and "angle" is available. */
        static public function get defaultPropertyNames() : * { return {"x":defaultXPropertyName, "y":defaultYPropertyName, "angle":defaultAnglePropertyName}; }
        static public function set defaultPropertyNames(names:*) : void {
            if (names == null) {
                defaultXPropertyName = "x";
                defaultYPropertyName = "y";
                defaultAnglePropertyName = "rotation";
            } else {
                if ("x" in names) defaultXPropertyName = names["x"];
                if ("y" in names) defaultYPropertyName = names["y"];
                if ("angle" in names) defaultAnglePropertyName = names["angle"];
            }
        }
        
        /** default scope rectangle. @default Rectangle(-160, -240, 320, 480)  */
        static public function setDefaultScope(x:Number, y:Number, width:Number, height:Number) : void { ScopeLimitObject.setDefaultScope(x, y, width, height); }
        
        
        /** Is paused ? */
        static public function isPaused() : Boolean { return _tickerPaused; }
        
        
        
        
    // constructor
    //------------------------------------------------------------
        /** @private constructor, but you should not create new BulletRunner. */
        function BulletRunner()
        {
        }
        
        
        
        
    // executor
    //------------------------------------------------------------
        /** apply BulletRunner to the object
         *  @param actor The object controlled by BulletRunner.
         *  @param callbacks set Callback functions by object. The key of "onCreate", "onUpdate", "onDestroy", "onNew" and "onFire" are available.
         *  @param propertyNames target property name to control. The key of "x", "y" and "angle" are available.
         *  @return BulletRunner instance
         */
        static public function apply(actor:*, callbacks:* = null, propertyNames:* = null) : BulletRunner
        {
            if (!_tickerAvailable) {
                _startTicker();
                ScopeLimitObject.initialize();
                _bulletRunnerDefaultTarget.setAsDefaultTarget();
            }
            
            //var br:BulletRunner = _brunnerDict[actor];
            var br:BulletRunner = null;
            if (br == null) br = _new_BulletRunner(actor, callbacks, propertyNames);
            
            return br;
        }
        
        
        /** update position that all bullets target to. 
         *  @param xpos x number.
         *  @param ypos y number.
         */
        static public function updateTargetPosition(xpos:Number, ypos:Number) : void
        {
            _bulletRunnerDefaultTarget.x = xpos;
            _bulletRunnerDefaultTarget.y = ypos;
        }
        
        
        /** pause all bullet runner runnings */
        static public function pause() : void
        {
            _tickerPaused = true;
        }
        
        
        /** resume all bullet runner runnings pause */
        static public function resume() : void 
        {
            _tickerPaused = false;
        }
        
        
        /** run sequence. call CMLObject::create and CMLObject::execute inside.
         *  @param seq sequence. CMLSequence instance, String in CannonML or XML in BulletML is available.
         *  @param args The array of arguments to execute sequence.
         *  @param invertFlag The flag to invert execution, same as 'm' command.
         *  @return Instance of fiber that execute the sequence.
         */
        public function runSequence(seq:*, args:Array=null, invertFlag:uint=0) : CMLFiber
        {
            var s:CMLSequence = (seq is String || seq is XML) ? (new CMLSequence(seq)) : seq as CMLSequence, 
                fiber:CMLFiber;
            if (!isActive) create(actor[xPropertyName], actor[yPropertyName]);
            if (s) fiber = execute(s, args, invertFlag);
            return fiber;
        }
        
        
        
        
    // handlers
    //------------------------------------------------------------
        /** @private */
        override public function onCreate() : void
        {
            if (atCreate != null) atCreate(this);
        }


        /** @private */
        override public function onDestroy() : void
        {
            if (atDestroy != null) atDestroy(this);
        }


        /** @private */
        override public function onUpdate() : void
        {
            if (isEscaped) {
                destroy(0);
            } else {
                actor[xPropertyName] = x;
                actor[yPropertyName] = y;
                if (anglePropertyName != null) actor[anglePropertyName] = angleOnStage;
                if (atUpdate != null) atUpdate(this);
            }
        }
        
        
        /** @private */
        override public function onNewObject(args:Array) : CMLObject
        {
            if (atNewObject == null) return null;
            var actor:* = atNewObject(args);
            return (actor is BulletRunner) ? actor : _new_BulletRunner(actor);
        }


        /** @private */
        override public function onFireObject(args:Array) : CMLObject
        {
            if (atFireObject == null) return null;
            var actor:* = atFireObject(args);
            return (actor is BulletRunner) ? actor : _new_BulletRunner(actor);
        }


        /** @private */
        public override function _finalize() : void
        {
            super._finalize();
            _delete(this);
        }
        
        
        
        
    // ticker
    //------------------------------------------------------------
        // ticker
        static private var _ticker:Shape = null;
        static private var _tickerAvailable:Boolean = false;
        static private var _tickerPaused:Boolean = false;
        
        static private function _startTicker() : void {
            if (!_ticker) _ticker = new Shape();
            _ticker.addEventListener(Event.ENTER_FRAME, _onTick);
            _tickerAvailable = true;
        }
        
        static private function _stopTicker() : void {
            _ticker.removeEventListener(Event.ENTER_FRAME, _onTick);
            _tickerAvailable = false;
        }
        
        static private function _onTick(e:Event) : void {
            if (!_tickerPaused) CMLObject.update();
        }
        
        
        
        
    // factory
    //------------------------------------------------------------
        // free list
        static private var _freeList:CMLList = new CMLList();
        static private var _brunnerDict:Dictionary = new Dictionary(true);
        
        
        /** create new instance */
        static private function _new_BulletRunner(actor:*, callbacks:*=null, propertyNames:*=null) : BulletRunner
        {
            var br:BulletRunner = (_freeList.isEmpty()) ? new BulletRunner() : BulletRunner(_freeList.pop());
            br.actor = actor;
            br.callbacks = callbacks;
            br.propertyNames = propertyNames;
            //_brunnerDict[actor] = br;
            return br;
        }
        
        
        // delete instance
        static private function _delete(br:BulletRunner) : void
        {
            //delete _brunnerDict[br.actor];
            _freeList.push(br);
        }
    }
}


