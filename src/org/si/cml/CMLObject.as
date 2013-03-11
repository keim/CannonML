//----------------------------------------------------------------------------------------------------
// CML object class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------


package org.si.cml {
    import flash.geom.Point;
    import org.si.cml.core.*;
    import org.si.cml.namespaces._cml_internal;
    import org.si.cml.namespaces._cml_fiber_internal;
    
    
    /** <b>Basic class for all objects.</b>
     * @see CMLObject#initialize()
     * @see CMLObject#update()
     * @see CMLObject#setAsDefaultTarget()
     * @see CMLObject#execute()
     * @see CMLObject#create()
     * @see CMLObject#root
     * @see CMLSequence
     * @see CMLFiber
@example 0) All classes of an object are an extension of CMLObject.<br/>
Override callback functions onCreate(), onDestroy(), onUpdate(), onNewObject() and onFireObject().
<listing version="3.0">
// Enemy class
class Enemy extends CMLObject
{
    ...
    
    // for initializing
    override public function onCreate() : void
    {
        _animationCounter = 0;
    }
    
    // for finalizing
    override public function onDestroy() : void
    {
        // destructionStatus=1 means destruction (as you like), create explosion particles.
        if (destructionStatus == 1) _createExplosion();
    }
    
    // for updating on each frame
    override public function onUpdate() : void
    {
        // Increase animation counter.
        if (++_animationCounter == 100) _animationCounter = 0;
        
        // Drawing
        _drawEnemy(this);
    }

    // for new object created by "n" command
    override public function onNewObject(args:Array) : CMLObject
    {
        return new Enemy();
    }
    
    // for new object created by "f" command
    override public function onFireObject(args:Array) : CMLObject
    {
        return new Bullet();
    }

    ...
}


class Bullet extends CMLObject
{
    ...
}


class Player extends CMLObject
{
    ...
}


class Shot extends CMLObject
{
    ...
}
</listing>
@example 1) Call the CMLObject.initialize() function first of all. 
<listing version="3.0">
// 1st argument specifies scrolling direction (set true for vertical, false for horizontal).
CMLObject.initialize(true);
</listing>
@example 2) Create player object and marking it as "default target".
<listing version="3.0">
var player:CMLObject = new Player();    // Player class is your extention of CMLObject.
player.setAsDefaultTarget();            // Default target is the object to fire.
</listing>
@example 3) Create a new CMLSequence from cannonML or bulletML, and call create() and execute().
<listing version="3.0">
// Create stage sequence from "String of cannonML" or "XML of bulletML".
var stageSequence:CMLSequence = new CMLSequence(String or XML);

 ...

var root:Enemy = new Enemy();   // create one enemy as "root enemy" (usually transparent)
root.create(x, y);              // Create root enemy on the cml field.
root.execute(stageSequence);    // Execute stage sequence on root enemy.
</listing>
@example 4) Call CMLObject.update() once for each frame.
<listing version="3.0">
addEventListener(Event.ENTER_FRAME, _onEnterFrame);

function _onEnterFrame(event:Event) : void {
    CMLObject.update();
}
</listing>
     */    
    public class CMLObject extends CMLListElem
    {
    // namespace
    //------------------------------------------------------------
        use namespace _cml_internal;
        
        
    // public constant values
    //------------------------------------------------------------
        /** @private Flag for parts motions. */
        static protected const MT_PART_FLAG:uint = 8;
        /** @private Filter for parts motions. */
        static protected const MT_PART_FILTER:uint = MT_PART_FLAG - 1;
        
        // enum for motion
        /** Number for CMLObject.motion_type, Linear motion. */
        static public const MT_CONST:uint    = 0;
        /** Number for CMLObject.motion_type, Accelarating motion. */
        static public const MT_ACCEL:uint    = 1;
        /** Number for CMLObject.motion_type, 3D-Bezier interpolating motion. */
        static public const MT_INTERPOL:uint = 2;
        /** Number for CMLObject.motion_type, BulletML compatible motion. */
        static public const MT_BULLETML:uint = 3;
        /** Number for CMLObject.motion_type, Gravity motion. */
        static public const MT_GRAVITY:uint  = 4;
        /** Number for CMLObject.motion_type, Linear motion of parts. */
        static public const MT_PART_CONST:uint = MT_CONST | MT_PART_FLAG;
        /** Number for CMLObject.motion_type, Accelarating motion of parts. */
        static public const MT_PART_ACCEL:uint = MT_ACCEL | MT_PART_FLAG;
        /** Number for CMLObject.motion_type, 3D-Bezier interpolating motion of parts. */
        static public const MT_PART_INTERPOL:uint = MT_INTERPOL | MT_PART_FLAG;
        /** Number for CMLObject.motion_type, BulletML compatible motion of parts. */
        static public const MT_PART_BULLETML:uint = MT_BULLETML | MT_PART_FLAG;



    // public variables
    //------------------------------------------------------------
        /** You can rewrite this for your own purpose. */
        public var actor:* = this;

        /** X value of position. */
        public var x:Number = 0;
        /** Y value of position. */
        public var y:Number = 0;
        /** X value of velocity. */
        public var vx:Number = 0;
        /** Y value of velocity. */
        public var vy:Number = 0;




    // public properties
    //------------------------------------------------------------
        // static properties
        /** root object is the default parent of all CMLObjects that are created with the argument of parent=null. */
        static public function get root():CMLObject { return _root; }
        
        /** Scrolling angle (vertical=-90, horizontal=180). */
        static public function get scrollAngle() : Number { return _root._scrollAngle; }
        
        /** Flag for scrolling direction (vertical=1, horizontal=0). */
        static public function get vertical() : int { return (_root._scrollAngle==-90) ? 1 : 0; }
        static public function set vertical(v:int) : void { _root._scrollAngle = (v) ? -90 : 180; }
        
        /** Value of (frame rate to calculate speed) / (screen frame rate). */
        static public function get frameRateRatio() : Number { return CMLState.speedRatio; }
        static public function set frameRateRatio(n:Number) : void { CMLState.speedRatio = n; }
        
        /** Function for "$?/$??" variable, The type is function():Number. @default Math.random() */
        static public function get funcRand() : Function { return _funcRand; }
        static public function set funcRand(func:Function) : void { _funcRand = func; }

        /** Variable for "$r" */
        static public function get globalRank() : Number { return _globalRank[0]; }
        static public function set globalRank(r:Number) : void {
            _globalRank[0] = (r<_globalRankRangeMin) ? _globalRankRangeMin : (r>_globalRankRangeMax) ? _globalRankRangeMax : r;
        }
        
        // common properties
        /** Construction ID, this value changes when the object is destroyed.
         * @example If you want to know the object is available or not, check the id.
<listing version="3.0">
target_object_id = target_object.id;        // keep the target's id value.
...
if (target_object_id != target_object.id) { // if the id value is different,
    target_object = null;                   // target object was destroyed.
}
</listing>
         */
        public function get id() : uint { return _id; }
        
        /** The CMLObject that creates this object. Returns root when the parent was destroyed. */
        public function get parent() : CMLObject {
            if (_parent._id != _parent_id) {
                _parent = _root;
                _parent_id = _parent._id;
                _access_id = ID_NOT_SPECIFYED;
            }
            return _parent;
        }
        
        
        /** Motion type. 
         * @see CMLObject#MT_CONST
         * @see CMLObject#MT_ACCEL
         * @see CMLObject#MT_INTERPOL
         * @see CMLObject#MT_BULLETML
         * @see CMLObject#MT_GRAVITY
         */
        public function get motion_type() : uint  { return _motion_type; }
        
        /** Is this object on stage ? */
        public function get isActive() : Boolean { return (_parent != null); }
        
        /** Is this object a part of its parent ? The part object's position is relative to parent's position. */
        public function get isPart() : Boolean { return Boolean(_motion_type & MT_PART_FLAG); }
        
        /** Does this object have another object as a part ? */
        public function get hasParts() : Boolean { return (!_partChildren.isEmpty); }
        
        /** You can define the "$r" value for each object by overriding this property, Ussualy returns CMLObject.globalRank. @see CMLObject#globalRank */
        public function get rank() : Number { return globalRank; }
        public function set rank(r:Number) : void { globalRank = r; }

        /** Destruction status. You can refer the argument of destroy() or the '@ko' command. Returns -1 when the object isn't destroyed.
         *  @see CMLObject#onDestroy()
         *  @see CMLObject#destroy()
         *  @see CMLObject#destroyAll()
         */
        public function get destructionStatus() : int { return _destructionStatus; }


        /** The x value of position parent related */
        public function get relatedX() : Number { return (_motion_type & MT_PART_FLAG) ? _rx : x; }
        /** The y value of position parent related */
        public function get relatedY() : Number { return (_motion_type & MT_PART_FLAG) ? _ry : y; }


        // velocity
        /** Absolute value of velocity. */
        public function get velocity() : Number { return ((_motion_type & MT_PART_FILTER) == MT_BULLETML) ? _ax : (Math.sqrt(vx*vx+vy*vy)); }
        public function set velocity(vel:Number) : void {
            if ((_motion_type & MT_PART_FILTER) == MT_BULLETML) {
                _ax = vel; 
            } else {
                var r:Number = vel/velocity;
                vx *= r;
                vy *= r;
            }
        }


        // angles
        /** Angle of this object, scrolling direction is 0 degree. */
        public function get angle()                  : Number { return ((_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset)) + _head + _root._scrollAngle; }
        public function set angle(ang:Number)        : void   { _head = ang - ((_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset)) - _root._scrollAngle; }
        /** Angle of this object, The direction(1,0) is 0 degree. */
        public function get angleOnStage()           : Number { return ((_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset)) + _head; }
        public function set angleOnStage(ang:Number) : void   { _head = ang - ((_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset)); }
        /** Angle of this parent object, scrolling direction is 0 degree. */
        public function get angleParentOnStage()     : Number { return ((_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset)); }
        /** Calculate direction of position from origin. */
        public function get anglePosition() : Number { return ((_motion_type & MT_PART_FLAG) ? (Math.atan2(_ry, _rx)) : (Math.atan2(y, x))) * 57.29577951308232 - _root._scrollAngle; }
        /** Calculate direction of velocity. */
        public function get angleVelocity() : Number { return ((_motion_type & MT_PART_FILTER) == MT_BULLETML) ? (angleOnStage) : (Math.atan2(vy, vx)*57.29577951308232 - _root._scrollAngle); }
        /** Calculate direction of accelaration. */
        public function get angleAccel()    : Number { return ((_motion_type & MT_PART_FILTER) == MT_BULLETML) ? (angleOnStage) : (Math.atan2(_ay, _ax)*57.29577951308232 - _root._scrollAngle); }




    // private variables
    //------------------------------------------------------------
        // statics
        static private  var _activeObjects:CMLList = new CMLList();     // active object list
        static private  var _root:CMLRoot = null;                       // root object instance
        static private  var _funcRand:Function = Math.random;           // random function
        static private  var _globalRankRangeMin:Number = 0;             // the range of globalRank
        static private  var _globalRankRangeMax:Number = 1;             // the range of globalRank
        /** @private */
        static _cml_internal var _globalRank:Array = new Array(10);     // array of globalRank
        

        // common parameters
        private var _id:uint = 0;                       // construction id
        private var _parent:CMLObject = null;           // parent object
        private var _parent_id:uint = 0;                // parent object id
        private var _access_id:int = ID_NOT_SPECIFYED;  // access id
        private var _destructionStatus:int = -1;        // destruction status
        
        private var _IDedChildren:Array = [];   // children list that has access id
        private var _partChildren:Array = [];   // children list that is part of this
        
        // motion parameters
        private var _rx:Number = 0;       // relative position
        private var _ry:Number = 0;
        private var _ax:Number = 0;       // accelaration
        private var _ay:Number = 0;
        private var _bx:Number = 0;       // differential of accelaration
        private var _by:Number = 0;
        private var _ac:int    = 0;       // accelaration counter
        private var _motion_type:uint = MT_CONST;  // motion type
        
        // posture
        private var _head:Number = 0;           // head angle
        private var _head_offset:Number = 0;    // head angle offset

        // rotation
        private var _roti:interpolation = new interpolation();    // rotation interpolation
        private var _rott:Number = 0;                             // rotation parameter
        private var _rotd:Number = 0;                             // rotation parameter increament

        // enum for relation
        static private const NO_RELATION:uint = 0;
        static private const REL_ATTRACT:uint = 1;
        
        /** @private */
        static _cml_internal const ID_NOT_SPECIFYED:int = 0;




    // constructor
    //------------------------------------------------------------
        /** Constructor. */
        public function CMLObject()
        {
            _id = 0;
            actor = this;
        }




    // callback functions
    //------------------------------------------------------------
        /** Callback function on create. Override this to initialize.*/
        public function onCreate() : void
        {
        }
        
        
        /** Callback function on destroy. Override this to finalize.
         *  @see CMLObject#destroy()
         *  @see CMLObject#destroyAll()
         */
        public function onDestroy() : void
        {
        }
        
        
        /** Callback function from CMLObject.update(). This function is called after updating position. Override this to update own parameters.*/
        public function onUpdate() : void
        {
        }

        
        /** Statement "n" calls this when it needs. Override this to define the new CMLObject created by "n" command.
         *  @param args The arguments of sequence.
        *  @return The new CMLObject created by "n" command. You must not activate(call create()) returning CMLObject.
         */
        public function onNewObject(args:Array) : CMLObject
        {
            return null;
        }

        
        /** Statement "f" calls this when it needs. Override this to define the new CMLObject created by "f" command.
         *  @param args The arguments of sequence.
         *  @return The new CMLObject created by "n" command. You must not activate(call create()) returning CMLObject.
         */
        public function onFireObject(args:Array) : CMLObject
        {
            return null;
        }




    // static functions
    //------------------------------------------------------------
        /** <b>Call this function first of all</b>.
         *  @param vertical_ Flag of scrolling direction
         *  @return The root object.
         */
        static public function initialize(vertical_:Boolean=true) : CMLObject
        {
            if (!_root) _root = new CMLRoot();
            vertical = int(vertical_);
            for (var i:int=0; i<_globalRank.length; i++) _globalRank[i] = 0;
            destroyAll(-1);
            CMLFiber._cml_fiber_internal::_deatroyAll();
            _root.create(0, 0, _root).setAsDefaultTarget();
            return _root;
        }

        
        /** <b>Call this function for each frame</b>. This function calls all CMLObject.onUpdate()s. */
        static public function update() : void
        {
            CMLFiber._cml_fiber_internal::_onUpdate();
            
            if (_activeObjects.isEmpty()) return;
            
            var object   :CMLObject, 
                elem     :CMLListElem = _activeObjects.begin,
                elem_end :CMLListElem = _activeObjects.end;

            while (elem!=elem_end) {
                object = CMLObject(elem);
                elem = elem.next;
                if (object._destructionStatus >= 0) {
                    object._finalize();
                } else {
                    object.update();
                    //if (object._destructionStatus >= 0) object._finalize();
                }
            }
        }

        
        /** Destroy all active objects except for root. This function <b>must not</b> be called from onDestroy().
         *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by destructionStatus in onDestroy(). 
         *  @see CMLObject#destructionStatus
         *  @see CMLObject#onDestroy()
         */
        static public function destroyAll(status:int) : void
        {
            var elem     :CMLListElem, elem_next:CMLListElem, 
                elem_end :CMLListElem = _activeObjects.end;
            for (elem=_activeObjects.begin; elem!=elem_end; elem=elem_next) {
                // CMLObject(elem).destroy(_destructionStatus);
                elem_next= elem.next;
                CMLObject(elem)._destructionStatus = status;
                CMLObject(elem)._finalize();
            }
        }

        
        /** The return value is from CMLObject.funcRand. Call CMLObject.funcRand internally.
         *  @return The random number between 0-1. 
         *  @see CMLObject#funcRand
         */
        static public function rand() : Number { return _funcRand(); }


        /** Set the range of globalRank. The global rank value is limited in this range. */
        static public function setGlobalRankRange(min:Number, max:Number) : void
        {
            _globalRankRangeMin = min;
            _globalRankRangeMax = max;
        }




    // create / destroy
    //------------------------------------------------------------
        /** Create new object on the CML stage.
         *  @param x_         X value of this object on a stage or parent(if its a part of parent).
         *  @param y_         Y value of this object on a stage or parent(if its a part of parent).
         *  @param parent_    The instance of parent object. Pass null to set this object as a child of root.
         *  @param isPart_    True to set this object as a part of parent.
         *  @param access_id_ Access ID from parent.
         *  @return this instance.
         */
        public function create(x_:Number, y_:Number, parent_:CMLObject=null, isPart_:Boolean=false, access_id_:int=ID_NOT_SPECIFYED) : CMLObject
        {
            if (isActive) throw new Error("CMLObject.create() must be called from inactive CMLObject.");
            _initialize(parent_ || _root, isPart_, access_id_, x_, y_, 0, 0, 0);
            return this;
        }
        
        
        /** Destroy this object. The onDestroy() is called when the next CMLObject.update().
         *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by CMLObject.destructionStatus in onDestroy().
         *  @see CMLObject#destructionStatus
         *  @see CMLObject#onDestroy()
         */
        public function destroy(status:int) : void
        {
            _destructionStatus = (status<0) ? 0 : status;
        }

        
        /** Reset position, velocity, accelaration, interpolation, motion type and rotation.
         */
        public function reset(x_:Number, y_:Number) : CMLObject
        {
            _motion_type = MT_CONST | (_motion_type & MT_PART_FLAG);
            setPosition(x_, y_);
            _bx = _by = _ax = _ay = vx = vy = 0;
            _ac = 0;
            _head_offset = _head = 0;
            _rotd = 0;
            return this;
        }



    // execute / halt
    //------------------------------------------------------------
        /** Execute a sequence and create a new fiber.
         *  @param seq The sequence to execute.
         *  @param args The array of arguments to execute sequence.
         *  @param invertFlag The flag to invert execution same as 'm' command.
         *  @return Instance of fiber that execute the sequence.
         */
        public function execute(seq:CMLSequence, args:Array=null, invertFlag:uint=0) : CMLFiber
        {
            return CMLFiber._cml_fiber_internal::_newRootFiber(this, seq, args, invertFlag);
        }
        
        
        /** Destroy all fibers of this object. This function is slow.
         *  If you want to execute faster, keep returned CMLFiber of CMLObject.execute() and call CMLFiber.destroy() wherever possible.
         *  @see CMLObject#execute()
         *  @see CMLFiber#destroy()
         */
        public function halt() : void
        {
            CMLFiber._cml_fiber_internal::_destroyAllFibers(this);
        }




    // reference
    //------------------------------------------------------------
        /** Calculate distance from another object aproximately. The distance is calculated as an octagnal.
         * @param tgt Another object to calculate distance.
         * @return Rough distance.
         */
        public function getDistance(tgt:CMLObject) : Number
        {
            var dx:Number = (x < tgt.x) ? (tgt.x - x) : (x - tgt.x);
            var dy:Number = (y < tgt.y) ? (tgt.y - y) : (y - tgt.y);
            return (dx > dy) ? (dx + dy * 0.2928932188134524) : (dy + dx * 0.2928932188134524);
        }
        
        
        /** Calculate aiming angle to another object.
         * @param target_ Another object to calculate angle.
         * @param offx X position offset to calculate angle.
         * @param offy Y position offset to calculate angle.
         * @return Angle.
         */
        public function getAimingAngle(target_:CMLObject, offx:Number=0, offy:Number=0) : Number
        {            
            var sang:int = sin.index(angleOnStage), cang:int = sang + sin.cos_shift,
                absx:Number = x + sin[cang]*offx - sin[sang]*offy,
                absy:Number = y + sin[sang]*offx + sin[cang]*offy;
            return Math.atan2(target_.y-absy, target_.x-absx)*57.29577951308232 - _root._scrollAngle;
        }
        
        
        /** transform object local coordinate to global coordinate 
         *  @param point on local coordinate. this instance is overwritten inside.
         *  @return point on global coordinate. this instance is that you passed as argument.
         */
        public function transformLocalToGlobal(local:Point) : Point
        {
            var sang:int = sin.index(angleOnStage), cang:int = sang + sin.cos_shift,
                glbx:Number = x + sin[cang]*local.x - sin[sang]*local.y,
                glby:Number = y + sin[sang]*local.x + sin[cang]*local.y;
            local.x = glbx;
            local.y = glby;
            return local;
        }
        
        
        /** transform global coordinate to object local coordinate
         *  @param point on global coordinate. this instance is overwritten inside.
         *  @return point on local coordinate. this instance is that you passed as argument.
         */
        public function transformGlobalToLocal(global:Point) : Point
        {
            var sang:int = sin.index(-angleOnStage), cang:int = sang + sin.cos_shift,
                locx:Number = sin[cang]*(global.x - x) - sin[sang]*(global.y - y),
                locy:Number = sin[sang]*(global.x - x) + sin[cang]*(global.y - y);
            global.x = locx;
            global.y = locy;
            return global;
        }
        
        
        /** Count all children with access id. 
         *  @return The count of child objects with access id.
         *  @see CMLObject#create()
         */
        public function countAllIDedChildren() : int
        {
            return _IDedChildren.length;
        }
        
        
        /** Count children with specifyed id.
         *  @param id Access id specifyed in create() or "n*" command.
         *  @return The count of child objects with specifyed id.
         *  @see CMLObject#create()
         */
        public function countIDedChildren(id:int) : int
        {
            var count:int=0, obj:CMLObject;
            for each (obj in _IDedChildren) {
                count += int(obj._access_id == id);
            }
            return count;
        }

        
        

    // set parameters
    //------------------------------------------------------------
        /** Set position.
         *  @param x_ X value of position.
         *  @param y_ Y value of position.
         *  @param term_ Frames for tweening with bezier interpolation.
         *  @return this object
         */
        public function setPosition(x_:Number, y_:Number, term_:int=0) : CMLObject
        {
            if (term_ == 0) {
                if (_motion_type == MT_GRAVITY) {
                    _rx = x_;
                    _ry = y_;
                } else {
                    if (isPart) {
                        _rx = x_;
                        _ry = y_;
                        calcAbsPosition();
                    } else {
                        x = x_;
                        y = y_;
                    }
                    _motion_type = MT_CONST | (_motion_type & MT_PART_FLAG);
                }
            } else {
                // interlopation
                var t:Number = 1 / term_;
                var dx:Number, dy:Number;
                if (isPart) {
                    dx = x_ - _rx;
                    dy = y_ - _ry;
                } else {
                    dx = x_ - x;
                    dy = y_ - y;
                }
                _ax = (dx * t * 3 - vx * 2) * t * 2;
                _ay = (dy * t * 3 - vy * 2) * t * 2;
                _bx = (dx * t *-2 + vx) * t * t * 6;
                _by = (dy * t *-2 + vy) * t * t * 6;
                _ac = term_;
                _motion_type = MT_INTERPOL | (_motion_type & MT_PART_FLAG);
            }
            return this;
        }


        /** Set velocity.
         *  @param vx_ X value of velocity.
         *  @param vy_ Y value of velocity.
         *  @param term_ Frames for tweening with bezier interpolation.
         *  @return this object
         */
        public function setVelocity(vx_:Number, vy_:Number, term_:int=0) : CMLObject
        {
            if (term_ == 0) {
                vx = vx_;
                vy = vy_;
                _motion_type = MT_CONST | (_motion_type & MT_PART_FLAG);
            } else {
                var t:Number = 1 / term_;
                if ((_motion_type & MT_PART_FILTER) == MT_INTERPOL) {
                    // interlopation
                    _ax -= vx_ * t * 2;
                    _ay -= vy_ * t * 2;
                    _bx += vx_ * t * t * 6;
                    _by += vy_ * t * t * 6;
                    _ac = term_;
                    _motion_type = MT_INTERPOL | (_motion_type & MT_PART_FLAG);
                } else {
                    // accelaration
                    _ax = (vx_ - vx) * t;
                    _ay = (vy_ - vy) * t;
                    _ac = term_;
                    _motion_type = MT_ACCEL | (_motion_type & MT_PART_FLAG);
                }
            }
            return this;
        }


        /** Set accelaration.
         *  @param ax_ X value of accelaration.
         *  @param ay_ Y value of accelaration.
         *  @param time_ Frames to stop accelarate. 0 means not to stop.
         *  @return this object
         */
        public function setAccelaration(ax_:Number, ay_:Number, time_:int=0) : CMLObject
        {
            _ax = ax_;
            _ay = ay_;
            _ac = time_;
            if (_ax==0 && _ay==0) {
                _motion_type = MT_CONST | (_motion_type & MT_PART_FLAG);
            } else {
                _motion_type = MT_ACCEL | (_motion_type & MT_PART_FLAG);
            }
            return this;
        }


        
        /** Set interpolating motion.
         *  @param x_ X value of position.
         *  @param y_ Y value of position.
         *  @param vx_ X value of velocity.
         *  @param vy_ Y value of velocity.
         *  @param term_ Frames for tweening with bezier interpolation.
         *  @return this object
         */
        public function setInterpolation(x_:Number, y_:Number, vx_:Number, vy_:Number, term_:int=0) : CMLObject
        {
            if (term_ == 0) {
                vx = vx_;
                vy = vy_;
                if (isPart) {
                    _rx = x_;
                    _ry = y_;
                    calcAbsPosition();
                } else {
                    x = x_;
                    y = y_;
                }
                _motion_type = MT_CONST | (_motion_type & MT_PART_FLAG);
            } else {
                // 3rd dimensional motion
                var t:Number = 1 / term_;
                var dx:Number, dy:Number;
                if (isPart) {
                    dx = x_ - _rx;
                    dy = y_ - _ry;
                } else {
                    dx = x_ - x;
                    dy = y_ - y;
                }
                _ax = (dx * t * 3 - vx * 2 - vx_) * t * 2;
                _ay = (dy * t * 3 - vy * 2 - vy_) * t * 2;
                _bx = (dx * t *-2 + vx + vx_) * t * t * 6;
                _by = (dy * t *-2 + vy + vy_) * t * t * 6;
                _ac = term_;
                _motion_type = MT_INTERPOL | (_motion_type & MT_PART_FLAG);
            }
            return this;
        }

        

        /** &lt;changeDirection type='absolute'&gt; of bulletML.
         *  @param dir Direction to change.
         *  @param term Frames to change direction.
         *  @param rmax Maxmum speed of rotation [degrees/frame].
         *  @param shortest_rot Flag to rotate on shortest rotation.
         *  @return this object
         */
        public function setChangeDirection(dir:Number, term:int, rmax:Number, shortest_rot:Boolean=true) : CMLObject
        {
            if (term == 0) {
                // set head angle and set velocity to head direction
                setRotation(dir, 0, 1, 1, shortest_rot);
                var sang:int = sin.index(angle),
                    cang:int = sang + sin.cos_shift,
                    spd:Number = velocity;
                vx = sin[cang] * spd;
                vy = sin[sang] * spd;
            } else {
                // set constant rotation
                setConstantRotation(dir, term, rmax, shortest_rot);
                // set verocity
                if ((_motion_type & MT_PART_FILTER) != MT_BULLETML) {
                    _ax = velocity;
                    _bx = 0;
                    _ac = 0;
                    _motion_type = MT_BULLETML | (_motion_type & MT_PART_FLAG);
                }
            }
            return this;
        }


        
        /** &lt;changeSpeed type='absolute'&gt; of bulletML.
         *  @param spd Speed to change.
         *  @param term Frames to change speed.
         *  @return this object
         */
        public function setChangeSpeed(spd:Number, term:int=0) : CMLObject
        {
            if (term == 0) {
                // turn velocity vector to head direction
                var sang:int = sin.index(angle),
                    cang:int = sang + sin.cos_shift;
                vx = sin[cang] * spd;
                vy = sin[sang] * spd;
            } else {
                // set verocity
                _ax = velocity;
                _bx = (spd - _ax) / term;
                _ac = term;
                _motion_type = MT_BULLETML | (_motion_type & MT_PART_FLAG);
            }
            return this;
        }



        /** Set gravity motion.
         *  <p>
         *  <b>This function is not available for a part of parent.</b>
         *  After this function, the CMLObject.setPosition() sets the gravity center.
         *  The calculation of the motion is below.<br/>
         *  [accelaration] = [distance] * [atr_a] / 100 - [velocity] * [atr_b] / 100<br/>
         *  </p>
         *  @param atr_a Attracting parameter a[%]. Ratio of attracting force.
         *  @param atr_b Attracting parameter b[%]. Ratio of air fliction.
         *  @param term Frames to enable attracting force.
         *  @return this object
         *  @see CMLObject#setPosition
         */
        public function setGravity(atr_a:Number, atr_b:Number, term:int=0) : CMLObject
        {
            if (_motion_type & MT_PART_FLAG) return this;
            
            if (atr_a == 0 && atr_b == 0) {
                // stop attraction
                _ax = 0;
                _ay = 0;
                _bx = 0;
                _by = 0;
                _ac = 0;
                _motion_type = MT_CONST;
            } else {
                // attraction
                _bx = atr_a*0.01;
                _by = atr_b*0.01;
                _ac = term;
                _rx = x;
                _ry = y;
                _motion_type = MT_GRAVITY;
            }
            return this;
        }

        
        
        /** Set rotation. You can specify the first and last speed.
         *  @param end_angle Final angle when the rotation finished, based on scrolling direction.
         *  @param term Frames to rotate.
         *  @param start_t Ratio of first rotating speed. The value of 1 means the speed of a constant rotation.
         *  @param end_t Ratio of last rotating speed. The value of 1 means the speed of a constant rotation.
         *  @param isShortestRotation Rotate with shortest rotation or not.
         *  @return this object
         */
        public function setRotation(end_angle:Number, term:Number=0, start_t:Number=1, end_t:Number=1, isShortestRotation:Boolean=true) : CMLObject
        {
            // calculate shotest rotation
            var diff:Number;
            if (isShortestRotation) {
                _normalizeHead();
                diff = (end_angle - angleOnStage + 180) * 0.00277777777777777778;
                diff = (diff-int(diff)) * 360 - 180;
            } else {
                diff = end_angle - angleOnStage;
            }

            if (term == 0) {
                _head += diff;
                _rott = 0;
                _rotd = 0;
            } else {
                // rotating interpolation
                _roti.setFergusonCoons(_head, _head+diff, diff*start_t, diff*end_t)
                _rott = 0;
                _rotd = 1/term;
            }
            return this;
        }

        
        
        /** Set constant rotation. You can specify the maximum speed.
         *  @param end_angle Final angle when the rotation finished, based on scrolling direction.
         *  @param term Frames to rotate.
         *  @param rmax Maximum speed of rotation [degrees/frame].
         *  @param isShortestRotation Rotate with shortest rotation or not.
         *  @return this object
         */
        public function setConstantRotation(end_angle:Number, term:Number=0, rmax:Number=1, isShortestRotation:Boolean=true) : CMLObject
        {
            // rotation max
            rmax *= (term==0) ? 1 : term;
            
            // calculate shotest rotation
            var diff:Number;
            if (isShortestRotation) {
                _normalizeHead();
                diff = (end_angle - angleOnStage + 180) * 0.00277777777777777778;
                diff = (diff-int(diff)) * 360 - 180;
            } else {
                diff = end_angle - angleOnStage;
            }
            
            // restriction
            if (rmax != 0) {
                if (diff < -rmax) diff = -rmax;
                else if (diff > rmax) diff = rmax;
            }
            
            if (term == 0) {
                _head += diff;
                _rott = 0;
                _rotd = 0;
            } else {
                _roti.setLinear(_head, _head+diff);
                _rott = 0;
                _rotd = 1/term;
            }
            return this;
        }


        /** Set as a default target object. A default target is the object to target from all objects at default, usually player is as. 
         *  @return this object
         */
        public function setAsDefaultTarget() : CMLObject
        {
            CMLFiber._cml_fiber_internal::_defaultTarget = this;
            return this;
        }
        
        
        /** Change parent. */
        public function changeParent(parent_:CMLObject=null, isPart_:Boolean=false, access_id_:int=ID_NOT_SPECIFYED) : void
        {
            // check parent availability
            isPart_ = (parent_ != null) && isPart_;

            // remove this from a parents IDed children list.
            if (_access_id != ID_NOT_SPECIFYED) {
                _parent._IDedChildren.splice(_parent._IDedChildren.indexOf(this), 1);
            }
            
            // when this WAS a part object ...
            if (isPart) {
                // check parents parts
                _parent._partChildren.splice(_parent._partChildren.indexOf(this), 1);
                // calculate absolute angle
                _head = _parent.angleOnStage + _head;
            }

            // change parameters
            _parent = parent_ || _root;
            _parent_id = _parent._id;
            _access_id = (parent_) ? access_id_ : ID_NOT_SPECIFYED;
            if (access_id_ != ID_NOT_SPECIFYED) {
                _parent._IDedChildren.push(this);
            }
            
            // when this WILL BE a part object ...
            if (isPart_) {
                // repush active object list
                _repush(this);
                
                // register this on parent parts list.
                _parent._partChildren.push(this);
            
                // change parts flag
                _motion_type |= MT_PART_FLAG;

                // calculate related position
                calcRelatedPosition();

                // calculate related angle
                _head = _head - _parent.angleOnStage;
            } else {
                // change parts flag
                _motion_type &= MT_PART_FILTER;
            }
            
            // refrective funciton
            function _repush(obj:CMLObject) : void {
                obj.remove_from_list();
                _activeObjects.push(obj);
                for each (var part:CMLObject in obj._partChildren) { _repush(part); }
            }
        }
        
        
        // calculate the angleOnStage in a range of -180 to 180.
        private function _normalizeHead() : void
        {
            var offset:Number = (_motion_type & MT_PART_FLAG) ? (_head_offset + _parent.angleOnStage) : (_head_offset);
            _head += 180 - offset;
            _head *= 0.00277777777777777778;
            _head = (_head-int(_head)) * 360 - 180 + offset;
        }
        
        
        
        
    // execute in each frame when it's necessary
    //------------------------------------------------------------
        /** Calculate absolute position when the isPart is true. 
         *  The protected function _motion_parts() is a typical usage of this. 
         */
        protected function calcAbsPosition() : void
        {
            var parent_angle:Number = angleParentOnStage;
            if (parent_angle != 0) {
                var sang:int = sin.index(parent_angle),
                    cang:int = sang + sin.cos_shift;
                x = _parent.x + sin[cang]*_rx - sin[sang]*_ry;
                y = _parent.y + sin[sang]*_rx + sin[cang]*_ry;
            } else {
                x = _parent.x + _rx;
                y = _parent.y + _ry;
            }
        }


        /** Calculate parent related position from absolute position.
         */
        protected function calcRelatedPosition() : void
        {
            var parent_angle:Number = angleParentOnStage;
            if (parent_angle != 0) {
                var sang:int = sin.index(-parent_angle),
                    cang:int = sang + sin.cos_shift,
                    dx:Number = x - _parent.x,
                    dy:Number = y - _parent.y;
                _rx = sin[cang]*dx - sin[sang]*dy;
                _ry = sin[sang]*dx + sin[cang]*dy;
            } else {
                _rx = x - _parent.x;
                _ry = y - _parent.y;
            }
        }


        /** Rotate haed in 1 frame, if rotd > 0. The _motion() is a typical usage exapmle. @see CMLObject#_motion()*/
        protected function rotateHead() : void
        {
            _rott += _rotd;
            if (_rott >= 1) {
                _rott = 1;
                _rotd = 0;
            }
            _head = _roti.calc(_rott);
        }




    // operation for children/parts
    //------------------------------------------------------------
        /** Find first child object with specifyed id. 
         *  @param id Access id specifyed in create() or "n*" command.
         *  @return The first child object with specifyed id. Return null when the seach was failed.
         *  @see CMLObject#create()
         */
        public function findChild(id:int) : CMLObject
        {
            var obj:CMLObject;
            for each (obj in _IDedChildren) {
                if (obj._access_id == id) return obj;
            }
            return null;
        }


        /** Find all child and callback. <br/>
         *  @param id Access id specifyed in create() or "n*" command.
         *  @param func The call back function to operate objects. The type is function(obj:CMLObject):Boolean. Stop finding when this returns true.
         *  @return The count of the executions of call back function.
         *  @see CMLObject#create()
         */
        public function findAllChildren(id:int, func:Function) : int
        {
            var count:int = 0,
                obj:CMLObject;
            for each (obj in _IDedChildren) {
                if (obj._access_id == id) {
                    ++count;
                    if (func(obj)) break;
                }
            }
            return count;
        }


        /** Find all parts and callback. <br/>
         *  @param func The call back function to operate objects. The type is function(obj:CMLObject):Boolean. Stop finding when this returns true.
         *  @return The count of the executions of call back function.
         *  @see CMLObject#create()
         */
        public function findAllParts(func:Function) : int
        {
            var count:int = 0;
            for each (var obj:CMLObject in _partChildren) {
                ++count;
                if (func(obj)) break;
            }
            return count;
        }
                
        
        // back door ...
        /** @private */ _cml_internal function _getX() : Number { return (_motion_type & MT_PART_FLAG) ? _rx : x; }
        /** @private */ _cml_internal function _getY() : Number { return (_motion_type & MT_PART_FLAG) ? _ry : y; }
        /** @private */ _cml_internal function _getAx() : Number {
            var filterd_mt:uint = _motion_type & MT_PART_FILTER;
            return (filterd_mt == MT_CONST || filterd_mt == MT_BULLETML) ? 0 : _ax;
        }
        /** @private */ _cml_internal function _getAy() : Number {
            var filterd_mt:uint = _motion_type & MT_PART_FILTER;
            return (filterd_mt == MT_CONST || filterd_mt == MT_BULLETML) ? 0 : _ay;
        }




    // initialize and finalize
    //------------------------------------------------------------
        /** @private initializer */ 
        public function _initialize(parent_:CMLObject, isPart_:Boolean, access_id_:int, x_:Number, y_:Number, vx_:Number, vy_:Number, head_:Number) : CMLObject
        {
            // clear some parameters
            vx = vx_;
            vy = vy_;
            _head = head_;
            _head_offset = 0;
            _rotd = 0;
            _destructionStatus = -1;
            
            // set the relations
            _parent    = parent_;
            _parent_id = _parent._id;
            _IDedChildren.length = 0;
            _partChildren.length = 0;
            
            // add this to the parent id list
            _access_id = access_id_;
            if (access_id_ != ID_NOT_SPECIFYED) {
                _parent._IDedChildren.push(this);
            }
            
            // push the active objects list, initialize position and motion.
            if (isPart_) {
                _parent._partChildren.push(this);
                _rx = x_;
                _ry = y_;
                calcAbsPosition();
                _motion_type = MT_PART_CONST;
            } else {
                x = x_;
                y = y_;
                _motion_type = MT_CONST;
            }
            _activeObjects.push(this);
	            
            // callback
            onCreate();
            
            return this;
        }


        /** @private finalizer */
        public function _finalize() : void
        {
            if (parent != _root) {
                // remove this from the parent id list.
                if (_access_id != ID_NOT_SPECIFYED) {
                    _parent._IDedChildren.splice(_parent._IDedChildren.indexOf(this), 1);
                }
                // check parents parts
                if (isPart) {
                    _parent._partChildren.splice(_parent._partChildren.indexOf(this), 1);
                }
            }
            
            // destroy all parts
            for each (var obj:CMLObject in _partChildren) {
                obj._destructionStatus = _destructionStatus;
            }
            
            // callback
            onDestroy();
            
            // remove from list
            remove_from_list();
            
            // update construction id
            _parent = null;
            _id++;
        }
        
        
        
        
    // update 
    //------------------------------------------------------------
        /** update position and angle */
        public function update() : void 
        {
            var sang:int, cang:int;
            
            switch (_motion_type) {
            case MT_CONST: {
                   x += vx;
                   y += vy;
                   break;
               }
            case MT_ACCEL: {
                    x += vx + _ax*0.5;
                    y += vy + _ay*0.5;
                    vx += _ax;
                    vy += _ay;
                    if (--_ac == 0) _motion_type = MT_CONST;
                    break;
                }
            case MT_INTERPOL: {
                    x += vx + _ax*0.5 + _bx*0.16666666666666667;
                    y += vy + _ay*0.5 + _by*0.16666666666666667;
                    vx += _ax + _bx*0.5;
                    vy += _ay + _by*0.5;
                    _ax += _bx;
                    _ay += _by;
                    if (--_ac == 0) _motion_type = MT_CONST;
                    break;
                }
            case MT_BULLETML: {
                    sang = sin.index(angle);
                    cang = sang + sin.cos_shift;
                    vx = sin[cang] * _ax;
                    vy = sin[sang] * _ax;
                    _ax += _bx;
                    x += vx;
                    y += vy;
                    if (--_ac == 0) _bx=0;
                    if (_rotd == 0 && _bx == 0) _motion_type = MT_CONST;
                    break;
                }
            case MT_GRAVITY: {
                    _ax = (_rx - x) * _bx - vx * _by,
                    _ay = (_ry - y) * _bx - vy * _by;
                    x += vx + _ax*0.5;
                    y += vy + _ay*0.5;
                    vx += _ax;
                    vy += _ay;
                    if (--_ac == 0) _motion_type = MT_CONST;
                    break;
                }
            case MT_PART_CONST: {
                    _rx += vx;
                    _ry += vy;
                    calcAbsPosition();
                    break;
                }
            case MT_PART_ACCEL: {
                    _rx += vx + _ax*0.5;
                    _ry += vy + _ay*0.5;
                    vx += _ax;
                    vy += _ay;
                    calcAbsPosition();
                    if (--_ac == 0) _motion_type = MT_PART_CONST;
                    break;
                }
            case MT_PART_INTERPOL: {
                    _rx += vx + _ax*0.5 + _bx*0.16666666666666667;
                    _ry += vy + _ay*0.5 + _by*0.16666666666666667;
                    vx += _ax + _bx*0.5;
                    vy += _ay + _by*0.5;
                    _ax += _bx;
                    _ay += _by;
                    calcAbsPosition();
                    if (--_ac == 0) _motion_type = MT_PART_CONST;
                    break;
                }
            case MT_PART_BULLETML: {
                    sang = sin.index(angle);
                    cang = sang + sin.cos_shift;
                    vx = sin[cang] * _ax;
                    vy = sin[sang] * _ax;
                    _ax += _bx;
                    _rx += vx;
                    _ry += vy;
                    calcAbsPosition();
                    if (--_ac == 0) _bx=0;
                    if (_rotd == 0 && _bx == 0) _motion_type = MT_PART_CONST;
                    break;
                }
            default:
                break;
            }
            
            if (_rotd != 0) rotateHead();
            onUpdate();
        }
    }
}



