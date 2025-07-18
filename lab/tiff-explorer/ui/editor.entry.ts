import { entry } from "../mod.ts";
import { wrapAsTd } from "./table.ts";

const selectTemplate = document.createElement("select");
selectTemplate.classList.add("tag-type");
selectTemplate.innerHTML = `
<option value="byte">1: Byte (u8)</option>
<option value="ascii">2: ASCII</option>
<option value="short">3: Short (u16)</option>
<option value="long">4: Long (u32)</option>
<option value="rational">5: Rational (u32/u32)</option>
<option value="sbyte">6: SByte (s8)</option>
<option value="undefined">7: Undefined</option>
<option value="sshort">8: SShort (s16)</option>
<option value="slong">9: SLong (s32)</option>
<option value="srational">10: SRational (s32/s32)</option>
<option value="float">11: Float (f32)</option>
<option value="double">12: Double (f64)</option>`;

export function makeEntryEditor(
    e: entry.Entry,
    { onDelete }: { onDelete?(e: entry.Entry): unknown } = {},
): HTMLTableRowElement {
    const row = document.createElement("tr");

    const tagIdInput = document.createElement("input");
    tagIdInput.classList.add("tag-id");
    tagIdInput.classList.add("digit");
    tagIdInput.placeholder = "Tag ID";
    tagIdInput.value = `0x${e.tag.toString(16).padStart(4, "0")}`;

    const tagNameSpan = document.createElement("span");
    const tagName = document.createTextNode("(tag name)");
    tagName.textContent = entry.tagInfo(e.tag)?.name ?? `Unknown`;
    tagNameSpan.classList.add("tag-name");
    tagNameSpan.append(tagName);

    const tagTypeSelect = selectTemplate.cloneNode(true) as HTMLSelectElement;
    tagTypeSelect.selectedIndex = e.type - 1;

    const valueCell = document.createElement("td");
    valueCell.classList.add("tag-value-cell");
    refreshValueCell();

    function refreshValueCell(): void {
        while (valueCell.firstChild) valueCell.firstChild.remove();
        const typeInfo = entry.valueTypes[e.type];

        if ("valueFromString" in typeInfo) {
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Value...";
            input.classList.add("tag-value");
            input.classList.add("digit");
            // deno-lint-ignore no-explicit-any
            input.value = typeInfo.valueToString(e.value as any);
            valueCell.append(input);

            input.addEventListener("input", () => {
                try {
                    e.value = typeInfo.valueFromString(input.value);
                    input.setCustomValidity("");
                } catch (e) {
                    input.setCustomValidity(e instanceof Error ? e.message : `${e}`);
                    input.reportValidity();
                    console.warn(e);
                }
            });

            return;
        }

        switch (e.type) {
            case entry.Type.Undefined:
            default:
                valueCell.append(document.createTextNode("Not implemented"));
                break;
        }
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.append(document.createTextNode("Delete"));

    row.append(
        wrapAsTd(tagIdInput),
        wrapAsTd(tagNameSpan),
        wrapAsTd(tagTypeSelect),
        valueCell,
        wrapAsTd(deleteButton),
    );

    tagIdInput.addEventListener("input", () => {
        const s = tagIdInput.value;
        const v = s.startsWith("0x") ? parseInt(s.substring(2), 16) : parseInt(s);

        if (Number.isNaN(v)) {
            tagIdInput.setCustomValidity("Invalid input. Must matches (0x)?[0-9]+");
            tagIdInput.reportValidity();
        } else {
            tagName.textContent = entry.tagInfo(v)?.name ?? `Unknown`;
            e.tag = v;
            tagIdInput.setCustomValidity("");
        }
    });

    tagTypeSelect.addEventListener("change", () => {
        const oldType = e.type;
        const newType = (tagTypeSelect.selectedIndex + 1) as entry.Type;
        if (oldType == newType) return;

        const oldTypeInfo = entry.valueTypes[oldType];
        const newTypeInfo = entry.valueTypes[newType];

        if ("valueFromString" in oldTypeInfo && "valueFromString" in newTypeInfo) {
            try {
                // deno-lint-ignore no-explicit-any
                const intermediary = oldTypeInfo.valueToString(e.value as any);
                const targetValue = newTypeInfo.valueFromString(intermediary);
                e.type = newType;
                e.value = targetValue;
                tagTypeSelect.setCustomValidity("");
            } catch (err) {
                e.type = newType;
                e.value = newTypeInfo.defaultValue;
                console.warn(err);
            }
        } else {
            e.type = newType;
            e.value = newTypeInfo.defaultValue;
        }

        refreshValueCell();
    });

    deleteButton.addEventListener("click", () => {
        if (onDelete) onDelete(e);
    });

    return row;
}
