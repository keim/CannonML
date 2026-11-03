// docs/reference/v3/cannonML.md: 「特殊ファイバ起動」「その他」（@x @o @ko / ko kf / t* / m*）
import { describe, it, expect } from "vitest";
import { run, deg, withTarget, at, parse } from "../helpers/run.js";
import { createCML } from "../helpers/load.js";

const round = n => Math.round(n * 1e6) / 1e6;
const pos = o => [round(o.pos.x), round(o.pos.y)];

describe("@x 排他的ファイバ起動", () => {
  it("同じ排他実行 ID を持つ起動中のファイバを停止してから、新たなファイバを起動する", () => {
    const { counts } = run("@x1{[f0 w1]} w3 @x1{}", 12);
    expect(counts[4]).toBeGreaterThan(2);
    expect(counts.at(-1)).toBe(counts[4]);
  });

  it("排他実行 ID が違えば他のファイバを停止しない", () => {
    expect(run("@x1{[f0 w1]} @x2{[f0 w1]}", 5).counts.at(-1)).toBe(10);
  });

  // 排他実行 ID=0 も他の ID と同じく排他。2 つ目の起動で 1 つ目が止まり、生成は 1 本分（1 フレーム 1 発）
  it("排他実行 ID=0 も同じ ID 同士は互いに停止する", () => {
    expect(run("@x0{[f0 w1]} @x0{[f0 w1]}", 5).counts.at(-1)).toBe(5);
  });

  it("仕様の例: @x1{[dt0 f10 w2]} w60 @x1{dt a-0.2} は、60 フレーム連射したあと連射を止めて逃避する", () => {
    const r = run("@x1{[dt0 f10 w2]} w60 @x1{dt a-0.2}", 90, { before: withTarget(0, 100) });
    expect(r.counts[58]).toBeGreaterThan(25);
    expect(r.counts.at(-1)).toBe(r.counts[69]);
    expect(r.runner.vel.y).toBeLessThan(0);
  });
});

describe("@o 子オブジェクトファイバ起動", () => {
  it("f の第 2 引数で ID を指定した子オブジェクトに対してだけ、シーケンスを実行する", () => {
    const r = run("f0,1{} f0,2{} @o1{p9,0}", 3);
    expect(pos(r.spawned[0])).toEqual([9, 0]);
    expect(pos(r.spawned[1])).toEqual([0, 0]);
  });

  it("同じ ID の子オブジェクトすべてに対して起動する", () => {
    const r = run("f0,1{} f0,1{} @o1{p9,0}", 3);
    expect(r.spawned.map(pos)).toEqual([[9, 0], [9, 0]]);
  });

  it("@o1{@o2{...}} は孫オブジェクトに対してシーケンスを実行する", () => {
    const r = run("f0,1{f0,2{}} w2 @o1{@o2{p9,0}}", 6);
    expect(pos(r.spawned[0])).toEqual([0, 0]);
    expect(pos(r.spawned[1])).toEqual([9, 0]);
  });

  // @o は子オブジェクト ID を 1 つだけ受け取る。2 つ書くと構文エラー
  it("@o に ID を 2 つ書くと構文エラー", () => {
    expect(() => parse("f0,1{} @o1,2{p9,0}")).toThrow();
  });
});

describe("@ko オブジェクト破棄時に起動するファイバ", () => {
  it("指定した終了ステータスで破棄されたとき、ファイバを起動する", () => {
    expect(run("@ko1{p9,0} w2 ko1", 4).trace.at(-1)).toEqual([9, 0]);
  });

  it("終了ステータスが違えば起動しない", () => {
    expect(run("@ko1{p9,0} w2 ko2", 4).trace.at(-1)).toEqual([0, 0]);
  });

  it("CMLObject.destroy() の引数で指定した終了ステータスでも起動する", () => {
    const r = run("@ko1{p9,0} w100", 1);
    r.runner.destroy(1);
    r.cml.update();
    expect(r.runner.pos.x).toBe(9);
  });

  it("シーケンスは 1 フレームだけ実行され、w 以降は無視される", () => {
    const r = run("@ko1{p9,0 w1 p7,0} w2 ko1", 8);
    expect(r.trace.at(-1)).toEqual([9, 0]);
  });
});

describe("ko オブジェクト破棄", () => {
  it("このコマンドを実行したオブジェクト自身を破棄する", () => {
    expect(run("w2 ko0", 2).runner.isActive).toBe(true);
    expect(run("w2 ko0", 3).runner.isActive).toBe(false);
  });

  it("破棄すると onDestroy コールバックが呼ばれる", () => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    let called = 0;
    const r = cml.runner(0, 0, 0);
    r.setCallbackFunctions({ onDestroy: () => called++ });
    r.execute(cml.sequence("w2 ko3"));
    for (let i = 0; i < 5; i++) cml.update();
    expect(called).toBe(1);
  });
});

describe("kf 全ファイバ停止", () => {
  it("このファイバが生成したすべての子ファイバを強制終了する", () => {
    const { counts } = run("{[f0 w1]} w3 kf", 10);
    expect(counts[3]).toBeGreaterThan(2);
    expect(counts.at(-1)).toBe(counts[4]);
  });

  it("kf を実行したファイバ自身は止まらない", () => {
    expect(run("kf p9,0", 2).trace.at(-1)).toEqual([9, 0]);
  });

  it("@o で起動したファイバは kf で停止しない", () => {
    const { counts } = run("f0,1{} @o1{[f0 w1]} w3 kf", 12);
    expect(counts.at(-1)).toBeGreaterThan(counts[5]);
  });

  it("他のファイバが生成したファイバは止めない", () => {
    expect(run("{[f0 w1]} {w3 kf}", 6).counts.at(-1)).toBe(6);
  });
});

