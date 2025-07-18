import { arrayOfF32, arrayOfF64, arrayOfI16, arrayOfI32, arrayOfU16, arrayOfU32 } from "./env.ts";
import { Endianness } from "./header.ts";
import names from "./names.json" with { type: "json" };

export enum Type {
    Byte = 1,
    ASCII = 2,
    Short = 3,
    Long = 4,
    Rational = 5,
    SByte = 6,
    Undefined = 7,
    SShort = 8,
    SLong = 9,
    SRational = 10,
    Float = 11,
    Double = 12,
    Unknown = -1,
}

export interface TypeValueMap {
    [Type.Byte]: Uint8Array;
    [Type.ASCII]: string;
    [Type.Short]: Uint16Array;
    [Type.Long]: Uint32Array;
    [Type.Rational]: Rational[];
    [Type.SByte]: Int8Array;
    [Type.Undefined]: Blob;
    [Type.SShort]: Int16Array;
    [Type.SLong]: Int32Array;
    [Type.SRational]: Rational[];
    [Type.Float]: Float32Array;
    [Type.Double]: Float64Array;
    [Type.Unknown]: Unknown;
}

export interface Rational {
    numerator: number;
    denominator: number;
}

export interface Unknown {
    type: number;
}

export interface TypedEntry<T extends Type> {
    tag: number;
    type: T;
    value: TypeValueMap[T];
}

export type Entry = { [x in Type]: TypedEntry<x> }[Type];

interface ValueType<T extends Type> {
    readonly byteSize: number;
    readonly defaultValue: TypeValueMap[T];
    decode(content: Blob, count: number, endianness: Endianness): Promise<TypeValueMap[T]>;
}

interface ConvertibleValueType<T extends Type> extends ValueType<T> {
    valueToString(value: TypeValueMap[T]): string;
    valueFromString(text: string): TypeValueMap[T];
}

function arrayFromString<T>(text: string, initial: T, valueFromString: (s: string) => T): T[] {
    if (text.startsWith("[")) {
        if (!text.endsWith("]")) throw new Error(`Array must ends with ']'`);
        const substring = text.substring(1, text.length - 1).trim();
        if (substring.length == 0) return [];
        return substring.split(",").map(valueFromString);
    } else if (text.length > 0) {
        return [valueFromString(text)];
    } else {
        return [initial];
    }
}

function arrayToString<T>(array: {
    readonly [x: number]: T;
    readonly length: number;
    map<U>(mapper: (value: T) => U): U[];
}, valueToString: (v: T) => string): string {
    if (array.length == 1) return valueToString(array[0]);
    return `[${array.map(valueToString).join(", ")}]`;
}

function safeParseInt(x: string): number {
    const v = parseInt(x);
    if (Number.isNaN(v)) throw new Error(`Invalid integer: ${x}`);
    return v;
}

function safeParseFloat(x: string): number {
    const v = parseFloat(x);
    if (Number.isNaN(v)) throw new Error(`Invalid integer: ${x}`);
    return v;
}

