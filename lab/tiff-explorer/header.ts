export interface Header {
    /**
     * Whether the file is in little endian or big endian format. Depending on system, little endian can be faster to
     * read comparing to big endian. Most modern systems are using little endian to represent the numbers.
     */
    endianness: Endianness;
}

/**
 * The variant of {@link Header}, obtained by decoding the file. Additional information are pretty much useless when
 * encoding back to TIFF.
 */
export interface DecodedHeader extends Header {
    /**
     * The magic `42` number that will be used to further identify the file as either little endian or big endian. This
     * value is encoded as unsigned `u16`.
     */
    signature: number;

    /**
     * The offset of the first IFD in the file. The offset is relative to the start position of the file.
     */
    ifdOffset: number;
}

export enum Endianness {
    Little = 0x4949,
    Big = 0x4d4d,
}

export async function decode(file: Blob): Promise<DecodedHeader> {
    if (file.size < 8) throw new Error(`Does not appear to be a valid TIFF file (size is smaller than 8)`);
    const buffer = await file.slice(0, 8).arrayBuffer();
    const view = new DataView(buffer);
    const endianness = view.getUint16(0, true) as Endianness;
    const signature = view.getUint16(2, endianness == Endianness.Little);
    const ifdOffset = view.getUint32(4, endianness == Endianness.Little);
    if (signature != 42) throw new Error(`Does not appear to be a valid TIFF file (signature is ${signature})`);
    return { endianness, signature, ifdOffset };
}