describe("t* ターゲットオブジェクトの指定", () => {
  // 子オブジェクト (50,0) が w1 の後でターゲットを変えて射出する。弾は 2 番目の生成物
  const childShot = (childScript, before) => {
    const r = run(`q50,0 f0{w1 ${childScript} f5}`, 4, { before });
    return deg(r.spawned[1].vel);
  };

  it("td: デフォルトターゲット（setDefaultTarget で指定したオブジェクト）に向ける", () => {
    expect(childShot("dt0", withTarget(0, 100))).toBeCloseTo(Math.atan2(100, -50) * 180 / Math.PI);
  });

  it("tp: ターゲットを親オブジェクトに変更する", () => {
    expect(childShot("tp dt0", withTarget(0, 100))).toBeCloseTo(180);
  });

  it("tp のあと td でデフォルトターゲットに戻る", () => {
    expect(childShot("tp td dt0", withTarget(0, 100))).toBeCloseTo(Math.atan2(100, -50) * 180 / Math.PI);
  });

  it("to: ターゲットを、指定 ID を持った子オブジェクトに変更する", () => {
    const r = run("f0,1{p0,30} w2 to1 dt0 f5", 4);
    expect(deg(r.spawned[1].vel)).toBeCloseTo(90);
  });

  it("to: 同じ ID の子オブジェクトが複数ある場合は、生存している中で最古のオブジェクト", () => {
    const r = run("f0,1{p0,30} f0,1{p30,0} w2 to1 dt0 f5", 4);
    expect(deg(r.spawned[2].vel)).toBeCloseTo(90);
  });

  it("to: 最古のオブジェクトが破棄されていれば、次に古い生存オブジェクトになる", () => {
    const r = run("f0,1{p0,30 w2 ko0} f0,1{p30,0} w6 to1 dt0 f5", 8);
    expect(deg(r.spawned[2].vel)).toBeCloseTo(0);
  });
});

describe("mx / my 反転動作", () => {
  // 基準は da30 p10,0（画面の -60 度に 10 進んだ位置）。角度はスクロール方向を軸に反転する:
  //   mx … スクロール方向の垂直成分を反転（da30 は画面の 30 度 → -30 度）
  //   my … スクロール方向の平行成分を反転（da30 は画面の 30 度 → 150 度）
  const BASE = "da30 p10,0";
  const mirror = prefix => run(`${prefix} ${BASE}`, 1).trace[0];

  it("mx と my は、それぞれ別の 1 軸だけを反転する", () => {
    expect(mirror("mx")).toEqual(at(-30, 10));
    expect(mirror("my")).toEqual(at(150, 10));
  });

  it("mx my で両軸が反転し、同じコマンドを 2 回で元に戻る", () => {
    expect(mirror("mx my")).toEqual(at(210, 10));
    expect(mirror("mx mx")).toEqual(at(30, 10));
  });

  // 既知の不具合: p の成分は反転されない（d* の角度と q・b* だけがミラーされる）。
  // 反転は、スクロール方向を軸にした鏡映: 基準の b（直交成分）の符号が反転する
  it.fails("p の位置が反転する", () => {
    expect(run("mx da30 p10,5", 1).trace[0]).toEqual(at(-30, 10, -5));
    expect(run("my da30 p10,5", 1).trace[0]).toEqual(at(150, 10, -5));
  });

  // 既知の不具合: 上と同じ（v の成分は反転されない）
  it.fails("v の速度が反転する", () => {
    expect(run("mx da0 v10,5", 1).runner.vel).toEqual(at(0, 10, -5));
  });

  // 既知の不具合: 上と同じ（a の成分は反転されない）
  it.fails("a の加速度が反転する", () => {
    expect(run("mx da0 a10,5", 1).runner.acc).toEqual(at(0, 10, -5));
  });

  // 要確認: q の反転は画面の軸（mx は y、my は x）で、d* の角度の反転（スクロール方向基準）と軸が揃っていない
  it("q の位置が反転する（現在の軸）", () => {
    expect(pos(run("mx q10,5 f0", 1).spawned[0])).toEqual([10, -5]);
    expect(pos(run("my q10,5 f0", 1).spawned[0])).toEqual([-10, 5]);
  });

  // da0 は画面の -90 度（基準）。bs で 1 射出ごとに +10 度、mx では -10 度ずつ、my では 180 度を起点に -10 度ずつ
  it("b* の角度が反転する", () => {
    const angles = prefix => run(`${prefix} da0 bs3,10,0 f5`, 1).spawned.map(o => Math.round(deg(o.vel)));
    expect(angles("")).toEqual([-90, -80, -70]);
    expect(angles("mx")).toEqual([-90, -100, -110]);
    expect(angles("my")).toEqual([90, 80, 70]);
  });

  it("w を挟むと反転はリセットされる", () => {
    expect(run(`mx w1 ${BASE}`, 2).trace.at(-1)).toEqual(at(30, 10));
  });

  it("& で呼び出したシーケンスの全コマンドが反転する", () => {
    expect(run(`#A{${BASE}} mx &A`, 1).trace[0]).toEqual(mirror("mx"));
  });

  it("{...} で起動したファイバは、w の後も含めて全コマンドが反転する", () => {
    expect(run(`mx {${BASE} w1 ${BASE}}`, 3).trace.at(-1)).toEqual(mirror("mx"));
  });

  it("f で生成した子オブジェクトのファイバも全コマンドが反転する", () => {
    expect(pos(run(`mx f0{${BASE} w1 ${BASE}}`, 4).spawned[0])).toEqual(mirror("mx"));
  });
});
