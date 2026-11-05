// docs/reference/v3/cannonML.md: 「オブジェクト生成」（o* b* f*）
import { describe, it, expect } from "vitest";
import { run, deg, withTarget, parse } from "../helpers/run.js";
import { createCML } from "../helpers/load.js";

const speed = o => Math.hypot(o.vel.x, o.vel.y);
const angles = spawned => spawned.map(o => deg(o.vel));
const sorted = a => [...a].sort((x, y) => x - y);
const round = n => Math.round(n * 1e6) / 1e6;
const pos = o => [round(o.pos.x), round(o.pos.y)];
// 弾は生成されたフレームの update で初速度ぶん動くので、そのぶんを戻して生成位置を求める
const origin = o => [round(o.pos.x - o.vel.x), round(o.pos.y - o.vel.y)];

// 先頭の w1 は、生成直後は projected が未更新でオブジェクトが (0,0) に見えるのを避けるため。
// その不具合自体は「最初のフレームの位置」のテストで確認している。

describe("オブジェクト生成 f / fs", () => {
  it("f は指定した初速度で子オブジェクトを 1 つ生成する", () => {
    // da0 は画面の下（縦スクロール）
    const r = run("da0 f5", 1);
    expect(r.spawned.length).toBe(1);
    expect(r.spawned[0].vel.x).toBeCloseTo(0);
    expect(r.spawned[0].vel.y).toBeCloseTo(-5);
  });

  it("初速度の向きは d* で指定した方向", () => {
    // da90 は画面の右
    const o = run("da90 f5", 1).spawned[0];
    expect(o.vel.x).toBeCloseTo(5);
    expect(o.vel.y).toBeCloseTo(0);
  });

  it("初速度 0 でも生成される", () => {
    expect(run("f0", 1).spawned.length).toBe(1);
  });

  it("子オブジェクトはオブジェクトの位置から生成される", () => {
    const o = run("p3,4 w1 f0", 2).spawned[0];
    expect(pos(o)).toEqual([3, 4]);
  });

  it("生成した最初のフレームでも、子オブジェクトはオブジェクトの位置から生成される", () => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    const spawned = [];
    const runner = cml.runner(3, 4, 0);
    runner.setCallbackFunctions({ onCreateNewRunner: c => spawned.push(c) });
    runner.execute(cml.sequence("f0"));
    cml.update();
    expect(pos(spawned[0])).toEqual([3, 4]);
  });

  it("f の子は親が動いても追従しない", () => {
    const r = run("da0 f0 v1,0", 6);
    expect(r.spawned[0].pos.x).toBeCloseTo(0);
    expect(r.spawned[0].pos.y).toBeCloseTo(0);
    expect(r.runner.pos.y).toBeCloseTo(-6);
  });

  it("fs の子は親の相対位置に配置され、親に追従する", () => {
    // 親は da0（画面の下）へ動く。縦方向の差で追従を見る
    const offset = n => {
      const r = run("da0 fs0 v1,0", n);
      return r.spawned[0].pos.y - r.runner.pos.y;
    };
    expect(offset(6)).toBeCloseTo(offset(3));
    const absolute = n => {
      const r = run("da0 f0 v1,0", n);
      return r.spawned[0].pos.y - r.runner.pos.y;
    };
    expect(absolute(6)).not.toBeCloseTo(absolute(3));
  });

  it("f の直後の {...} は、子オブジェクトが最初から実行するシーケンスになる", () => {
    expect(pos(run("f0{p5,0}", 3).spawned[0])).toEqual([5, 0]);
  });

  it("f5 { a0.1 } で、加速度 0.1 を持った初速 5 の弾が射出される", () => {
    const o = run("da0 f5{da0 a0.1}", 6).spawned[0];
    expect(Math.hypot(o.vel.x, o.vel.y)).toBeGreaterThan(5.3);
  });

  it("f の直後に &label を指定すると、そのシーケンスを実行する子オブジェクトが生成される", () => {
    expect(pos(run("#A{p9,0} f0 &A", 3).spawned[0])).toEqual([9, 0]);
  });

  it("&label の引数は、生成された子オブジェクトの $1.. になる", () => {
    expect(pos(run("#A{p$1,0} f0 &A 4", 3).spawned[0])).toEqual([4, 0]);
  });
});

