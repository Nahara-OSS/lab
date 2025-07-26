import { Node, type NodeCreateOptions } from "../mod.ts";
import type { NodePart, Socket } from "../node.ts";

export abstract class ShaderNode extends Node {
    abstract generateWgslExpression(socket: Socket): string;
}

function wgslExprOrElse(socket: Socket, defaultValue: string): string {
    const [target] = [...socket.targets];
    if (target != null && target.node instanceof ShaderNode) return target.node.generateWgslExpression(target);
    return defaultValue;
}

export class Scalar extends ShaderNode {
    readonly ui = this.addPart({ ui: true, minHeight: 24 * 1 });
    readonly output: Socket = this.addSocket({ id: "vector", direction: "out", type: "f32", name: "Vector" });
    value: number = 0;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.ui.add(this.output);
    }

    override generateWgslExpression(): string {
        return `${this.value}`;
    }
}

export class Vec4f extends ShaderNode {
    readonly ui = this.addPart({ ui: true, minHeight: 24 * 4 });
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "out", type: "vec4f", name: "Vector" });
    valueX: number = 0;
    valueY: number = 0;
    valueZ: number = 0;
    valueW: number = 0;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.ui.add(this.vector);
    }

    override generateWgslExpression(): string {
        return `vec4f(${this.valueX}, ${this.valueY}, ${this.valueZ}, ${this.valueW})`;
    }
}

export class Vec2f extends ShaderNode {
    readonly ui = this.addPart({ ui: true, minHeight: 24 * 2 });
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "out", type: "vec2f", name: "Vector" });
    valueX: number = 0;
    valueY: number = 0;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.ui.add(this.vector);
    }

    override generateWgslExpression(): string {
        return `vec2f(${this.valueX}, ${this.valueY})`;
    }
}

export class SplitVec4f extends ShaderNode {
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "in", type: "vec4f", name: "Vector" });
    readonly valueX: Socket = this.addSocket({ id: "x", direction: "out", type: "f32", name: "X" });
    readonly valueY: Socket = this.addSocket({ id: "y", direction: "out", type: "f32", name: "Y" });
    readonly valueZ: Socket = this.addSocket({ id: "z", direction: "out", type: "f32", name: "Z" });
    readonly valueW: Socket = this.addSocket({ id: "w", direction: "out", type: "f32", name: "W" });

    override generateWgslExpression(socket: Socket): string {
        const source = wgslExprOrElse(this.vector, "vec4f(0)");

        switch (socket) {
            case this.valueX:
                return `${source}.x`;
            case this.valueY:
                return `${source}.y`;
            case this.valueZ:
                return `${source}.z`;
            case this.valueW:
                return `${source}.w`;
            default:
                return "0.0";
        }
    }
}

export class MergeVec4f extends ShaderNode {
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "out", type: "vec4f", name: "Vector" });
    readonly valueX: Socket = this.addSocket({ id: "x", direction: "in", type: "f32", name: "X" });
    readonly valueY: Socket = this.addSocket({ id: "y", direction: "in", type: "f32", name: "Y" });
    readonly valueZ: Socket = this.addSocket({ id: "z", direction: "in", type: "f32", name: "Z" });
    readonly valueW: Socket = this.addSocket({ id: "w", direction: "in", type: "f32", name: "W" });

    override generateWgslExpression(): string {
        const x = wgslExprOrElse(this.valueX, "0");
        const y = wgslExprOrElse(this.valueY, "0");
        const z = wgslExprOrElse(this.valueZ, "0");
        const w = wgslExprOrElse(this.valueW, "0");
        return `vec4f(${x}, ${y}, ${z}, ${w})`;
    }
}

export class SplitVec2f extends ShaderNode {
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "in", type: "vec2f", name: "Vector" });
    readonly valueX: Socket = this.addSocket({ id: "x", direction: "out", type: "f32", name: "X" });
    readonly valueY: Socket = this.addSocket({ id: "y", direction: "out", type: "f32", name: "Y" });

    override generateWgslExpression(socket: Socket): string {
        const source = wgslExprOrElse(this.vector, "vec2f(0)");

        switch (socket) {
            case this.valueX:
                return `${source}.x`;
            case this.valueY:
                return `${source}.y`;
            default:
                return "0.0";
        }
    }
}

export class MergeVec2f extends ShaderNode {
    readonly vector: Socket = this.addSocket({ id: "vector", direction: "out", type: "vec2f", name: "Vector" });
    readonly valueX: Socket = this.addSocket({ id: "x", direction: "in", type: "f32", name: "X" });
    readonly valueY: Socket = this.addSocket({ id: "y", direction: "in", type: "f32", name: "Y" });

    override generateWgslExpression(): string {
        const x = wgslExprOrElse(this.valueX, "0");
        const y = wgslExprOrElse(this.valueY, "0");
        return `vec2f(${x}, ${y})`;
    }
}

export class VertexInput extends ShaderNode {
    readonly position: Socket = this.addSocket({ id: "position", direction: "out", type: "vec4f", name: "Position" });
    readonly uv: Socket = this.addSocket({ id: "uv", direction: "out", type: "vec2f", name: "UV" });

    override generateWgslExpression(socket: Socket): string {
        switch (socket) {
            case this.position:
                return "vertexInputs.position";
            case this.uv:
                return "vertexInputs.uv";
            default:
                throw new Error(`Invalid socket: ${socket.id}`);
        }
    }
}

export class FragmentTarget extends Node {
    readonly ui: NodePart = this.addPart({ ui: true, minHeight: 92 });
    readonly color: Socket = this.addSocket({ id: "color", direction: "in", type: "vec4f", name: "Color" });

    toWgslExpression(): string {
        return wgslExprOrElse(this.color, "vec4f(0)");
    }
}

export class Todo extends Node {
    readonly control: NodePart = this.addPart({ ui: true, minHeight: 32 });
    #content = new Map<NodePart, [string, Socket]>();

    get content(): ReadonlyMap<NodePart, [string, Socket]> {
        return this.#content;
    }

    addTodo(): void {
        const content = this.addPart({ ui: true, minHeight: 32 });
        const socket = this.addSocket({ id: crypto.randomUUID(), type: "string", direction: "out", name: "Content" });
        content.add(socket);
        this.#content.set(content, ["", socket]);
    }

    changeContent(part: NodePart, content: string): void {
        const entry = this.#content.get(part);
        if (entry != null) entry[0] = content;
    }

    deleteTodo(part: NodePart): void {
        const entry = this.#content.get(part);

        if (entry != null) {
            this.deleteSocket(entry[1]);
            this.deletePart(part);
            this.#content.delete(part);
        }
    }
}

export class StringReader extends Node {
    readonly input: Socket = this.addSocket({ id: "input", direction: "in", type: "string", name: "Input" });
}
