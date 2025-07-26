import {
    FragmentTarget,
    MergeVec2f,
    MergeVec4f,
    Scalar,
    SplitVec2f,
    SplitVec4f,
    Vec2f,
    Vec4f,
    VertexInput,
} from "./demo/nodes.ts";
import { buildPipeline, buildShaderSource } from "./demo/wgsl.ts";
import { Network, type Node, type NodeCreateOptions, type NodePart } from "./mod.ts";
import "./index.css";
import "./ui/preload.ts";

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter?.requestDevice()!;

const canvas = document.createElement("canvas");
const surface = canvas.getContext("webgpu")!;
surface.configure({ device, format: "rgba8unorm" });

interface NodeFactory<N extends Node> {
    readonly name: string;
    type: { new (options: NodeCreateOptions): N };
    populatePartInterface?(node: N, part: NodePart): Element;
}

function createInputField(initial: number, onValue: (v: number) => unknown): HTMLInputElement {
    const input = document.createElement("input");
    input.style.width = "100%";
    input.value = `${initial}`;

    input.addEventListener("input", () => {
        const value = parseFloat(input.value);
        if (Number.isNaN(value)) return;
        onValue(value);
    });

    return input;
}

const factories: NodeFactory<Node>[] = [
    {
        name: "Scalar",
        type: Scalar,
        populatePartInterface: (node: Scalar, part) => {
            const div = document.createElement("div");
            if (part != node.ui) return div;
            div.append(createInputField(node.value, (v) => node.value = v));
            return div;
        },
    },
    {
        name: "2D Vector",
        type: Vec2f,
        populatePartInterface: (node: Vec2f, part) => {
            const div = document.createElement("div");
            if (part != node.ui) return div;
            div.append(
                createInputField(node.valueX, (v) => node.valueX = v),
                createInputField(node.valueY, (v) => node.valueY = v),
            );
            return div;
        },
    },
    { name: "Split 2D Vector", type: SplitVec2f },
    { name: "Merge 2D Vector", type: MergeVec2f },
    {
        name: "4D Vector",
        type: Vec4f,
        populatePartInterface: (node: Vec4f, part) => {
            const div = document.createElement("div");
            if (part != node.ui) return div;
            div.append(
                createInputField(node.valueX, (v) => node.valueX = v),
                createInputField(node.valueY, (v) => node.valueY = v),
                createInputField(node.valueZ, (v) => node.valueZ = v),
                createInputField(node.valueW, (v) => node.valueW = v),
            );
            return div;
        },
    },
    { name: "Split 4D Vector", type: SplitVec4f },
    { name: "Merge 4D Vector", type: MergeVec4f },
    { name: "Fragment Inputs", type: VertexInput },
    {
        name: "Fragment Target",
        type: FragmentTarget,
        populatePartInterface: (node: FragmentTarget, part) => {
            const div = document.createElement("div");
            if (part != node.ui) return div;

            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.gap = "4px";
            div.style.padding = "0 0 12px 0";

            const renderBtn = document.createElement("button");
            renderBtn.textContent = "Render";
            renderBtn.addEventListener("click", () => {
                const pipeline = buildPipeline(device, node);
                const commandEncoder = device.createCommandEncoder();
                const renderPass = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: surface.getCurrentTexture().createView(),
                            loadOp: "clear",
                            storeOp: "store",
                        },
                    ],
                });
                renderPass.setPipeline(pipeline);
                renderPass.draw(4);
                renderPass.end();
                device.queue.submit([commandEncoder.finish()]);
            });

            const copyPngBtn = document.createElement("button");
            copyPngBtn.textContent = "Copy PNG";
            copyPngBtn.addEventListener("click", async () => {
                const canvas = new OffscreenCanvas(1024, 1024);
                const surface = canvas.getContext("webgpu")!;
                surface.configure({ device, format: "rgba8unorm" });

                const pipeline = buildPipeline(device, node);
                const commandEncoder = device.createCommandEncoder();
                const renderPass = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: surface.getCurrentTexture().createView(),
                            loadOp: "clear",
                            storeOp: "store",
                        },
                    ],
                });
                renderPass.setPipeline(pipeline);
                renderPass.draw(4);
                renderPass.end();
                device.queue.submit([commandEncoder.finish()]);

                const data = await canvas.convertToBlob({ type: "image/png" });
                await navigator.clipboard.write([new ClipboardItem({ "image/png": data })]);
            });

            const copyWgslBtn = document.createElement("button");
            copyWgslBtn.textContent = "Copy WGSL";
            copyWgslBtn.addEventListener("click", () => {
                const source = buildShaderSource(node);
                navigator.clipboard.write([new ClipboardItem({ "text/plain": source })]);
            });

            div.append(renderBtn, copyPngBtn, copyWgslBtn);
            return div;
        },
    },
];

