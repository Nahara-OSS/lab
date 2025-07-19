# Lab experiments
## Experiment structure
Each experiment is encapsulated in its own folder. All experiments are allowed to interact with `@nahara/lab` and its
dependencies listed under `lab/` folder only.

- `README.md` contains both the metadata (as YAML header) and user-readable document describing the experiment.
- `mod.ts` exports all symbols for dependants.
- `main.ts` contains the code for testing and showcasing the experiment.
- `index.html` is the main HTML that will be embedded inside `<iframe>` of the lab's webpage.
  + `index.ts` will be bundled into `index.js` and placed next to `index.html`.
  + Deno's `bundle` command will be used to bundle the scripts.

### Metadata
Metadata is stored as YAML header in `README.md` of the experiment's folder:

```yaml
name: Experiment Name
startTime: (ISO string)
dependencies: [A list of experiments that this one depends on]
tags: [A list of tags]
```

## Tags
Tags are used by search box for searching experiments that could be related to keywords.

### Area namespace (`area/`)
- `area/animation`: This experiment is designed around animating.
- `area/raster`: This experiment is designed for raster graphics.
- `area/vector`: This experiment is designed for vector graphics.

### File format namespace (`file/`)
This one is usually suffixed with file extension.