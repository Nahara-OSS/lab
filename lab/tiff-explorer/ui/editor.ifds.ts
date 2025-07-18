import { entry } from "../mod.ts";
import { makeIfdEditor } from "./editor.ifd.ts";
import { wrapAsTd } from "./table.ts";

const tableTemplate = document.createElement("table");
tableTemplate.innerHTML = `
<colgroup>
    <col class="col-tag-id">
    <col class="col-tag-name">
    <col class="col-tag-type">
    <col class="col-tag-value">
    <col class="col-tag-actions">
</colgroup>
<thead>
    <tr>
        <th>Tag ID</th>
        <th>Tag name</th>
        <th>Type</th>
        <th>Value</th>
        <th>Actions</th>
    </tr>
</thead>`;

export function makeIfdsEditor(content: entry.Entry[][]): HTMLTableElement {
    const table = tableTemplate.cloneNode(true) as HTMLTableElement;

    const controlSection = document.createElement("tbody");
    const addIfdRow = document.createElement("tr");
    const addIfdButton = document.createElement("button");
    addIfdButton.type = "button";
    addIfdButton.classList.add("add-ifd-btn");
    addIfdButton.append(document.createTextNode("Add IFD"));
    addIfdRow.append(wrapAsTd(addIfdButton, { colSpan: 5 }));
    controlSection.append(addIfdRow);
    table.append(controlSection);

    function addIfdEditor(ifd: entry.Entry[]) {
        const section = makeIfdEditor(ifd, {
            onDelete(ifd) {
                const idx = content.indexOf(ifd);
                if (idx == -1) return;
                content.splice(idx, 1);
                section.remove();
            },
        });
        table.insertBefore(section, controlSection);
    }

    for (const ifd of content) addIfdEditor(ifd);

    addIfdButton.addEventListener("click", () => {
        const ifd: entry.Entry[] = [{ tag: 0, type: entry.Type.Long, value: new Uint32Array([0]) }];
        content.push(ifd);
        addIfdEditor(ifd);
    });

    return table;
}
