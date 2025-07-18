import { parse as parseYaml } from "@std/yaml";
import index from "./index.json" with { type: "json" };

export interface Experiment {
    id: string;
    root: URL;
    header: ExperimentHeader;
    content: string;
}

export interface ExperimentHeader {
    name: string;
    startTime: Date;
    dependencies: string[];
    tags: string[];
}

const base = new URL(import.meta.url);

export const experiments: readonly Experiment[] = (await Promise.all(index.map(async (id) => {
    const root = new URL(id + "/", base);
    const readme = await Deno.readTextFile(new URL("./README.md", root));
    const contentDivider = readme.indexOf("---", 3);
    const header = parseYaml(readme.substring(3, contentDivider).trim()) as ExperimentHeader;
    const content = readme.substring(contentDivider + 3).trim();
    return { id, root, header, content } as Experiment;
}))).sort((a, b) => a.header.name.localeCompare(b.header.name));
