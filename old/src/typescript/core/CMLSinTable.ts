/** @private */
export default class CMLSinTable extends Array
{
    private d2i:number;
    private fil:number;
    public cos_shift:number;
    
    constructor(table_size:number=4096)
    {
        super();
        this.cos_shift = table_size>>2;

        var size:number    = table_size + this.cos_shift,
            step:number = Math.PI / Number(table_size >> 1),
            i:number;
        
        this.length = size;
        for (i=0; i<size; ++i) { this[i] = Math.sin(Number(i)*step); }
        
        this.d2i = Number(table_size)/360;
        this.fil = table_size - 1;
    }
    
    public index(deg:number) : number
    {
        return (Math.floor(deg*this.d2i))&this.fil;
    }
}

