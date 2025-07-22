import "./index.css";
import { Network, Node, type NodeCreateOptions, type Socket } from "./mod.ts";
import "./ui/preload.ts";

class SplitRgbaNode extends Node {
    readonly rgba: Socket;
    readonly r: Socket;
    readonly g: Socket;
    readonly b: Socket;
    readonly a: Socket;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.rgba = this.addSocket({ id: "input", direction: "in", type: "color", name: "Color" });
        this.r = this.addSocket({ id: "r", direction: "out", type: "float", name: "Red" });
        this.g = this.addSocket({ id: "g", direction: "out", type: "float", name: "Green" });
        this.b = this.addSocket({ id: "b", direction: "out", type: "float", name: "Blue" });
        this.a = this.addSocket({ id: "a", direction: "out", type: "float", name: "Alpha" });
    }
}

class PulseGeneratorNode extends Node {
    readonly pulseOut: Socket;

    constructor(options: NodeCreateOptions) {
        super(options);
        this.pulseOut = this.addSocket({ id: "pulseOut", direction: "out", type: "pulse", name: "Pulse Out" });
    }
}

const view = document.createElement("nahara-network-view");
document.body.append(view);

const network = new Network();
network.addNode(new SplitRgbaNode({ name: "Split RGBA", x: 0, y: 0 }));
network.addNode(new PulseGeneratorNode({ name: "Pulse Generator", x: 8 * 30, y: 0 }));
console.log(network);

view.network = network;
