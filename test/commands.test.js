import { describe, it, expect } from "vitest";
import { run, last } from "./helpers/run.js";

// 既知の不具合は it.fails で固定している。修正されたら失敗するので、.fails を外すこと。

describe("位置・速度・加速度", () => {
  it("px / py / p", () => {
    expect(last("px10")).toEqual([10, 0]);
    expect(last("py5")).toEqual([0, 5]);
    expect(last("p10,20")).toEqual([10, 20]);
  });

  it("v: 毎フレーム位置に加算される", () => {
    expect(run("vx2", 4).trace).toEqual([[2, 0], [4, 0], [6, 0], [8, 0]]);
    expect(run("v1,2", 2).trace).toEqual([[1, 2], [2, 4]]);
  });

  it("a: 位置は 0.5 * a * t^2", () => {
    expect(run("a1", 4).trace.map(([x]) => x)).toEqual([0.5, 2, 4.5, 8]);
  });

  it("pd / vd: ha で指定した角度方向に設定する", () => {
    expect(last("ha90 pd10")).toEqual([0, 10]);
    expect(run("ha90 vd2", 2).trace).toEqual([[0, 2], [0, 4]]);
  });

  it("i + px: 補間し、i フレーム後にちょうど目標値", () => {
    const t = run("i4 px40", 6).trace.map(([x]) => x);
    expect(t).toEqual([6.25, 20, 33.75, 40, 40, 40]);
  });

  it("i + v: 指定フレームかけて加速して目標速度になる", () => {
    const t = run("i3 v3,0", 5).trace.map(([x]) => x);
    expect(t).toEqual([0.5, 2, 4.5, 7.5, 10.5]);
  });

  it("~ は i フレーム待つ（その間の補間を含む）", () => {
    expect(run("vy1 i3 vy4 ~", 5).trace.map(([, y]) => y)).toEqual([4, 8, 12, 16, 20]);
  });
});

describe("制御構文", () => {
  it("w: 指定フレーム待つ", () => {
    expect(run("w3 px2", 4).trace.map(([x]) => x)).toEqual([0, 0, 0, 2]);
    expect(run("v1,2 w2 v0,0", 6).trace).toEqual([[1, 2], [2, 4], [2, 4], [2, 4], [2, 4], [2, 4]]);
  });

  it("[n ...]: n 回ループし、$l はループカウンタ", () => {
    expect(run("[3 px$l w1]", 5).trace.map(([x]) => x)).toEqual([0, 1, 2, 2, 2]);
    expect(run("[2 vx1 w1]", 4).trace.map(([x]) => x)).toEqual([1, 2, 3, 4]);
  });

  it("入れ子ループは $l1 で外側のカウンタを参照", () => {
    expect(run("[2 [2 px$l+$l1*10 w1]]", 5).trace.map(([x]) => x)).toEqual([0, 1, 10, 11, 11]);
  });

  it("待ちのないループは実行上限で例外", () => {
    expect(() => run("[0 vx1]", 1)).toThrow("No wait command in the loop");
  });

  it("[cond ? A : B]", () => {
    expect(last("[$x>0?py1:py2]")).toEqual([0, 2]);
    expect(last("px5 [$x>0?py1:py2]")).toEqual([5, 1]);
    expect(last("px5 [$x>0?py1]")).toEqual([5, 1]);
    expect(last("[$x>0?py1]")).toEqual([0, 0]);
  });

  it("w? は条件が真の間待つ", () => {
    // 条件はフレームごとに再評価される: vx1 で x が増え、x>=3 で待ちが終わり vy1（速度）が効き始める
    expect(run("vx1 w?$x<3 vy1", 6).trace).toEqual([[1, 0], [2, 0], [3, 0], [4, 1], [5, 2], [6, 3]]);
  });
});

