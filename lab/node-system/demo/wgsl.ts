import type { FragmentTarget } from "./nodes.ts";

export function buildShaderSource(target: FragmentTarget): string {
    return `
        struct VertexInputs { @builtin(position) position: vec4f, @location(0) uv: vec2f }

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
        fn fragmentShader(vertexInputs: VertexInputs) -> @location(0) vec4f {
            return ${target.toWgslExpression()};
        }
    `;
}

export function buildPipeline(device: GPUDevice, target: FragmentTarget): GPURenderPipeline {
    const shaderModule = device.createShaderModule({ code: buildShaderSource(target) });
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
