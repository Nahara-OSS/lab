/*

ok, here's how one can make a node:

- first add the sockets. they doesn't have to follow a certain order, just keep adding sockets
- then add node part, which can be used to reorder sockets or even provide UI
  + regular node part display socket information normally
  + custom node part allows node author to add custom control UI that optionally belongs to group of sockets
  + all node parts must have minimum height. each socket adds 24px of height to the part
    + this will be used for calculating the node's bounds for culling off-screen nodes
  + part collection allows one to add collapsable section on the node
- sockets that aren't belong to any node part will belong to default part, which will be placed on top of the node for
visiblity.

*/

/**
 * A node consists of input and output sockets. This node class is typically extended to add default sockets.
 *
 * ```typescript
 * // Simple usage
 * const node = new Node({ name: "My node" });
 * node.addSocket({ id: "input", direction: "in", type: "dtype" });
 *
 * // Typical usage
 * class MyNode extends Node {
 *     readonly input: Socket;
 *
 *     constructor(options: NodeCreateOptions) {
 *         super(options);
 *         this.input = this.addSocket({ id: "input", direction: "in", type: "dtype" });
 *     }
 * }
 *
 * new MyNode().input.connect(...);
 * ```
 *
 * **Evaluation**: Node evaluation order can be either from left to right or from right to left:
 *
 * - Use left to right order if the node network is "active". The signal from source node will trigger the destinations,
 * such as emitting pulse signal every second.
 * - Use right to left order if the node network is "passive". The destination will request signal from the source
 * nodes, such as on every animation frame.
 *
 * **Events**:
 *
 * - `update`: Emit when properties of a node is changed, such as node name, size or position.
 * - `addsocket`: Emit when a new socket is added to this node (by calling {@link Node.addSocket}). Listeners use this
 * to update the UI accordingly.
 * - `removesocket`: Emit when an existing socket is about to be removed from this node (by calling
 * {@link Node.deleteSocket}). Listeners use this to update the UI accordingly.
 * - `connect`: Emit when a new pair of sockets has been connected. This will emit for both source and destination
 * nodes.
 * - `disconnect`: Emit when an existing pair of sockets has been disconnected. This will emit for both source and
 * destination nodes.
 */
export class Node extends EventTarget {
    #sockets = new Map<string, SocketInternals>();
    #name: string;
    #expanded: boolean;
    #x: number;
    #y: number;
    #width: number;

    constructor(options: NodeCreateOptions) {
        super();
        this.#name = options.name;
        this.#expanded = options.expanded ?? true;
        this.#x = options.x ?? 0;
        this.#y = options.y ?? 0;
        this.#width = options.width ?? 160;
    }

    /**
     * Get a map of all sockets that are on this node.
     */
    get sockets(): ReadonlyMap<string, Socket> {
        return this.#sockets;
    }

    /**
     * Get/set display name of this node.
     */
    get name(): string {
        return this.#name;
    }

