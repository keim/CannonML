//----------------------------------------------------------------------------------------------------
// CML object class
//  Copyright (c) 2007 keim All rights reserved.
//  Distributed under BSD-style license (see license.txt).
//----------------------------------------------------------------------------------------------------
//import CML.List from "./CML.List.js";
//import CML.ListElem from "./CML.ListElem.js";
//import CML.Vector from "./CML.Vector.js"
//import interpolation from "./interpolation.js";
/** <b>Basic class for all objects.</b>
 * @see CML.Object#initialize()
 * @see CML.Object#update()
 * @see CML.Object#setAsDefaultTarget()
 * @see CML.Object#execute()
 * @see CML.Object#create()
 * @see CML.Object#root
 * @see CML.Sequence
 */
CML.Object = class extends CML.ListElem {
    // constructor
    //------------------------------------------------------------
    /** Constructor. */
    constructor() {
        super();
        // public variables
        //------------------------------------------------------------
        this.pos = new CML.Vector();
        this.vel = new CML.Vector();
        this.acc = new CML.Vector();
        this.bez = new CML.Vector();
        this.relative = new CML.Vector();
        this.projected = new CML.Vector();
        this.euler = new CML.Vector();
        this.quat = new CML.Vector();
        this.euler.changed = false;
        this.quat.w = 1;
        this.counter = 0;
        this.bmlVelocity = 0;
        this.bmlAccel = 0;
        // common parameters
        this._id = 0; // construction id
        this._parent = null; // parent object
        this._parent_id = 0; // parent object id
        this._access_id = CML.Object.ID_NOT_SPECIFYED; // access id
        this._destructionStatus = -1; // destruction status
        this._IDedChildren = []; // children list that has access id
        this._partChildren = []; // children list that is part of this
        this._motion_type = CML.Object.MT_CONST; // motion type
        this._age = 0; // age in frame
        // rotation
        this._roti = new CML.interpolation(); // rotation CML.interpolation
        this._rott = 0; // rotation parameter
        this._rotd = 0; // rotation parameter increament
    }
    // public properties
    //------------------------------------------------------------
    // static properties
    /** root object is the default parent of all CML.Objects that are created with the argument of parent=null. */
    static get root() { return CML.Object._root; }
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
    /** The CML.Object that creates this object. Returns root when the parent was destroyed. */
    get parent() {
        if (this._parent._id != this._parent_id) {
            this._parent = CML.Object._root;
            this._parent_id = this._parent._id;
            this._access_id = CML.Object.ID_NOT_SPECIFYED;
        }
        return this._parent;
    }
    /** Motion type.
     * @see CML.Object#MT_CONST
     * @see CML.Object#MT_ACCEL
     * @see CML.Object#MT_INTERPOL
     * @see CML.Object#MT_BULLETML
     * @see CML.Object#MT_GRAVITY
     */
    get motion_type() { return this._motion_type; }
    /** Is this object on stage ? */
    get isActive() { return (this._parent != null); }
    /** Is this object a part of its parent ? The part object's position is relative to parent's position. */
    get isPart() { return Boolean(this._motion_type & CML.Object.MT_PART_FLAG); }
    /** Is this object bulletML mode. */
    get isBMLMode() { return (this._motion_type & CML.Object.MT_PART_FILTER) == CML.Object.MT_BULLETML; }
    /** Does this object have another object as a part ? */
    get hasParts() { return (this._partChildren.length != 0); }
    /** You can define the "$r" value for each object by overriding this property, Ussualy returns CML.Global.getRank(0). @see CML.Global#getRank */
    get rank() { return CML.Object._globalVariables.getRank(0); }
    set rank(r) { CML.Object._globalVariables.setRank(0, r); }
    /** age in frames */
    get age() { return this._age; }
    /** Destruction status. You can refer the argument of destroy() or the '&#64;ko' command. Returns -1 when the object isn't destroyed.
     *  @see CML.Object#onDestroy()
     *  @see CML.Object#destroy()
     *  @see CML.Object#destroyAll()
     */
    get destructionStatus() { return this._destructionStatus; }
    /** The x value of position parent related */
    get relatedX() { return (this.isPart) ? this.relative.x : this.pos.x; }
    /** The y value of position parent related */
    get relatedY() { return (this.isPart) ? this.relative.y : this.pos.y; }
    /** The z value of position parent related */
    get relatedZ() { return (this.isPart) ? this.relative.z : this.pos.z; }
    // velocity
    /** Absolute value of velocity. */
    get velocity() { return (this.isBMLMode) ? this.bmlVelocity : this.vel.length(); }
    set velocity(vel) {
        if (this.isBMLMode) 
            this.bmlVelocity = vel;
        else 
            this.vel.setLength(vel);
    }
    // angles
    /** Angle of this object, scrolling direction is 0 degree. */
    get angle() { 
        return this.angleOnScreen + CML.Object._globalVariables._scrollRadian;
    }
    set angle(ang) {
        this.angleOnScreen = ang - CML.Object._globalVariables._scrollRadian;
    }
    /** Angle of this object, The direction(1,0) is 0 degree. */
    get angleOnScreen() { 
        return this.angleParentOnScreen + this.head;
    }
    set angleOnScreen(ang) {
        this.head = ang - this.angleParentOnScreen;
    }
    /** Angle of this parent object, scrolling direction is 0 degree. */
    get angleParentOnScreen() {
        return (this.isPart) ? this._parent.angleOnScreen : 0;
    }
    /** Calculate direction of position from origin. */
    get anglePositionOnScreen() {
        if (this.isPart) {
            const dx = this.projected.x - this._parent.projected.x,
                  dy = this.projected.y - this._parent.projected.y;
            return Math.atan2(dy, dx);                  
        }
        return Math.atan2(this.projected.y, this.projected.x);
    }
    /** Calculate direction of velocity. */
    get angleVelocityOnScreen() {
        return (this.isBMLMode) ? this.angleOnScreen : Math.atan2(this.vel.y, this.vel.x);
    }
    /** Calculate direction of accelaration. */
    get angleAccelOnScreen() { 
        return (this.isBMLMode) ? this.angleOnScreen : Math.atan2(this.acc.y, this.acc.x);
    }
    /** rotation */
    get head()  {
        return this.euler.z;
    }
    set head(r) {
        this.euler.z = r;
        this.euler.changed = true;
    }
    get pitch() {
        return this.euler.y;
    }
    set pitch(r){
        this.euler.y = r;
        this.euler.changed = true;
    }
    get bank()  {
        return this.euler.x;
    }
    set bank(r) {
        this.euler.x = r;
        this.euler.changed = true;
    }
    // callback functions
    //------------------------------------------------------------
    /** Callback function on create. Override this to initialize.*/
    onCreate() {
    }
    /** Callback function on destroy. Override this to finalize.
     *  @see CML.Object#destroy()
     *  @see CML.Object#destroyAll()
     */
    onDestroy() {
    }
    /** Callback function from CML.Object.update(). This function is called after updating position. Override this to update own parameters.*/
    onUpdate() {
    }
    /** Statement "f" calls this when it needs. Override this to define the new CML.Object created by "f" command.
     *  @param args The arguments of sequence.
     *  @return The new CML.Object created by "n" command. You must not activate(call create()) returning CML.Object.
     */
    onFireObject(seq) {
        return null;
    }
    // static functions
    //------------------------------------------------------------
    /** Destroy all active objects except for root. This function <b>must not</b> be called from onDestroy().
     *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by destructionStatus in onDestroy().
     *  @see CML.Object#destructionStatus
     *  @see CML.Object#onDestroy()
     */
    static destroyAll(status) {
        let elem = CML.Object._activeObjects.begin, elem_next;
        while (elem != CML.Object._activeObjects.end) {
            // CML.Object(elem).destroy(_destructionStatus);
            elem_next = elem.next;
            elem._destructionStatus = status;
            elem._finalize();
            elem = elem_next;
        }
    }
    /** @private initialize call from CannonML.initialize */
    static _initialize(globalVariables_, _rootObject) {
        CML.Object._globalVariables = globalVariables_;
        CML.Object._root = _rootObject || new CML.Object();
        CML.Object.destroyAll(-1);
        CML.Object._root.create(0, 0, CML.Object._root);
    }
    /** @private update all call from CannonML.update */
    static _updateAll() {
        if (CML.Object._activeObjects.isEmpty()) return;
        let object, elem = CML.Object._activeObjects.begin;
        while (elem != CML.Object._activeObjects.end) {
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
     *  @param x         X value of this object on a stage or parent(if its a part of parent).
     *  @param y         Y value of this object on a stage or parent(if its a part of parent).
     *  @param parent_    The instance of parent object. Pass null to set this object as a child of root.
     *  @param isPart_    True to set this object as a part of parent.
     *  @param access_id Access ID from parent.
     *  @return this instance.
     */
    create(x, y, parent = null, isPart = false, access_id = CML.Object.ID_NOT_SPECIFYED) {
        if (this.isActive)
            throw new Error("CML.Object.create() must be called from inactive CML.Object.");
        this._initialize(parent || CML.Object._root, isPart, access_id, x, y, 0, 0, 0);
        return this;
    }
    /** Destroy this object. The onDestroy() is called when the next CML.Object.update().
     *  @param status A value of the destruction status. This must be greater than or equal to 0. You can refer this by CML.Object.destructionStatus in onDestroy().
     *  @see CML.Object#destructionStatus
     *  @see CML.Object#onDestroy()
     */
    destroy(status) {
        this._destructionStatus = (status < 0) ? 0 : status;
    }
    /** Reset position, velocity, accelaration, interpolation, motion type and rotation.
     */
    reset(x, y, z = 0) {
        this._motion_type = CML.Object.MT_CONST | (this._motion_type & CML.Object.MT_PART_FLAG);
        this.setPosition(x, y, z); // pos, relative, projected
        this.vel.setScaler(0);
        this.acc.setScaler(0);
        this.bez.setScaler(0);
        this.euler.setScaler(0);
        this.quat.setScaler(0);
        this.counter = 0;
        this.bmlVelocity = 0;
        this.bmlAccel = 0;
        this._rotd = 0;
        return this;
    }
    // reference
    //------------------------------------------------------------
    /** Calculate distance from another object.
     * @param target Another object to calculate distance.
     * @return distance.
     */
    getDistance(target) {
        return this.projected.distanceTo(target.projected);
    }
    /** Calculate aiming angle to another object.
     * @param target Another object to calculate angle.
     * @param offx X position offset to calculate angle.
     * @param offy Y position offset to calculate angle.
     * @return Angle.
     */
    getAimingAngleOnScreen(target, offx = 0, offy = 0) {
        const vec2 = this._calcFiberPosition(offx, offy);
        return Math.atan2(target.projected.y - vec2.y, target.projected.x - vec2.x);
    }
    /** Count all children with access id.
     *  @return The count of child objects with access id.
     *  @see CML.Object#create()
     */
    countAllIDedChildren() {
        return this._IDedChildren.length;
    }
    /** Count children with specifyed id.
     *  @param id Access id specifyed in create() or "n*" command.
     *  @return The count of child objects with specifyed id.
     *  @see CML.Object#create()
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
    _changeMotionType(type) {
        this._motion_type = type | (this._motion_type & CML.Object.MT_PART_FLAG);
    }
    /** Set position.
     *  @param x X value of position.
     *  @param y Y value of position.
     *  @param z Z value of position.
     *  @param frames Frames for tweening with bezier interpolation.
     *  @return this object
     */
    setPosition(x, y, z, frames=0) {
        if (frames == 0) {
            if (this._motion_type == CML.Object.MT_GRAVITY) {
                this.relative.set(x, y, z);
            }
            else {
                if (this.isPart) {
                    this.relative.set(x, y, z);
                    this.calcAbsPosition();
                }
                else {
                    this.pos.set(x, y, z);
                }
                this._changeMotionType(CML.Object.MT_CONST);
            }
        }
        else {
            // interlopation
            //this._ax = (v.x * t * 3 - this.vx * 2) * t * 2;
            //this._bx = (v.x * t * -2 + this.vx) * t * t * 6;
            const t = 1 / frames;
            const v = new CML.Vector(x,y,z).sub((this.isPart) ? this.relative : this.pos);
            this.acc.copy(v).multiplyScalar(t*t*6).addScaledVector(this.vel,-t*4);
            this.bez.copy(v).multiplyScalar(t*t*t*-12).addScaledVector(this.vel,t*t*6);
            this.counter = frames;
            this._changeMotionType(CML.Object.MT_INTERPOL);
        }
        return this;
    }
    setPositionX(x, frames=0) { return this.setPosition(x, this._getY(), this._getZ(), frames); }
    setPositionY(y, frames=0) { return this.setPosition(this._getX(), y, this._getZ(), frames); }
    setPositionZ(z, frames=0) { return this.setPosition(this._getX(), this._getY(), z, frames); }
    setPositionByDirection(angle, v, h, frames=0) { 
        const sin = Math.sin(angle), cos = Math.cos(angle);
        return this.setPosition(cos*v-sin*h, sin*v+cos*h, this._getZ(), frames);
    }
    /** Set velocity.
     *  @param vx X value of velocity.
     *  @param vy Y value of velocity.
     *  @param vz Z value of velocity.
     *  @param frames Frames for tweening with bezier interpolation.
     *  @return this object
     */
    setVelocity(vx=0, vy=0, vz=0, frames=0) {
        if (frames == 0) {
            this.vel.set(vx, vy, vz);
            this._motion_type = CML.Object.MT_CONST | (this._motion_type & CML.Object.MT_PART_FLAG);
        }
        else {
            const t = 1 / frames;
            const v = new CML.Vector(vx, vy, vz);
            if ((this._motion_type & CML.Object.MT_PART_FILTER) == CML.Object.MT_INTERPOL) {
                // interlopation
                //this._ax -= vx * t * 2;
                //this._bx += vx * t * t * 6;
                this.acc.addScaledVector(v,-t*2);
                this.bez.addScaledVector(v, t*t*6);
                this.counter = frames;
                this._changeMotionType(CML.Object.MT_INTERPOL);
            }
            else {
                // accelaration
                //this._ax = (vx - this.vx) * t;
                this.acc.copy(v).sub(this.vel).multiplyScalar(t);
                this.counter = frames;
                this._changeMotionType(CML.Object.MT_ACCEL);
            }
        }
        return this;
    }
    setVelocityX(x, frames=0) { return this.setVelocity(x, this.vel.y, this.vel.z, frames); }
    setVelocityY(y, frames=0) { return this.setVelocity(this.vel.x, y, this.vel.z, frames); }
    setVelocityZ(z, frames=0) { return this.setVelocity(this.vel.x, this.vel.y, z, frames); }
    setVelocityByDirection(angle, v, h, frames=0) { 
        const sin = Math.sin(angle), cos = Math.cos(angle);
        return this.setVelocity(cos*v-sin*h, sin*v+cos*h, this._getZ(), frames);
    }
    /** Set accelaration.
     *  @param ax X value of accelaration.
     *  @param ay Y value of accelaration.
     *  @param az Z value of accelaration.
     *  @param frames Frames to stop accelarate. 0 means not to stop.
     *  @return this object
     */
    setAccel(ax=0, ay=0, az=0, frames=0) {
        this.acc.set(ax, ay, az);
        this.counter = frames;
        this._changeMotionType((ax==0 && ay==0 && az==0) ? CML.Object.MT_CONST : CML.Object.MT_ACCEL);
        return this;
    }
    setAccelX(x, frames=0) { return this.setAccel(x, this._getAy(), this._getAz(), frames); }
    setAccelY(y, frames=0) { return this.setAccel(this._getAx(), y, this._getAz(), frames); }
    setAccelZ(z, frames=0) { return this.setAccel(this._getAx(), this._getAy(), z, frames); }
    setAccelByDirection(angle, v, h, frames=0) { 
        const sin = Math.sin(angle), cos = Math.cos(angle);
        return this.setAccel(cos*v-sin*h, sin*v+cos*h, this._getAz(), frames);
    }
    /** &lt;changeDirection type='absolute'&gt; of bulletML.
     *  @param dir Direction to change.
     *  @param frames Frames to change direction.
     *  @param rmax Maxmum speed of rotation [radians/frame].
     *  @param shortest_rot Flag to rotate on shortest rotation.
     *  @return this object
     */
    setChangeDirection(dir, frames, rmax, shortest_rot = true) {
        this.setConstantRotation(dir, frames, rmax, shortest_rot);
        this.bmlVelocity = this.velocity;
        this.bmlAccel = 0;
        this.conter = 0;
        this._changeMotionType(CML.Object.MT_BULLETML);
        return this;
    }
    /** &lt;changeSpeed type='absolute'&gt; of bulletML.
     *  @param speed Speed to change.
     *  @param frames Frames to change speed.
     *  @return this object
     */
    setChangeSpeed(speed, frames = 0) {
        if (frames == 0) {
            // turn velocity vector to head direction
            this.bmlVelocity = speed;
            this.bmlAccel = 0;
            this.conter = 0;
        }
        else {
            // set verocity
            this.bmlVelocity = this.velocity;
            this.bmlAccel = (speed - this.velocity) / frames;
            this.conter = frames;
        }
        this._changeMotionType(CML.Object.MT_BULLETML);
        return this;
    }
    /** Set gravity motion.
     *  <p>
     *  <b>This function is not available for a part of parent.</b>
     *  After this function, the CML.Object.setPosition() sets the gravity center.
     *  The calculation of the motion is below.<br/>
     *  [accelaration] = [distance] * [atr_a] / 100 - [velocity] * [atr_b] / 100<br/>
     *  </p>
     *  @param atr_a Attracting parameter a[%]. Ratio of attracting force.
     *  @param atr_b Attracting parameter b[%]. Ratio of air fliction.
     *  @param frames Frames to enable attracting force.
     *  @return this object
     *  @see CML.Object#setPosition
     */
    setGravity(atr_a, atr_b, frames = 0) {
        if (this.isPart)
            return this;
        if (atr_a == 0 && atr_b == 0) {
            // stop attraction
            this.acc.setScaler(0);
            this.bez.setScaler(0);
            this.counter = 0;
            this._motion_type = CML.Object.MT_CONST;
        }
        else {
            // attraction
            this.acc.setScaler(0);
            this.bez.setScaler(0);
            this.counter = 0;
            this.bez.x = atr_a * 0.01;
            this.bez.y = atr_b * 0.01;
            this.counter = frames;
            this.relative.copy(this.pos);
            this._motion_type = CML.Object.MT_GRAVITY;
        }
        return this;
    }
    /** Set rotation. You can specify the first and last speed.
     *  @param end_angle Final angle when the rotation finished, based on scrolling direction.
     *  @param frames Frames to rotate.
     *  @param start_t Ratio of first rotating speed. The value of 1 means the speed of a constant rotation.
     *  @param end_t Ratio of last rotating speed. The value of 1 means the speed of a constant rotation.
     *  @param isShortestRotation Rotate with shortest rotation or not.
     *  @return this object
     */
    setRotation(end_angle, frames = 0, start_t = 1, end_t = 1, isShortestRotation = true) {
        // calculate shotest rotation
        let diff;
        if (isShortestRotation) {
            this._normalizeHead();
            diff = (end_angle - this.angleOnScreen) / (Math.PI * 2) + 0.5;
            diff = (diff - Math.floor(diff) - 0.5) * Math.PI * 2;
        }
        else {
            diff = end_angle - this.angleOnScreen;
        }
        if (frames == 0) {
            this.head += diff;
            this._rott = 0;
            this._rotd = 0;
        }
        else {
            // rotating interpolation
            this._roti.setFergusonCoons(this.head, this.head + diff, diff * start_t, diff * end_t);
            this._rott = 0;
            this._rotd = 1 / frames;
        }
        return this;
    }
    /** Set constant rotation. You can specify the maximum speed.
     *  @param end_angle Final angle when the rotation finished, based on scrolling direction.
     *  @param frames Frames to rotate.
     *  @param rmax Maximum speed of rotation [radians/frame].
     *  @param isShortestRotation Rotate with shortest rotation or not.
     *  @return this object
     */
    setConstantRotation(end_angle, frames = 0, rmax = 1, isShortestRotation = true) {
        // rotation max
        rmax *= (frames == 0) ? 1 : frames;
        // calculate shotest rotation
        var diff;
        if (isShortestRotation) {
            this._normalizeHead();
            diff = (end_angle - this.angleOnScreen) / (Math.PI * 2) + 0.5;
            diff = (diff - Math.floor(diff) - 0.5) * Math.PI * 2;
        }
        else {
            diff = end_angle - this.angleOnScreen;
        }
        // restriction
        if (rmax != 0) 
            diff = (diff < -rmax) ? -rmax : (diff > rmax) ? rmax : diff;
        if (frames == 0) {
            this.head += diff;
            this._rott = 0;
            this._rotd = 0;
        }
        else {
            this._roti.setLinear(this.head, this.head + diff);
            this._rott = 0;
            this._rotd = 1 / frames;
        }
        return this;
    }
    /** Change parent. */
    changeParent(parent_ = null, isPart_ = false, access_id = CML.Object.ID_NOT_SPECIFYED) {
        // check parent availability
        isPart_ = (parent_ != null) && isPart_;
        // remove this from a parents IDed children list.
        if (this._access_id != CML.Object.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.splice(this._parent._IDedChildren.indexOf(this), 1);
        }
        // when this WAS a part object ...
        if (this.isPart) {
            // check parents parts
            this._parent._partChildren.splice(this._parent._partChildren.indexOf(this), 1);
            // calculate absolute angle
            this.head = this.angleOnScreen;
        }
        // change parameters
        this._parent = parent_ || CML.Object._root;
        this._parent_id = this._parent._id;
        this._access_id = (parent_) ? access_id : CML.Object.ID_NOT_SPECIFYED;
        if (access_id != CML.Object.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.push(this);
        }
        // when this WILL BE a part object ...
        if (isPart_) {
            // repush active object list
            _repush(this);
            // register this on parent parts list.
            this._parent._partChildren.push(this);
            // change parts flag
            this._motion_type |= CML.Object.MT_PART_FLAG;
            // calculate related position
            this.calcRelatedPosition();
            // calculate related angle
            this.head -= this.angleParentOnScreen;
        }
        else {
            // change parts flag
            this._motion_type &= CML.Object.MT_PART_FILTER;
        }
        // refrective funciton
        function _repush(obj) {
            var key;
            obj.remove_from_list();
            CML.Object._activeObjects.push(obj);
            for (key in obj._partChildren) {
                var part = obj._partChildren[key];
                _repush(part);
            }
        }
    }
    // calculate the angleOnScreen in a range of -180 to 180.
    _normalizeHead() {
        const offset = this.angleParentOnScreen;
        const diff = (this.head + Math.PI - offset) / (Math.PI * 2);
        this.head = (diff - Math.floor(diff) - 0.5) * Math.PI * 2 + offset;
    }
    // execute in each frame when it's necessary
    //------------------------------------------------------------
    /** Calculate absolute position when the isPart is true.
     *  The protected function _motion_parts() is a typical usage of this.
     */
    calcAbsPosition() {
        if (this.parent.euler.isZero()) {
            this.pos.addVectors(this.related, this.parent.pos);
        }
        else {
            /**/ // with rotation
            this.pos.addVectors(this.parent.pos, new CML.Vector().copy(this.related).applyQuat(this.parent.quat));
        }
    }
    /** Calculate parent related position from absolute position.
     */
    calcRelatedPosition() {
        if (this.parent.euler.isZero()) {
            this.related.subVectors(this.pos, this.parent.pos);
        }
        else {
            /**/
            const q = new CML.Vector().copy(this.parent.quat).nagate();
            this.pos.addVectors(this.parent.pos, new CML.Vector().copy(this.related).applyQuat(q));
        }
    }
    /** Rotate haed in 1 frame, if rotd &gt; 0. The _motion() is a typical usage exapmle. @see CML.Object#_motion()*/
    rotateHead() {
        this._rott += this._rotd;
        if (this._rott >= 1) {
            this._rott = 1;
            this._rotd = 0;
        }
        this.head = this._roti.calc(this._rott);
    }
    // operation for children/parts
    //------------------------------------------------------------
    /** Find first child object with specifyed id.
     *  @param id Access id specifyed in create() or "n*" command.
     *  @return The first child object with specifyed id. Return null when the seach was failed.
     *  @see CML.Object#create()
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
     *  @param func The call back function to operate objects. The type is function(obj:CML.Object):Boolean. Stop finding when this returns true.
     *  @return The count of the executions of call back function.
     *  @see CML.Object#create()
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
     *  @param func The call back function to operate objects. The type is function(obj:CML.Object):Boolean. Stop finding when this returns true.
     *  @return The count of the executions of call back function.
     *  @see CML.Object#create()
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
    /** @private _cml_internal */ _getX() { return (this.isPart) ? this.relative.x : this.pos.x; }
    /** @private _cml_internal */ _getY() { return (this.isPart) ? this.relative.y : this.pos.y; }
    /** @private _cml_internal */ _getZ() { return (this.isPart) ? this.relative.z : this.pos.z; }
    /** @private _cml_internal */ _getAx() {
        var filterd_mt = this._motion_type & CML.Object.MT_PART_FILTER;
        return (filterd_mt == CML.Object.MT_CONST || filterd_mt == CML.Object.MT_BULLETML) ? 0 : this.acc.x;
    }
    /** @private _cml_internal */ _getAy() {
        var filterd_mt = this._motion_type & CML.Object.MT_PART_FILTER;
        return (filterd_mt == CML.Object.MT_CONST || filterd_mt == CML.Object.MT_BULLETML) ? 0 : this.acc.y;
    }
    /** @private _cml_internal */ _getAz() {
        var filterd_mt = this._motion_type & CML.Object.MT_PART_FILTER;
        return (filterd_mt == CML.Object.MT_CONST || filterd_mt == CML.Object.MT_BULLETML) ? 0 : this.acc.z;
    }
    /** @private */ 
    _calcFiberPosition(fx, fy) {
        if (!this.isPart)
            return {x:fx+this.projected.x, y:fy+this.projected.y};
        const rad = this.angleOnScreen;
        return {x:this.projected.x + Math.cos(rad) * fx - Math.sin(rad) * fy, 
                y:this.projected.y + Math.sin(rad) * fx + Math.cos(rad) * fy};
    }
    // initialize and finalize
    //------------------------------------------------------------
    /** @private initializer */
    _initialize(parent_, isPart_, access_id, x, y, vx, vy, head) {
        // clear some parameters
        this.vel.set(vx, vy, 0);
        this._age = 0;
        this.head = head;
        this._rotd = 0;
        this._destructionStatus = -1;
        // set the relations
        this._parent = parent_;
        this._parent_id = this._parent._id;
        this._IDedChildren.length = 0;
        this._partChildren.length = 0;
        // add this to the parent id list
        this._access_id = access_id;
        if (access_id != CML.Object.ID_NOT_SPECIFYED) {
            this._parent._IDedChildren.push(this);
        }
        // push the active objects list, initialize position and motion.
        if (isPart_) {
            this._parent._partChildren.push(this);
            this.relative.set(x, y, 0);
            this.calcAbsPosition();
            this._motion_type = CML.Object.MT_PART_CONST;
        }
        else {
            this.pos.set(x, y, 0);
            this._motion_type = CML.Object.MT_CONST;
        }
        CML.Object._activeObjects.push(this);
        // callback
        this.onCreate();
        return this;
    }
    /** @private finalizer */
    _finalize() {
        if (this.parent != CML.Object._root) {
            // remove this from the parent id list.
            if (this._access_id != CML.Object.ID_NOT_SPECIFYED) {
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
        let ang;
        switch (this._motion_type) {
            case CML.Object.MT_CONST:
                this.pos.add(this.vel);
                break;
            case CML.Object.MT_ACCEL: 
                this.pos.add(this.vel).addScaledVector(this.acc, 0.5);
                this.vel.add(this.acc);
                if (--this.counter == 0)
                    this._motion_type = CML.Object.MT_CONST;
                break;
            case CML.Object.MT_INTERPOL:
                this.pos.add(this.vel).addScaledVector(this.acc, 0.5).addScaledVector(this.bez, 0.16666666666666667);
                this.vel.add(this.acc).addScaledVector(this.bez, 0.5);
                this.acc.add(this.bez);
                if (--this.counter == 0)
                    this._motion_type = CML.Object.MT_CONST;
                break;
            case CML.Object.MT_BULLETML: 
                ang = this.angleOnScreen;
                this.vel.set(Math.cos(ang) * this.bmlVelocity, Math.sin(ang) * this.bmlVelocity, this.vel.z);
                this.bmlVelocity += this.bmlAccel;
                this.pos.add(this.vel);
                if (--this.counter == 0)
                    this.bmlAccel = 0;
                if (this._rotd == 0 && this.bmlAccel == 0)
                    this._motion_type = CML.Object.MT_CONST;
                break;
            case CML.Object.MT_GRAVITY: 
                this.acc.subVectors(this.related, this.pos).multiplyScalar(this.bez.x).addScaledVector(this.vel, this.bez.y);
                this.pos.add(this.vel).addScaledVector(this.acc, 0.5);
                this.vel.add(this.acc);
                if (--this.counter == 0)
                    this._motion_type = CML.Object.MT_CONST;
                break;
            case CML.Object.MT_PART_CONST: 
                this.related.add(this.vel);
                this.calcAbsPosition();
                break;
            case CML.Object.MT_PART_ACCEL: 
                this.related.add(this.vel).addScaledVector(this.acc, 0.5);
                this.vel.add(this.acc);
                this.calcAbsPosition();
                if (--this.counter == 0)
                    this._motion_type = CML.Object.MT_PART_CONST;
                break;
            case CML.Object.MT_PART_INTERPOL: 
                this.related.add(this.vel).addScaledVector(this.acc, 0.5).addScaledVector(this.bez, 0.16666666666666667);
                this.vel.add(this.acc).addScaledVector(this.bez, 0.5);
                this.acc.add(this.bez);
                this.calcAbsPosition();
                if (--this.counter == 0)
                    this._motion_type = CML.Object.MT_PART_CONST;
                break;
            case CML.Object.MT_PART_BULLETML: 
                ang = this.angleOnScreen;
                this.vel.set(Math.cos(ang) * this.bmlVelocity, Math.sin(ang) * this.bmlVelocity, this.vel.z);
                this.bmlVelocity += this.bmlAccel;
                this.related.add(this.vel);
                this.calcAbsPosition();
                if (--this.counter == 0)
                    this.bmlAccel = 0;
                if (this._rotd == 0 && this.bmlAccel == 0)
                    this._motion_type = CML.Object.MT_PART_CONST;
                break;
            default:
                break;
        }
        if (this._rotd != 0)
            this.rotateHead();
        if (this.euler.changed) {
            this.quat.euler2Quat(this.euler);
            this.euler.changed = false;
        }
        this.projected.copy(this.pos);
        this._age++;
        this.onUpdate();
    }
}
// public constant values
//------------------------------------------------------------
/** @private Flag for parts motions. */
CML.Object.MT_PART_FLAG = 8;
/** @private Filter for parts motions. */
CML.Object.MT_PART_FILTER = CML.Object.MT_PART_FLAG - 1;
// enum for motion
/** Number for CML.Object.motion_type, Linear motion. */
CML.Object.MT_CONST = 0;
/** Number for CML.Object.motion_type, Accelarating motion. */
CML.Object.MT_ACCEL = 1;
/** Number for CML.Object.motion_type, 3D-Bezier interpolating motion. */
CML.Object.MT_INTERPOL = 2;
/** Number for CML.Object.motion_type, BulletML compatible motion. */
CML.Object.MT_BULLETML = 3;
/** Number for CML.Object.motion_type, Gravity motion. */
CML.Object.MT_GRAVITY = 4;
/** Number for CML.Object.motion_type, Linear motion of parts. */
CML.Object.MT_PART_CONST = CML.Object.MT_CONST | CML.Object.MT_PART_FLAG;
/** Number for CML.Object.motion_type, Accelarating motion of parts. */
CML.Object.MT_PART_ACCEL = CML.Object.MT_ACCEL | CML.Object.MT_PART_FLAG;
/** Number for CML.Object.motion_type, 3D-Bezier interpolating motion of parts. */
CML.Object.MT_PART_INTERPOL = CML.Object.MT_INTERPOL | CML.Object.MT_PART_FLAG;
/** Number for CML.Object.motion_type, BulletML compatible motion of parts. */
CML.Object.MT_PART_BULLETML = CML.Object.MT_BULLETML | CML.Object.MT_PART_FLAG;
// private variables
//------------------------------------------------------------
// statics
CML.Object._activeObjects = new CML.List(); // active object list
CML.Object._root = null; // root object instance
CML.Object._globalVariables = null; // gloabal variables
// enum for relation
CML.Object.NO_RELATION = 0;
CML.Object.REL_ATTRACT = 1;
/** @private _cml_internal */
CML.Object.ID_NOT_SPECIFYED = 0;
