// docs/reference/v3/cannonML.md: 「オブジェクト制御」（i ~ d* p v a r）
import { describe, it, expect } from "vitest";
import { run, last, deg, withTarget, at, screenDeg } from "../helpers/run.js";

const xs = trace => trace.map(([x]) => x);
const RAD = Math.PI / 180;

describe("方向設定 d*", () => {
  // d* の角度はスクロール方向を 0 とする。既定の縦スクロールでは、da0 は画面の下、da90 は画面の右
  it("da: 角度は Degree、反時計回りが正（スクロール方向基準）", () => {
    expect(last("da90 p10,0")).toEqual([10, 0]);
    expect(last("da0 p10,0")).toEqual([0, -10]);
    expect(last("da180 p10,0")).toEqual([0, 10]);
    expect(last("da-90 p10,0")).toEqual([-10, 0]);
    expect(last("da180 p10,0")).toEqual(at(180, 10));
  });

  it("p の第 2 引数は指定角度に垂直な方向（反時計回り）", () => {
    expect(last("da90 p0,5")).toEqual([0, 5]);
    expect(last("da0 p0,5")).toEqual([5, 0]);
  });

  it("da の基準（0 度）はスクロール方向で、縦と横で向きが変わる", () => {
    const vertical = run("da0 p10,0", 1, { vertical: true }).trace[0];
    const horizontal = run("da0 p10,0", 1, { vertical: false }).trace[0];
    expect(horizontal).not.toEqual(vertical);
  });

  // 先頭の w1 は、生成直後は projected が未更新で、ターゲットの位置が (0,0) に見えるのを避けるため
  it("dt: ターゲット方向との相対角度", () => {
    const before = withTarget(0, 100);
    expect(last("w1 dt0 p10,0", 2, { before })).toEqual([0, 10]);
    expect(last("w1 dt90 p10,0", 2, { before })).toEqual([-10, 0]);
  });

  // da90 r1,1 で、オブジェクトの角度は画面の 0 度（右）
  it("do: オブジェクト角度との相対角度", () => {
    expect(last("da90 r1,1 do0 p10,0")).toEqual([10, 0]);
    expect(last("da90 r1,1 do90 p10,0")).toEqual([0, 10]);
  });

  // da90 v5,0 で、進行方向は画面の 0 度（右）
  it("dv: オブジェクト進行方向との相対角度", () => {
    const angle = script => deg(run(script, 1).spawned[0].vel);
    expect(angle("da90 v5,0 dv0 f10")).toBeCloseTo(0);
    expect(angle("da90 v5,0 dv90 f10")).toBeCloseTo(90);
  });

  // 親オブジェクトの向き（da90 で画面の 90 度）を基準にした相対角度
  it("dp: 親オブジェクトの角度との相対角度", () => {
    // 親は da0 r1,1 で画面の -90 度（下）を向く。fs の子は親の角度基準、f の子は画面の 0 度基準
    const vel = s => deg(run(s, 3).spawned[0].vel);
    expect(vel("da0 r1,1 w1 fs0{w1 dp0 v10,0}")).toBeCloseTo(-90);
    expect(vel("da0 r1,1 w1 fs0{w1 dp90 v10,0}")).toBeCloseTo(0);
    expect(vel("da0 r1,1 w1 f0{w1 dp90 v10,0}")).toBeCloseTo(90);
  });

  // da30 は画面の -60 度、ds60 で画面の 0 度（右）
  it("ds: 現在の角度設定値からの相対角度", () => {
    expect(last("da30 ds60 p10,0")).toEqual([10, 0]);
    // da0 は画面の -90 度、ds90 を 2 回で画面の 90 度（上）
    expect(last("da0 ds90 ds90 p10,0")).toEqual([0, 10]);
  });

  it("角度は実行した時点で算出される（dt0 w10 f と w10 dt0 f は向きが違う）", () => {
    // ターゲットは (0,100) にいて、5 フレーム後に (100,0) へ移る
    const before = withTarget(0, 100, "w5 p100,0");
    const early = run("w1 dt0 w10 f10", 13, { before }).spawned[0];
    const late = run("w11 dt0 f10", 13, { before }).spawned[0];
    expect(deg(early.vel)).toBeCloseTo(90);
    expect(deg(late.vel)).toBeCloseTo(0);
  });
});

