/** @private */
export class SinTable extends Array {
    cos_shift: number
    d2i: number
    fil: number
    constructor(table_size = 4096) {
        super();
        this.cos_shift = table_size >> 2;
        const size = table_size + this.cos_shift, step = Math.PI / Number(table_size >> 1);
        this.length = size;
        for (let i = 0; i < size; ++i) {
            this[i] = Math.sin(Number(i) * step);
        }
        this.d2i = Number(table_size) / 360;
        this.fil = table_size - 1;
    }
    index(deg: number): number {
        return (Math.floor(deg * this.d2i)) & this.fil;
    }
}
