import { decode as decodeTiff } from "./mod.ts";

const sample = await Deno.readFile(new URL(import.meta.resolve("./sample.dng")));
const file = new Blob([sample]);
console.log(await decodeTiff(file));
