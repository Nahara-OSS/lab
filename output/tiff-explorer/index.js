var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// helper.ts
function requestFileBlob() {
  return new Promise((resolve, reject) => {
    const e = document.createElement("input");
    e.type = "file";
    e.addEventListener("input", () => {
      if (e.files == null || e.files.length == 0) {
        reject("No file selected by user");
        return;
      }
      resolve(e.files[0]);
    });
    e.addEventListener("cancel", () => reject("No file selected by user"));
    e.click();
  });
}

// lab/tiff-explorer/header.ts
var Endianness = /* @__PURE__ */ function(Endianness2) {
  Endianness2[Endianness2["Little"] = 18761] = "Little";
  Endianness2[Endianness2["Big"] = 19789] = "Big";
  return Endianness2;
}({});
async function decode(file) {
  if (file.size < 8) throw new Error(`Does not appear to be a valid TIFF file (size is smaller than 8)`);
  const buffer = await file.slice(0, 8).arrayBuffer();
  const view = new DataView(buffer);
  const endianness = view.getUint16(0, true);
  const signature = view.getUint16(2, endianness == Endianness.Little);
  const ifdOffset = view.getUint32(4, endianness == Endianness.Little);
  if (signature != 42) throw new Error(`Does not appear to be a valid TIFF file (signature is ${signature})`);
  return {
    endianness,
    signature,
    ifdOffset
  };
}

// lab/tiff-explorer/env.ts
var systemEndianness = new Uint8Array(new Uint16Array([
  255
]).buffer)[0] == 255 ? Endianness.Little : Endianness.Big;
function arrayOfU16(buffer, endianness, count = Math.floor(buffer.byteLength / 2)) {
  if (endianness == systemEndianness) return new Uint16Array(buffer, 0, count);
  const array = new Uint16Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getUint16(i << 1, endianness == Endianness.Little);
  return array;
}
function arrayOfU32(buffer, endianness, count = Math.floor(buffer.byteLength / 4)) {
  if (endianness == systemEndianness) return new Uint32Array(buffer, 0, count);
  const array = new Uint32Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getUint32(i << 2, endianness == Endianness.Little);
  return array;
}
function arrayOfI16(buffer, endianness, count = Math.floor(buffer.byteLength / 2)) {
  if (endianness == systemEndianness) return new Int16Array(buffer, 0, count);
  const array = new Int16Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getInt16(i << 1, endianness == Endianness.Little);
  return array;
}
function arrayOfI32(buffer, endianness, count = Math.floor(buffer.byteLength / 4)) {
  if (endianness == systemEndianness) return new Int32Array(buffer, 0, count);
  const array = new Int32Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getInt32(i << 2, endianness == Endianness.Little);
  return array;
}
function arrayOfF32(buffer, endianness, count = Math.floor(buffer.byteLength / 4)) {
  if (endianness == systemEndianness) return new Float32Array(buffer, 0, count);
  const array = new Float32Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getFloat32(i << 2, endianness == Endianness.Little);
  return array;
}
function arrayOfF64(buffer, endianness, count = Math.floor(buffer.byteLength / 4)) {
  if (endianness == systemEndianness) return new Float64Array(buffer, 0, count);
  const array = new Float64Array(count);
  const srcView = new DataView(buffer);
  for (let i = 0; i < count; i++) array[i] = srcView.getFloat64(i << 3, endianness == Endianness.Little);
  return array;
}

// lab/tiff-explorer/entry.ts
var entry_exports = {};
__export(entry_exports, {
  Type: () => Type,
  decode: () => decode2,
  tagInfo: () => tagInfo,
  valueTypes: () => valueTypes
});

