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
 * to update the UI accordingly. The new socket will be added to default part.
 * - `removesocket`: Emit when an existing socket is about to be removed from this node (by calling
 * {@link Node.deleteSocket}). Listeners use this to update the UI accordingly.
 * - `transfersocket`: Emit when the socket is being transferred from one part to another.
 * - `addpart`: Emit when a new part is about to be added.
 * - `removepart`: Emit when an existing part is about to be removed.
 * - `connect`: Emit when a new pair of sockets has been connected. This will emit for both source and destination
 * nodes.
 * - `disconnect`: Emit when an existing pair of sockets has been disconnected. This will emit for both source and
 * destination nodes.
 */
export class Node extends EventTarget {
    #sockets = new Map<string, SocketInternals>();
    #defaultPart = new NodePartInternals(this);
    #parts: NodePart[] = [this.#defaultPart];
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

    get parts(): readonly NodePart[] {
        return this.#parts;
    }

    get defaultPart(): NodePart {
        return this.#defaultPart;
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
        const socket = new SocketInternals(this, this.#defaultPart, info);
        this.#defaultPart.sockets.push(socket);

        this.#sockets.set(socket.id, socket);
        this.dispatchEvent(new CustomEvent("addsocket", { detail: socket }));
        return socket;
    }

    deleteSocket(id: string | Socket): void {
        const socket = this.#sockets.get(typeof id == "string" ? id : id.id);
        if (socket == null) throw new Error(`Socket with ID ${id} does not exists on this node`);

        socket.disconnectAll();
        const idx = socket.part.sockets.indexOf(socket);
        if (idx != -1) socket.part.sockets.splice(idx, 1);
        this.#sockets.delete(socket.id);
        this.dispatchEvent(new CustomEvent("removesocket", { detail: socket }));
    }

    addPart(info: NodePartInfo = {}): NodePart {
        const part = new NodePartInternals(this, info);
        this.#parts.push(part);
        this.dispatchEvent(new CustomEvent("addpart", { detail: part }));
        return part;
    }

    deletePart(part: NodePart): void {
        if (part == this.#defaultPart) throw new Error("Cannot delete default part");
        const idx = this.#parts.indexOf(part);
        if (idx == -1) return;

        for (const socket of part.sockets) part.delete(socket);
        this.#parts.splice(idx, 1);
        this.dispatchEvent(new CustomEvent("removepart", { detail: part }));
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
    "addpart": CustomEvent<NodePart>;
    "removepart": CustomEvent<NodePart>;
    "transfersocket": SocketTransferEvent;
    "connect": NodeConnectionEvent;
    "disconnect": NodeConnectionEvent;
}

export class NodeConnectionEvent extends Event {
    constructor(type: string, public readonly src: Socket, public readonly dst: Socket) {
        super(type);
    }
}

export class SocketTransferEvent extends Event {
    constructor(
        type: string,
        public readonly socket: Socket,
        public readonly from: NodePart,
        public readonly to: NodePart,
    ) {
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
    readonly part: NodePart;
    readonly relativeY: number;

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
    canConnectTo(socket: Socket): boolean;
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
        public part: NodePartInternals,
        { id, type, direction, maxInputs, name, description }: SocketInfo,
    ) {
        this.id = id;
        this.type = type;
        this.direction = direction;
        this.maxInputs = maxInputs ?? 1;
        this.name = name ?? null;
        this.description = description ?? null;
    }

    get relativeY(): number {
        let accumulated = 0;

        for (let i = 0; i < this.node.parts.length; i++) {
            if (this.node.parts[i] == this.part) break;
            accumulated += this.node.parts[i].height;
        }

        return accumulated + this.part.sockets.indexOf(this) * 24 + 12;
    }

    connect(socket: Socket): void {
        if (!(socket instanceof SocketInternals)) throw new Error(`Invalid socket implementation`);
        if (!this.canConnectTo(socket)) throw new Error(`Attempt to connect ${this.id} to ${socket.id}`);

        const src = this.direction == "in" ? socket : this;
        const dst = this.direction == "in" ? this : socket;
        if (dst.targets.size >= dst.maxInputs) throw new Error(`Socket ${dst.id} reached maximum number of inputs`);

        this.targets.add(socket);
        socket.targets.add(this);

        this.node.dispatchEvent(new NodeConnectionEvent("connect", src, dst));
        socket.node.dispatchEvent(new NodeConnectionEvent("connect", src, dst));
    }

    canConnectTo(socket: Socket): boolean {
        if (!(socket instanceof SocketInternals)) return false;
        if (socket == this) return false;
        if (this.type != socket.type) return false;
        if (this.direction == socket.direction) return false;
        if (this.targets.has(socket)) return false;
        // TODO: detect circular connection

        const dst = this.direction == "in" ? this : socket;
        if (dst.targets.size >= dst.maxInputs) return false;

        return true;
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

export interface NodePartInfo {
    /**
     * Whether to enable custom control UI that sits on top of all sockets. Default is `false`.
     */
    readonly ui?: boolean | null;

    /**
     * The minimum height of node part, measured in CSS pixels. Default is 0 pixels.
     */
    readonly minHeight?: number | null;
}

/**
 * Node part represent a group of sockets on a node, as well as UI controls that could be related to sockets.
 */
export interface NodePart extends NodePartInfo {
    readonly node: Node;
    readonly ui: boolean;
    readonly minHeight: number;

    /**
     * The actual height of this node part.
     */
    readonly height: number;

    /**
     * An ordered list of sockets in this node part.
     */
    readonly sockets: readonly Socket[];

    insert(beforeIndex: number, socket: Socket): void;
    add(socket: Socket): void;
    delete(socket: Socket): void;
}

class NodePartInternals implements NodePart {
    readonly ui: boolean;
    readonly minHeight: number;
    sockets: SocketInternals[] = [];

    constructor(
        public readonly node: Node,
        { ui, minHeight }: NodePartInfo = {},
    ) {
        this.ui = ui ?? false;
        this.minHeight = minHeight ?? 0;
    }

    get height(): number {
        return Math.max(this.minHeight, this.sockets.length * 24);
    }

    insert(beforeIndex: number, socket: Socket): void {
        if (!(socket instanceof SocketInternals)) throw new Error(`Invalid socket implementation`);

        const transferFrom = socket.part;
        const idx = socket.part.sockets.indexOf(socket);
        if (idx == -1) throw new Error(`Invalid node state`);
        socket.part.sockets.splice(idx, 1);
        this.sockets.splice(beforeIndex, 0, socket);
        socket.part = this;
        this.node.dispatchEvent(new SocketTransferEvent("transfersocket", socket, transferFrom, this));
    }

    add(socket: Socket): void {
        if (socket.part == this) return;
        this.insert(this.sockets.length, socket);
    }

    delete(socket: Socket): void {
        if (!(socket instanceof SocketInternals)) throw new Error(`Invalid socket implementation`);
        if (this == this.node.defaultPart) throw new Error(`Cannot delete socket from default part`);
        if (socket.part != this) return;

        const idx = this.sockets.indexOf(socket);
        if (idx == -1) throw new Error(`Invalid node state`);
        this.sockets.splice(idx, 1);
        socket.part = this.node.defaultPart as NodePartInternals;
        (this.node.defaultPart as NodePartInternals).sockets.push(socket);
        this.node.dispatchEvent(new SocketTransferEvent("transfersocket", socket, this, this.node.defaultPart));
    }
}