describe("式", () => {
  it.each([
    ["px(1+2*3)", 7],
    ["px10+5", 15],
    ["px2*3-1", 5],
    ["px7%4", 3],
    ["px-3", -3],
    ["px2*-3", -6],
    ["px1.5", 1.5],
    ["px1==1", 1],
    ["px1!=1", 0],
    ["px3>2", 1],
    ["px3<2", 0],
    ["px(2>3)+5", 5],
    ["px!0", 1],
    ["px!2", 0],
    ["px$sqr16", 4],
    ["px$abs-3", 3],
    ["px$sin90", 1],
    ["px$cos0", 1],
    ["px$int3.7", 3],
  ])("%s -> x=%d", (src, x) => {
    expect(last(src)[0]).toBeCloseTo(x, 9);
  });

  it("$? / $?? は funcRand を使う", () => {
    expect(last("px$?*10", 1, { rand: () => 0.3 })[0]).toBeCloseTo(3, 9);
    expect(last("px$??*10", 1, { rand: () => 0.75 })[0]).toBeCloseTo(5, 9);
  });

  it("$x $y $v $vx $vy は自オブジェクトの状態", () => {
    expect(last("px7 w1 py$x")).toEqual([7, 0]);
    expect(run("px7 w1 py$x", 2).trace.at(-1)).toEqual([7, 7]);
    expect(last("v3,4 px$v")).toEqual([8, 4]); // $v=5 が px に入り、その後 vx=3 で 1 フレーム進む
  });

  it("$r は rank（既定 0）", () => {
    expect(last("px$r")).toEqual([0, 0]);
  });

  it("$o / $oN は ID つき子オブジェクトの数", () => {
    expect(last("f3,1 f3,2 f3,2 px$o")[0]).toBe(3);
    expect(last("f3,1 f3,2 f3,2 px$o2")[0]).toBe(2);
  });

  it("$p.x は親の位置を参照できる", () => {
    const { spawned } = run("px7 f{py$p.x}", 2);
    expect(spawned[0].pos.y).toBe(7);
  });

  // 既知の不具合: FormulaLiteral が parseFloat で読むため 0x.. が 0 になる
  it.fails("16 進リテラル 0xff", () => {
    expect(last("px0xff")[0]).toBe(255);
  });
});

describe("シーケンス呼び出し・fiber", () => {
  it("&LABEL: ラベル付きシーケンスを呼び、引数は $1.. で受ける", () => {
    expect(last("#A{px$1} &A7")).toEqual([7, 0]);
    expect(last("#A{p$1,$2} &A10,20")).toEqual([10, 20]);
  });

  it("& の呼び出し元は呼び出し先の終了後に続きを実行する", () => {
    expect(run("#A{vx1 w1} &A vy1", 3).trace).toEqual([[1, 0], [2, 1], [3, 2]]);
    expect(run("#A{vx1} #B{vy1} &A &B", 2).trace).toEqual([[1, 1], [2, 2]]);
  });

  it("ネストした呼び出し", () => {
    expect(last("#A{#B{px4}&B} &A")).toEqual([4, 0]);
  });

  it("引数（$1）は呼び出しごとに独立", () => {
    expect(last("#A{px$1} &A9 &A5")).toEqual([5, 0]);
  });

  it("{...} は並行 fiber として動く", () => {
    expect(run("{vx1} vy2", 3).trace).toEqual([[1, 2], [2, 4], [3, 6]]);
  });

  it("execute の args は $1.. に入る", () => {
    expect(last("px$1 py$2", 1, { args: [7, 8] })).toEqual([7, 8]);
  });

  it("空のシーケンスの execute は null", () => {
    const { runner, cml } = run("", 0);
    expect(runner.execute(cml.sequence(""))).toBeNull();
  });

  it("kf は子 fiber を止める", () => {
    expect(run("{[0 px$x+1 w1]} w2 kf", 5).trace.map(([x]) => x)).toEqual([1, 2, 2, 2, 2]);
  });

  it("halt() で実行中の fiber が止まる", () => {
    const { runner, cml } = run("px1 w1 px2", 1);
    runner.halt();
    cml.update();
    cml.update();
    expect(runner.pos.x).toBe(1);
  });

  it("@oN{...}: ID つきの子オブジェクトで sequence を実行する", () => {
    const { spawned } = run("f2,1 @o1{vx5}", 2);
    expect(spawned[0].vel.x).toBe(5);
    expect(spawned[0].pos.x).toBe(10);
  });

  // 既知の不具合: 仕様どおり `&A 7` と空白を入れると引数として認識されない（正規表現中の "\s" がエスケープ漏れ）
  it.fails("コマンドと引数の間に空白を許す: &A 7", () => {
    expect(last("#A{px$1} &A 7")).toEqual([7, 0]);
  });

  // 既知の不具合: 同上
  it.fails("無名シーケンスの直後の引数: &{px$1}9", () => {
    expect(last("&{px$1}9")).toEqual([9, 0]);
  });
});

