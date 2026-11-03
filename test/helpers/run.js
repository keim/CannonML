import { createCML } from "./load.js";

// + 0 で -0 を 0 にする（toEqual で -0 と 0 を区別しないため）
const round = n => Math.round(n * 1e6) / 1e6 + 0;

/**
 * script を 1 つの Runner で実行して frames 回 update する。
 * trace は各フレーム後の runner の [x, y]、counts は各フレーム後の生成数、
 * spawned は生成された Runner（孫以降も含む）、extra は before の戻り値。
 */
export function run(script, frames = 1, { vertical = true, screen = 10000, rand, before, invFlag = 0 } = {}) {
  const { cml, CML, ctx } = createCML({ vertical, rand });
  cml.setScreenSize(screen, screen);
  const extra = before && before(cml);
  const spawned = [];
  const runner = cml.runner(0, 0, 0);
  runner.setCallbackFunctions({ onCreateNewRunner: r => spawned.push(r) });
  const fiber = runner.execute(cml.sequence(script), invFlag);
  const trace = [], counts = [];
  for (let i = 0; i < frames; i++) {
    cml.update();
    trace.push([round(runner.pos.x), round(runner.pos.y)]);
    counts.push(spawned.length);
  }
  return { cml, CML, ctx, runner, fiber, spawned, trace, counts, extra };
}

/** 最終フレームの [x, y] */
export const last = (script, frames = 1, opts) => run(script, frames, opts).trace.at(-1);

/** Vector -> [x, y] */
export const xy = v => [round(v.x), round(v.y)];

/**
 * 縦スクロール（既定）でのスクロール方向の角度（度）。
 * d* / da の角度はスクロール方向を 0 として数える（da0 は画面の下、da90 は画面の右）。
 */
export const SCROLL = -90;

/** da の角度（度）を画面の角度（度）にする */
export const screenDeg = da => ((da + SCROLL + 540) % 360) - 180;

/**
 * da の向きに a、それと直交する向き（反時計回り）に b 進んだ先を、画面の座標 [x, y] で返す。
 * p / v / a の 1 番目・2 番目の引数と同じ式。
 */
export const at = (da, a, b = 0) => {
  const t = (da + SCROLL) * Math.PI / 180;
  return [round(a * Math.cos(t) - b * Math.sin(t)), round(a * Math.sin(t) + b * Math.cos(t))];
};

/** 角度（度）。Runner/Object の vel などから進行方向を求める */
export const deg = ({ x, y }) => round(Math.atan2(y, x) * 180 / Math.PI);

/**
 * before に渡して、(x, y) に Runner を置き、デフォルトターゲットにする。戻り値は extra で受け取れる。
 * script を渡すと、そのターゲット自身がそのスクリプトを実行する（動くターゲット用）。
 */
export const withTarget = (x, y, script) => cml => {
  const t = cml.runner(x, y, 0);
  t.scopeEnabled = false;
  cml.setDefaultTarget(t);
  if (script) t.execute(cml.sequence(script));
  return t;
};

/** パースだけ行う。構文エラーなら例外 */
export const parse = (script, { before } = {}) => {
  const { cml } = createCML();
  before && before(cml);
  return cml.sequence(script);
};