describe("原点の指定 o / ox / oy", () => {
  it("o は子オブジェクトの初期位置を指定する", () => {
    expect(pos(run("w1 o5,3 f0", 2).spawned[0])).toEqual([5, 3]);
  });

  it("ox / oy は一方の座標だけを変える", () => {
    expect(pos(run("w1 o1,2 ox7 f0", 2).spawned[0])).toEqual([7, 2]);
    expect(pos(run("w1 o1,2 oy9 f0", 2).spawned[0])).toEqual([1, 9]);
  });

  it("旧名の q / qx / qy は構文エラー（o / ox / oy に改名）", () => {
    for (const s of ["q1,2", "qx7", "qy9", "w1 q5,3 f0"]) expect(() => parse(s), s).toThrow();
  });

  it("引数を省略すると 0 になる", () => {
    expect(pos(run("w1 o5,3 o f0", 2).spawned[0])).toEqual([0, 0]);
  });

  it("原点はオブジェクトの相対位置で、オブジェクトが回転するとその角度に合わせて移動する", () => {
    // da0 r1,1 で画面の -90 度へ向く。原点 (5,0) は -90 度回って (0,-5) になる
    expect(pos(run("da0 r1,1 w1 o5,0 f0", 2).spawned[0])).toEqual([0, -5]);
  });

  it("仕様の例 1: o0,0 dt0 o-5,0 f10 o5,0 f10 は、中心から算出した同じ向きで ±5 の位置から射出する", () => {
    const before = withTarget(0, 100);
    const [a, b] = run("w1 o0,0 dt0 o-5,0 f10 o5,0 f10", 2, { before }).spawned;
    expect(origin(a)).toEqual([-5, 0]);
    expect(origin(b)).toEqual([5, 0]);
    expect(deg(a.vel)).toBeCloseTo(90);
    expect(deg(b.vel)).toBeCloseTo(90);
  });

  it("仕様の例 2: o-5,0 dt0 f10 o5,0 dt0 f10 は、それぞれの位置からターゲットへ向けて射出する", () => {
    const before = withTarget(0, 100);
    const [a, b] = run("w1 o-5,0 dt0 f10 o5,0 dt0 f10", 2, { before }).spawned;
    expect(origin(a)).toEqual([-5, 0]);
    expect(origin(b)).toEqual([5, 0]);
    expect(deg(a.vel)).toBeCloseTo(Math.atan2(100, 5) * 180 / Math.PI);
    expect(deg(b.vel)).toBeCloseTo(Math.atan2(100, -5) * 180 / Math.PI);
  });
});

