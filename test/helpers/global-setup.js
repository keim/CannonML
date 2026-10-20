import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { build } from "vite";
import { bundlePath, root } from "./paths.js";

// src/index.ts を 1 本の IIFE にまとめる。load.js が vm に毎回読み直して、テストごとに別の CannonML（singleton）を得る。
// shortcut: watch モードでは起動時の 1 回だけビルドする。src を変えたらテストを再起動すること
export default async function setup() {
  const out = await build({
    root,
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: { entry: join(root, "src/index.ts"), formats: ["iife"], name: "CMLLib", fileName: "cml" },
    },
  });
  const code = [out].flat().flatMap(o => o.output).find(c => c.type === "chunk").code;
  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, code);
}