describe("位置 p / pz", () => {
  it("p は d* で指定した方向を基準に絶対位置を設定する", () => {
    expect(last("p10,5")).toEqual([10, 5]);
    expect(last("p1,0 p2,3")).toEqual([2, 3]);
  });

  it("pz は z 座標を指定する", () => {
    const r = run("pz5", 1);
    expect(r.runner.pos.z).toBe(5);
    expect(r.trace[0]).toEqual([0, 0]);
  });

  it("i0（既定）なら即時に変更する", () => {
    expect(xs(run("i0 p40,0", 1).trace)).toEqual([40]);
  });

  it("i n の p は n フレームかけて移動し、ちょうど目標で止まる", () => {
    const t = xs(run("i4 p40,0", 6).trace);
    expect(t[3]).toBe(40);
    expect(t[4]).toBe(40);
    expect(t[5]).toBe(40);
  });

  it("i n の p は速度 0 で出発し速度 0 で着くので、中間点は対称になる", () => {
    const t = xs(run("i4 p40,0", 4).trace);
    expect(t[1]).toBeCloseTo(20);
    expect(t[0]).toBeCloseTo(40 - t[2]);
  });

  it("pz も i の影響を受け、xy とは独立に補間する", () => {
    const a = run("i4 pz40", 4);
    expect(a.runner.pos.z).toBeCloseTo(40);
    expect(a.trace.at(-1)).toEqual([0, 0]);
    const b = run("i4 p40,0", 4);
    expect(b.runner.pos.z).toBe(0);
  });

  it("i30 p10,20 v5 のように p と v を同時に指定すると、目標位置に着いた時の速度が v になる", () => {
    // da0 は画面の下。p10,20 は下向き 10・右向き 20 の位置、v5 は下向きに毎フレーム 5
    const t = run("da0 i4 p10,20 v5", 6).trace;
    expect(t[3]).toEqual(at(0, 10, 20));
    expect(t[5]).toEqual(at(0, 20, 20));
  });
});

describe("速度 v / vz", () => {
  it("v は毎フレーム位置に加算される速度を設定する", () => {
    expect(run("da0 v2,0", 3).trace).toEqual([at(0, 2), at(0, 4), at(0, 6)]);
  });

  it("v の向きは d* に従い、第 2 引数は垂直方向", () => {
    expect(run("da90 v2,0", 3).trace.at(-1)).toEqual(at(90, 6));
    expect(run("da0 v0,3", 3).trace.at(-1)).toEqual(at(0, 0, 9));
  });

  it("引数を省略すると 0 になり止まる", () => {
    expect(run("da0 v2,0 w2 v", 6).trace.slice(-2)).toEqual([at(0, 4), at(0, 4)]);
  });

  it("vz は z 方向の速度を設定する", () => {
    const r = run("vz2", 3);
    expect(r.runner.pos.z).toBe(6);
    expect(r.trace.at(-1)).toEqual([0, 0]);
  });

  it("i n の v は n フレームかけて加減速して指定速度になり、そのあと一定速度で進む", () => {
    const r4 = run("da0 i4 v10,0", 4);
    expect(r4.runner.vel.x).toBeCloseTo(0);
    expect(r4.runner.vel.y).toBeCloseTo(-10);
    const r8 = run("da0 i4 v10,0", 8);
    expect(r8.runner.vel.y).toBeCloseTo(-10);
  });

  it("i n の vz も同様に指定速度になる", () => {
    expect(run("i4 vz10", 4).runner.vel.z).toBeCloseTo(10);
    expect(run("i4 vz10", 8).runner.vel.z).toBeCloseTo(10);
  });
});