// lab/tiff-explorer/names.json
var names_default = [
  { tag: 254, name: "NewSubfileType" },
  { tag: 255, name: "SubfileType" },
  { tag: 256, name: "ImageWidth" },
  { tag: 257, name: "ImageLength" },
  { tag: 258, name: "BitsPerSample" },
  { tag: 259, name: "Compression" },
  { tag: 262, name: "PhotometricInterpretation" },
  { tag: 264, name: "CellWidth" },
  { tag: 265, name: "CellLength" },
  { tag: 266, name: "FillOrder" },
  { tag: 270, name: "ImageDescription" },
  { tag: 271, name: "Make" },
  { tag: 272, name: "Model" },
  { tag: 273, name: "StripOffsets" },
  { tag: 274, name: "Orientation" },
  { tag: 277, name: "SamplesPerPixel" },
  { tag: 278, name: "RowsPerStrip" },
  { tag: 279, name: "StripByteCounts" },
  { tag: 282, name: "XResolution" },
  { tag: 283, name: "YResolution" },
  { tag: 284, name: "PlanarConfiguration" },
  { tag: 288, name: "FreeOffset" },
  { tag: 289, name: "FreeByteCounts" },
  { tag: 290, name: "GrayResponseUnit" },
  { tag: 291, name: "GrayResponseCurve" },
  { tag: 296, name: "ResolutionUnit" },
  { tag: 305, name: "Software" },
  { tag: 306, name: "DateTime" },
  { tag: 315, name: "Artist" },
  { tag: 316, name: "HostComputer" },
  { tag: 320, name: "ColorMap" },
  { tag: 338, name: "ExtraSamples" },
  { tag: 33432, name: "Copyright" }
];

