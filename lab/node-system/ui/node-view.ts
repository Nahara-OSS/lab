import type { Node, NodePart, Socket, SocketTransferEvent } from "../mod.ts";
import css from "./node-view.css" with { type: "text" };
import { procgenColor } from "./procgen.ts";

const stylesheet = await new CSSStyleSheet().replace(css);

export class NodeViewElement extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });
    #title: Text;
    #node: Node | null = null;
    #parts = new Map<NodePart, PartViewInfo>();
    #attached = false;
    #slotIdCounter = 0;

    snapX: number = 8;
    snapY: number = 8;

    #updateListener = (e: CustomEvent<Node>) => this.#onNodeUpdate(e.detail);
    #addSocketListener = (e: CustomEvent<Socket>) => this.#onAddSocket(e.detail);
    #transferSocketListener = (e: SocketTransferEvent) => this.#onTransferSocket(e.socket, e.from, e.to);
    #removeSocketListener = (e: CustomEvent<Socket>) => this.#onRemoveSocket(e.detail);
    #addPartListener = (e: CustomEvent<NodePart>) => this.#onAddPart(e.detail);
    #removePartListener = (e: CustomEvent<NodePart>) => this.#onRemovePart(e.detail);

    constructor() {
        super();
        this.#shadow.adoptedStyleSheets = [stylesheet];

        const titleDiv = document.createElement("div");
        titleDiv.classList.add("title");
        titleDiv.part.add("title");
        titleDiv.append(this.#title = document.createTextNode("Node"));
        this.#shadow.append(titleDiv);

        titleDiv.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            if (this.#node == null) return;

            if (e.buttons == 1) {
                const node = this.#node;
                const initialX = e.clientX;
                const initialY = e.clientY;
                const initialNodeX = this.#node.x;
                const initialNodeY = this.#node.y;

                const pointerMove = (e: PointerEvent) => {
                    e.preventDefault();
                    const dx = e.clientX - initialX;
                    const dy = e.clientY - initialY;
                    node.x = this.snapX > 0
                        ? Math.round((initialNodeX + dx) / this.snapX) * this.snapX
                        : initialNodeX + dx;
                    node.y = this.snapY > 0
                        ? Math.round((initialNodeY + dy) / this.snapY) * this.snapY
                        : initialNodeY + dy;
                };

                const pointerUp = () => {
                    document.removeEventListener("pointermove", pointerMove);
                    document.removeEventListener("pointerup", pointerUp);
                };

                document.addEventListener("pointermove", pointerMove);
                document.addEventListener("pointerup", pointerUp);
            }
        });
    }

    get node(): Node | null {
        return this.#node;
    }

    set node(v: Node | null) {
        if (this.#node == v) return;

        if (this.#attached) {
            if (this.#node != null) this.#nodeDetach(this.#node);
            if (v != null) this.#nodeAttach(v);
            this.#onNodeUpdate(v);
        }

        this.#node = v;
    }

    #nodeAttach(node: Node) {
        for (const part of node.parts) this.#onAddPart(part);
        for (const socket of node.sockets.values()) this.#onAddSocket(socket);

        node.addEventListener("update", this.#updateListener);
        node.addEventListener("addsocket", this.#addSocketListener);
        node.addEventListener("transfersocket", this.#transferSocketListener);
        node.addEventListener("removesocket", this.#removeSocketListener);
        node.addEventListener("addpart", this.#addPartListener);
        node.addEventListener("removepart", this.#removePartListener);
    }

    #nodeDetach(node: Node) {
        for (const socket of node.sockets.values()) this.#onRemoveSocket(socket);
        for (const part of node.parts) this.#onRemovePart(part);

        node.removeEventListener("update", this.#updateListener);
        node.removeEventListener("addsocket", this.#addSocketListener);
        node.removeEventListener("transfersocket", this.#transferSocketListener);
        node.removeEventListener("removesocket", this.#removeSocketListener);
        node.removeEventListener("addpart", this.#addPartListener);
        node.removeEventListener("removepart", this.#removePartListener);
    }

    connectedCallback(): void {
        this.#attached = true;
        if (this.#node) this.#nodeAttach(this.#node);
        this.#onNodeUpdate(this.#node);
    }

    disconnectedCallback(): void {
        this.#attached = false;
        if (this.#node) this.#nodeDetach(this.#node);
    }

    /**
     * Obtain the `<slot>` name for given node part. Returns `null` if such part does not have an associated slot name.
     * The function may always return `null` if `<nahara-node-view>` is not attached to the DOM tree.
     */
    getPartSlot(part: NodePart): string | null {
        return this.#parts.get(part)?.slot?.name ?? null;
    }

    #onNodeUpdate(node: Node | null): void {
        this.#title.textContent = node?.name ?? "Node";
    }

    #onAddPart(part: NodePart): void {
        const partView: PartViewInfo = { container: document.createElement("div"), sockets: [], slot: null };
        partView.container.style.minHeight = `${part.minHeight}px`;
        partView.container.classList.add("node-part");

        if (part.ui) {
            partView.slot = document.createElement("slot");
            partView.slot.classList.add("content");
            partView.slot.name = `${this.#slotIdCounter++}`;
            partView.container.append(partView.slot);
            this.dispatchEvent(new PartVisiblityEvent("partshow", part, partView.slot.name));
        }

        this.#parts.set(part, partView);
        this.#shadow.append(partView.container);
    }

    #onRemovePart(part: NodePart): void {
        const partView = this.#parts.get(part);
        if (partView == null) return;
        if (partView.slot != null) this.dispatchEvent(new PartVisiblityEvent("parthide", part, partView.slot.name));
        partView.container.remove();
        this.#parts.delete(part);
    }

    #onAddSocket(socket: Socket): void {
        const partElements = this.#parts.get(socket.part);
        if (partElements == null) return;

        const socketDiv = document.createElement("div");
        socketDiv.classList.add("socket");
        socketDiv.classList.add(socket.direction);
        socketDiv.part.add("socket");
        socketDiv.part.add(socket.direction);
        socketDiv.append(document.createTextNode(socket.name ?? socket.id), createTypeIndicator(socket.type));
        partElements.container.insertBefore(socketDiv, partElements.slot);
        partElements.sockets.push([socket, socketDiv]);

        socketDiv.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            if (e.buttons == 1) this.dispatchEvent(new SocketPointerEvent("socketdown", socket, e));
        });

        socketDiv.addEventListener("pointerup", (e) => {
            // TODO: figure out how to handle touch going outside the bounds
            e.preventDefault();
            this.dispatchEvent(new SocketPointerEvent("socketup", socket, e));
        });

        socketDiv.addEventListener("pointerenter", (e) => {
            e.preventDefault();
            this.dispatchEvent(new SocketPointerEvent("socketenter", socket, e));
        });

        socketDiv.addEventListener("pointerleave", (e) => {
            e.preventDefault();
            this.dispatchEvent(new SocketPointerEvent("socketleave", socket, e));
        });
    }

    #onRemoveSocket(socket: Socket): void {
        const partElements = this.#parts.get(socket.part);
        if (partElements == null) return;

        const idx = partElements.sockets.findIndex(([s]) => s == socket);
        if (idx == -1) return;

        partElements.sockets[idx][1].remove();
        partElements.sockets.splice(idx, 1);
    }

    #onTransferSocket(socket: Socket, from: NodePart, to: NodePart): void {
        const fromPartView = this.#parts.get(from);
        const toPartView = this.#parts.get(to);
        if (fromPartView == null || toPartView == null) return;

        const idxFrom = fromPartView.sockets.findIndex(([s]) => s == socket);
        if (idxFrom == -1) return;

        const [[_, socketDiv]] = fromPartView.sockets.splice(idxFrom, 1);
        const idxTo = to.sockets.indexOf(socket);
        const before = (idxTo != -1 ? toPartView.sockets[idxTo]?.[1] : null) ?? toPartView.slot;
        toPartView.container.insertBefore(socketDiv, before);
    }
}

function createTypeIndicator(type: string): HTMLDivElement {
    const div = document.createElement("div");
    div.classList.add("type-indicator");
    div.style.backgroundColor = procgenColor(type);
    div.part.add("type-indicator");
    div.part.add(type);
    return div;
}

export interface NodeViewElement {
    addEventListener<K extends keyof NodeViewElementEventMap>(
        type: K,
        callback: (this: Node, e: NodeViewElementEventMap[K]) => unknown,
        options?: AddEventListenerOptions | boolean,
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void;
    removeEventListener<K extends keyof NodeViewElementEventMap>(
        type: K,
        callback: (this: Node, e: NodeViewElementEventMap[K]) => unknown,
        options?: EventListenerOptions | boolean,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

export interface NodeViewElementEventMap extends HTMLElementEventMap {
    "socketdown": SocketPointerEvent;
    "socketenter": SocketPointerEvent;
    "socketleave": SocketPointerEvent;
    "socketup": SocketPointerEvent;
    "partshow": PartVisiblityEvent;
    "parthide": PartVisiblityEvent;
}

export class SocketPointerEvent extends Event {
    constructor(type: string, public readonly socket: Socket, public readonly parent: PointerEvent) {
        super(type);
    }
}

export class PartVisiblityEvent extends Event {
    constructor(type: string, public readonly part: NodePart, public readonly slot: string) {
        super(type);
    }
}

interface PartViewInfo {
    container: HTMLDivElement;
    slot: HTMLSlotElement | null;
    sockets: [Socket, HTMLDivElement][];
}
