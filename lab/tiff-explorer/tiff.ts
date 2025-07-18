import type { Entry } from "./entry.ts";
import { decode as decodeHeader, type DecodedHeader, type Header } from "./header.ts";
import { decode as decodeIfds } from "./ifd.ts";

export interface Tiff {
    header: Header;
    ifds: Entry[][];
}

export interface DecodedTiff extends Tiff {
    header: DecodedHeader;
}

export async function decode(file: Blob): Promise<DecodedTiff> {
    const header = await decodeHeader(file);
    const ifds = await decodeIfds(file, header.ifdOffset, header.endianness);
    return { header, ifds };
}