describe("加速度 a / az", () => {
  it("a は毎フレーム速度に加算される加速度を設定する", () => {
    // da0 は下、da90 は右、a0,1 は da0 の反時計回りの向き（右）
    expect(run("da0 a1,0", 3).runner.vel.y).toBeCloseTo(-3);
    expect(run("da90 a1,0", 3).runner.vel.x).toBeCloseTo(3);
    expect(run("da0 a0,1", 3).runner.vel.x).toBeCloseTo(3);
  });

  it("i の影響を受けない", () => {
    expect(run("da0 i10 a1,0", 3).runner.vel.y).toBeCloseTo(-3);
  });

  it("a0 で加速を止められる", () => {
    const speed = n => { const v = run("da0 a1,0 w3 a0", n).runner.vel; return Math.hypot(v.x, v.y); };
    expect(speed(6)).toBeGreaterThan(0);
    expect(speed(8)).toBeCloseTo(speed(6));
  });

  it("速度に変遷時間を指定する v でも加速は止まる", () => {
    const speed = n => { const v = run("da0 a1,0 w2 i4 v5,0", n).runner.vel; return Math.hypot(v.x, v.y); };
    expect(speed(12)).toBeCloseTo(5);
    expect(speed(14)).toBeCloseTo(5);
  });

  it("az は z 方向の加速度を設定する", () => {
    expect(run("az1", 3).runner.vel.z).toBeCloseTo(3);
  });
});

describe("補間時間 i / ~", () => {
  it("~ n は i n と w n を実行する（~10 v5 は i10 v5 w10）", () => {
    const a = run("da0 ~4 v5,0 f0", 12);
    const b = run("da0 i4 v5,0 w4 f0", 12);
    expect(a.trace).toEqual(b.trace);
    expect(a.counts).toEqual(b.counts);
  });

  it("~ は直後の補間コマンドをまとめて実行する（p と v を同時に補間する）", () => {
    const a = run("da0 ~4 p40,0 v5", 8).trace;
    const b = run("da0 i4 p40,0 v5 w4", 8).trace;
    expect(a).toEqual(b);
  });

  it("~ の引数を省略すると i の指定値を使う（i60 ~ p10,0 ~ p-10,0 は i60 p10,0 w60 p-10,0 w60）", () => {
    const a = run("i6 ~ p10,0 ~ p-10,0", 16).trace;
    const b = run("i6 p10,0 w6 p-10,0 w6", 16).trace;
    expect(a).toEqual(b);
  });

  it("~ の引数の小数は切り捨てる（~2.5 は ~2、i2.5 と同じ）", () => {
    expect(run("~2.5 p10,0", 6).trace).toEqual(run("~2 p10,0", 6).trace);
    expect(run("~2.5 p10,0", 6).trace.at(-1)).toEqual(run("i2.5 p10,0 w2", 6).trace.at(-1));
    // 0.5 は切り捨てて 0 になるので、i の指定値を使う
    expect(run("i4 ~0.5 p10,0", 6).trace).toEqual(run("i4 ~ p10,0", 6).trace);
  });

  // ~ の後に続くコマンドは、補間の後ろから実行される（補間命令の位置で止まって次の命令を飛ばさない）
  it("~ の後の非補間コマンドは飛ばされず、補間が終わるとすぐ実行される", () => {
    const x = run("~3 p10,0 w1 p20,0", 6).trace.map(([v]) => Math.round(v));
    expect(x.slice(2)).toEqual([10, 10, 20, 20]);
  });

  it("~ を使うと次の補間コマンドは前の補間が終わってから始まる", () => {
    const t = xs(run("i6 ~ p10,0 ~ p-10,0", 14).trace);
    expect(t[5]).toBe(10);
    expect(t[13]).toBe(-10);
  });
});