describe("l$N= 代入", () => {
  // 既知の不具合: CML.Assign の func は (state,$,fiber) で呼ばれるが、実装は (fbr) を受ける前提で第 1 引数が State になる
  it.fails("l$1= で変数に代入して $1 で参照", () => {
    expect(last("l$1=5 px$1")).toEqual([5, 0]);
  });

  it.fails("l$1+= 演算つき代入", () => {
    expect(last("l$1=2 [3 l$1+=3] px$1")).toEqual([11, 0]);
  });

  it.fails("l$r= で rank に代入", () => {
    expect(last("l$r=1 px$r")).toEqual([1, 0]);
  });
});

describe("オブジェクト生成: f / q / h / b", () => {
  const vels = spawned => spawned.map(o => [o.vel.x, o.vel.y].map(v => Math.round(v * 1e3) / 1e3));

  it("f: 指定速度で 1 つ生成。ha で向きを決める", () => {
    expect(vels(run("f3").spawned)).toEqual([[3, 0]]);
    expect(vels(run("ha90 f3").spawned)).toEqual([[0, 3]]);
    expect(vels(run("ha90 f3 f4").spawned)).toEqual([[0, 3], [0, 4]]);
  });

  it("f の位置は発射元（q のオフセットあり）", () => {
    const { spawned } = run("px5 w1 q2,3 f0", 2);
    expect([spawned[0].pos.x, spawned[0].pos.y]).toEqual([7, 3]);
  });

  it("生成物は onCreateNewRunner で通知され、parent は発射元", () => {
    const { spawned, runner } = run("f3");
    expect(spawned).toHaveLength(1);
    expect(spawned[0].parent).toBe(runner);
  });

  it("f{...}: 生成物はその sequence を実行する", () => {
    const { spawned } = run("f{vy1}", 3);
    expect(spawned[0].vel.y).toBe(1);
  });

  it("f の引数 {…} の数値は生成物の $1.. になる", () => {
    const { spawned } = run("f3 {px$1}");
    expect(spawned[0].pos.x).toBe(3);
  });

  it("bm: 扇状に n way（中心角 30 度）", () => {
    const [a, b, c] = vels(run("bm3,30 f2").spawned);
    expect(b).toEqual([2, 0]);
    expect(a[0]).toBeCloseTo(c[0], 3);
    expect(a[1]).toBeCloseTo(-c[1], 3);
    expect(c[1]).toBeCloseTo(2 * Math.sin(Math.PI / 12), 3);
  });

  it("bm: 速度レンジ", () => {
    expect(vels(run("bm3,0,2 f2").spawned)).toEqual([[1, 0], [2, 0], [3, 0]]);
  });

  it("bs: 角度の増分", () => {
    const v = vels(run("bs3,10,0,0 f2").spawned);
    const rad = d => d * Math.PI / 180;
    v.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(2 * Math.cos(rad(10 * i)), 3);
      expect(y).toBeCloseTo(2 * Math.sin(rad(10 * i)), 3);
    });
  });

  it("bs: 速度の増分", () => {
    expect(vels(run("bs3,0,1,0 f2").spawned)).toEqual([[2, 0], [3, 0], [4, 0]]);
  });

  it("br: 乱数を使う（rand=0.5 で中心方向）", () => {
    expect(vels(run("br3,90,0,0 f2").spawned)).toEqual([[2, 0], [2, 0], [2, 0]]);
  });

  it("bm の 4 番目（間隔）指定は 1 回の f で時間差発射する", () => {
    const { cml, spawned } = run("bm2,0,0,3 f1", 0);
    const counts = [];
    for (let i = 0; i < 6; i++) { cml.update(); counts.push(spawned.length); }
    expect(counts).toEqual([1, 1, 1, 2, 2, 2]);
  });

  it("bs の個数 0 + 間隔は無限連射", () => {
    const { cml, spawned } = run("bs0,0,0,2 f1", 0);
    const counts = [];
    for (let i = 0; i < 6; i++) { cml.update(); counts.push(spawned.length); }
    expect(counts).toEqual([1, 1, 2, 2, 3, 3]);
  });

  // 既知の不具合: bm の 360 度全方位は angle をラジアンに変換した後で `== 360` を比較しているため特例が効かない
  it.fails("bm4,360: 全方位に等間隔（90 度ごと）で撃つ", () => {
    const v = vels(run("bm4,360 f2").spawned);
    const angles = v.map(([x, y]) => Math.round(Math.atan2(y, x) * 180 / Math.PI));
    const step = a => ((a % 360) + 360) % 360;
    expect(new Set(angles.map(step)).size).toBe(4);
  });
});

