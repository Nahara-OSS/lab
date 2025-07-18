import type { ExperimentHeader } from "../lab/mod.ts";
import { markdown as md } from "markdown";
import "./index.css";

interface IndexedExperiment extends ExperimentHeader {
    id: string;
}

const index = (await fetch("./index.json")).json() as Promise<IndexedExperiment[]>;
const listElement = document.querySelector("#list") as HTMLDivElement;
const view = document.querySelector("#view") as HTMLIFrameElement;
const readme = document.querySelector("#readme") as HTMLDivElement;
const seachbox = document.querySelector("#search") as HTMLInputElement;

async function search(query: string) {
    const resolvedIndex = (await index).filter((e) =>
        query.length == 0 ||
        e.name.includes(query) ||
        e.tags.some((t) => t.includes(query))
    );

    while (listElement.firstChild) listElement.firstChild.remove();
    listElement.append(...resolvedIndex.map((e) => {
        const entry = document.createElement("div");
        entry.classList.add("item");
        entry.append(document.createTextNode(e.name));
        entry.addEventListener("click", () => navigateTo(e));
        return entry;
    }));
}

let selected = "";

async function navigateTo(e: IndexedExperiment) {
    if (selected == e.id) return;
    view.src = `./${e.id}`;
    const markdown = await (await fetch(`./${e.id}/README.md`)).text();
    readme.innerHTML = md.toHTML(markdown);
    selected = e.id;
}

search("");
seachbox.addEventListener("input", () => search(seachbox.value));
