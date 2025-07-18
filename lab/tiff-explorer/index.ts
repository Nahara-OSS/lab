import { requestFileBlob } from "../../helper.ts";
import { decode as decodeTiff } from "./mod.ts";
import "./index.css";
import { makeIfdsEditor } from "./ui/editor.ifds.ts";

const importBtn = document.querySelector("#import-tiff") as HTMLButtonElement;
// const exportBtn = document.querySelector("#export-tiff") as HTMLButtonElement;

const ifdsView = document.querySelector("#ifds > .view") as HTMLDivElement;
// const previewView = document.querySelector("#ifds > .view") as HTMLDivElement;

importBtn.addEventListener("click", async () => {
    const file = await requestFileBlob();
    const tiff = await decodeTiff(file);

    while (ifdsView.firstChild) ifdsView.firstChild.remove();
    ifdsView.append(makeIfdsEditor(tiff.ifds));
});
