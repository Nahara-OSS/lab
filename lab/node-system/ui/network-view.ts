import type { Network } from "../network.ts";
import type { Node, NodeConnectionEvent, Socket } from "../node.ts";
import css from "./network-view.css" with { type: "text" };
import { NodeViewElement } from "./node-view.ts";
import { procgenColor } from "./procgen.ts";

const stylesheet = await new CSSStyleSheet().replace(css);

interface WireInfo {
    readonly src: Socket;
    readonly dst: Socket;
    readonly wire: SVGPathElement;
}

export class NetworkViewElement extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });
    #wireContainerSvg: SVGSVGElement;
    #nodeContainerDiv: HTMLDivElement;
    #attached = false;

    #network: Network | null = null;
    #nodes = new Map<Node, NodeViewElement>();
    #wires: WireInfo[] = [];
    #panX = 0;
    #panY = 0;

    #connecting: SVGPathElement | null = null;
    #connectingFrom: Socket | null = null;
    #connectingTo: Socket | null = null;

    #onNetworkAddNode = (e: CustomEvent<Node>) => this.#addNode(e.detail);
    #onNetworkRemoveNode = (e: CustomEvent<Node>) => this.#removeNode(e.detail);
    #onNodeUpdate = (e: CustomEvent<Node>) => this.#updateNode(e.detail);
    #onNodeConnect = (e: NodeConnectionEvent) => e.target == e.src.node ? this.#addWire(e.src, e.dst) : void 0;
    #onNodeDisconnect = (e: NodeConnectionEvent) => e.target == e.src.node ? this.#removeWire(e.src, e.dst) : void 0;

    constructor() {
        super();
        this.#shadow.adoptedStyleSheets = [stylesheet];

        const wrapper = document.createElement("div");
        wrapper.classList.add("wrapper");
        this.#shadow.append(wrapper);

        this.#wireContainerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.#wireContainerSvg.classList.add("wire-container");
        this.#wireContainerSvg.style.backgroundPositionX = `${this.#panX}px`;
        this.#wireContainerSvg.style.backgroundPositionY = `${this.#panY}px`;

        this.#nodeContainerDiv = document.createElement("div");
        this.#nodeContainerDiv.classList.add("node-container");

        wrapper.append(
            this.#wireContainerSvg,
            this.#nodeContainerDiv,
        );

        this.#wireContainerSvg.addEventListener("pointerdown", (e) => {
            if (e.target != this.#wireContainerSvg) return;
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

                for (const [node] of this.#nodes) this.#updateNode(node);
                for (const wire of this.#wires) this.#updateWire(wire);

                this.#wireContainerSvg.style.backgroundPositionX = `${this.#panX}px`;
                this.#wireContainerSvg.style.backgroundPositionY = `${this.#panY}px`;
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

        network.addEventListener("addnode", this.#onNetworkAddNode);
        network.addEventListener("removenode", this.#onNetworkRemoveNode);
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
        node.addEventListener("connect", this.#onNodeConnect);
        node.addEventListener("disconnect", this.#onNodeDisconnect);

        nodeView.addEventListener("socketdown", (e) => {
            if (this.#connectingFrom != null) return;
            this.#connectingFrom = e.socket;
            this.#updateConnectingWire(e.parent);

            const pointerMove = (e: PointerEvent): void => {
                this.#updateConnectingWire(e);
            };

            const pointerUp = (e: PointerEvent) => {
                if (this.#connectingFrom != null) {
                    // TODO: Open node picker menu when connecting to air
                    this.#connectingFrom = null;
                    this.#updateConnectingWire(e);
                }

                document.removeEventListener("pointermove", pointerMove);
                document.removeEventListener("pointerup", pointerUp);
            };

            document.addEventListener("pointermove", pointerMove);
            document.addEventListener("pointerup", pointerUp);
        });

        nodeView.addEventListener("socketenter", (e) => {
            if (this.#connectingFrom == null) return;
            if (!this.#connectingFrom.canConnectTo(e.socket)) return;
            this.#connectingTo = e.socket;
            this.#updateConnectingWire(e.parent);
        });

        nodeView.addEventListener("socketleave", (e) => {
            if (this.#connectingFrom == null) return;
            if (this.#connectingTo != e.socket) return;
            this.#connectingTo = null;
            this.#updateConnectingWire(e.parent);
        });

        nodeView.addEventListener("socketup", (e) => {
            if (this.#connectingFrom == null) return;
            if (!this.#connectingFrom.canConnectTo(e.socket)) return;
            this.#connectingFrom.connect(e.socket);
            this.#connectingFrom = null;
            this.#connectingTo = null;
            this.#updateConnectingWire(e.parent);
        });
    }

    #removeNode(node: Node): void {
        const nodeView = this.#nodes.get(node);
        if (nodeView == null) return;

        nodeView.remove();
        this.#nodes.delete(node);

        node.removeEventListener("update", this.#onNodeUpdate);
        node.removeEventListener("connect", this.#onNodeConnect);
        node.removeEventListener("disconnect", this.#onNodeDisconnect);
    }

    #updateNode(node: Node): void {
        const nodeView = this.#nodes.get(node);
        if (nodeView == null) return;

        nodeView.style.width = `${node.width}px`;
        nodeView.style.left = `${node.x + this.#panX}px`;
        nodeView.style.top = `${node.y + this.#panY}px`;

        for (const a of node.sockets.values()) {
            for (const b of a.targets) {
                const src = a.direction == "in" ? b : a;
                const dst = a.direction == "in" ? a : b;
                const idx = this.#wires.findIndex(({ src: s, dst: d }) => s == src && d == dst);
                if (idx == -1) continue;
                this.#updateWire(this.#wires[idx]);
            }
        }
    }

    #addWire(src: Socket, dst: Socket): void {
        const idx = this.#wires.findIndex(({ src: s, dst: d }) => s == src && d == dst);
        if (idx != -1) return;

        const wire = document.createElementNS("http://www.w3.org/2000/svg", "path");
        wire.classList.add("wire");
        this.#wireContainerSvg.append(wire);

        const info: WireInfo = { src, dst, wire };
        this.#updateWire(info);
        this.#wires.push(info);

        wire.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.buttons == 1) src.disconnect(dst);
        });
    }

    #removeWire(src: Socket, dst: Socket): void {
        const idx = this.#wires.findIndex(({ src: s, dst: d }) => s == src && d == dst);
        if (idx == -1) return;

        const [{ wire }] = this.#wires.splice(idx, 1);
        wire.remove();
    }

    #updateWire(info: WireInfo): void {
        const [sx, sy] = this.#socketPositionOf(info.src);
        const [dx, dy] = this.#socketPositionOf(info.dst);
        const diff = Math.abs(dx - sx);

        info.wire.setAttribute("d", `M ${sx},${sy} C ${sx + diff / 2},${sy},${dx - diff / 2},${dy},${dx},${dy}`);
        info.wire.setAttribute("stroke", procgenColor(info.src.type));
    }

    #socketPositionOf(socket: Socket): [number, number] {
        const { x: nx, y: ny } = socket.node;
        const sideX = socket.direction == "in" ? 0 : socket.node.width;

        return [
            this.#panX + nx + sideX,
            this.#panY + ny + 44 + socket.position * 24,
        ];
    }

    #updateConnectingWire(e: PointerEvent): void {
        if (this.#connectingFrom == null) {
            this.#connecting?.remove();
            this.#connecting = null;
            return;
        }

        if (this.#connecting == null) {
            this.#connecting = document.createElementNS("http://www.w3.org/2000/svg", "path");
            this.#connecting.classList.add("wire");
            this.#connecting.classList.add("connecting");
            this.#connecting.style.stroke = procgenColor(this.#connectingFrom.type); // !override
            this.#wireContainerSvg.append(this.#connecting);
        }

        const { left, top } = this.#wireContainerSvg.getBoundingClientRect();
        const [sx, sy] = this.#socketPositionOf(this.#connectingFrom);
        const [dx, dy] = this.#connectingTo != null
            ? this.#socketPositionOf(this.#connectingTo)
            : [e.clientX - left, e.clientY - top];
        const diff = Math.abs(dx - sx);
        const acpx = this.#connectingFrom.direction == "in" ? -diff / 2 : diff / 2;
        const bcpx = this.#connectingFrom.direction == "in" ? diff / 2 : -diff / 2;
        this.#connecting.setAttribute("d", `M ${sx},${sy} C ${sx + acpx},${sy},${dx + bcpx},${dy},${dx},${dy}`);
    }
}
