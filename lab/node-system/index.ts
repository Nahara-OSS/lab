import { FragmentTarget, MergeVec2f, MergeVec4f, SplitVec2f, SplitVec4f, VertexInput } from "./demo/nodes.ts";
import { buildFragmentShader, buildPipeline } from "./demo/wgsl.ts";
import "./index.css";
import { Network } from "./mod.ts";
import "./ui/preload.ts";

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter?.requestDevice()!;

const canvas = document.createElement("canvas");
const surface = canvas.getContext("webgpu")!;
surface.configure({ device, format: "rgba8unorm" });

const view = document.createElement("nahara-network-view");
const runBtn = document.createElement("button");
runBtn.textContent = "Run";
document.body.append(canvas, view, runBtn);

const network = new Network();
view.network = network;

network.addNode(new VertexInput({ name: "Vertex Input", x: 240 * 0 }));
network.addNode(new SplitVec4f({ name: "Split 4D Vector", x: 240 * 1 }));
network.addNode(new MergeVec4f({ name: "Merge 4D Vector", x: 240 * 2 }));
network.addNode(new SplitVec2f({ name: "Split 2D Vector", x: 240 * 3 }));
network.addNode(new MergeVec2f({ name: "Merge 2D Vector", x: 240 * 4 }));
network.addNode(new FragmentTarget({ name: "Fragment Target", x: 240 * 5 }));

runBtn.addEventListener("click", () => {
    const pipeline = buildPipeline(device, network);

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                loadOp: "clear",
                storeOp: "store",
                view: surface.getCurrentTexture().createView(),
                clearValue: [0, 0, 0, 1],
            },
        ],
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(4);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
});