describe("旋回 r / rx / ry", () => {
  // d* の角度は画面の角度 + スクロール方向（縦では -90°）。da0 は画面の -90°、da180 は画面の 90°
  it("r は i0（既定）なら d* で指定した方向へ即座に向く", () => {
    expect(run("da0 r1,1", 1).runner.angleOnScreen).toBeCloseTo(screenDeg(0) * RAD);
    expect(run("da180 r1,1", 1).runner.angleOnScreen).toBeCloseTo(screenDeg(180) * RAD);
  });

  it("r1,1 は i フレームかけて等速で旋回する", () => {
    const T = screenDeg(0) * RAD; // 画面の -90 度へ向けて回る
    const angle = n => run("da0 i4 r1,1", n).runner.angleOnScreen;
    expect(angle(1)).toBeCloseTo(T / 4);
    expect(angle(2)).toBeCloseTo(T / 2);
    expect(angle(4)).toBeCloseTo(T);
    expect(angle(6)).toBeCloseTo(T);
  });

  it("r0,0 は加速→減速し、開始時と終了時の角速度は 0", () => {
    const T = screenDeg(0) * RAD;
    const angle = n => run("da0 i4 r0,0", n).runner.angleOnScreen;
    expect(Math.abs(angle(1))).toBeLessThan(Math.abs(T) / 4);
    expect(angle(2)).toBeCloseTo(T / 2);
    expect(angle(4)).toBeCloseTo(T);
  });

  it("r2,0 は開始時の角速度が等速の 2 倍（等加速度回転）", () => {
    const T = screenDeg(0) * RAD;
    const angle = n => run("da0 i4 r2,0", n).runner.angleOnScreen;
    expect(Math.abs(angle(1))).toBeGreaterThan(Math.abs(T) / 4);
    expect(angle(4)).toBeCloseTo(T);
  });

  it("r-1,0 は開始時に反対方向へ回り、最後は指定方向に着く", () => {
    const T = screenDeg(0) * RAD; // 負の向き。最初は正の向きへ戻る
    const angle = n => run("da0 i10 r-1,0", n).runner.angleOnScreen;
    expect(angle(1)).toBeGreaterThan(0);
    expect(angle(10)).toBeCloseTo(T);
  });

  // da は縦スクロールでは -90 度が 0 になるので、da180 は画面上の 90 度（上向き）
  it("第 3 引数は 1 回の旋回量の最大値（度）", () => {
    expect(run("da180 r1,1,10", 1).runner.angleOnScreen).toBeCloseTo(10 * RAD);
    expect(run("[da180 r1,1,10 w1]", 3).runner.angleOnScreen).toBeCloseTo(30 * RAD);
  });

  it("仕様の例: [dt0 r1,1,1 w1] は最大 1 度/フレームでターゲットへ旋回する", () => {
    const before = withTarget(0, 100);
    expect(run("w1 [dt0 r1,1,1 w1]", 6, { before }).runner.angleOnScreen).toBeCloseTo(5 * RAD);
  });

  it("rx は X 軸を軸に、i フレームかけて指定角度（度）まで旋回する", () => {
    const r = run("i4 rx30,1,1", 4).runner;
    expect(r.euler.x).toBeCloseTo(30 * RAD);
    expect(r.euler.y).toBeCloseTo(0);
  });

  it("ry は Y 軸を軸に、i フレームかけて指定角度（度）まで旋回する", () => {
    const r = run("i4 ry30,1,1", 4).runner;
    expect(r.euler.y).toBeCloseTo(30 * RAD);
    expect(r.euler.x).toBeCloseTo(0);
  });

  it("rx と ry は独立に計算される", () => {
    const r = run("rx30,1,1 ry60,1,1", 1).runner;
    expect(r.euler.x).toBeCloseTo(30 * RAD);
    expect(r.euler.y).toBeCloseTo(60 * RAD);
  });
});
