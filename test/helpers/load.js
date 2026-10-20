import { readFileSync } from "node:fs";
import vm from "node:vm";
import { bundlePath } from "./paths.js";

// global-setup.js が src/index.ts から作ったバンドル。vitest 起動ごとに 1 回だけ読む
const code = readFileSync(bundlePath, "utf8") + "\nthis.CML = CMLLib.CML; this.CannonML = CMLLib.CannonML;";

/** 新しい vm コンテキストに読み込む（CannonML は singleton なのでテストごとに別コンテキスト） */
export function loadCML() {
  const ctx = vm.createContext({});
  vm.runInContext(code, ctx, { filename: "cml.iife.js" });
  return ctx;
}

/** CannonML インスタンスまで作る。乱数は固定値を返す（既定 0.5） */
export function createCML({ vertical = true, rand = () => 0.5 } = {}) {
  const ctx = loadCML();
  const cml = new ctx.CannonML(vertical);
  cml.globalVariables.funcRand = rand;
  return { ctx, CML: ctx.CML, cml };
}
