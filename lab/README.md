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