import { Node } from "../mod.ts";
import type { NodePart, Socket } from "../node.ts";
import { type NodeFactory, SimpleWgslContext, type WgslContext, WgslNode } from "./nodes.base.ts";

export class VertexInputNode extends WgslNode {
    readonly position: Socket = this.addSocket({ id: "position", direction: "out", type: "vec4f", name: "Position" });
    readonly uv: Socket = this.addSocket({ id: "uv", direction: "out", type: "vec2f", name: "UV" });

    override wgslSetup(): void {}

    override wgslExpr(_ctx: WgslContext, socket: Socket): string {
        switch (socket) {
            case this.position:
                return "vi.position";
            case this.uv:
                return "vi.uv";
            default:
                throw new Error("Invalid socket");
        }
    }

    static readonly factory: NodeFactory<VertexInputNode> = { name: "Vertex Input", type: VertexInputNode };
}

export class RenderOutputNode extends Node {
    readonly uiPart: NodePart = this.addPart({ ui: true, minHeight: 24 });
    readonly color: Socket = this.addSocket({ id: "color", direction: "in", type: "vec4f", name: "Color" });

    buildShaderSource(): string {
        const ctx = new SimpleWgslContext();
        const [colorSocket] = [...this.color.targets.values()];
        const colorExpr = colorSocket != null ? ctx.expressionOf(colorSocket) : "vec4f(0)";

        return [
            `struct VertexInput {`,
            `    @builtin(position) position: vec4f,`,
            `    @location(0) uv: vec2f,`,
            `}`,
            ``,
            `struct RenderOutput {`,
            `    @location(0) color: vec4f,`,
            `}`,
            ``,
            `@vertex`,
            `fn vertex_shader(@builtin(vertex_index) index: u32) -> VertexInput {`,
            `    const quad = array(`,
            `        VertexInput(vec4f(-1.00,  1.00,  0.00,  1.00), vec2f(0.00, 0.00)),`,
            `        VertexInput(vec4f( 1.00,  1.00,  0.00,  1.00), vec2f(1.00, 0.00)),`,
            `        VertexInput(vec4f(-1.00, -1.00,  0.00,  1.00), vec2f(0.00, 1.00)),`,
            `        VertexInput(vec4f( 1.00, -1.00,  0.00,  1.00), vec2f(1.00, 1.00))`,
            `    );`,
            `    return quad[index % 4];`,
            `}`,
            ``,
            `@fragment`,
            `fn fragment_shader(vi: VertexInput) -> RenderOutput {`,
            ...([...ctx.declarations.values()].map(({ name, dtype, ntype, value }) =>
                `    ${ntype} ${name}: ${dtype} = ${value};`
            )),
            `    return RenderOutput(`,
            `        ${colorExpr}`,
            `    );`,
            `}`,
        ].join("\n");
    }

    build(device: GPUDevice, target: GPUColorTargetState): {
        shader: GPUShaderModule;
        pipeline: GPURenderPipeline;
        renderBundle: GPURenderBundle;
    } {
        const shader = device.createShaderModule({ code: this.buildShaderSource() });
        const pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: shader,
                entryPoint: "vertex_shader",
            },
            fragment: {
                module: shader,
                entryPoint: "fragment_shader",
                targets: [target],
            },
            primitive: {
                topology: "triangle-strip",
            },
        });
        const renderBundleEncoder = device.createRenderBundleEncoder({ colorFormats: [target.format] });
        renderBundleEncoder.setPipeline(pipeline);
        renderBundleEncoder.draw(4);
        const renderBundle = renderBundleEncoder.finish();
        return { shader, pipeline, renderBundle };
    }

    static createFactory(device: GPUDevice): NodeFactory<RenderOutputNode> {
        return {
            name: "Render Output",
            type: RenderOutputNode,
            populatePartInterface: (node, part) => {
                const div = document.createElement("div");
                if (part != node.uiPart) return div;
                div.style.display = "flex";
                div.style.flexDirection = "column";

                const canvas = document.createElement("canvas");
                canvas.width = 1024;
                canvas.height = 1024;
                canvas.style.width = "100%";
                canvas.style.border = "1px solid #7f7f7f";
                canvas.style.boxSizing = "border-box";
                canvas.addEventListener("pointerdown", (e) => e.stopPropagation());
                canvas.addEventListener("contextmenu", (e) => e.stopPropagation());

                const ctx = canvas.getContext("webgpu")!;
                const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
                ctx.configure({ device, format: presentationFormat });

                const runBtn = document.createElement("button");
                runBtn.textContent = "Render";
                runBtn.addEventListener("click", () => {
                    const { renderBundle } = node.build(device, { format: presentationFormat });
                    const command = device.createCommandEncoder();
                    const pass = command.beginRenderPass({
                        colorAttachments: [
                            {
                                view: ctx.getCurrentTexture().createView(),
                                loadOp: "clear",
                                storeOp: "store",
                                clearValue: [0, 0, 0, 0],
                            },
                        ],
                    });
                    pass.executeBundles([renderBundle]);
                    pass.end();
                    device.queue.submit([command.finish()]);
                });

                div.append(runBtn, canvas);
                return div;
            },
        };
    }
}
