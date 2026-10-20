import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it, expect } from "vitest";
import { root } from "./helpers/paths.js";

// tsc の出力（ESM）を Node でそのまま import できるか。次を検出する:
//  - 循環 import の評価順の誤り（ReferenceError）
//  - 相対 import の `.js` 拡張子の付け忘れ（moduleResolution: bundler の tsc は見逃すが、Node の ESM は拒否する）
describe("tsc output (dist)", () => {
  it("Node で import でき、CannonML が動く", () => {
    const out = mkdtempSync(join(tmpdir(), "cannonml-dist-"));
    try {
      execFileSync(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "--outDir", out, "--declaration", "false", "--sourceMap", "false"], { cwd: root });
      const script = `
        const { CML, CannonML } = await import(${JSON.stringify(pathToFileURL(join(out, "index.js")).href)});
        const cml = new CannonML();
        cml.setScreenSize(1000, 1000);
        const r = cml.runner(0, 0, 0, cml.sequence("vx2"));
        cml.update(); cml.update();
        console.log(JSON.stringify([Object.keys(CML).length, r.pos.x]));
      `;
      const res = execFileSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
      expect(JSON.parse(res)).toEqual([22, 4]);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }, 60000);
});
