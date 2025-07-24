import type { Node, NodePart, Socket } from "../mod.ts";
import css from "./node-view.css" with { type: "text" };
import { procgenColor } from "./procgen.ts";

const stylesheet = await new CSSStyleSheet().replace(css);

export class NodeViewElement extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });
    #title: Text;
    #node: Node | null = null;
    #socketDivs = new Map<Socket, HTMLDivElement>();
    #parts = new Map<NodePart, [HTMLDivElement, HTMLSlotElement | null]>();
    #attached = false;
    #slotIdCounter = 0;

    snapX: number = 8;
    snapY: number = 8;

    #updateListener = (e: CustomEvent<Node>) => this.#onNodeUpdate(e.detail);
    #addSocketListener = (e: CustomEvent<Socket>) => this.#onAddSocket(e.detail);
    #removeSocketListener = (e: CustomEvent<Socket>) => this.#onRemoveSocket(e.detail);

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

            const node = this.#node;
            const initialX = e.clientX;
            const initialY = e.clientY;
            const initialNodeX = this.#node.x;
            const initialNodeY = this.#node.y;

            const pointerMove = (e: PointerEvent) => {
                e.preventDefault();
                const dx = e.clientX - initialX;
                const dy = e.clientY - initialY;
                node.x = this.snapX > 0 ? Math.round((initialNodeX + dx) / this.snapX) * this.snapX : initialNodeX + dx;
                node.y = this.snapY > 0 ? Math.round((initialNodeY + dy) / this.snapY) * this.snapY : initialNodeY + dy;
            };

            const pointerUp = () => {
                document.removeEventListener("pointermove", pointerMove);
                document.removeEventListener("pointerup", pointerUp);
            };

            document.addEventListener("pointermove", pointerMove);
            document.addEventListener("pointerup", pointerUp);
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
        node.addEventListener("removesocket", this.#removeSocketListener);
    }

    #nodeDetach(node: Node) {
        for (const socket of node.sockets.values()) this.#onRemoveSocket(socket);
        for (const part of node.parts) this.#onRemovePart(part);

        node.removeEventListener("update", this.#updateListener);
        node.removeEventListener("addsocket", this.#addSocketListener);
        node.removeEventListener("removesocket", this.#removeSocketListener);
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

    #onNodeUpdate(node: Node | null): void {
        this.#title.textContent = node?.name ?? "Node";
    }

    #onAddPart(part: NodePart): void {
        const partDiv = document.createElement("div");
        partDiv.style.minHeight = `${part.minHeight}px`;
        partDiv.classList.add("node-part");

        if (part.ui) {
            const uiSlot = document.createElement("slot");
            uiSlot.classList.add("content");
            uiSlot.name = `${this.#slotIdCounter++}`;
            partDiv.append(uiSlot);
            this.#parts.set(part, [partDiv, uiSlot]);
            this.dispatchEvent(new PartVisiblityEvent("partshow", part, uiSlot.name));
        } else {
            this.#parts.set(part, [partDiv, null]);
        }

        this.#shadow.append(partDiv);
    }

    #onRemovePart(part: NodePart): void {
        const partElements = this.#parts.get(part);
        if (partElements == null) return;

        if (partElements[1] != null) {
            this.dispatchEvent(new PartVisiblityEvent("parthide", part, partElements[1].name));
        }

        partElements[0].remove();
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
        partElements[0].insertBefore(socketDiv, partElements[1]);
        this.#socketDivs.set(socket, socketDiv);

        socketDiv.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            this.dispatchEvent(new SocketPointerEvent("socketdown", socket, e));
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
        this.#socketDivs.get(socket)?.remove();
        this.#socketDivs.delete(socket);
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
