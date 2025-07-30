import { Network, type Node, type NodePart } from "./mod.ts";
import "./index.css";
import "./ui/preload.ts";
import {
    ConstF32Node,
    ConstVec2fNode,
    ConstVec3fNode,
    ConstVec4fNode,
    MathF32Node,
    MathVec2fNode,
    MathVec3fNode,
    MathVec4fNode,
    MergeVec2fNode,
    MergeVec3fNode,
    MergeVec4fNode,
    SplitVec2fNode,
    SplitVec3fNode,
    SplitVec4fNode,
} from "./demo/nodes.vector.ts";
import type { NodeFactory } from "./demo/nodes.base.ts";
import { RenderOutputNode, VertexInputNode } from "./demo/nodes.shader.ts";

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter?.requestDevice()!;

const factories: (NodeFactory<Node> | string)[] = [
    "Input",
    VertexInputNode.factory,
    "Output",
    RenderOutputNode.createFactory(device),
    "Number",
    ConstF32Node.factory,
    MathF32Node.factory,
    "2D Vector",
    ConstVec2fNode.factory,
    SplitVec2fNode.factory,
    MergeVec2fNode.factory,
    MathVec2fNode.factory,
    "3D Vector",
    ConstVec3fNode.factory,
    SplitVec3fNode.factory,
    MergeVec3fNode.factory,
    MathVec3fNode.factory,
    "4D Vector",
    ConstVec4fNode.factory,
    SplitVec4fNode.factory,
    MergeVec4fNode.factory,
    MathVec4fNode.factory,
];

const view = document.createElement("nahara-network-view");
let existingMenu: HTMLDivElement | null = null;

view.addEventListener("pointerdown", (e) => {
    if (e.buttons != 2) {
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

            factories.forEach((factory) => {
                if (typeof factory == "string") {
                    const label = document.createElement("div");
                    label.classList.add("label");
                    label.textContent = factory;
                    menu.append(label);
                } else {
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
                }
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
    const factory = factories.find((factory) => typeof factory != "string" && e.part.node instanceof factory.type);
    if (factory == null) return;

    if ((factory as NodeFactory<Node>).populatePartInterface) {
        const element = (factory as NodeFactory<Node>).populatePartInterface!(e.part.node, e.part);
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

document.body.append(view);
view.network = new Network();
