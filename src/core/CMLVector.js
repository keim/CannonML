CML.Vector = class {
  constructor(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  setScalar(scalar) {
    this.x = scalar;
    this.y = scalar;
    this.z = scalar;
    return this;
  }

  clone() {
    return new CML.Vector(this.x, this.y, this.z);
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addScalar(s) {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }

  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  addScaledVector(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  subScalar(s) {
    this.x -= s;
    this.y -= s;
    this.z -= s;
    return this;
  }

  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  multiplyScalar(scalar) {
    if ( isFinite( scalar ) ) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
    return this;
  }

  multiplyVectors(a, b) {
    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;
    return this;
  }

  divide(v) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    return this;
  }

  divideScalar(scalar) {
    return this.multiplyScalar(1/scalar);
  }

  divideVectors(a, b) {
    this.x = a.x / b.x;
    this.y = a.y / b.y;
    this.z = a.z / b.z;
    return this;
  }

  applyMatrix3(m) {
    const x = this.x, y = this.y, z = this.z;
    this.x = m[ 0 ] * x + m[ 3 ] * y + m[ 6 ] * z;
    this.y = m[ 1 ] * x + m[ 4 ] * y + m[ 7 ] * z;
    this.z = m[ 2 ] * x + m[ 5 ] * y + m[ 8 ] * z;
    return this;
  }

  applyMatrix4(m) {
    const x = this.x, y = this.y, z = this.z;
    this.x = m[ 0 ] * x + m[ 4 ] * y + m[ 8 ]  * z + m[ 12 ];
    this.y = m[ 1 ] * x + m[ 5 ] * y + m[ 9 ]  * z + m[ 13 ];
    this.z = m[ 2 ] * x + m[ 6 ] * y + m[ 10 ] * z + m[ 14 ];
    const w =  m[ 3 ] * x + m[ 7 ] * y + m[ 11 ] * z + m[ 15 ];
    return this.divideScalar(w);
  }

  euler2Quat(e){
    const c1 = Math.cos(e.x/2), c2 = Math.cos(e.y/2), c3 = Math.cos(e.z/2),
          s1 = Math.sin(e.x/2), s2 = Math.sin(e.y/2), s3 = Math.sin(e.z/2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
    return this;
  }

  applyQuat(q) {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix =  qw * x + qy * z - qz * y;
    const iy =  qw * y + qz * x - qx * z;
    const iz =  qw * z + qx * y - qy * x;
    const iw = - qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;
    return this;
  }

  min(v) {
    this.x = Math.min( this.x, v.x );
    this.y = Math.min( this.y, v.y );
    this.z = Math.min( this.z, v.z );
    return this;
  }

  max(v) {
    this.x = Math.max( this.x, v.x );
    this.y = Math.max( this.y, v.y );
    this.z = Math.max( this.z, v.z );
    return this;
  }

  clamp(min, max) {
    this.x = Math.max(min.x, Math.min( max.x, this.x ));
    this.y = Math.max(min.y, Math.min( max.y, this.y ));
    this.z = Math.max(min.z, Math.min( max.z, this.z ));
    return this;
  }

  negate() {
    this.x = - this.x;
    this.y = - this.y;
    this.z = - this.z;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  }

  lengthManhattan() {
    return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );
  }

  normalize() {
    return this.divideScalar(this.length());
  }

  setLength(length) {
    return this.multiplyScalar(length / this.length());
  }

  lerp(v, alpha) {
    this.x += ( v.x - this.x ) * alpha;
    this.y += ( v.y - this.y ) * alpha;
    this.z += ( v.z - this.z ) * alpha;
    return this;
  }

  lerpVectors(v1, v2, alpha) {
    return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
  }

  cross(v) {
    const x = this.x, y = this.y, z = this.z;
    this.x = y * v.z - z * v.y;
    this.y = z * v.x - x * v.z;
    this.z = x * v.y - y * v.x;
    return this;
  }

  crossVectors(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }

  angleTo(v) {
    return Math.acos(Math.max(-1, Math.min(1, this.dot(v) / (Math.sqrt(this.lengthSq() * v.lengthSq())))));
  }

  distanceTo(v) {
    return Math.sqrt(this.distanceToSquared(v));
  }

  distanceToSquared(v) {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  distanceToManhattan(v) {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);
  }
}