describe("ターゲット", () => {
  const withTarget = (x, y) => cml => {
    const tg = cml.runner(x, y, 0);
    tg.scopeEnabled = false;
    cml.setDefaultTarget(tg);
  };

  it("$t.x / $t.y はターゲットの位置", () => {
    expect(last("px$t.y", 1, { before: withTarget(0, 100) })[0]).toBe(100);
  });

  it("$td はターゲットまでの距離（projected 座標）", () => {
    expect(last("w1 px$td", 2, { before: withTarget(30, 40) })[0]).toBe(50);
  });

  it("ht（既定）で撃つとターゲットへ向かう", () => {
    const { spawned } = run("w1 f2", 2, { before: withTarget(0, 100) });
    expect([spawned[0].vel.x, spawned[0].vel.y].map(Math.round)).toEqual([0, 2]);
  });
});

describe("rank", () => {
  it("$r は Global の rank 0", () => {
    expect(last("px$r*10", 1, { before: cml => cml.globalVariables.setRank(0, 0.5) })[0]).toBe(5);
  });
});

describe("オブジェクト破棄・画面外", () => {
  it("ko: 自分を破棄し、status を残す", () => {
    const { runner } = run("ko1 px1");
    expect(runner.destructionStatus).toBe(1);
  });

  it("画面外に出た Runner は ESCAPE_STATUS で破棄される", () => {
    const { runner, CML } = run("vx30", 4, { screen: 100 });
    expect(runner.destructionStatus).toBe(CML.Runner.ESCAPE_STATUS);
    expect(runner.pos.x).toBe(60);
  });

  it("scopeEnabled=false なら画面外でも破棄されない", () => {
    const { runner, cml } = run("vx30", 1, { screen: 100 });
    expect(runner.destructionStatus).toBe(-1);
    runner.scopeEnabled = false;
    cml.update(); cml.update(); cml.update();
    expect(runner.destructionStatus).toBe(-1);
  });

  it("破棄された Runner の fiber は止まる", () => {
    const { runner, fiber } = run("ko0 vx1 w5 vx9", 3);
    expect(runner.pos.x).toBe(0);
    expect(fiber.isActive).toBe(false);
  });

  // 既知の不具合: `$w4d` が State から (state,$,fiber,object) で呼ばれるが _wait4destruction(state,$,fiber,object) として受けず例外になる
  it.fails("@ko: 破棄時に指定ステータスのシーケンスを実行", () => {
    run("@ko1{px9} ko1", 2);
  });
});

describe("ミラー / 向き", () => {
  // 現状の挙動: mx は内部で Y 反転(invertFlag=1)、my は X 反転(=2)。名前と軸が逆なので、修正時はこのテストも更新すること
  it("mx は次以降の Y、my は X に作用する", () => {
    expect(run("mx vy3", 2).trace).toEqual([[0, -3], [0, -6]]);
    expect(run("my vx3", 2).trace).toEqual([[-3, 0], [-6, 0]]);
    expect(run("mx my v3,4", 2).trace).toEqual([[-3, -4], [-6, -8]]);
  });
});

describe("コメント・文字列", () => {
  it("コメントは無視される", () => {
    expect(last("/*c*/px1//x\n")).toEqual([1, 0]);
  });

  // 既知の不具合: `'...'` 文字列コマンドは State._nop を参照するが未定義(this.func is not a function)
  it.fails("'...' 文字列は無視して続行する", () => {
    expect(last("'abc' px1")).toEqual([1, 0]);
  });
});
