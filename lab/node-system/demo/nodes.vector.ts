import type { NodeCreateOptions, NodePart, Socket, SocketDirection } from "../mod.ts";
import { createNumberInputField, type NodeFactory, type WgslContext, WgslNode } from "./nodes.base.ts";

interface GeneratedNodeClass<T = object> {
    new (options: NodeCreateOptions): WgslNode & T;
    readonly factory: NodeFactory<WgslNode & T>;
}

export class ConstF32Node extends WgslNode {
    readonly uiPart: NodePart = this.addPart({ ui: true, minHeight: 24 });
    readonly output: Socket = this.addSocket({ id: "constant", direction: "out", type: "f32", name: "Constant" });
    value: number = 0;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.uiPart.add(this.output);
    }

    override wgslSetup(): void {}

    override wgslExpr(_: WgslContext, socket: Socket): string {
        if (socket == this.output) return `${this.value}`;
        throw new Error("Invalid socket");
    }

    static readonly factory: NodeFactory<ConstF32Node> = {
        name: "Scalar",
        type: ConstF32Node,
        initials: [{ id: "constant", direction: "out", type: "f32", name: "Constant" }],
        populatePartInterface: (node, part) => {
            const div = document.createElement("div");
            if (part != node.uiPart) return div;
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.append(createNumberInputField(node.value, (v) => node.value = v));
            return div;
        },
    };
}

export function constantVectorNode(dim: number, dtype: string, name: string): GeneratedNodeClass<{
    readonly output: Socket;
    readonly values: number[];
}> {
    return class ConstantVectorNode extends WgslNode {
        readonly uiPart: NodePart = this.addPart({ ui: true, minHeight: 24 * dim });
        readonly output: Socket = this.addSocket({ id: "constant", direction: "out", type: dtype, name: "Constant" });
        values: number[] = [];

        constructor(options: NodeCreateOptions) {
            super(options);
            this.uiPart.add(this.output);
            for (let i = 0; i < dim; i++) this.values.push(0);
        }

        override wgslSetup(ctx: WgslContext): void {
            ctx.genName("constant", dtype, "const", `${dtype}(${this.values.join(", ")})`);
        }

        override wgslExpr(ctx: WgslContext, socket: Socket): string {
            if (socket == this.output) return ctx.nameOf("constant");
            throw new Error("Invalid socket");
        }

        static readonly factory: NodeFactory<ConstantVectorNode> = {
            name,
            type: ConstantVectorNode,
            initials: [{ id: "constant", direction: "out", type: dtype, name: "Constant" }],
            populatePartInterface: (node, part) => {
                const div = document.createElement("div");
                if (part != node.uiPart) return div;

                div.style.display = "flex";
                div.style.flexDirection = "column";

                for (let i = 0; i < dim; i++) {
                    const input = createNumberInputField(node.values[i], (v) => node.values[i] = v);
                    div.append(input);
                }

                return div;
            },
        };
    };
}

export const ConstVec2fNode = constantVectorNode(2, "vec2f", "2D Vector");
export const ConstVec3fNode = constantVectorNode(3, "vec3f", "3D Vector");
export const ConstVec4fNode = constantVectorNode(4, "vec4f", "4D Vector");

export function splitVectorNode(components: [string, string][], dtype: string, name: string): GeneratedNodeClass<{
    readonly input: Socket;
    readonly components: Socket[];
}> {
    return class SplitVectorNode extends WgslNode {
        readonly input: Socket = this.addSocket({ id: "input", direction: "in", type: dtype, name: "Vector" });
        readonly components: Socket[] = [];

        constructor(options: NodeCreateOptions) {
            super(options);

            for (const [id, label] of components) {
                const socket = this.addSocket({ id, direction: "out", type: "f32", name: label });
                this.components.push(socket);
            }
        }

        override wgslSetup(ctx: WgslContext): void {
            const [socket] = [...this.input.targets.values()];
            const expr = socket != null ? ctx.expressionOf(socket) : `${dtype}(0)`;
            ctx.genName("input", dtype, "let", expr);
        }

        override wgslExpr(ctx: WgslContext, socket: Socket): string {
            const idx = this.components.indexOf(socket);
            if (idx == -1) throw new Error("Invalid socket");
            return `${ctx.nameOf("input")}.${components[idx][0]}`;
        }

        static readonly factory: NodeFactory<SplitVectorNode> = {
            name,
            type: SplitVectorNode,
            initials: [
                { id: "input", direction: "in", type: dtype, name: "Vector" },
                ...components.map(([id, label]) => ({
                    id,
                    direction: "out" as SocketDirection,
                    type: "f32",
                    name: label,
                })),
            ],
        };
    };
}

