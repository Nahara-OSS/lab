import type { Node } from "./node.ts";

export class Network extends EventTarget {
    #nodes = new Set<Node>();

    get nodes(): ReadonlySet<Node> {
        return this.#nodes;
    }

    addNode(node: Node): void {
        if (this.#nodes.has(node)) return;
        this.#nodes.add(node);
        this.dispatchEvent(new CustomEvent("addnode", { detail: node }));
    }

    deleteNode(node: Node): void {
        if (!this.#nodes.delete(node)) return;
        this.dispatchEvent(new CustomEvent("removenode", { detail: node }));
    }
}

export interface Network {
    addEventListener<K extends keyof NetworkEventMap>(
        type: K,
        callback: (this: Node, e: NetworkEventMap[K]) => unknown,
        options?: AddEventListenerOptions | boolean,
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void;
    removeEventListener<K extends keyof NetworkEventMap>(
        type: K,
        callback: (this: Node, e: NetworkEventMap[K]) => unknown,
        options?: EventListenerOptions | boolean,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

export interface NetworkEventMap {
    "addnode": CustomEvent<Node>;
    "removenode": CustomEvent<Node>;
}
