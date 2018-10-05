//----------------------------------------------------------------------------------------------------
// CML object class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
import CMLList from "./CMLList";
import CMLListElem from "./CMLListElem";
import interpolation from "./interpolation";
/** <b>Basic class for all objects.</b>
 * @see CMLObject#initialize()
 * @see CMLObject#update()
 * @see CMLObject#setAsDefaultTarget()
 * @see CMLObject#execute()
 * @see CMLObject#create()
 * @see CMLObject#root
 * @see CMLSequence
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
export default class CMLObject extends CMLListElem {
    // constructor
    //------------------------------------------------------------
    /** Constructor. */
    constructor() {
        super();
        // public variables
        //------------------------------------------------------------
        /** You can rewrite this for your own purpose. */
        this.actor = this;
        /** X value of position. */
        this.x = 0;
        /** Y value of position. */
        this.y = 0;
        /** Z value of position. */
        this.z = 0;
        /** X value of velocity. */
        this.vx = 0;
        /** Y value of velocity. */
        this.vy = 0;
        /** Z value of velocity. */
        this.vz = 0;
        // common parameters
        this._id = 0; // construction id
        this._parent = null; // parent object
        this._parent_id = 0; // parent object id
        this._access_id = CMLObject.ID_NOT_SPECIFYED; // access id
        this._destructionStatus = -1; // destruction status
        this._IDedChildren = []; // children list that has access id
        this._partChildren = []; // children list that is part of this
        // motion parameters
        this._rx = 0; // relative position
        this._ry = 0;
        this._rz = 0;
        this._ax = 0; // accelaration
        this._ay = 0;
        this._az = 0;
        this._bx = 0; // differential of accelaration
        this._by = 0;
        this._bz = 0;
        this._ac = 0; // accelaration counter
        this._motion_type = CMLObject.MT_CONST; // motion type
        // posture
        this._head = 0; // head angle
        this._head_offset = 0; // head angle offset
        // rotation
        this._roti = new interpolation(); // rotation interpolation
        this._rott = 0; // rotation parameter
        this._rotd = 0; // rotation parameter increament
        this._id = 0;
        this.actor = this;
    }
    // public properties
    //------------------------------------------------------------
    // static properties
    /** root object is the default parent of all CMLObjects that are created with the argument of parent=null. */
    static get root() { return CMLObject._root; }
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
    get id() { return this._id; }
    /** The CMLObject that creates this object. Returns root when the parent was destroyed. */
    get parent() {
        if (this._parent._id != this._parent_id) {
            this._parent = CMLObject._root;
            this._parent_id = this._parent._id;
            this._access_id = CMLObject.ID_NOT_SPECIFYED;
        }
        return this._parent;
    }
    /** Motion type.
     * @see CMLObject#MT_CONST
     * @see CMLObject#MT_ACCEL
     * @see CMLObject#MT_INTERPOL
     * @see CMLObject#MT_BULLETML
     * @see CMLObject#MT_GRAVITY
     */
    get motion_type() { return this._motion_type; }
    /** Is this object on stage ? */
    get isActive() { return (this._parent != null); }
    /** Is this object a part of its parent ? The part object's position is relative to parent's position. */
    get isPart() { return Boolean(this._motion_type & CMLObject.MT_PART_FLAG); }
    /** Does this object have another object as a part ? */
    get hasParts() { return (this._partChildren.length != 0); }
    /** You can define the "$r" value for each object by overriding this property, Ussualy returns CMLGlobal.getRank(0). @see CMLGlobal#getRank */
    get rank() { return CMLObject._globalVariables.getRank(0); }
    set rank(r) { CMLObject._globalVariables.setRank(0, r); }
    /** Destruction status. You can refer the argument of destroy() or the '&#64;ko' command. Returns -1 when the object isn't destroyed.
     *  @see CMLObject#onDestroy()
     *  @see CMLObject#destroy()
     *  @see CMLObject#destroyAll()
     */
    get destructionStatus() { return this._destructionStatus; }
    /** The x value of position parent related */
    get relatedX() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._rx : this.x; }
    /** The y value of position parent related */
    get relatedY() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._ry : this.y; }
    /** The z value of position parent related */
    get relatedZ() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._rz : this.z; }
    // velocity
    /** Absolute value of velocity. */
    get velocity() { return ((this._motion_type & CMLObject.MT_PART_FILTER) == CMLObject.MT_BULLETML) ? this._ax : (Math.sqrt(this.vx * this.vx + this.vy * this.vy)); }
    set velocity(vel) {
        if ((this._motion_type & CMLObject.MT_PART_FILTER) == CMLObject.MT_BULLETML) {
            this._ax = vel;
        }
        else {
            var r = vel / this.velocity;
            this.vx *= r;
            this.vy *= r;
        }
    }
    // angles
    /** Angle of this object, scrolling direction is 0 degree. */
    get angle() { return ((this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset)) + this._head + CMLObject._globalVariables.scrollAngle; }
    set angle(ang) { this._head = ang - ((this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset)) - CMLObject._globalVariables.scrollAngle; }
    /** Angle of this object, The direction(1,0) is 0 degree. */
    get angleOnStage() { return ((this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset)) + this._head; }
    set angleOnStage(ang) { this._head = ang - ((this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset)); }
    /** Angle of this parent object, scrolling direction is 0 degree. */
    get angleParentOnStage() { return ((this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset)); }
    /** Calculate direction of position from origin. */
    get anglePosition() { return ((this._motion_type & CMLObject.MT_PART_FLAG) ? (Math.atan2(this._ry, this._rx)) : (Math.atan2(this.y, this.x))) * 57.29577951308232 - CMLObject._globalVariables.scrollAngle; }
    /** Calculate direction of velocity. */
    get angleVelocity() { return ((this._motion_type & CMLObject.MT_PART_FILTER) == CMLObject.MT_BULLETML) ? (this.angleOnStage) : (Math.atan2(this.vy, this.vx) * 57.29577951308232 - CMLObject._globalVariables.scrollAngle); }
    /** Calculate direction of accelaration. */
    get angleAccel() { return ((this._motion_type & CMLObject.MT_PART_FILTER) == CMLObject.MT_BULLETML) ? (this.angleOnStage) : (Math.atan2(this._ay, this._ax) * 57.29577951308232 - CMLObject._globalVariables.scrollAngle); }
    // callback functions
    //------------------------------------------------------------
    /** Callback function on create. Override this to initialize.*/
    onCreate() {
    }
    /** Callback function on destroy. Override this to finalize.
     *  @see CMLObject#destroy()
     *  @see CMLObject#destroyAll()
     */
    onDestroy() {
    }
    /** Callback function from CMLObject.update(). This function is called after updating position. Override this to update own parameters.*/
    onUpdate() {
    }
    /** Statement "n" calls this when it needs. Override this to define the new CMLObject created by "n" command.
     *  @param args The arguments of sequence.
     *  @return The new CMLObject created by "n" command. You must not activate(call create()) returning CMLObject.
     */
    onNewObject(seq) {
        return null;
    }
    /** Statement "f" calls this when it needs. Override this to define the new CMLObject created by "f" command.
     *  @param args The arguments of sequence.
     *  @return The new CMLObject created by "n" command. You must not activate(call create()) returning CMLObject.
     */
    onFireObject(seq) {
        return null;
    }
    // static functions
    //------------------------------------------------------------
    /** Destroy all active objects except for root. This function <b>must not</b> be called from onDestroy().
     *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by destructionStatus in onDestroy().
     *  @see CMLObject#destructionStatus
     *  @see CMLObject#onDestroy()
     */
    static destroyAll(status) {
        var elem = CMLObject._activeObjects.begin, elem_end = CMLObject._activeObjects.end, elem_next;
        while (elem != elem_end) {
            // CMLObject(elem).destroy(_destructionStatus);
            elem_next = elem.next;
            elem._destructionStatus = status;
            elem._finalize();
            elem = elem_next;
        }
    }
    /** @private initialize call from CannonML.initialize */
    static _initialize(globalVariables_) {
        CMLObject._globalVariables = globalVariables_;
        if (!CMLObject._root)
            CMLObject._root = new CMLObject();
        CMLObject.destroyAll(-1);
        CMLObject._root.create(0, 0, CMLObject._root);
    }
    /** @private update all call from CannonML.update */
    static _updateAll() {
        if (CMLObject._activeObjects.isEmpty())
            return;
        var object, elem = CMLObject._activeObjects.begin, elem_end = CMLObject._activeObjects.end;
        while (elem != elem_end) {
            object = elem;
            elem = elem.next;
            if (object._destructionStatus >= 0) {
                object._finalize();
            }
            else {
                object.update();
                //if (object._destructionStatus >= 0) object._finalize();
            }
        }
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
    create(x_, y_, parent_ = null, isPart_ = false, access_id_ = CMLObject.ID_NOT_SPECIFYED) {
        if (this.isActive)
            throw new Error("CMLObject.create() must be called from inactive CMLObject.");
        this._initialize(parent_ || CMLObject._root, isPart_, access_id_, x_, y_, 0, 0, 0);
        return this;
    }
    /** Destroy this object. The onDestroy() is called when the next CMLObject.update().
     *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by CMLObject.destructionStatus in onDestroy().
     *  @see CMLObject#destructionStatus
     *  @see CMLObject#onDestroy()
     */
    destroy(status) {
        this._destructionStatus = (status < 0) ? 0 : status;
    }
    /** Reset position, velocity, accelaration, interpolation, motion type and rotation.
     */
    reset(x_, y_, z_ = 0) {
        this._motion_type = CMLObject.MT_CONST | (this._motion_type & CMLObject.MT_PART_FLAG);
        this.setPosition(x_, y_, z_);
        this._bx = this._by = this._bz = this._ax = this._ay = this._az = this.vx = this.vy = this.vz = 0;
        this._ac = 0;
        this._head_offset = this._head = 0;
        this._rotd = 0;
        return this;
    }
    // reference
    //------------------------------------------------------------
    /** Calculate distance from another object aproximately. The distance is calculated as an octagnal.
     * @param tgt Another object to calculate distance.
     * @return Rough distance.
     */
    getDistance(tgt) {
        var dx = (this.x < tgt.x) ? (tgt.x - this.x) : (this.x - tgt.x);
        var dy = (this.y < tgt.y) ? (tgt.y - this.y) : (this.y - tgt.y);
        return (dx > dy) ? (dx + dy * 0.2928932188134524) : (dy + dx * 0.2928932188134524);
    }
    /** Calculate aiming angle to another object.
     * @param target_ Another object to calculate angle.
     * @param offx X position offset to calculate angle.
     * @param offy Y position offset to calculate angle.
     * @return Angle.
     */
    getAimingAngle(target_, offx = 0, offy = 0) {
        var sin = CMLObject._globalVariables._sin;
        var sang = sin.index(this.angleOnStage), cang = sang + sin.cos_shift, absx = this.x + sin[cang] * offx - sin[sang] * offy, absy = this.y + sin[sang] * offx + sin[cang] * offy;
        return Math.atan2(target_.y - absy, target_.x - absx) * 57.29577951308232 - CMLObject._globalVariables.scrollAngle;
    }
    /** transform object local coordinate to global coordinate
     *  @param point on local coordinate. this instance is overwritten inside.
     *  @return point on global coordinate. this instance is that you passed as argument.
     */
    transformLocalToGlobal(local) {
        var sin = CMLObject._globalVariables._sin;
        var sang = sin.index(this.angleOnStage), cang = sang + sin.cos_shift, glbx = this.x + sin[cang] * local.x - sin[sang] * local.y, glby = this.y + sin[sang] * local.x + sin[cang] * local.y;
        local.x = glbx;
        local.y = glby;
        return local;
    }
    /** transform global coordinate to object local coordinate
     *  @param point on global coordinate. this instance is overwritten inside.
     *  @return point on local coordinate. this instance is that you passed as argument.
     */
    transformGlobalToLocal(global) {
        var sin = CMLObject._globalVariables._sin;
        var sang = sin.index(-this.angleOnStage), cang = sang + sin.cos_shift, locx = sin[cang] * (global.x - this.x) - sin[sang] * (global.y - this.y), locy = sin[sang] * (global.x - this.x) + sin[cang] * (global.y - this.y);
        global.x = locx;
        global.y = locy;
        return global;
    }
    /** Count all children with access id.
     *  @return The count of child objects with access id.
     *  @see CMLObject#create()
     */
    countAllIDedChildren() {
        return this._IDedChildren.length;
    }
    /** Count children with specifyed id.
     *  @param id Access id specifyed in create() or "n*" command.
     *  @return The count of child objects with specifyed id.
     *  @see CMLObject#create()
     */
    countIDedChildren(id) {
        var count = 0, obj, key;
        for (key in this._IDedChildren) {
            obj = this._IDedChildren[key];
            count += (obj._access_id == id) ? 1 : 0;
        }
        return count;
    }
    // set parameters
    //------------------------------------------------------------
    /** Set position.
     *  @param x_ X value of position.
     *  @param y_ Y value of position.
     *  @param z_ Z value of position.
     *  @param term_ Frames for tweening with bezier interpolation.
     *  @return this object
     */
    setPosition(x_, y_, z_ = 0, term_ = 0) {
        if (term_ == 0) {
            if (this._motion_type == CMLObject.MT_GRAVITY) {
                this._rx = x_;
                this._ry = y_;
                this._rz = z_;
            }
            else {
                if (this.isPart) {
                    this._rx = x_;
                    this._ry = y_;
                    this._rz = z_;
                    this.calcAbsPosition();
                }
                else {
                    this.x = x_;
                    this.y = y_;
                    this.z = z_;
                }
                this._motion_type = CMLObject.MT_CONST | (this._motion_type & CMLObject.MT_PART_FLAG);
            }
        }
        else {
            // interlopation
            var t = 1 / term_;
            var dx, dy, dz;
            if (this.isPart) {
                dx = x_ - this._rx;
                dy = y_ - this._ry;
                dz = z_ - this._rz;
            }
            else {
                dx = x_ - this.x;
                dy = y_ - this.y;
                dz = z_ - this.z;
            }
            this._ax = (dx * t * 3 - this.vx * 2) * t * 2;
            this._ay = (dy * t * 3 - this.vy * 2) * t * 2;
            this._az = (dz * t * 3 - this.vz * 2) * t * 2;
            this._bx = (dx * t * -2 + this.vx) * t * t * 6;
            this._by = (dy * t * -2 + this.vy) * t * t * 6;
            this._bz = (dz * t * -2 + this.vz) * t * t * 6;
            this._ac = term_;
            this._motion_type = CMLObject.MT_INTERPOL | (this._motion_type & CMLObject.MT_PART_FLAG);
        }
        return this;
    }
    /** Set velocity.
     *  @param vx_ X value of velocity.
     *  @param vy_ Y value of velocity.
     *  @param vz_ Z value of velocity.
     *  @param term_ Frames for tweening with bezier interpolation.
     *  @return this object
     */
    setVelocity(vx_, vy_, vz_ = 0, term_ = 0) {
        if (term_ == 0) {
            this.vx = vx_;
            this.vy = vy_;
            this.vz = vz_;
            this._motion_type = CMLObject.MT_CONST | (this._motion_type & CMLObject.MT_PART_FLAG);
        }
        else {
            var t = 1 / term_;
            if ((this._motion_type & CMLObject.MT_PART_FILTER) == CMLObject.MT_INTERPOL) {
                // interlopation
                this._ax -= vx_ * t * 2;
                this._ay -= vy_ * t * 2;
                this._az -= vz_ * t * 2;
                this._bx += vx_ * t * t * 6;
                this._by += vy_ * t * t * 6;
                this._bz += vz_ * t * t * 6;
                this._ac = term_;
                this._motion_type = CMLObject.MT_INTERPOL | (this._motion_type & CMLObject.MT_PART_FLAG);
            }
            else {
                // accelaration
                this._ax = (vx_ - this.vx) * t;
                this._ay = (vy_ - this.vy) * t;
                this._az = (vz_ - this.vz) * t;
                this._ac = term_;
                this._motion_type = CMLObject.MT_ACCEL | (this._motion_type & CMLObject.MT_PART_FLAG);
            }
        }
        return this;
    }
    /** Set accelaration.
     *  @param ax_ X value of accelaration.
     *  @param ay_ Y value of accelaration.
     *  @param az_ Z value of accelaration.
     *  @param time_ Frames to stop accelarate. 0 means not to stop.
     *  @return this object
     */
    setAccelaration(ax_, ay_, az_, time_ = 0) {
        this._ax = ax_;
        this._ay = ay_;
        this._az = az_;
        this._ac = time_;
        if (this._ax == 0 && this._ay == 0) {
            this._motion_type = CMLObject.MT_CONST | (this._motion_type & CMLObject.MT_PART_FLAG);
        }
        else {
            this._motion_type = CMLObject.MT_ACCEL | (this._motion_type & CMLObject.MT_PART_FLAG);
        }
        return this;
    }
    /** Set interpolating motion.
     *  @param x_ X value of position.
     *  @param y_ Y value of position.
     *  @param z_ Z value of position.
     *  @param vx_ X value of velocity.
     *  @param vy_ Y value of velocity.
     *  @param vz_ Z value of velocity.
     *  @param term_ Frames for tweening with bezier interpolation.
     *  @return this object
     */
    setInterpolation(x_, y_, z_, vx_, vy_, vz_, term_ = 0) {
        if (term_ == 0) {
            this.vx = vx_;
            this.vy = vy_;
            this.vz = vz_;
            if (this.isPart) {
                this._rx = x_;
                this._ry = y_;
                this._rz = z_;
                this.calcAbsPosition();
            }
            else {
                this.x = x_;
                this.y = y_;
                this.z = z_;
            }
            this._motion_type = CMLObject.MT_CONST | (this._motion_type & CMLObject.MT_PART_FLAG);
        }
        else {
            // 3rd dimensional motion
            var t = 1 / term_;
            var dx, dy, dz;
            if (this.isPart) {
                dx = x_ - this._rx;
                dy = y_ - this._ry;
                dz = z_ - this._rz;
            }
            else {
                dx = x_ - this.x;
                dy = y_ - this.y;
                dz = z_ - this.z;
            }
            this._ax = (dx * t * 3 - this.vx * 2 - vx_) * t * 2;
            this._ay = (dy * t * 3 - this.vy * 2 - vy_) * t * 2;
            this._az = (dz * t * 3 - this.vz * 2 - vz_) * t * 2;
            this._bx = (dx * t * -2 + this.vx + vx_) * t * t * 6;
            this._by = (dy * t * -2 + this.vy + vy_) * t * t * 6;
            this._bz = (dz * t * -2 + this.vz + vz_) * t * t * 6;
            this._ac = term_;
            this._motion_type = CMLObject.MT_INTERPOL | (this._motion_type & CMLObject.MT_PART_FLAG);
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
    setChangeDirection(dir, term, rmax, shortest_rot = true) {
        if (term == 0) {
            // set head angle and set velocity to head direction
            this.setRotation(dir, 0, 1, 1, shortest_rot);
            var sin = CMLObject._globalVariables._sin;
            var sang = sin.index(this.angle), cang = sang + sin.cos_shift, spd = this.velocity;
            this.vx = sin[cang] * spd;
            this.vy = sin[sang] * spd;
        }
        else {
            // set constant rotation
            this.setConstantRotation(dir, term, rmax, shortest_rot);
            // set verocity
            if ((this._motion_type & CMLObject.MT_PART_FILTER) != CMLObject.MT_BULLETML) {
                this._ax = this.velocity;
                this._bx = 0;
                this._ac = 0;
                this._motion_type = CMLObject.MT_BULLETML | (this._motion_type & CMLObject.MT_PART_FLAG);
            }
        }
        return this;
    }
    /** &lt;changeSpeed type='absolute'&gt; of bulletML.
     *  @param spd Speed to change.
     *  @param term Frames to change speed.
     *  @return this object
     */
    setChangeSpeed(spd, term = 0) {
        if (term == 0) {
            // turn velocity vector to head direction
            var sin = CMLObject._globalVariables._sin;
            var sang = sin.index(this.angle), cang = sang + sin.cos_shift;
            this.vx = sin[cang] * spd;
            this.vy = sin[sang] * spd;
        }
        else {
            // set verocity
            this._ax = this.velocity;
            this._bx = (spd - this._ax) / term;
            this._ac = term;
            this._motion_type = CMLObject.MT_BULLETML | (this._motion_type & CMLObject.MT_PART_FLAG);
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
    setGravity(atr_a, atr_b, term = 0) {
        if (this._motion_type & CMLObject.MT_PART_FLAG)
            return this;
        if (atr_a == 0 && atr_b == 0) {
            // stop attraction
            this._ax = 0;
            this._ay = 0;
            this._az = 0;
            this._bx = 0;
            this._by = 0;
            this._bz = 0;
            this._ac = 0;
            this._motion_type = CMLObject.MT_CONST;
        }
        else {
            // attraction
            this._bx = atr_a * 0.01;
            this._by = atr_b * 0.01;
            this._ac = term;
            this._rx = this.x;
            this._ry = this.y;
            this._rz = this.z;
            this._motion_type = CMLObject.MT_GRAVITY;
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
    setRotation(end_angle, term = 0, start_t = 1, end_t = 1, isShortestRotation = true) {
        // calculate shotest rotation
        var diff;
        if (isShortestRotation) {
            this._normalizeHead();
            diff = (end_angle - this.angleOnStage + 180) * 0.00277777777777777778;
            diff = (diff - Math.floor(diff)) * 360 - 180;
        }
        else {
            diff = end_angle - this.angleOnStage;
        }
        if (term == 0) {
            this._head += diff;
            this._rott = 0;
            this._rotd = 0;
        }
        else {
            // rotating interpolation
            this._roti.setFergusonCoons(this._head, this._head + diff, diff * start_t, diff * end_t);
            this._rott = 0;
            this._rotd = 1 / term;
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
    setConstantRotation(end_angle, term = 0, rmax = 1, isShortestRotation = true) {
        // rotation max
        rmax *= (term == 0) ? 1 : term;
        // calculate shotest rotation
        var diff;
        if (isShortestRotation) {
            this._normalizeHead();
            diff = (end_angle - this.angleOnStage + 180) * 0.00277777777777777778;
            diff = (diff - Math.floor(diff)) * 360 - 180;
        }
        else {
            diff = end_angle - this.angleOnStage;
        }
        // restriction
        if (rmax != 0) {
            if (diff < -rmax)
                diff = -rmax;
            else if (diff > rmax)
                diff = rmax;
        }
        if (term == 0) {
            this._head += diff;
            this._rott = 0;
            this._rotd = 0;
        }
        else {
            this._roti.setLinear(this._head, this._head + diff);
            this._rott = 0;
            this._rotd = 1 / term;
        }
        return this;
    }
    /** Change parent. */
    changeParent(parent_ = null, isPart_ = false, access_id_ = CMLObject.ID_NOT_SPECIFYED) {
        // check parent availability
        isPart_ = (parent_ != null) && isPart_;
        // remove this from a parents IDed children list.
        if (this._access_id != CMLObject.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.splice(this._parent._IDedChildren.indexOf(this), 1);
        }
        // when this WAS a part object ...
        if (this.isPart) {
            // check parents parts
            this._parent._partChildren.splice(this._parent._partChildren.indexOf(this), 1);
            // calculate absolute angle
            this._head = this._parent.angleOnStage + this._head;
        }
        // change parameters
        this._parent = parent_ || CMLObject._root;
        this._parent_id = this._parent._id;
        this._access_id = (parent_) ? access_id_ : CMLObject.ID_NOT_SPECIFYED;
        if (access_id_ != CMLObject.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.push(this);
        }
        // when this WILL BE a part object ...
        if (isPart_) {
            // repush active object list
            _repush(this);
            // register this on parent parts list.
            this._parent._partChildren.push(this);
            // change parts flag
            this._motion_type |= CMLObject.MT_PART_FLAG;
            // calculate related position
            this.calcRelatedPosition();
            // calculate related angle
            this._head = this._head - this._parent.angleOnStage;
        }
        else {
            // change parts flag
            this._motion_type &= CMLObject.MT_PART_FILTER;
        }
        // refrective funciton
        function _repush(obj) {
            var key;
            obj.remove_from_list();
            CMLObject._activeObjects.push(obj);
            for (key in obj._partChildren) {
                var part = obj._partChildren[key];
                _repush(part);
            }
        }
    }
    // calculate the angleOnStage in a range of -180 to 180.
    _normalizeHead() {
        var offset = (this._motion_type & CMLObject.MT_PART_FLAG) ? (this._head_offset + this._parent.angleOnStage) : (this._head_offset);
        this._head += 180 - offset;
        this._head *= 0.00277777777777777778;
        this._head = (this._head - Math.floor(this._head)) * 360 - 180 + offset;
    }
    // execute in each frame when it's necessary
    //------------------------------------------------------------
    /** Calculate absolute position when the isPart is true.
     *  The protected function _motion_parts() is a typical usage of this.
     */
    calcAbsPosition() {
        var parent_angle = this.angleParentOnStage;
        if (parent_angle != 0) {
            var sin = CMLObject._globalVariables._sin, sang = sin.index(parent_angle), cang = sang + sin.cos_shift;
            this.x = this._parent.x + sin[cang] * this._rx - sin[sang] * this._ry;
            this.y = this._parent.y + sin[sang] * this._rx + sin[cang] * this._ry;
            this.z = this._parent.z + this._rz;
        }
        else {
            this.x = this._parent.x + this._rx;
            this.y = this._parent.y + this._ry;
            this.z = this._parent.z + this._rz;
        }
    }
    /** Calculate parent related position from absolute position.
     */
    calcRelatedPosition() {
        var parent_angle = this.angleParentOnStage;
        if (parent_angle != 0) {
            var sin = CMLObject._globalVariables._sin, sang = sin.index(-parent_angle), cang = sang + sin.cos_shift, dx = this.x - this._parent.x, dy = this.y - this._parent.y, dz = this.z - this._parent.z;
            this._rx = sin[cang] * dx - sin[sang] * dy;
            this._ry = sin[sang] * dx + sin[cang] * dy;
            this._rz = dz;
        }
        else {
            this._rx = this.x - this._parent.x;
            this._ry = this.y - this._parent.y;
            this._rz = this.z - this._parent.z;
        }
    }
    /** Rotate haed in 1 frame, if rotd &gt; 0. The _motion() is a typical usage exapmle. @see CMLObject#_motion()*/
    rotateHead() {
        this._rott += this._rotd;
        if (this._rott >= 1) {
            this._rott = 1;
            this._rotd = 0;
        }
        this._head = this._roti.calc(this._rott);
    }
    // operation for children/parts
    //------------------------------------------------------------
    /** Find first child object with specifyed id.
     *  @param id Access id specifyed in create() or "n*" command.
     *  @return The first child object with specifyed id. Return null when the seach was failed.
     *  @see CMLObject#create()
     */
    findChild(id) {
        var key, obj;
        for (key in this._IDedChildren) {
            obj = this._IDedChildren[key];
            if (obj._access_id == id)
                return obj;
        }
        return null;
    }
    /** Find all child and callback. <br/>
     *  @param id Access id specifyed in create() or "n*" command.
     *  @param func The call back function to operate objects. The type is function(obj:CMLObject):Boolean. Stop finding when this returns true.
     *  @return The count of the executions of call back function.
     *  @see CMLObject#create()
     */
    findAllChildren(id, func) {
        var count = 0, key, obj;
        for (key in this._IDedChildren) {
            obj = this._IDedChildren[key];
            if (obj._access_id == id) {
                ++count;
                if (func(obj))
                    break;
            }
        }
        return count;
    }
    /** Find all parts and callback. <br/>
     *  @param func The call back function to operate objects. The type is function(obj:CMLObject):Boolean. Stop finding when this returns true.
     *  @return The count of the executions of call back function.
     *  @see CMLObject#create()
     */
    findAllParts(func) {
        var key, count = 0;
        for (key in this._partChildren) {
            var obj = this._partChildren[key];
            ++count;
            if (func(obj))
                break;
        }
        return count;
    }
    // back door ...
    /** @private _cml_internal */ _getX() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._rx : this.x; }
    /** @private _cml_internal */ _getY() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._ry : this.y; }
    /** @private _cml_internal */ _getZ() { return (this._motion_type & CMLObject.MT_PART_FLAG) ? this._rz : this.z; }
    /** @private _cml_internal */ _getAx() {
        var filterd_mt = this._motion_type & CMLObject.MT_PART_FILTER;
        return (filterd_mt == CMLObject.MT_CONST || filterd_mt == CMLObject.MT_BULLETML) ? 0 : this._ax;
    }
    /** @private _cml_internal */ _getAy() {
        var filterd_mt = this._motion_type & CMLObject.MT_PART_FILTER;
        return (filterd_mt == CMLObject.MT_CONST || filterd_mt == CMLObject.MT_BULLETML) ? 0 : this._ay;
    }
    /** @private _cml_internal */ _getAz() {
        var filterd_mt = this._motion_type & CMLObject.MT_PART_FILTER;
        return (filterd_mt == CMLObject.MT_CONST || filterd_mt == CMLObject.MT_BULLETML) ? 0 : this._az;
    }
    // initialize and finalize
    //------------------------------------------------------------
    /** @private initializer */
    _initialize(parent_, isPart_, access_id_, x_, y_, vx_, vy_, head_) {
        // clear some parameters
        this.vx = vx_;
        this.vy = vy_;
        this.vz = 0;
        this._head = head_;
        this._head_offset = 0;
        this._rotd = 0;
        this._destructionStatus = -1;
        // set the relations
        this._parent = parent_;
        this._parent_id = this._parent._id;
        this._IDedChildren.length = 0;
        this._partChildren.length = 0;
        // add this to the parent id list
        this._access_id = access_id_;
        if (access_id_ != CMLObject.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.push(this);
        }
        // push the active objects list, initialize position and motion.
        if (isPart_) {
            this._parent._partChildren.push(this);
            this._rx = x_;
            this._ry = y_;
            this._rz = 0;
            this.calcAbsPosition();
            this._motion_type = CMLObject.MT_PART_CONST;
        }
        else {
            this.x = x_;
            this.y = y_;
            this.z = 0;
            this._motion_type = CMLObject.MT_CONST;
        }
        CMLObject._activeObjects.push(this);
        // callback
        this.onCreate();
        return this;
    }
    /** @private finalizer */
    _finalize() {
        if (this.parent != CMLObject._root) {
            // remove this from the parent id list.
            if (this._access_id != CMLObject.ID_NOT_SPECIFYED) {
                this._parent._IDedChildren.splice(this._parent._IDedChildren.indexOf(this), 1);
            }
            // check parents parts
            if (this.isPart) {
                this._parent._partChildren.splice(this._parent._partChildren.indexOf(this), 1);
            }
        }
        // destroy all parts
        var key;
        for (key in this._partChildren) {
            var obj = this._partChildren[key];
            obj._destructionStatus = this._destructionStatus;
        }
        // callback
        this.onDestroy();
        // remove from list
        this.remove_from_list();
        // update construction id
        this._parent = null;
        this._id++;
    }
    // update 
    //------------------------------------------------------------
    /** update position and angle */
    update() {
        var sin = CMLObject._globalVariables._sin, sang, cang;
        switch (this._motion_type) {
            case CMLObject.MT_CONST: {
                this.x += this.vx;
                this.y += this.vy;
                this.z += this.vz;
                break;
            }
            case CMLObject.MT_ACCEL: {
                this.x += this.vx + this._ax * 0.5;
                this.y += this.vy + this._ay * 0.5;
                this.z += this.vz + this._az * 0.5;
                this.vx += this._ax;
                this.vy += this._ay;
                this.vz += this._az;
                if (--this._ac == 0)
                    this._motion_type = CMLObject.MT_CONST;
                break;
            }
            case CMLObject.MT_INTERPOL: {
                this.x += this.vx + this._ax * 0.5 + this._bx * 0.16666666666666667;
                this.y += this.vy + this._ay * 0.5 + this._by * 0.16666666666666667;
                this.z += this.vz + this._az * 0.5 + this._bz * 0.16666666666666667;
                this.vx += this._ax + this._bx * 0.5;
                this.vy += this._ay + this._by * 0.5;
                this.vz += this._az + this._bz * 0.5;
                this._ax += this._bx;
                this._ay += this._by;
                this._az += this._bz;
                if (--this._ac == 0)
                    this._motion_type = CMLObject.MT_CONST;
                break;
            }
            case CMLObject.MT_BULLETML: {
                sang = sin.index(this.angle);
                cang = sang + sin.cos_shift;
                this.vx = sin[cang] * this._ax;
                this.vy = sin[sang] * this._ax;
                this._ax += this._bx;
                this.x += this.vx;
                this.y += this.vy;
                this.z += this.vz;
                if (--this._ac == 0)
                    this._bx = 0;
                if (this._rotd == 0 && this._bx == 0)
                    this._motion_type = CMLObject.MT_CONST;
                break;
            }
            case CMLObject.MT_GRAVITY: {
                this._ax = (this._rx - this.x) * this._bx - this.vx * this._by,
                    this._ay = (this._ry - this.y) * this._bx - this.vy * this._by;
                this._az = (this._rz - this.z) * this._bx - this.vz * this._by;
                this.x += this.vx + this._ax * 0.5;
                this.y += this.vy + this._ay * 0.5;
                this.z += this.vz + this._az * 0.5;
                this.vx += this._ax;
                this.vy += this._ay;
                this.vz += this._az;
                if (--this._ac == 0)
                    this._motion_type = CMLObject.MT_CONST;
                break;
            }
            case CMLObject.MT_PART_CONST: {
                this._rx += this.vx;
                this._ry += this.vy;
                this._rz += this.vz;
                this.calcAbsPosition();
                break;
            }
            case CMLObject.MT_PART_ACCEL: {
                this._rx += this.vx + this._ax * 0.5;
                this._ry += this.vy + this._ay * 0.5;
                this._rz += this.vz + this._az * 0.5;
                this.vx += this._ax;
                this.vy += this._ay;
                this.vz += this._az;
                this.calcAbsPosition();
                if (--this._ac == 0)
                    this._motion_type = CMLObject.MT_PART_CONST;
                break;
            }
            case CMLObject.MT_PART_INTERPOL: {
                this._rx += this.vx + this._ax * 0.5 + this._bx * 0.16666666666666667;
                this._ry += this.vy + this._ay * 0.5 + this._by * 0.16666666666666667;
                this._rz += this.vz + this._az * 0.5 + this._bz * 0.16666666666666667;
                this.vx += this._ax + this._bx * 0.5;
                this.vy += this._ay + this._by * 0.5;
                this.vz += this._az + this._bz * 0.5;
                this._ax += this._bx;
                this._ay += this._by;
                this._az += this._bz;
                this.calcAbsPosition();
                if (--this._ac == 0)
                    this._motion_type = CMLObject.MT_PART_CONST;
                break;
            }
            case CMLObject.MT_PART_BULLETML: {
                sang = sin.index(this.angle);
                cang = sang + sin.cos_shift;
                this.vx = sin[cang] * this._ax;
                this.vy = sin[sang] * this._ax;
                this._ax += this._bx;
                this._rx += this.vx;
                this._ry += this.vy;
                this._rz += this.vz;
                this.calcAbsPosition();
                if (--this._ac == 0)
                    this._bx = 0;
                if (this._rotd == 0 && this._bx == 0)
                    this._motion_type = CMLObject.MT_PART_CONST;
                break;
            }
            default:
                break;
        }
        if (this._rotd != 0)
            this.rotateHead();
        this.onUpdate();
    }
}
// public constant values
//------------------------------------------------------------
/** @private Flag for parts motions. */
CMLObject.MT_PART_FLAG = 8;
/** @private Filter for parts motions. */
CMLObject.MT_PART_FILTER = CMLObject.MT_PART_FLAG - 1;
// enum for motion
/** Number for CMLObject.motion_type, Linear motion. */
CMLObject.MT_CONST = 0;
/** Number for CMLObject.motion_type, Accelarating motion. */
CMLObject.MT_ACCEL = 1;
/** Number for CMLObject.motion_type, 3D-Bezier interpolating motion. */
CMLObject.MT_INTERPOL = 2;
/** Number for CMLObject.motion_type, BulletML compatible motion. */
CMLObject.MT_BULLETML = 3;
/** Number for CMLObject.motion_type, Gravity motion. */
CMLObject.MT_GRAVITY = 4;
/** Number for CMLObject.motion_type, Linear motion of parts. */
CMLObject.MT_PART_CONST = CMLObject.MT_CONST | CMLObject.MT_PART_FLAG;
/** Number for CMLObject.motion_type, Accelarating motion of parts. */
CMLObject.MT_PART_ACCEL = CMLObject.MT_ACCEL | CMLObject.MT_PART_FLAG;
/** Number for CMLObject.motion_type, 3D-Bezier interpolating motion of parts. */
CMLObject.MT_PART_INTERPOL = CMLObject.MT_INTERPOL | CMLObject.MT_PART_FLAG;
/** Number for CMLObject.motion_type, BulletML compatible motion of parts. */
CMLObject.MT_PART_BULLETML = CMLObject.MT_BULLETML | CMLObject.MT_PART_FLAG;
// private variables
//------------------------------------------------------------
// statics
CMLObject._activeObjects = new CMLList(); // active object list
CMLObject._root = null; // root object instance
CMLObject._globalVariables = null; // gloabal variables
// enum for relation
CMLObject.NO_RELATION = 0;
CMLObject.REL_ATTRACT = 1;
/** @private _cml_internal */
CMLObject.ID_NOT_SPECIFYED = 0;
