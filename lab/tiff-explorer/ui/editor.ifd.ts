import { entry } from "../mod.ts";
import { makeEntryEditor } from "./editor.entry.ts";
import { wrapAsTd } from "./table.ts";

export function makeIfdEditor(
    ifd: entry.Entry[],
    { onDelete }: {
        onDelete?(ifd: entry.Entry[]): unknown;
    } = {},
): HTMLTableSectionElement {
    const section = document.createElement("tbody");

    const headerRow = document.createElement("tr");
    headerRow.classList.add("ifd-header");

    const headerCell = document.createElement("th");
    headerCell.colSpan = 4;
    headerCell.append(document.createTextNode(`IFD`));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.append(document.createTextNode("Delete"));

    const addEntryRow = document.createElement("tr");
    const addEntryButton = document.createElement("button");
    addEntryButton.type = "button";
    addEntryButton.classList.add("add-entry-btn");
    addEntryButton.append(document.createTextNode("Add entry"));
    headerRow.append(headerCell, wrapAsTd(deleteButton));
    addEntryRow.append(wrapAsTd(addEntryButton, { colSpan: 5 }));
    section.append(headerRow, addEntryRow);

    function addEntryEditor(e: entry.Entry) {
        const row = makeEntryEditor(e, {
            onDelete(e) {
                const i = ifd.indexOf(e);
                if (i == -1) return;
                ifd.splice(i, 1);
                row.remove();
                if (ifd.length == 0 && onDelete) onDelete(ifd);
            },
        });
        section.insertBefore(row, addEntryRow);
    }

    for (const e of ifd) addEntryEditor(e);

    addEntryButton.addEventListener("click", () => {
        const e: entry.Entry = { tag: 0, type: entry.Type.Long, value: new Uint32Array(1) };
        ifd.push(e);
        addEntryEditor(e);
    });

    deleteButton.addEventListener("click", () => {
        if (onDelete) onDelete(ifd);
    });

    return section;
}