// lab/tiff-explorer/entry.ts
var Type = /* @__PURE__ */ function(Type2) {
  Type2[Type2["Byte"] = 1] = "Byte";
  Type2[Type2["ASCII"] = 2] = "ASCII";
  Type2[Type2["Short"] = 3] = "Short";
  Type2[Type2["Long"] = 4] = "Long";
  Type2[Type2["Rational"] = 5] = "Rational";
  Type2[Type2["SByte"] = 6] = "SByte";
  Type2[Type2["Undefined"] = 7] = "Undefined";
  Type2[Type2["SShort"] = 8] = "SShort";
  Type2[Type2["SLong"] = 9] = "SLong";
  Type2[Type2["SRational"] = 10] = "SRational";
  Type2[Type2["Float"] = 11] = "Float";
  Type2[Type2["Double"] = 12] = "Double";
  Type2[Type2["Unknown"] = -1] = "Unknown";
  return Type2;
}({});
function arrayFromString(text, initial, valueFromString) {
  if (text.startsWith("[")) {
    if (!text.endsWith("]")) throw new Error(`Array must ends with ']'`);
    const substring = text.substring(1, text.length - 1).trim();
    if (substring.length == 0) return [];
    return substring.split(",").map(valueFromString);
  } else if (text.length > 0) {
    return [
      valueFromString(text)
    ];
  } else {
    return [
      initial
    ];
  }
}
function arrayToString(array, valueToString) {
  if (array.length == 1) return valueToString(array[0]);
  return `[${array.map(valueToString).join(", ")}]`;
}
function safeParseInt(x) {
  const v = parseInt(x);
  if (Number.isNaN(v)) throw new Error(`Invalid integer: ${x}`);
  return v;
}
function safeParseFloat(x) {
  const v = parseFloat(x);
  if (Number.isNaN(v)) throw new Error(`Invalid integer: ${x}`);
  return v;
}
var valueTypes = {
  [Type.Byte]: {
    byteSize: 1,
    defaultValue: new Uint8Array(),
    decode: async (content, count) => new Uint8Array(await content.arrayBuffer(), 0, count),
    valueFromString: (text) => new Uint8Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
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
    valueToString: (x) => x
  },
  [Type.Short]: {
    byteSize: 2,
    defaultValue: new Uint16Array(),
    decode: async (content, count, endianness) => arrayOfU16(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Uint16Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.Long]: {
    byteSize: 4,
    defaultValue: new Uint32Array(),
    decode: async (content, count, endianness) => arrayOfU32(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Uint32Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.Rational]: {
    byteSize: 8,
    get defaultValue() {
      return [];
    },
    decode: async (content, count, endianness) => {
      const view = new DataView(await content.arrayBuffer());
      const out = new Array();
      for (let i = 0; i < count; i++) {
        out[i] = {
          numerator: view.getUint32(i << 3, endianness == Endianness.Little),
          denominator: view.getUint32((i << 3) + 4, endianness == Endianness.Little)
        };
      }
      return out;
    },
    valueFromString: (text) => arrayFromString(text, {
      numerator: 0,
      denominator: 1
    }, (s) => {
      if (!s.includes("/")) throw new Error("Missing '/'");
      const [numerator, denominator] = s.split("/", 2).map(safeParseInt);
      return {
        numerator,
        denominator
      };
    }),
    valueToString: (value) => arrayToString(value, ({ numerator, denominator }) => `${numerator}/${denominator}`)
  },
  [Type.SByte]: {
    byteSize: 1,
    defaultValue: new Int8Array(),
    decode: async (content, count) => new Int8Array(await content.arrayBuffer(), 0, count),
    valueFromString: (text) => new Int8Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.Undefined]: {
    byteSize: 1,
    defaultValue: new Blob([]),
    decode: (content) => Promise.resolve(content)
  },
  [Type.SShort]: {
    byteSize: 2,
    defaultValue: new Int16Array(),
    decode: async (content, count, endianness) => arrayOfI16(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Int16Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.SLong]: {
    byteSize: 4,
    defaultValue: new Int32Array(),
    decode: async (content, count, endianness) => arrayOfI32(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Int32Array(arrayFromString(text, 0, safeParseInt)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.SRational]: {
    byteSize: 8,
    get defaultValue() {
      return [];
    },
    decode: async (content, count, endianness) => {
      const view = new DataView(await content.arrayBuffer());
      const out = new Array();
      for (let i = 0; i < count; i++) {
        out[i] = {
          numerator: view.getInt32(i << 3, endianness == Endianness.Little),
          denominator: view.getInt32(i << 3 + 4, endianness == Endianness.Little)
        };
      }
      return out;
    },
    valueFromString: (text) => arrayFromString(text, {
      numerator: 0,
      denominator: 1
    }, (s) => {
      if (!s.includes("/")) throw new Error("Missing '/'");
      const [numerator, denominator] = s.split("/", 2).map(safeParseInt);
      return {
        numerator,
        denominator
      };
    }),
    valueToString: (value) => arrayToString(value, ({ numerator, denominator }) => `${numerator}/${denominator}`)
  },
  [Type.Float]: {
    byteSize: 4,
    defaultValue: new Float32Array(),
    decode: async (content, count, endianness) => arrayOfF32(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Float32Array(arrayFromString(text, 0, safeParseFloat)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.Double]: {
    byteSize: 8,
    defaultValue: new Float64Array(),
    decode: async (content, count, endianness) => arrayOfF64(await content.arrayBuffer(), endianness, count),
    valueFromString: (text) => new Float64Array(arrayFromString(text, 0, safeParseFloat)),
    valueToString: (value) => arrayToString([
      ...value
    ], (x) => `${x}`)
  },
  [Type.Unknown]: {
    byteSize: -1,
    get defaultValue() {
      return {
        type: 32768
      };
    },
    decode() {
      throw new Error("Unknown type must be handled by decode()");
    }
  }
};
async function decode2(file, offset, endianness) {
  const buffer = await file.slice(offset, offset + 12).arrayBuffer();
  const view = new DataView(buffer);
  const tag = view.getUint16(0, endianness == Endianness.Little);
  const type = view.getUint16(2, endianness == Endianness.Little);
  const count = view.getUint32(4, endianness == Endianness.Little);
  const elementSize = valueTypes[type]?.byteSize ?? -1;
  if (elementSize == -1) return {
    tag,
    type: Type.Unknown,
    value: {
      type
    }
  };
  const valueSize = elementSize * count;
  const elementOffset = valueSize <= 4 ? offset + 8 : view.getUint32(8, endianness == Endianness.Little);
  const content = file.slice(elementOffset, elementOffset + valueSize);
  return {
    tag,
    type,
    value: await valueTypes[type].decode(content, count, endianness)
  };
}
var nameCache = null;
function tagInfo(tag) {
  if (nameCache == null) {
    nameCache = /* @__PURE__ */ new Map();
    names_default.forEach((n) => nameCache.set(n.tag, n));
  }
  return nameCache.get(tag) ?? null;
}

// lab/tiff-explorer/ifd.ts
async function decode3(file, offset, endianness) {
  const out = [];
  while (offset != 0) {
    const ifd = [];
    const countBuffer = await file.slice(offset, offset + 2).arrayBuffer();
    const count = new DataView(countBuffer).getUint16(0, endianness == Endianness.Little);
    for (let i = 0; i < count; i++) ifd.push(await decode2(file, offset + 2 + i * 12, endianness));
    const offsetBuffer = await file.slice(offset + 2 + count * 12, offset + 2 + count * 12 + 4).arrayBuffer();
    offset = new DataView(offsetBuffer).getUint32(0, endianness == Endianness.Little);
    out.push(ifd);
  }
  return out;
}

// lab/tiff-explorer/tiff.ts
async function decode4(file) {
  const header = await decode(file);
  const ifds = await decode3(file, header.ifdOffset, header.endianness);
  return {
    header,
    ifds
  };
}

// lab/tiff-explorer/ui/table.ts
function wrapAsTd(e, { rowSpan, colSpan } = {}) {
  const td = document.createElement("td");
  if (rowSpan != null) td.rowSpan = rowSpan;
  if (colSpan != null) td.colSpan = colSpan;
  if (Array.isArray(e)) td.append(...e);
  else td.append(e);
  return td;
}

// lab/tiff-explorer/ui/editor.entry.ts
var selectTemplate = document.createElement("select");
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
function makeEntryEditor(e, { onDelete } = {}) {
  const row = document.createElement("tr");
  const tagIdInput = document.createElement("input");
  tagIdInput.classList.add("tag-id");
  tagIdInput.classList.add("digit");
  tagIdInput.placeholder = "Tag ID";
  tagIdInput.value = `0x${e.tag.toString(16).padStart(4, "0")}`;
  const tagNameSpan = document.createElement("span");
  const tagName = document.createTextNode("(tag name)");
  tagName.textContent = entry_exports.tagInfo(e.tag)?.name ?? `Unknown`;
  tagNameSpan.classList.add("tag-name");
  tagNameSpan.append(tagName);
  const tagTypeSelect = selectTemplate.cloneNode(true);
  tagTypeSelect.selectedIndex = e.type - 1;
  const valueCell = document.createElement("td");
  valueCell.classList.add("tag-value-cell");
  refreshValueCell();
  function refreshValueCell() {
    while (valueCell.firstChild) valueCell.firstChild.remove();
    const typeInfo = entry_exports.valueTypes[e.type];
    if ("valueFromString" in typeInfo) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Value...";
      input.classList.add("tag-value");
      input.classList.add("digit");
      input.value = typeInfo.valueToString(e.value);
      valueCell.append(input);
      input.addEventListener("input", () => {
        try {
          e.value = typeInfo.valueFromString(input.value);
          input.setCustomValidity("");
        } catch (e2) {
          input.setCustomValidity(e2 instanceof Error ? e2.message : `${e2}`);
          input.reportValidity();
          console.warn(e2);
        }
      });
      return;
    }
    switch (e.type) {
      case entry_exports.Type.Undefined:
      default:
        valueCell.append(document.createTextNode("Not implemented"));
        break;
    }
  }
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.append(document.createTextNode("Delete"));
  row.append(wrapAsTd(tagIdInput), wrapAsTd(tagNameSpan), wrapAsTd(tagTypeSelect), valueCell, wrapAsTd(deleteButton));
  tagIdInput.addEventListener("input", () => {
    const s = tagIdInput.value;
    const v = s.startsWith("0x") ? parseInt(s.substring(2), 16) : parseInt(s);
    if (Number.isNaN(v)) {
      tagIdInput.setCustomValidity("Invalid input. Must matches (0x)?[0-9]+");
      tagIdInput.reportValidity();
    } else {
      tagName.textContent = entry_exports.tagInfo(v)?.name ?? `Unknown`;
      e.tag = v;
      tagIdInput.setCustomValidity("");
    }
  });
  tagTypeSelect.addEventListener("change", () => {
    const oldType = e.type;
    const newType = tagTypeSelect.selectedIndex + 1;
    if (oldType == newType) return;
    const oldTypeInfo = entry_exports.valueTypes[oldType];
    const newTypeInfo = entry_exports.valueTypes[newType];
    if ("valueFromString" in oldTypeInfo && "valueFromString" in newTypeInfo) {
      try {
        const intermediary = oldTypeInfo.valueToString(e.value);
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

// lab/tiff-explorer/ui/editor.ifd.ts
function makeIfdEditor(ifd, { onDelete } = {}) {
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
  addEntryRow.append(wrapAsTd(addEntryButton, {
    colSpan: 5
  }));
  section.append(headerRow, addEntryRow);
  function addEntryEditor(e) {
    const row = makeEntryEditor(e, {
      onDelete(e2) {
        const i = ifd.indexOf(e2);
        if (i == -1) return;
        ifd.splice(i, 1);
        row.remove();
        if (ifd.length == 0 && onDelete) onDelete(ifd);
      }
    });
    section.insertBefore(row, addEntryRow);
  }
  for (const e of ifd) addEntryEditor(e);
  addEntryButton.addEventListener("click", () => {
    const e = {
      tag: 0,
      type: entry_exports.Type.Long,
      value: new Uint32Array(1)
    };
    ifd.push(e);
    addEntryEditor(e);
  });
  deleteButton.addEventListener("click", () => {
    if (onDelete) onDelete(ifd);
  });
  return section;
}

// lab/tiff-explorer/ui/editor.ifds.ts
var tableTemplate = document.createElement("table");
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
function makeIfdsEditor(content) {
  const table = tableTemplate.cloneNode(true);
  const controlSection = document.createElement("tbody");
  const addIfdRow = document.createElement("tr");
  const addIfdButton = document.createElement("button");
  addIfdButton.type = "button";
  addIfdButton.classList.add("add-ifd-btn");
  addIfdButton.append(document.createTextNode("Add IFD"));
  addIfdRow.append(wrapAsTd(addIfdButton, {
    colSpan: 5
  }));
  controlSection.append(addIfdRow);
  table.append(controlSection);
  function addIfdEditor(ifd) {
    const section = makeIfdEditor(ifd, {
      onDelete(ifd2) {
        const idx = content.indexOf(ifd2);
        if (idx == -1) return;
        content.splice(idx, 1);
        section.remove();
      }
    });
    table.insertBefore(section, controlSection);
  }
  for (const ifd of content) addIfdEditor(ifd);
  addIfdButton.addEventListener("click", () => {
    const ifd = [
      {
        tag: 0,
        type: entry_exports.Type.Long,
        value: new Uint32Array([
          0
        ])
      }
    ];
    content.push(ifd);
    addIfdEditor(ifd);
  });
  return table;
}

// lab/tiff-explorer/index.ts
var importBtn = document.querySelector("#import-tiff");
var ifdsView = document.querySelector("#ifds > .view");
importBtn.addEventListener("click", async () => {
  const file = await requestFileBlob();
  const tiff = await decode4(file);
  while (ifdsView.firstChild) ifdsView.firstChild.remove();
  ifdsView.append(makeIfdsEditor(tiff.ifds));
});
