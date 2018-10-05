package org.si.cml.core {
    /** @private */
    public dynamic class CMLSinTable extends Array
    {
        private var d2i:Number;
        private var fil:int;
        public  var cos_shift:int;
        
        public function CMLSinTable(table_size:int=4096)
        {
            cos_shift = table_size>>2;

            var size:int    = table_size + cos_shift,
                step:Number = Math.PI / Number(table_size >> 1),
                i:int;
            
            this.length = size;
            for (i=0; i<size; ++i) { this[i] = Math.sin(Number(i)*step); }
            
            d2i = Number(table_size)/360;
            fil = table_size - 1;
        }
        
        public function index(deg:Number) : int
        {
            return (int(deg*d2i))&fil;
        }
    }
}



