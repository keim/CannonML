package org.si.cml.core {
    /** interpolating calculation @private */
    public class interpolation
    {
    // variables
    //--------------------------------------------------
        public var P:Number = 0;
        public var Q:Number = 0;
        public var R:Number = 0;
        public var S:Number = 0;
        
        
    // constructor
    //--------------------------------------------------
        public function interpolation()
        {
        }

        
    // calculation
    //--------------------------------------------------
        public function calc(t:Number) : Number
        {
            return ((P*t+Q)*t+R)*t+S;
        }


    // interpolation setting
    //--------------------------------------------------
        // linear interpolation
        public function setLinear(x0:Number, x1:Number) : interpolation
        {
            P = 0;
            Q = 0;
            R = x1 - x0;
            S = x0;
            return this;
        }
        
        // 2-dimensional bezier interpolation
        public function setBezier2(x0:Number, x1:Number, p:Number) : interpolation
        {
            P = 0;
            Q = x0+x1-p*2;
            R = (p-x0)*2;
            S = x0;
            return this;
        }

        // 3-dimensional bezier interpolation
        public function setBezier3(x0:Number, x1:Number, p0:Number, p1:Number) : interpolation
        {
            P = -x0+(p0-p1)*3+x1;
            Q = (x0-p0*2+p1)*3;
            R = (-x0+p0)*3;
            S = x0;
            return this;
        }
        
        // ferguson-coons interpolation
        public function setFergusonCoons(x0:Number, x1:Number, v0:Number, v1:Number) : interpolation
        {
            P = (x0-x1)*2+v0+v1;
            Q = -x0+x1-v0-P;
            R = v0;
            S = x0;
            return this;
        }
        
        // lagrange interpolation
        public function setLagrange(x0:Number, x1:Number, x2:Number, x3:Number) : interpolation
        {
            P = x3-x2-x0+x1;
            Q = x0-x1-P;
            R = x2-x0;
            S = x1;
            return this;
        }
        
        // catmull-rom interpolation
        public function setCatmullRom(x0:Number, x1:Number, x2:Number, x3:Number) : interpolation
        {
            P = (-x0+x1-x2+x3)*0.5+x1-x2;
            Q = x0+(x2-x1)*2-(x1+x3)*0.5;
            R = (x2-x0)*0.5;
            S = x1;
            return this;
        }

        // catmull-rom interpolation for starting point
        public function setCatmullRomStart(x1:Number, x2:Number, x3:Number) : interpolation
        {
            P = 0;
            Q = (x1+x3)*0.5-x2;
            R = (x2-x1)*2+(x1-x3)*0.5;
            S = x1;
            return this;
        }

        // catmull-rom interpolation for line end
        public function setCatmullRomEnd(x0:Number, x1:Number, x2:Number) : interpolation
        {
            P = 0;
            Q = (x0+x2)*0.5-x1;
            R = (x2-x0)*0.5;
            S = x1;
            return this;
        }
    }
}

