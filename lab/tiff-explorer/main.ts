import { header, ifd } from "./mod.ts";

const sample = await Deno.readFile(new URL(import.meta.resolve("./sample.nef")));
const file = new Blob([sample]);

const head = await header.decode(file);
const entries = await ifd.decode(file, head.ifdOffset, head.endianness);
console.log(entries);
