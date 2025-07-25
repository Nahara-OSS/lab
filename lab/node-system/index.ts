import {
    FragmentTarget,
    MergeVec2f,
    MergeVec4f,
    SplitVec2f,
    SplitVec4f,
    StringReader,
    Todo,
    Vec4f,
    VertexInput,
} from "./demo/nodes.ts";
import { buildPipeline, buildShaderSource } from "./demo/wgsl.ts";
import "./index.css";
import { Network } from "./mod.ts";
import "./ui/preload.ts";

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter?.requestDevice()!;

const canvas = document.createElement("canvas");
const surface = canvas.getContext("webgpu")!;
surface.configure({ device, format: "rgba8unorm" });

const view = document.createElement("nahara-network-view");
view.addEventListener("partshow", (e) => {
    const node = e.part.node;
    const div = document.createElement("div");
    div.slot = e.slot;
    div.style.width = "100%";
    div.style.height = "100%";

    if (node instanceof Vec4f) {
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.padding = "4px 0";

        const makeControl = (value: number, onChange: (newValue: number) => unknown): HTMLInputElement => {
            const input = document.createElement("input");
            input.style.width = "100%";
            input.type = "text";
            input.value = `${value}`;

            input.oninput = () => {
                const v = parseFloat(input.value);
                if (Number.isNaN(v)) return;
                onChange(v);
            };

            return input;
        };

        div.append(
            makeControl(node.valueX, (x) => node.valueX = x),
            makeControl(node.valueY, (x) => node.valueY = x),
            makeControl(node.valueZ, (x) => node.valueZ = x),
            makeControl(node.valueW, (x) => node.valueW = x),
        );
    }

    if (node instanceof FragmentTarget) {
        div.style.display = "flex";
        div.style.gap = "4px";
        div.style.alignItems = "center";

        const renderBtn = document.createElement("button");
        renderBtn.textContent = "Render";
        renderBtn.addEventListener("click", () => {
            const pipeline = buildPipeline(device, node);
            const commandEncoder = device.createCommandEncoder();
            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        loadOp: "clear",
                        storeOp: "store",
                        view: surface.getCurrentTexture().createView(),
                        clearValue: [0, 0, 0, 1],
                    },
                ],
            });
            renderPass.setPipeline(pipeline);
            renderPass.draw(4);
            renderPass.end();
            device.queue.submit([commandEncoder.finish()]);
        });

        const shaderBtn = document.createElement("button");
        shaderBtn.textContent = "Shader";
        shaderBtn.addEventListener("click", () => {
            const source = buildShaderSource(node);
            console.log(source);
        });

        div.append(renderBtn, shaderBtn);
    }

    if (node instanceof Todo) {
        const part = e.part;
        div.style.display = "flex";
        div.style.gap = "4px";
        div.style.alignItems = "center";

        if (part == node.control) {
            const addBtn = document.createElement("button");
            addBtn.textContent = "Add todo";
            addBtn.addEventListener("click", () => node.addTodo());

            div.append(addBtn);
        } else {
            const content = node.content.get(part);

            const input = document.createElement("input");
            input.style.width = "100%";
            input.type = "text";
            input.value = content?.[0] ?? "";
            input.addEventListener("input", () => node.changeContent(part, input.value));

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "-";
            deleteBtn.addEventListener("click", () => node.deleteTodo(part));

            div.append(input, deleteBtn);
        }
    }

    view.append(div);
});

const runBtn = document.createElement("button");
runBtn.textContent = "Run";
runBtn.style.position = "absolute";
runBtn.style.left = "16px";
runBtn.style.top = "16px";
runBtn.addEventListener("click", () => console.log(network));

document.body.append(canvas, view, runBtn);

const network = new Network();
view.network = network;

// Basic
network.addNode(new VertexInput({ name: "Vertex Input", x: 240 * 0 }));
network.addNode(new Vec4f({ name: "Vector 4D", x: 240 * 1 }));
network.addNode(new SplitVec4f({ name: "Split 4D Vector", x: 240 * 2 }));
network.addNode(new MergeVec4f({ name: "Merge 4D Vector", x: 240 * 3 }));
network.addNode(new SplitVec2f({ name: "Split 2D Vector", x: 240 * 4 }));
network.addNode(new MergeVec2f({ name: "Merge 2D Vector", x: 240 * 5 }));
network.addNode(new FragmentTarget({ name: "Fragment Target", x: 240 * 6 }));

// Dynamic
network.addNode(new Todo({ name: "Todo", x: 240 * 0, y: 240 }));
network.addNode(new StringReader({ name: "String Reader", x: 240 * 1, y: 240 }));