export const valueTypes: { [x in Type]: ValueType<x> | ConvertibleValueType<x> } = {
    [Type.Byte]: {
        byteSize: 1,
        defaultValue: new Uint8Array(),
        decode: async (content, count) => new Uint8Array(await content.arrayBuffer(), 0, count),
        valueFromString: (text) => new Uint8Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.ASCII]: {
        byteSize: 1,
        defaultValue: "",
        decode: async (content, count) => {
            const ascii = new Uint8Array(await content.arrayBuffer(), 0, count);
            const length = ascii.indexOf(0);
            return new TextDecoder().decode(ascii.subarray(0, length));
        },
        valueFromString: (x) => x,
        valueToString: (x) => x,
    },
    [Type.Short]: {
        byteSize: 2,
        defaultValue: new Uint16Array(),
        decode: async (content, count, endianness) => arrayOfU16(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Uint16Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.Long]: {
        byteSize: 4,
        defaultValue: new Uint32Array(),
        decode: async (content, count, endianness) => arrayOfU32(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Uint32Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.Rational]: {
        byteSize: 8,
        get defaultValue() {
            return [];
        },
        decode: async (content, count, endianness) => {
            const view = new DataView(await content.arrayBuffer());
            const out = new Array<Rational>();

            for (let i = 0; i < count; i++) {
                out[i] = {
                    numerator: view.getUint32(i << 3, endianness == Endianness.Little),
                    denominator: view.getUint32((i << 3) + 4, endianness == Endianness.Little),
                };
            }

            return out;
        },
        valueFromString: (text) =>
            arrayFromString(text, { numerator: 0, denominator: 1 }, (s) => {
                if (!s.includes("/")) throw new Error("Missing '/'");
                const [numerator, denominator] = s.split("/", 2).map(safeParseInt);
                return { numerator, denominator };
            }),
        valueToString: (value) => arrayToString(value, ({ numerator, denominator }) => `${numerator}/${denominator}`),
    },
    [Type.SByte]: {
        byteSize: 1,
        defaultValue: new Int8Array(),
        decode: async (content, count) => new Int8Array(await content.arrayBuffer(), 0, count),
        valueFromString: (text) => new Int8Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.Undefined]: {
        byteSize: 1,
        defaultValue: new Blob([]),
        decode: (content) => Promise.resolve(content),
    },
    [Type.SShort]: {
        byteSize: 2,
        defaultValue: new Int16Array(),
        decode: async (content, count, endianness) => arrayOfI16(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Int16Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.SLong]: {
        byteSize: 4,
        defaultValue: new Int32Array(),
        decode: async (content, count, endianness) => arrayOfI32(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Int32Array(arrayFromString(text, 0, safeParseInt)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.SRational]: {
        byteSize: 8,
        get defaultValue() {
            return [];
        },
        decode: async (content, count, endianness) => {
            const view = new DataView(await content.arrayBuffer());
            const out = new Array<Rational>();

            for (let i = 0; i < count; i++) {
                out[i] = {
                    numerator: view.getInt32(i << 3, endianness == Endianness.Little),
                    denominator: view.getInt32(i << 3 + 4, endianness == Endianness.Little),
                };
            }

            return out;
        },
        valueFromString: (text) =>
            arrayFromString(text, { numerator: 0, denominator: 1 }, (s) => {
                if (!s.includes("/")) throw new Error("Missing '/'");
                const [numerator, denominator] = s.split("/", 2).map(safeParseInt);
                return { numerator, denominator };
            }),
        valueToString: (value) => arrayToString(value, ({ numerator, denominator }) => `${numerator}/${denominator}`),
    },
    [Type.Float]: {
        byteSize: 4,
        defaultValue: new Float32Array(),
        decode: async (content, count, endianness) => arrayOfF32(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Float32Array(arrayFromString(text, 0, safeParseFloat)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.Double]: {
        byteSize: 8,
        defaultValue: new Float64Array(),
        decode: async (content, count, endianness) => arrayOfF64(await content.arrayBuffer(), endianness, count),
        valueFromString: (text) => new Float64Array(arrayFromString(text, 0, safeParseFloat)),
        valueToString: (value) => arrayToString([...value], (x) => `${x}`),
    },
    [Type.Unknown]: {
        byteSize: -1,
        get defaultValue() {
            return { type: 32768 };
        },
        decode() {
            throw new Error("Unknown type must be handled by decode()");
        },
    },
};

export async function decode(file: Blob, offset: number, endianness: Endianness): Promise<Entry> {
    const buffer = await file.slice(offset, offset + 12).arrayBuffer();
    const view = new DataView(buffer);
    const tag = view.getUint16(0, endianness == Endianness.Little);
    const type = view.getUint16(2, endianness == Endianness.Little) as Type;
    const count = view.getUint32(4, endianness == Endianness.Little);
    const elementSize = valueTypes[type]?.byteSize ?? -1;
    if (elementSize == -1) return { tag, type: Type.Unknown, value: { type } };

    const valueSize = elementSize * count;
    const elementOffset = valueSize <= 4 ? offset + 8 : view.getUint32(8, endianness == Endianness.Little);
    const content = file.slice(elementOffset, elementOffset + valueSize);
    return { tag, type, value: await valueTypes[type].decode(content, count, endianness) } as Entry;
}

export interface TagInfo {
    tag: number;
    name: string;
}

let nameCache: Map<number, TagInfo> | null = null;

export function tagInfo(tag: number): TagInfo | null {
    if (nameCache == null) {
        nameCache = new Map();
        names.forEach((n) => nameCache!.set(n.tag, n));
    }

    return nameCache.get(tag) ?? null;
}