export const SplitVec2fNode = splitVectorNode([["x", "X"], ["y", "Y"]], "vec2f", "Split 2D Vector");
export const SplitVec3fNode = splitVectorNode([["x", "X"], ["y", "Y"], ["z", "Z"]], "vec3f", "Split 3D Vector");
export const SplitVec4fNode = splitVectorNode(
    [["x", "X"], ["y", "Y"], ["z", "Z"], ["w", "W"]],
    "vec4f",
    "Split 4D Vector",
);

export function mergeVectorNode(components: [string, string][], dtype: string, name: string): GeneratedNodeClass {
    return class MergeVectorNode extends WgslNode {
        readonly output: Socket = this.addSocket({ id: "output", direction: "out", type: dtype, name: "Vector" });
        readonly components: Socket[] = [];

        constructor(options: NodeCreateOptions) {
            super(options);

            for (const [id, label] of components) {
                const socket = this.addSocket({ id, direction: "in", type: "f32", name: label });
                this.components.push(socket);
            }
        }

        override wgslSetup(ctx: WgslContext): void {
            const values = components.map((_, i) => {
                const [socket] = [...this.components[i].targets.values()];
                const expr = socket != null ? ctx.expressionOf(socket) : "0";
                return expr;
            });
            ctx.genName("output", dtype, "let", `${dtype}(${values.join(", ")})`);
        }

        override wgslExpr(ctx: WgslContext, socket: Socket): string {
            if (socket == this.output) return ctx.nameOf("output");
            throw new Error("Invalid socket");
        }

        static readonly factory: NodeFactory<MergeVectorNode> = {
            name,
            type: MergeVectorNode,
            initials: [
                { id: "output", direction: "out", type: dtype, name: "Vector" },
                ...components.map(([id, label]) => ({
                    id,
                    direction: "in" as SocketDirection,
                    type: "f32",
                    name: label,
                })),
            ],
        };
    };
}

export const MergeVec2fNode = mergeVectorNode([["x", "X"], ["y", "Y"]], "vec2f", "Merge 2D Vector");
export const MergeVec3fNode = mergeVectorNode([["x", "X"], ["y", "Y"], ["z", "Z"]], "vec3f", "Merge 3D Vector");
export const MergeVec4fNode = mergeVectorNode(
    [["x", "X"], ["y", "Y"], ["z", "Z"], ["w", "W"]],
    "vec4f",
    "Merge 4D Vector",
);

export function mathNode(dtype: string, name: string): GeneratedNodeClass {
    const operators: [string, string][] = [
        ["Add", "+"],
        ["Subtract", "-"],
        ["Multiply", "*"],
        ["Divide", "/"],
    ];

    return class MathNode extends WgslNode {
        readonly uiPart: NodePart = this.addPart({ ui: true, minHeight: 48 });
        readonly a: Socket = this.addSocket({ id: "a", direction: "in", type: dtype, name: "A" });
        readonly b: Socket = this.addSocket({ id: "b", direction: "in", type: dtype, name: "B" });
        readonly output: Socket = this.addSocket({ id: "output", direction: "out", type: dtype, name: "Output" });
        operator: number = 0;

        constructor(options: NodeCreateOptions) {
            super(options);
            this.uiPart.add(this.a);
            this.uiPart.add(this.b);
        }

        override wgslSetup(ctx: WgslContext): void {
            const [socketA] = [...this.a.targets.values()];
            const [socketB] = [...this.b.targets.values()];
            const exprA = socketA != null ? ctx.expressionOf(socketA) : "0.0";
            const exprB = socketB != null ? ctx.expressionOf(socketB) : "0.0";
            ctx.genName("output", dtype, "let", `${exprA} ${operators[this.operator][1]} ${exprB}`);
        }

        override wgslExpr(ctx: WgslContext, socket: Socket): string {
            if (socket == this.output) return ctx.nameOf("output");
            throw new Error("Invalid socket");
        }

        static readonly factory: NodeFactory<MathNode> = {
            name,
            type: MathNode,
            initials: [
                { id: "a", direction: "in", type: dtype, name: "A" },
                { id: "b", direction: "in", type: dtype, name: "B" },
                { id: "output", direction: "out", type: dtype, name: "Output" },
            ],
            populatePartInterface: (node) => {
                const select = document.createElement("select");
                select.style.width = "100%";
                select.style.height = "100%";
                select.selectedIndex = node.operator;

                for (let i = 0; i < operators.length; i++) {
                    const [name] = operators[i];
                    const option = document.createElement("option");
                    option.textContent = name;
                    select.append(option);
                }

                return select;
            },
        };
    };
}

export const MathF32Node = mathNode("f32", "Math");
export const MathVec2fNode = mathNode("vec2f", "2D Vector Math");
export const MathVec3fNode = mathNode("vec3f", "3D Vector Math");
export const MathVec4fNode = mathNode("vec4f", "4D Vector Math");
