// docs/reference/v3/cannonML.md: 「特殊ファイバ起動」「その他」（@x @o @ko / ko kf / t* / @m）
import { describe, it, expect } from "vitest";
import { run, deg, withTarget, at, parse, xy } from "../helpers/run.js";
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

describe("@x の ID に変数・0 を使う", () => {
  it("変数で指定した排他 ID も、静的な ID と同じく前のファイバを止める", () => {
    expect(run("l$1=1 @x$1{[f0 w1]} w3 @x$1{}", 8).counts).toEqual(run("@x1{[f0 w1]} w3 @x1{}", 8).counts);
  });

  it("負の排他 ID は実行時エラー", () => {
    expect(() => run("@x-1{[f0 w1]}", 2)).toThrow("Invalid exclusive ID");
  });

  it("排他 ID 0 は、同じ ID 同士で止め合う", () => {
    expect(run("@x0{[f0 w1]} w3 @x0{}", 8).counts.at(-1)).toBe(run("@x1{[f0 w1]} w3 @x1{}", 8).counts.at(-1));
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
    const r = run(`o50,0 f0{w1 ${childScript} f5}`, 4, { before });
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

describe("@m ミラーファイバ起動", () => {
  // 基準は da30 p10,0。@m はスクロール方向を軸に鏡映する（da30 は da-30 になる）
  const BASE = "da30 p10,0";
  const mirrored = at(-30, 10);

  it("@m の外側は反転しない", () => {
    expect(run(`@m{} ${BASE}`, 1).trace[0]).toEqual(at(30, 10));
  });

  it("d* の角度が反転する", () => {
    expect(run(`@m{${BASE}}`, 1).trace[0]).toEqual(mirrored);
  });

  it("p の位置が反転する（直交成分の符号も反転）", () => {
    expect(run("@m{da30 p10,5}", 1).trace[0]).toEqual(at(-30, 10, -5));
  });

  it("i と ~ の補間でも p の終点が反転する", () => {
    expect(run("@m{da30 i3 p10,5 ~}", 3).trace.at(-1)).toEqual(at(-30, 10, -5));
  });

  it("v の速度が反転する", () => {
    expect(xy(run("@m{da0 v10,5}", 1).runner.vel)).toEqual(at(0, 10, -5));
  });

  it("a の加速度が反転する", () => {
    expect(xy(run("@m{da0 a10,5}", 1).runner.acc)).toEqual(at(0, 10, -5));
  });

  // o は画面座標。スクロール軸に垂直な画面軸を反転する（縦: x、横: y）
  it("o の位置が反転する（縦スクロール: 画面の x が反転）", () => {
    expect(pos(run("@m{o10,5 f0}", 1).spawned[0])).toEqual([-10, 5]);
  });

  it("o の位置が反転する（横スクロール: 画面の y が反転）", () => {
    expect(pos(run("@m{o10,5 f0}", 1, { vertical: false }).spawned[0])).toEqual([10, -5]);
    expect(pos(run("@m{ox10 oy5 f0}", 1, { vertical: false }).spawned[0])).toEqual([10, -5]);
    expect(pos(run("@m{ox10 oy5 f0}", 1).spawned[0])).toEqual([-10, 5]);
  });

  // da0 は画面の -90 度（基準）。bs で 1 射出ごとに +10 度、@m では -10 度ずつ
  it("b* の角度が反転する", () => {
    const angles = script => run(script, 1).spawned.map(o => Math.round(deg(o.vel)));
    expect(angles("da0 bs3,10,0 f5")).toEqual([-90, -80, -70]);
    expect(angles("@m{da0 bs3,10,0 f5}")).toEqual([-90, -100, -110]);
  });

  it("w を挟んでも反転は続く（起動したファイバは終了まで反転）", () => {
    expect(run(`@m{w1 ${BASE}}`, 2).trace.at(-1)).toEqual(mirrored);
  });

  it("& で呼び出したシーケンスの全コマンドが反転する", () => {
    expect(run(`#A{${BASE}} @m{&A}`, 1).trace[0]).toEqual(mirrored);
    expect(run(`#A{${BASE}} @m&A`, 1).trace[0]).toEqual(mirrored);
  });

  it("f で生成した子オブジェクトのファイバも全コマンドが反転する", () => {
    expect(pos(run(`@m{f0{${BASE} w1 ${BASE}}}`, 4).spawned[0])).toEqual(mirrored);
  });

  // & の戻りで反転の状態（mstc）が正しく戻ること。@m の中の & は、フレームをまたいでも反転したまま
  it("@m の中の & は、戻った後の反転も保つ（& を複数回・フレームをまたいで呼んでも）", () => {
    expect(run(`#A{${BASE}} @m{&A w1 &A}`, 1).trace[0]).toEqual(mirrored);
    expect(run(`#A{${BASE}} @m{&A w1 &A}`, 2).trace.at(-1)).toEqual(mirrored);
    expect(run(`#A{${BASE}} @m{&A da30 p0,10}`, 1).trace[0]).toEqual(at(-30, 0, -10));
  });

  // 位置は同じオブジェクトを動かすので、向きは弾の射出角で確かめる（呼び出し元は反転していないこと）
  it("& の中で @m を使っても、呼び出し元の反転は戻る", () => {
    const shot = script => deg(run(script, 1).spawned[0].vel);
    expect(shot("#A{@m{da30 p10,0}} &A da30 f5")).toBeCloseTo(shot("da30 f5"));
  });

  it("@m の入れ子は反転が打ち消される", () => {
    expect(run(`@m{@m{${BASE}}}`, 1).trace[0]).toEqual(at(30, 10));
  });

  it("mx / my は構文として存在しない", () => {
    expect(() => run("mx", 1)).toThrow();
  });
});

describe("画面サイズの既定値（setScreenSize を呼ばない場合は 200 x 200）", () => {
  const alive = x => {
    const { cml } = createCML();
    const r = cml.runner(x, 0, 0);
    cml.update();
    return r.destructionStatus < 0;
  };

  it("画面内（|x| <= 100）の Runner は破棄されず、外に出ると破棄される", () => {
    expect(alive(0)).toBe(true);
    expect(alive(100)).toBe(true);
    expect(alive(101)).toBe(false);
    expect(alive(-101)).toBe(false);
  });
});

describe("halt: オブジェクトの全ファイバを止める", () => {
  it("同じオブジェクトに複数のファイバがあっても、全部止まる（他のオブジェクトのファイバは止まらない）", () => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    const r = cml.runner(0, 0, 0), other = cml.runner(0, 0, 0);
    const mine = ["[w1]", "[w1]", "[w1]"].map(s => r.execute(cml.sequence(s)));
    const theirs = other.execute(cml.sequence("[w1]"));
    r.halt();
    expect(mine.map(f => f.isActive)).toEqual([false, false, false]);
    expect(theirs.isActive).toBe(true);
  });

  it("子ファイバがあるファイバも、子ごと止まる", () => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    const r = cml.runner(0, 0, 0);
    const f = r.execute(cml.sequence("{[w1]} {[w1]} [w1]"));
    cml.update();
    r.halt();
    expect(f.isActive).toBe(false);
    r.execute(cml.sequence("p1,0")); // 空きリストが壊れていなければ、再利用して実行できる
    cml.update();
    expect(r.pos.x).toBe(1);
  });
});

describe("内部の不変条件（壊れていれば実行時に例外）", () => {
  it("ミラーの退避スタックが空のときに pop すると例外（黙って mirror が undefined にならない）", () => {
    const r = run("p1,0", 1);
    expect(() => r.fiber._popMirrorFlag()).toThrow("mirror stack is empty");
  });

  it("未解決のラベル参照を & で呼ぶと例外（黙って終了しない）", () => {
    const { cml, CML } = createCML();
    const r = cml.runner(0, 0, 0);
    const fiber = r.execute(cml.sequence("p1,0"));
    const ref = new CML.Refer(null, "NoSuchLabel");
    const call = new CML.State("$calllabel");
    call.next = ref;
    expect(() => call._gosub(fiber)).toThrow("unresolved label");
  });
});