    set name(v: string) {
        if (this.#name == v) return;
        this.#name = v;
        this.dispatchEvent(new CustomEvent("update", { detail: this }));
    }

    /**
     * Get or set the expanded state of this node. Expanded state means the content of the node will be visible.
     */
    get expanded(): boolean {
        return this.#expanded;
    }

    set expanded(v: boolean) {
        if (this.#expanded == v) return;
        this.#expanded = v;
        this.dispatchEvent(new CustomEvent("update", { detail: this }));
    }

    get x(): number {
        return this.#x;
    }

    set x(v: number) {
        if (this.#x == v) return;
        this.#x = v;
        this.dispatchEvent(new CustomEvent("update", { detail: this }));
    }

    get y(): number {
        return this.#y;
    }

    set y(v: number) {
        if (this.#y == v) return;
        this.#y = v;
        this.dispatchEvent(new CustomEvent("update", { detail: this }));
    }

    get width(): number {
        return this.#width;
    }

    set width(v: number) {
        if (this.#width == v) return;
        this.#width = v;
        this.dispatchEvent(new CustomEvent("update", { detail: this }));
    }

    addSocket(info: Readonly<SocketInfo>): Socket {
        if (this.#sockets.has(info.id)) throw new Error(`Socket with ID ${info.id} already existed on this node`);
        const socket = new SocketInternals(this, info);

        this.#sockets.set(socket.id, socket);
        this.dispatchEvent(new CustomEvent("addsocket", { detail: socket }));
        return socket;
    }

    deleteSocket(id: string | Socket): void {
        const socket = this.#sockets.get(typeof id == "string" ? id : id.id);
        if (socket == null) throw new Error(`Socket with ID ${id} does not exists on this node`);

        socket.disconnectAll();
        this.dispatchEvent(new CustomEvent("removesocket", { detail: socket }));
        this.#sockets.delete(socket.id);
    }
}

export interface NodeCreateOptions {
    name: string;
    expanded?: boolean | null;
    x?: number | null;
    y?: number | null;
    width?: number | null;
}

export interface Node {
    addEventListener<K extends keyof NodeEventMap>(
        type: K,
        callback: (this: Node, e: NodeEventMap[K]) => unknown,
        options?: AddEventListenerOptions | boolean,
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
    ): void;
    removeEventListener<K extends keyof NodeEventMap>(
        type: K,
        callback: (this: Node, e: NodeEventMap[K]) => unknown,
        options?: EventListenerOptions | boolean,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

export interface NodeEventMap {
    "update": CustomEvent<Node>;
    "addsocket": CustomEvent<Socket>;
    "removesocket": CustomEvent<Socket>;
    "connect": NodeConnectionEvent;
    "disconnect": NodeConnectionEvent;
}

export class NodeConnectionEvent extends Event {
    constructor(type: string, public readonly src: Socket, public readonly dst: Socket) {
        super(type);
    }
}

export interface SocketInfo {
    /**
     * The unique ID identifying this socket.
     */
    id: string;

    /**
     * The type ID for this socket, usually corresponding to data type. Examples are `float`, `vec3f` and `vertex`. This
     * will be used by node graph view to visualize the socket type with color and shape, as well as disallow connecting
     * sockets of different type.
     */
    type: string;

    /**
     * The signal flowing direction of the socket. `in` means signal coming into the node and `out` means signal coming
     * out from the node. `in` sockets will be displayed on the left of the node and `out` on the right.
     */
    direction: SocketDirection;

    /**
     * Maximum number of input signals coming to this socket. Only applicable to `in` direction. By default, the maximum
     * number of input is 1.
     */
    maxInputs?: number | null;

    /**
     * User-friendly/display name for this socket, which will be displayed as label on UI. The label will fallback to
     * socket's ID when `name` is not provided.
     */
    name?: string | null;

    /**
     * Description for this socket, which will be shown when user hovers on the socket's label.
     */
    description?: string | null;
}

export type SocketDirection = "in" | "out";

export interface Socket extends Readonly<SocketInfo> {
    /**
     * The node owning this socket.
     */
    readonly node: Node;

    /**
     * The posiion of this socket inside node part. This will be used to calculate socket's coordinates when rendering
     * the wires.
     */
    readonly position: number;

    readonly id: string;
    readonly type: string;
    readonly direction: SocketDirection;
    readonly maxInputs: number;
    readonly name: string | null;
    readonly description: string | null;

    /**
     * A set of targets that this socket is connected to. Depending on the socket's direction, this set can either be
     * a set of destinations (for `out` direction) or sources (for `in` direction).
     */
    readonly targets: ReadonlySet<Socket>;

    connect(socket: Socket): void;
    disconnect(socket: Socket): void;
    disconnectAll(): void;
}

class SocketInternals implements Socket {
    readonly id: string;
    readonly type: string;
    readonly direction: SocketDirection;
    readonly maxInputs: number;
    readonly name: string | null;
    readonly description: string | null;
    readonly targets = new Set<SocketInternals>();

    constructor(
        public readonly node: Node,
        { id, type, direction, maxInputs, name, description }: SocketInfo,
    ) {
        this.id = id;
        this.type = type;
        this.direction = direction;
        this.maxInputs = maxInputs ?? 1;
        this.name = name ?? null;
        this.description = description ?? null;
    }

    get position(): number {
        return [...this.node.sockets.values()].indexOf(this);
    }

    connect(socket: Socket): void {
        if (!(socket instanceof SocketInternals)) throw new Error(`Invalid socket implementation`);
        if (socket == this) throw new Error(`Cannot connect the socket to itself`);
        if (this.type != socket.type) throw new Error(`Type mismatch: ${this.type} connecting to ${socket.type}`);
        if (this.direction == socket.direction) throw new Error(`Direction match: ${this.direction}`);
        if (this.targets.has(socket)) return;
        // TODO: throw on circular connection

        const src = this.direction == "in" ? socket : this;
        const dst = this.direction == "in" ? this : socket;
        if (dst.targets.size >= dst.maxInputs) throw new Error(`Socket ${dst.id} reached maximum number of inputs`);

        this.targets.add(socket);
        socket.targets.add(this);

        this.node.dispatchEvent(new NodeConnectionEvent("connect", src, dst));
        socket.node.dispatchEvent(new NodeConnectionEvent("connect", src, dst));
    }

    disconnect(socket: Socket): void {
        if (!(socket instanceof SocketInternals)) throw new Error(`Invalid socket implementation`);
        if (socket == this) throw new Error(`Cannot disconnect the socket from itself`);
        if (!this.targets.delete(socket)) return;
        socket.targets.delete(this);

        const src = this.direction == "in" ? socket : this;
        const dst = this.direction == "in" ? this : socket;
        this.node.dispatchEvent(new NodeConnectionEvent("disconnect", src, dst));
        socket.node.dispatchEvent(new NodeConnectionEvent("disconnect", src, dst));
    }

    disconnectAll(): void {
        for (const target of [...this.targets]) this.disconnect(target);
    }
}
