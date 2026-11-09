import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./helpers/paths.js";
import { loadCML } from "./helpers/load.js";

describe("バージョン", () => {
  it("package.json と CannonML.VERSION が一致する", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const { CannonML } = loadCML();
    expect(CannonML.VERSION).toBe(pkg.version);
  });
});
