/** interpolating calculation @private */
export class Interpolation {
    // constructor
    //--------------------------------------------------
    P = 0
    Q = 0
    R = 0
    S = 0
    // calculation
    //--------------------------------------------------
    calc(t: number): number {
        return ((this.P * t + this.Q) * t + this.R) * t + this.S;
    }
    // interpolation setting
    //--------------------------------------------------
    // linear interpolation
    setLinear(x0: number, x1: number): this {
        this.P = 0;
        this.Q = 0;
        this.R = x1 - x0;
        this.S = x0;
        return this;
    }
    // 2-dimensional bezier interpolation
    setBezier2(x0: number, x1: number, p: number): this {
        this.P = 0;
        this.Q = x0 + x1 - p * 2;
        this.R = (p - x0) * 2;
        this.S = x0;
        return this;
    }
    // 3-dimensional bezier interpolation
    setBezier3(x0: number, x1: number, p0: number, p1: number): this {
        this.P = -x0 + (p0 - p1) * 3 + x1;
        this.Q = (x0 - p0 * 2 + p1) * 3;
        this.R = (-x0 + p0) * 3;
        this.S = x0;
        return this;
    }
    // ferguson-coons interpolation
    setFergusonCoons(x0: number, x1: number, v0: number, v1: number): this {
        this.P = (x0 - x1) * 2 + v0 + v1;
        this.Q = -x0 + x1 - v0 - this.P;
        this.R = v0;
        this.S = x0;
        return this;
    }
    // lagrange interpolation
    setLagrange(x0: number, x1: number, x2: number, x3: number): this {
        this.P = x3 - x2 - x0 + x1;
        this.Q = x0 - x1 - this.P;
        this.R = x2 - x0;
        this.S = x1;
        return this;
    }
    // catmull-rom interpolation
    setCatmullRom(x0: number, x1: number, x2: number, x3: number): this {
        this.P = (-x0 + x1 - x2 + x3) * 0.5 + x1 - x2;
        this.Q = x0 + (x2 - x1) * 2 - (x1 + x3) * 0.5;
        this.R = (x2 - x0) * 0.5;
        this.S = x1;
        return this;
    }
    // catmull-rom interpolation for starting point
    setCatmullRomStart(x1: number, x2: number, x3: number): this {
        this.P = 0;
        this.Q = (x1 + x3) * 0.5 - x2;
        this.R = (x2 - x1) * 2 + (x1 - x3) * 0.5;
        this.S = x1;
        return this;
    }
    // catmull-rom interpolation for line end
    setCatmullRomEnd(x0: number, x1: number, x2: number): this {
        this.P = 0;
        this.Q = (x0 + x2) * 0.5 - x1;
        this.R = (x2 - x0) * 0.5;
        this.S = x1;
        return this;
    }
}
