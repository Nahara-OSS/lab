import { decode as decodeEntry, type Entry } from "./entry.ts";
import { Endianness } from "./header.ts";

export async function decode(file: Blob, offset: number, endianness: Endianness): Promise<Entry[][]> {
    const out: Entry[][] = [];

    while (offset != 0) {
        const ifd: Entry[] = [];

        const countBuffer = await file.slice(offset, offset + 2).arrayBuffer();
        const count = new DataView(countBuffer).getUint16(0, endianness == Endianness.Little);
        for (let i = 0; i < count; i++) ifd.push(await decodeEntry(file, offset + 2 + i * 12, endianness));

        const offsetBuffer = await file.slice(offset + 2 + count * 12, offset + 2 + count * 12 + 4).arrayBuffer();
        offset = new DataView(offsetBuffer).getUint32(0, endianness == Endianness.Little);
        out.push(ifd);
    }

    return out;
}
