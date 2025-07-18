/**
 * Adapt value encoding and decoding to system's endianness.
 * 
 * @module
 */

import { Endianness } from "./header.ts";

export const systemEndianness: Endianness = new Uint8Array(new Uint16Array([0x00FF]).buffer)[0] == 0xFF
    ? Endianness.Little
    : Endianness.Big;

export function arrayOfU16(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 2),
): Uint16Array {
    if (endianness == systemEndianness) return new Uint16Array(buffer, 0, count);
    const array = new Uint16Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getUint16(i << 1, endianness == Endianness.Little);
    return array;
}

export function arrayOfU32(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 4),
): Uint32Array {
    if (endianness == systemEndianness) return new Uint32Array(buffer, 0, count);
    const array = new Uint32Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getUint32(i << 2, endianness == Endianness.Little);
    return array;
}

export function arrayOfI16(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 2),
): Int16Array {
    if (endianness == systemEndianness) return new Int16Array(buffer, 0, count);
    const array = new Int16Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getInt16(i << 1, endianness == Endianness.Little);
    return array;
}

export function arrayOfI32(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 4),
): Int32Array {
    if (endianness == systemEndianness) return new Int32Array(buffer, 0, count);
    const array = new Int32Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getInt32(i << 2, endianness == Endianness.Little);
    return array;
}

export function arrayOfF32(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 4),
): Float32Array {
    if (endianness == systemEndianness) return new Float32Array(buffer, 0, count);
    const array = new Float32Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getFloat32(i << 2, endianness == Endianness.Little);
    return array;
}

export function arrayOfF64(
    buffer: ArrayBuffer,
    endianness: Endianness,
    count: number = Math.floor(buffer.byteLength / 4),
): Float64Array {
    if (endianness == systemEndianness) return new Float64Array(buffer, 0, count);
    const array = new Float64Array(count);
    const srcView = new DataView(buffer);
    for (let i = 0; i < count; i++) array[i] = srcView.getFloat64(i << 3, endianness == Endianness.Little);
    return array;
}
