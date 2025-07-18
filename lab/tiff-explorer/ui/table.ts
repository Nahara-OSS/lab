export function wrapAsTd(
    e: Node | Node[],
    { rowSpan, colSpan }: { rowSpan?: number; colSpan?: number } = {},
): HTMLTableCellElement {
    const td = document.createElement("td");
    if (rowSpan != null) td.rowSpan = rowSpan;
    if (colSpan != null) td.colSpan = colSpan;
    if (Array.isArray(e)) td.append(...e);
    else td.append(e);
    return td;
}
