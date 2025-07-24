import { Node } from "../mod.ts";
import type { NodeCreateOptions, NodePart, Socket } from "../node.ts";

export abstract class ShaderNode extends Node {
    abstract generateWgslExpression(socket: Socket): string;
}

function wgslExprOrElse(socket: Socket, defaultValue: string): string {
    const [target] = [...socket.targets];
    if (target != null && target.node instanceof ShaderNode) return target.node.generateWgslExpression(target);
    return defaultValue;
}

export class Vec4f extends ShaderNode {
    #uiPart = this.addPart({ ui: true, minHeight: 24 * 4 + 8 });

    readonly vector: Socket = this.addSocket({ id: "vector", direction: "out", type: "vec4f", name: "Vector" });
    valueX: number = 0;
    valueY: number = 0;
    valueZ: number = 0;
    valueW: number = 0;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.#uiPart.add(this.vector);
    }

    override generateWgslExpression(): string {
        return `vec4f(${this.valueX},  ${this.valueY}, ${this.valueZ}, ${this.valueW})`;
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
    readonly ui: NodePart = this.addPart({ ui: true, minHeight: 32 });
    readonly afterUi: NodePart = this.addPart();
    readonly color: Socket = this.addSocket({ id: "color", direction: "in", type: "vec4f", name: "Color" });

    constructor(options: NodeCreateOptions) {
        super(options);
        this.afterUi.add(this.color);
    }

    toWgslExpression(): string {
        return wgslExprOrElse(this.color, "vec4f(0)");
    }
}
