import { Node, type NodeCreateOptions, type NodePart, type Socket, SocketInfo } from "../mod.ts";

export abstract class WgslNode extends Node {
    abstract wgslSetup(ctx: WgslContext): void;
    abstract wgslExpr(ctx: WgslContext, socket: Socket): string;
}

export interface WgslContext {
    genName(key: string, dtype: string, ntype: "var" | "let" | "const", value: string): void;
    nameOf(key: string): string;
    expressionOf(socket: Socket): string;
}

export interface NodeFactory<N extends Node> {
    readonly name: string;
    type: { new (options: NodeCreateOptions): N };
    initials?: SocketInfo[];
    populatePartInterface?(node: N, part: NodePart): Element;
}

export function createNumberInputField(initial: number, onValue: (v: number) => unknown): HTMLInputElement {
    const input = document.createElement("input");
    input.style.width = "100%";
    input.value = `${initial}`;

    input.addEventListener("input", () => {
        const value = parseFloat(input.value);
        if (Number.isNaN(value)) return;
        onValue(value);
    });

    return input;
}

export interface WgslNameDecl {
    name: string;
    ntype: "var" | "let" | "const";
    dtype: string;
    value: string;
    refCount: number;
}

export class SimpleWgslContext implements WgslContext {
    #mappedKeys = new Map<string, string>();

    constructor(
        public readonly declarations: Map<string, WgslNameDecl> = new Map(),
        public readonly nodes: Map<Node, SimpleWgslContext> = new Map(),
        public readonly expressions: Map<Socket, string> = new Map(),
        public readonly nameGenerator: Generator<string> = (function* () {
            let counter = 0;
            while (true) yield `symbol${(counter++).toString(16).padStart(4, "0")}`;
        })(),
    ) {}

    genName(key: string, dtype: string, ntype: "var" | "let" | "const", value: string): void {
        const result = this.nameGenerator.next();
        if (result.done) throw new Error(`Generator stopped producing names`);

        const name = result.value;
        this.declarations.set(name, { name, ntype, dtype, value, refCount: 0 });
        this.#mappedKeys.set(key, name);
    }

    nameOf(key: string): string {
        const value = this.#mappedKeys.get(key);
        if (value == null) throw new Error(`Key ${key} does not have generated name`);

        const decl = this.declarations.get(value);
        if (decl) decl.refCount++;

        return value;
    }

    expressionOf(socket: Socket): string {
        let expr = this.expressions.get(socket);

        if (expr == null) {
            const node = socket.node;
            if (!(node instanceof WgslNode)) throw new Error(`Cannot mix non-WGSL nodes with WGSL nodes`);
            let ctx = this.nodes.get(node);

            if (ctx == null) {
                ctx = new SimpleWgslContext(this.declarations, this.nodes, this.expressions, this.nameGenerator);
                node.wgslSetup(ctx);
                this.nodes.set(node, ctx);
            }

            expr = node.wgslExpr(ctx, socket);
        }

        return expr;
    }
}
