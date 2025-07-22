import type { Network } from "../network.ts";
import type { Node } from "../node.ts";
import css from "./network-view.css" with { type: "text" };
import { NodeViewElement } from "./node-view.ts";

const stylesheet = await new CSSStyleSheet().replace(css);

export class NetworkViewElement extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });
    #nodeContainerDiv: HTMLDivElement;
    #attached = false;

    #network: Network | null = null;
    #nodes = new Map<Node, NodeViewElement>();
    #panX = 0;
    #panY = 0;

    #onNetworkAddNode = (e: CustomEvent<Node>) => this.#addNode(e.detail);
    #onNetworkRemoveNode = (e: CustomEvent<Node>) => this.#addNode(e.detail);
    #onNodeUpdate = (e: CustomEvent<Node>) => this.#updateNode(e.detail);

    constructor() {
        super();
        this.#shadow.adoptedStyleSheets = [stylesheet];

        const wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        this.#shadow.append(wrapper);

        this.#nodeContainerDiv = document.createElement("div");
        this.#nodeContainerDiv.classList.add("node-container");
        this.#nodeContainerDiv.style.backgroundPositionX = `${this.#panX}px`;
        this.#nodeContainerDiv.style.backgroundPositionY = `${this.#panY}px`;
        wrapper.append(this.#nodeContainerDiv);

        this.#nodeContainerDiv.addEventListener("pointerdown", (e) => {
            if (e.target != this.#nodeContainerDiv) return;
            e.preventDefault();

            const initialX = e.clientX;
            const initialY = e.clientY;
            const initialPanX = this.#panX;
            const initialPanY = this.#panY;

            const pointerMove = (e: PointerEvent) => {
                e.preventDefault();
                const dx = e.clientX - initialX;
                const dy = e.clientY - initialY;
                this.#panX = initialPanX + dx;
                this.#panY = initialPanY + dy;

                for (const [node, nodeView] of this.#nodes) {
                    nodeView.style.left = `${node.x + this.#panX}px`;
                    nodeView.style.top = `${node.y + this.#panY}px`;
                }

                this.#nodeContainerDiv.style.backgroundPositionX = `${this.#panX}px`;
                this.#nodeContainerDiv.style.backgroundPositionY = `${this.#panY}px`;
            };

            const pointerUp = () => {
                document.removeEventListener("pointermove", pointerMove);
                document.removeEventListener("pointerup", pointerUp);
            };

            document.addEventListener("pointermove", pointerMove);
            document.addEventListener("pointerup", pointerUp);
        });
    }

    get network(): Network | null {
        return this.#network;
    }

    set network(v: Network | null) {
        if (this.#network == v) return;

        if (this.#attached) {
            if (this.#network != null) this.#networkDetach(this.#network);
            if (v != null) this.#networkAttach(v);
        }

        this.#network = v;
    }

    #networkAttach(network: Network) {
        for (const node of network.nodes) this.#addNode(node);

        network.removeEventListener("addnode", this.#onNetworkAddNode);
        network.removeEventListener("removenode", this.#onNetworkRemoveNode);
    }

    #networkDetach(network: Network) {
        for (const node of network.nodes) this.#removeNode(node);

        network.removeEventListener("addnode", this.#onNetworkAddNode);
        network.removeEventListener("removenode", this.#onNetworkRemoveNode);
    }

    connectedCallback(): void {
        this.#attached = true;
        if (this.#network) this.#networkAttach(this.#network);
    }

    disconnectedCallback(): void {
        this.#attached = false;
        if (this.#network) this.#networkDetach(this.#network);
    }

    #addNode(node: Node): void {
        if (this.#nodes.has(node)) return;

        const nodeViewId = customElements.getName(NodeViewElement);
        if (nodeViewId == null) throw new Error(`NodeViewElement is not registered to customElements`);

        const nodeView = document.createElement(nodeViewId) as NodeViewElement;
        nodeView.classList.add("node");
        nodeView.node = node;
        this.#nodes.set(node, nodeView);
        this.#updateNode(node);
        this.#nodeContainerDiv.append(nodeView);

        node.addEventListener("update", this.#onNodeUpdate);
    }

    #removeNode(node: Node): void {
        const nodeView = this.#nodes.get(node);
        if (nodeView == null) return;

        nodeView.remove();
        this.#nodes.delete(node);

        node.removeEventListener("update", this.#onNodeUpdate);
    }

    #updateNode(node: Node): void {
        const nodeView = this.#nodes.get(node);
        if (nodeView == null) return;

        nodeView.style.width = `${node.width}px`;
        nodeView.style.left = `${node.x + this.#panX}px`;
        nodeView.style.top = `${node.y + this.#panY}px`;
    }
}
