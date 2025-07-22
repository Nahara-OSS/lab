import type { Node, Socket } from "../mod.ts";
import css from "./node-view.css" with { type: "text" };

const stylesheet = await new CSSStyleSheet().replace(css);

export class NodeViewElement extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });
    #title: Text;
    #node: Node | null = null;
    #socketDivs = new Map<Socket, HTMLDivElement>();
    #attached = false;

    snapX: number = 8;
    snapY: number = 8;

    #updateListener = () => this.#onNodeUpdate();
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
            this.#onNodeUpdate();
        }

        this.#node = v;
    }

    #nodeAttach(node: Node) {
        for (const socket of node.sockets.values()) this.#onAddSocket(socket);

        node.addEventListener("update", this.#updateListener);
        node.addEventListener("addsocket", this.#addSocketListener);
        node.addEventListener("removesocket", this.#removeSocketListener);
    }

    #nodeDetach(node: Node) {
        for (const socket of node.sockets.values()) this.#onRemoveSocket(socket);

        node.removeEventListener("update", this.#updateListener);
        node.removeEventListener("addsocket", this.#addSocketListener);
        node.removeEventListener("removesocket", this.#removeSocketListener);
    }

    connectedCallback(): void {
        this.#attached = true;
        if (this.#node) this.#nodeAttach(this.#node);
        this.#onNodeUpdate();
    }

    disconnectedCallback(): void {
        this.#attached = false;
        if (this.#node) this.#nodeDetach(this.#node);
    }

    #onNodeUpdate(): void {
        this.#title.textContent = this.#node?.name ?? "Node";
    }

    #onAddSocket(socket: Socket): void {
        const socketDiv = document.createElement("div");
        socketDiv.classList.add("socket");
        socketDiv.classList.add(socket.direction);
        socketDiv.part.add("socket");
        socketDiv.part.add(socket.direction);
        socketDiv.append(document.createTextNode(socket.name ?? socket.id), createTypeIndicator(socket.type));
        this.#shadow.append(socketDiv);
        this.#socketDivs.set(socket, socketDiv);
    }

    #onRemoveSocket(socket: Socket): void {
        this.#socketDivs.get(socket)?.remove();
        this.#socketDivs.delete(socket);
    }
}

function createTypeIndicator(type: string): HTMLDivElement {
    const div = document.createElement("div");
    div.classList.add("type-indicator");
    div.part.add("type-indicator");
    div.part.add(type);
    return div;
}