describe("同時生成 bm / bs / br", () => {
  it("bm は扇状弾: 中心角の範囲を等間隔に弾数分生成する", () => {
    // da0 の画面角は -90 度。扇の中心角 30 度は、両側 15 度ずつ
    const r = run("da0 bm3,30 f10", 1);
    expect(sorted(angles(r.spawned)).map(a => Math.round(a))).toEqual([-105, -90, -75]);
  });

  // 最初の弾は -[扇中心角]/2、最後の弾は +[扇中心角]/2。弾数 1 だと最初の弾だけなので、扇の端（-中心角/2）に飛ぶ
  it("bm は弾数 1 のとき、扇の中心ではなく端（-中心角/2）に 1 発だけ撃つ", () => {
    const one = s => angles(run(`da0 ${s} f10`, 1).spawned).map(a => Math.round(a + 90));
    expect(one("bm1,30")).toEqual([-15]);
    expect(one("bm1,-30")).toEqual([15]);
    expect(one("bm1,0")).toEqual([0]);
    expect(one("bm2,30")).toEqual([-15, 15]);
  });

  it("bm の速度幅も同様に、弾数 1 なら -速度幅/2 の速度で 1 発撃つ", () => {
    const speeds = s => run(`da0 ${s} f10`, 1).spawned.map(speed).map(v => Math.round(v * 100) / 100).sort((a, b) => a - b);
    expect(speeds("bm1,0,2")).toEqual([9]);
    expect(speeds("bm3,0,2")).toEqual([9, 10, 11]);
  });

  it("bm の第 3 引数は多重弾の速度幅", () => {
    const r = run("da0 bm5,0,2 f10", 1);
    expect(sorted(r.spawned.map(speed)).map(v => Math.round(v * 100) / 100)).toEqual([9, 9.5, 10, 10.5, 11]);
    expect(angles(r.spawned).every(a => Math.abs(a + 90) < 1e-6)).toBe(true);
  });

  it("扇中心角に 360 を指定すると全方位弾（端が重ならず等間隔）", () => {
    const a = sorted(angles(run("da0 bm4,360 f2", 1).spawned).map(v => ((Math.round(v) % 360) + 360) % 360));
    expect(a).toEqual([0, 90, 180, 270]);
  });

  it("扇中心角に -360 を指定しても全方位弾", () => {
    const a = sorted(angles(run("da0 bm4,-360 f2", 1).spawned).map(v => ((Math.round(v) % 360) + 360) % 360));
    expect(a).toEqual([0, 90, 180, 270]);
  });

  it("bs は 1 射出ごとに角度・速度が増減する", () => {
    const r = run("da0 bs3,10,1 f5", 1);
    expect(r.spawned.length).toBe(3);
    const a = angles(r.spawned), v = r.spawned.map(speed);
    expect(a[1] - a[0]).toBeCloseTo(10);
    expect(a[2] - a[1]).toBeCloseTo(10);
    expect(v[1] - v[0]).toBeCloseTo(1);
    expect(v[2] - v[1]).toBeCloseTo(1);
  });

  it("br は乱数弾: 角度範囲・速度範囲の中に弾数分生成する（乱数は funcRand）", () => {
    // da0 の画面角は -90 度。角度範囲 90 度の中心は -90 度で、乱数 0 なら -135 度、0.5 なら -90 度
    const lo = run("da0 br5,90,4,0 f10", 1, { rand: () => 0 });
    expect(lo.spawned.length).toBe(5);
    expect(angles(lo.spawned).every(a => Math.abs(a + 135) < 1e-6)).toBe(true);
    expect(lo.spawned.every(o => Math.abs(speed(o) - 8) < 1e-6)).toBe(true);
    const mid = run("da0 br5,90,4,0 f10", 1, { rand: () => 0.5 });
    expect(angles(mid.spawned).every(a => Math.abs(a + 90) < 1e-6)).toBe(true);
    expect(mid.spawned.every(o => Math.abs(speed(o) - 10) < 1e-6)).toBe(true);
    const hi = run("da0 br5,90,4,0 f10", 1, { rand: () => 0.999999 });
    expect(angles(hi.spawned).every(a => Math.abs(a + 45) < 0.01)).toBe(true);
  });

  it("第 4 引数は連射間隔（フレーム）で、弾数分を一定間隔で連射する", () => {
    const { counts } = run("bm3,0,0,5 f0", 16);
    const frames = counts.map((c, i) => (c > (counts[i - 1] ?? 0) ? i + 1 : 0)).filter(Boolean);
    expect(frames.length).toBe(3);
    expect(frames[1] - frames[0]).toBe(5);
    expect(frames[2] - frames[1]).toBe(5);
    expect(counts.at(-1)).toBe(3);
  });

  it("bm と bm を連ねると階層的な弾幕になる（bm3,30 bm5,0,2 は 3 方向 × 5 発）", () => {
    const r = run("da0 bm3,30 bm5,0,2 f5", 1);
    expect(r.spawned.length).toBe(15);
    const dirs = [...new Set(angles(r.spawned).map(a => Math.round(a)))];
    expect(sorted(dirs)).toEqual([-105, -90, -75]);
    const speeds = [...new Set(r.spawned.map(o => Math.round(speed(o) * 100) / 100))];
    expect(sorted(speeds)).toEqual([4, 4.5, 5, 5.5, 6]);
  });

  it("br と bm を連ねられる（br5,90,0,10 bm4,10 は 4 発の扇 × 5 回の連射）", () => {
    const r = run("da0 br5,90,0,10 bm4,10 f5", 50, { rand: () => 0.5 });
    expect(r.spawned.length).toBe(20);
  });

  it("指定したあと、f を繰り返しても同じ設定で生成される", () => {
    expect(run("da0 bm3,30 f10 f10", 1).spawned.length).toBe(6);
  });

  it("bs で弾数 0 かつ連射間隔 > 0 なら、kf するまで連射し続ける", () => {
    const r = run("bs0,0,0,2 f1 w5 kf", 24);
    expect(r.counts[9]).toBeGreaterThan(2);
    expect(r.counts.at(-1)).toBe(r.counts[11]);
  });

  it("bs で弾数 0 かつ連射間隔 > 0 なら、オブジェクトが破壊されるまで連射し続ける", () => {
    const r = run("bs0,0,0,2 f1 w5 ko0", 24);
    expect(r.counts[4]).toBeGreaterThan(1);
    expect(r.counts.at(-1)).toBe(r.counts[11]);
  });
});