const view = document.createElement("nahara-network-view");
let existingMenu: HTMLDivElement | null = null;

view.addEventListener("pointerdown", (e) => {
    if (e.buttons == 1) {
        existingMenu?.remove();
        existingMenu = null;
    }
});

view.addEventListener("nodeoption", (e) => {
    existingMenu?.remove();

    const menu = document.createElement("div");
    menu.classList.add("context-menu");
    menu.style.left = `${e.parent.clientX}px`;
    menu.style.top = `${e.parent.clientY + 1}px`;

    if (e.node != null) {
        const node = e.node;

        const label = document.createElement("div");
        label.classList.add("label");
        label.textContent = e.node.name;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete node";
        deleteBtn.addEventListener("click", () => {
            for (const socket of node.sockets.values()) socket.disconnectAll();
            view.network?.deleteNode(node);
            existingMenu?.remove();
            existingMenu = null;
        });

        menu.append(label, deleteBtn);
    } else {
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add node";
        addBtn.addEventListener("click", () => {
            existingMenu?.remove();

            const menu = document.createElement("div");
            menu.classList.add("context-menu");
            menu.style.left = `${e.parent.clientX}px`;
            menu.style.top = `${e.parent.clientY + 1}px`;

            const label = document.createElement("div");
            label.classList.add("label");
            label.textContent = "Add node";
            menu.append(label);

            factories.forEach((factory) => {
                const btn = document.createElement("button");
                btn.textContent = factory.name;

                btn.addEventListener("click", () => {
                    const node = new factory.type({
                        name: factory.name,
                        x: e.parent.clientX - view.panX,
                        y: e.parent.clientY - view.panY,
                    });
                    view.network?.addNode(node);
                    existingMenu?.remove();
                    existingMenu = null;
                });

                menu.append(btn);
            });

            existingMenu = menu;
            document.body.append(menu);
        });

        menu.append(addBtn);
    }

    existingMenu = menu;
    document.body.append(menu);
});

view.addEventListener("contextmenu", (e) => e.preventDefault());

const partToElement = new Map<NodePart, Element>();

view.addEventListener("partshow", (e) => {
    const factory = factories.find((factory) => e.part.node instanceof factory.type);
    if (factory == null) return;

    if (factory.populatePartInterface) {
        const element = factory.populatePartInterface(e.part.node, e.part);
        element.slot = e.slot;
        view.append(element);
        partToElement.set(e.part, element);
    }
});

view.addEventListener("parthide", (e) => {
    const element = partToElement.get(e.part);

    if (element != null) {
        element.remove();
        partToElement.delete(e.part);
    }
});

document.body.append(canvas, view);

{
    // Sample node network
    view.network = new Network();

    const inputs = new VertexInput({ name: "Fragment Inputs", x: 240 * 0, y: 0 });
    const split = new SplitVec2f({ name: "Split 2D Vector", x: 240 * 1, y: 0 });
    const scalar = new Scalar({ name: "Scalar", x: 240 * 1, y: 112 });
    const merge = new MergeVec4f({ name: "Merge 4D Vector", x: 240 * 2, y: 0 });
    const target = new FragmentTarget({ name: "Fragment Target", x: 240 * 3, y: 0 });

    scalar.value = 1;

    view.network.addNode(inputs);
    view.network.addNode(split);
    view.network.addNode(scalar);
    view.network.addNode(merge);
    view.network.addNode(target);

    inputs.uv.connect(split.vector);
    split.valueX.connect(merge.valueX);
    split.valueY.connect(merge.valueY);
    scalar.output.connect(merge.valueZ);
    merge.vector.connect(target.color);
}
