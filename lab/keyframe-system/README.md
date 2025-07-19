---
name: Keyframe system
startTime: 2025-07-18T16:27:04.338Z
dependencies: []
tags: [area/animation]
---

# Keyframe system
## About this experiment
Explore a system/user interaction for keyframing animations. This will be used for anything related to animations in all
apps.

## Goals
In order to consider this experiment a success, all required goals must be achieved.

### Required goals
- [ ] Usable in following environments: Chromium/Firefox and Deno
- [ ] Cubic bezier easing function
- [ ] Spring easing function
- [ ] Common easing function presets
- [ ] Packaged as simple to use Web Components

### Optional goals
- [ ] Usable in following environments: Node and Bun

## Design notes
There will be some design notes here...

## Technical notes
### Web Components
This experiment introduces 2 web components:

- `<nahara-keyframe-view>`: A view for editing each individual channel of a keyframe on a graph. This is its own big
view and should only be used for editing a single animation controller.
- `<nahara-timeline-view>`: A view for viewing all keyframes ordered on a horizontal timeline. This can be used on each
individual property of an animatable object and stacked vertically to display/compare keyframes across multiple
properties.

### Keyframes
A single keyframe consists of following parts:

- Time of the keyframe on the timeline;
- Easing function that interpolates between previous and current keyframe;
- A set of values whose controller's values matches with keyframe's at keyframe time.

### Calculating value
To calculate the value, simply perform binary search on the timeline to find 2 keyframes next to target time, then
interpolate the values using the easing function from the next keyframe.

### Appending/prepending new keyframe
Appending keyframe is simple: simply duplicate the keyframe before selected time and adjust it to new time and there we
go. The same can be done for prepending: duplicate the keyframe after selected time and adjust to new time.

### Inserting new keyframe between the two
But what about inserting new keyframe? Interpolate to get the values at given time is one thing, but how do we calculate
the parameters for new easing function? Maybe we just copy the easing function of the next keyframe for now.

### Animation controller on multiple views
A single animation controller can be assigned to multiple `<nahara-keyframe-view>`. When assigning the controller, the
component will register event listeners to animation controller. Any modifications on controller will be reflects by
emitting events from `EventTarget`, allowing other views to update accordingly.