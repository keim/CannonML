import { createCML } from "./load.js";

const round = n => Math.round(n * 1e6) / 1e6;

/**
 * script を 1 つの Runner で実行して frames 回 update する。
 * trace は各フレーム後の runner の [x, y]、spawned は発射/生成された Runner。
 */
export function run(script, frames = 1, { args = null, vertical = true, screen = 10000, rand, before } = {}) {
  const { cml, CML, ctx } = createCML({ vertical, rand });
  cml.setScreenSize(screen, screen);
  before && before(cml);
  const spawned = [];
  const runner = cml.runner(0, 0, 0);
  runner.setCallbackFunctions({ onCreateNewRunner: r => spawned.push(r) });
  const fiber = runner.execute(cml.sequence(script), args);
  const trace = [];
  for (let i = 0; i < frames; i++) {
    cml.update();
    trace.push([round(runner.pos.x), round(runner.pos.y)]);
  }
  return { cml, CML, ctx, runner, fiber, spawned, trace };
}

/** 最終フレームの [x, y] */
export const last = (script, frames = 1, opts) => run(script, frames, opts).trace.at(-1);

/** Vector -> [x, y] */
export const xy = v => [round(v.x), round(v.y)];
