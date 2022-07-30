
export namespace NumberUtils {
    export function getReadableSizeString(size:number): string{

        let i = -1;
        let byteUnits = [' kb', ' Mb', ' Gb', ' Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
        do {
            size = size / 1024;
            i++;
        } while (size > 1024);
    
        return Math.max(size, 0.1).toFixed(1) + byteUnits[i];
    }
}