---
name: Node System
startTime: 2025-07-19T11:42:06.585Z
dependencies: []
tags: [area/core]
---

# Node system
## About this experiment
Introduce a node system with real-time capability, as well as Web Component for editing nodes. The node system will be
adapted for all kind of apps, which means it should be generalized.

## Goals
In order to consider this experiment a success, all required goals must be achieved.

### Required goals
- [ ] Editor UI works in Chromium/Firefox
- [ ] Usable in following environments: Chromium/Firefox and Deno
- [x] Dynamically add and remove sockets
- [ ] Custom UI on nodes
- [ ] Grouping nodes with sockets exporting
- [ ] Framing nodes for organization
- [ ] Routing wires

### Optional goals
- [ ] Usable in following environments: Node and Bun
- [ ] Programmatically edit the node network

## Demo
The following demo converts node network into WebGPU Shading Language and build render pipeline from it.

## Notes
### Editing node programmatically
When inserting new node in the network, the algorithm should be able to push the nodes to left/right to make some empty
space. When removing existing node, the algorithm should also push the nodes to reclaim empty space.