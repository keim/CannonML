/** @private */
CML.SinTable = class extends Array {
    constructor(table_size = 4096) {
        super();
        this.cos_shift = table_size >> 2;
        var size = table_size + this.cos_shift, step = Math.PI / Number(table_size >> 1), i;
        this.length = size;
        for (i = 0; i < size; ++i) {
            this[i] = Math.sin(Number(i) * step);
        }
        this.d2i = Number(table_size) / 360;
        this.fil = table_size - 1;
    }
    index(deg) {
        return (Math.floor(deg * this.d2i)) & this.fil;
    }
}
