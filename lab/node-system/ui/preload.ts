import { NetworkViewElement } from "./network-view.ts";
import { NodeViewElement } from "./node-view.ts";

customElements.define("nahara-node-view", NodeViewElement);
customElements.define("nahara-network-view", NetworkViewElement);

declare global {
    interface HTMLElementTagNameMap {
        "nahara-node-view": NodeViewElement;
        "nahara-network-view": NetworkViewElement;
    }
}
