import { type Experiment, experiments } from "./lab/mod.ts";
import { copy, ensureDir, exists } from "@std/fs";
import { join as joinPath } from "@std/path";

const outputDir = "output";

async function bundle(script: URL | string, output: string): Promise<void> {
    const command = new Deno.Command("deno", {
        args: [
            "bundle",
            "--unstable-raw-imports",
            "--platform=browser",
            "--format=esm",
            script.toString(),
            "-o",
            output,
        ],
        stdin: "null",
        stderr: "piped",
        stdout: "piped",
    });
    const process = command.spawn();
    const processOut = await process.output();

    if (!processOut.success) {
        await Deno.stdout.write(processOut.stdout);
        await Deno.stdout.write(processOut.stderr);
        throw new Error(`Failed to bundle ${script} into ${output}`);
    }
}

async function build(experiment: Experiment, outputFolder: string): Promise<void> {
    const indexDocument = new URL("index.html", experiment.root);
    const indexScript = new URL("index.ts", experiment.root);
    await ensureDir(outputFolder);
    await Deno.writeTextFile(joinPath(outputFolder, "README.md"), experiment.content);
    if (await exists(indexDocument)) await copy(indexDocument, joinPath(outputFolder, "index.html"), { overwrite: true });
    if (await exists(indexScript)) await bundle(indexScript, joinPath(outputFolder, "index.js"));
}

await ensureDir(outputDir);
await copy(new URL(import.meta.resolve("./viewer/index.html")), joinPath(outputDir, "index.html"), { overwrite: true });
await bundle(new URL(import.meta.resolve("./viewer/index.ts")), joinPath(outputDir, "index.js"));

await Deno.writeTextFile(
    joinPath(outputDir, "index.json"),
    JSON.stringify(
        experiments.map(({ id, header: { name, dependencies, startTime, tags } }) => ({
            id,
            name,
            dependencies,
            startTime,
            tags,
        })),
    ),
);

experiments.map(async (e) => {
    await build(e, joinPath(outputDir, e.id));
    console.log(`%cbuild %c${e.id} (${e.header.name})`, "color: green", "");
});
