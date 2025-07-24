import type { Network } from "../mod.ts";
import { FragmentTarget } from "./nodes.ts";

export function buildFragmentShader(network: Network): string {
    const targets = [...network.nodes].filter((n) => n instanceof FragmentTarget);
    return `
        struct VertexInputs { @builtin(position) position: vec4f, @location(0) uv: vec2f }
        struct FragmentTargets { ${targets.map((_, i) => `@location(${i}) target${i}: vec4f`).join(", ")} }

        @vertex
        fn vertexShader(@builtin(vertex_index) index: u32) -> VertexInputs {
            const quad = array(
                VertexInputs(vec4f(-1.00,  1.00,  0.00,  1.00), vec2f(0.00, 0.00)),
                VertexInputs(vec4f( 1.00,  1.00,  0.00,  1.00), vec2f(1.00, 0.00)),
                VertexInputs(vec4f(-1.00, -1.00,  0.00,  1.00), vec2f(0.00, 1.00)),
                VertexInputs(vec4f( 1.00, -1.00,  0.00,  1.00), vec2f(1.00, 1.00))
            );
            return quad[index % 4];
        }

        @fragment
        fn fragmentShader(vertexInputs: VertexInputs) -> FragmentTargets {
            return FragmentTargets(${targets.map((t) => t.toWgslExpression()).join(", ")});
        }
    `;
}

export function buildPipeline(device: GPUDevice, network: Network): GPURenderPipeline {
    const shaderModule = device.createShaderModule({ code: buildFragmentShader(network) });
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vertexShader",
            buffers: [],
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fragmentShader",
            targets: [
                { format: "rgba8unorm" },
            ],
        },
        primitive: {
            topology: "triangle-strip",
        },
    });
    return pipeline;
}
