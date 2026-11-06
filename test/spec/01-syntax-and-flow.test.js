// docs/reference/v3/cannonML.md: 「CMLスクリプトの構成要素」「制御構文」「待機」
import { describe, it, expect } from "vitest";
import { run, last, parse, at } from "../helpers/run.js";

const xs = trace => trace.map(([x]) => x);
// 1 始まりのフレーム番号。見つからなければ 0
const firstFrame = (arr, pred) => arr.findIndex(pred) + 1;

describe("構成要素", () => {
  it("// から行末まではコメント", () => {
    expect(last("p5,0 // p9,0")).toEqual([5, 0]);
    expect(last("// p9,0\np5,0")).toEqual([5, 0]);
  });

  it("/* ~ */ の内部はコメント", () => {
    expect(last("/* p9,0 */ p5,0")).toEqual([5, 0]);
    expect(last("p5,0 /* p9,0 */")).toEqual([5, 0]);
  });

  it("/* ~ */ は複数行にまたがってもコメント", () => {
    expect(last("/* p9,0\n p8,0 */ p5,0")).toEqual([5, 0]);
  });

  it("引数を省略すると 0 が入る", () => {
    expect(last("p5,3 p")).toEqual([0, 0]);
    expect(last("p5,3 p7")).toEqual([7, 0]);
  });

  it("意味が確定できればコマンド間のスペースは不要（あってもなくても同じ）", () => {
    const withSpace = run("p1,0 w2 p2,0 v3,0", 6).trace;
    const without = run("p1,0w2p2,0v3,0", 6).trace;
    expect(without).toEqual(withSpace);
  });

  it("構文解析は最長一致（pz は p と z ではない）", () => {
    const r = run("pz5", 1);
    expect(r.runner.pos.z).toBe(5);
    expect(r.trace.at(-1)).toEqual([0, 0]);
  });

  it("コマンドに指定できる数を超える引数は構文エラー", () => {
    expect(() => parse("p1,2,3")).toThrow();
    expect(() => parse("kf1")).toThrow();
    expect(() => parse("p1,2")).not.toThrow();
  });

  it("ラベル名は英数字とアンダースコア", () => {
    expect(last("#a_B9{p5,0} &a_B9")).toEqual([5, 0]);
  });
});

describe("繰り返し [n ...]", () => {
  it("指定回数だけ繰り返す", () => {
    expect(run("[3 f0 w1]", 8).counts.at(-1)).toBe(3);
  });

  it("ループ回数が 0 なら永久ループ", () => {
    expect(run("[0 f0 w1]", 6).counts.at(-1)).toBe(6);
  });

  it("ループ回数が未指定でも永久ループ", () => {
    expect(run("[f0 w1]", 6).counts.at(-1)).toBe(6);
  });

  it("ループ回数の数式はループに入った最初の 1 回だけ計算される", () => {
    expect(run("l$1=3 [$1 l$1=1 f0 w1]", 10).counts.at(-1)).toBe(3);
  });

  it("$l はループカウンタ（0 始まり、n-1 まで）", () => {
    expect(xs(run("[3 p$l,0 w1]", 4).trace)).toEqual([0, 1, 2, 2]);
  });

  it("入れ子では $l1 が 1 つ外側のカウンタ", () => {
    const t = run("[2 [3 p$l1*10+$l,0 w1]]", 6).trace;
    expect(xs(t)).toEqual([0, 1, 2, 10, 11, 12]);
  });
});

describe("条件分岐 [式 ? ... : 式 ? ... : ...]", () => {
  it("式が非 0 なら ':' より前を実行する", () => {
    expect(last("l$1=1 [$1 ? p1,0 : p2,0]")).toEqual([1, 0]);
    expect(last("l$1=7 [$1 ? p1,0 : p2,0]")).toEqual([1, 0]);
  });

  it("式が 0 なら ':' より後を実行する", () => {
    expect(last("l$1=0 [$1 ? p1,0 : p2,0]")).toEqual([2, 0]);
  });

  it("else if を連ねられる", () => {
    const script = n => `l$1=${n} [$1==0 ? p10,0 : $1==1 ? p20,0 : p30,0]`;
    expect(last(script(0))).toEqual([10, 0]);
    expect(last(script(1))).toEqual([20, 0]);
    expect(last(script(2))).toEqual([30, 0]);
  });

  it("選ばれなかった分岐は実行されない", () => {
    expect(run("l$1=1 [$1 ? f0 : f0 f0]", 3).counts.at(-1)).toBe(1);
    expect(run("l$1=0 [$1 ? f0 : f0 f0]", 3).counts.at(-1)).toBe(2);
  });

  it("分岐を実行したあと [...] を出て、続きを実行する", () => {
    expect(last("l$1=1 [$1 ? p1,0 : p2,0] p0,5")).toEqual([0, 5]);
    expect(last("l$1=0 [$1 ? p1,0 : p2,0] p0,5")).toEqual([0, 5]);
  });
});

describe("並列実行 {...}", () => {
  it("新規ファイバで実行され、呼び出し元は待たずに続く", () => {
    expect(xs(run("{w3 p5,0} p1,0", 4).trace)).toEqual([1, 1, 1, 5]);
  });

  it("複数のファイバが同じフレームで並行して進む", () => {
    expect(run("{[f0 w1]} {[f0 w1]}", 5).counts.at(-1)).toBe(10);
  });

  it("呼び出し元が永久待機でも、並列実行したファイバは進む", () => {
    expect(run("{[f0 w1]} w0", 5).counts.at(-1)).toBe(5);
  });

  it("仕様の例: {da0 v10 w30 v-10} {[w5 f10]}", () => {
    const r = run("{da0 v10 w30 v-10} {[w5 f10]}", 40);
    // da0 は画面の下（縦スクロール）なので、位置は y 軸の負の方向に伸びる
    expect(r.trace[0]).toEqual(at(0, 10));
    expect(r.trace[29]).toEqual(at(0, 300));
    expect(r.trace[39]).toEqual(at(0, 200));
    // 5 フレームごとに 1 発（1 フレーム目は w5 の待機中）
    expect(r.counts[29]).toBe(5);
    expect(r.counts[39]).toBe(7);
  });
});

describe("シーケンス呼出 &", () => {
  it("#label{...} で定義したシーケンスを &label で実行する", () => {
    expect(last("#A{p5,0} &A")).toEqual([5, 0]);
  });

  it("呼び出し先が終わったあと、呼び出し元が続きを実行する", () => {
    const t = run("#A{p1,0 w2 p2,0} &A p3,0", 5).trace;
    expect(t[1]).toEqual([1, 0]);
    expect(t.at(-1)).toEqual([3, 0]);
  });

  it("{&label} と中括弧で囲むと並列実行になる", () => {
    expect(xs(run("#A{w3 p5,0} {&A} p1,0", 4).trace)).toEqual([1, 1, 1, 5]);
  });

  it("引数は呼び出し先の $1, $2 ... に順番に入る", () => {
    expect(last("#A{p$1,$2} &A 10,20")).toEqual([10, 20]);
  });

  it("引数を取れるのは &label だけ。{...} {.} の後ろの引数は構文エラー", () => {
    expect(() => parse("{p$1,0}9")).toThrow();
    expect(() => parse("f0{p$1,0}9")).toThrow();
    expect(() => parse("@x1{p$1,0}9")).toThrow();
    expect(() => parse("f0{p1,0} f0{.}9")).toThrow();
    expect(() => parse("{p1,0} p1,0")).not.toThrow();
  });

  it("引数は ( , ) で囲む関数形式でも書ける（ニーモニック形式と同じ意味）", () => {
    expect(last("da90 p(1,2)")).toEqual(last("da90 p1,2"));
    expect(run("da90 v(1,2)", 1).runner.vel).toEqual(run("da90 v1,2", 1).runner.vel);
    expect(last("#A{p$1,$2} &A(10,20)")).toEqual([10, 20]);
    expect(last("p(1+2,3*4)")).toEqual(last("p1+2,3*4"));
    expect(last("l$1=3 p((1+$1)*2,0)")).toEqual([8, 0]);
    expect(run("#A{p$1,0} f(0)&A(4)", 3).spawned.length).toBe(1);
    expect(run("w(2) p1,0", 3).trace).toEqual([[0, 0], [0, 0], [1, 0]]);
  });

  it("括弧の内側や前後の空白は無視される", () => {
    const want = last("da90 p1,2");
    for (const s of ["p( 1,2)", "p(1 ,2 )", "p( 1 , 2 )", "p(\t1,2)", "p (\n1,2)"])
      expect(last("da90 " + s), s).toEqual(want);
    expect(last("da90 p( -1,2)")).toEqual(last("da90 p-1,2"));
    expect(last("da90 p(- 1,2)")).toEqual(last("da90 p-1,2"));
    expect(last("da90 p(1,( 2))")).toEqual(want);
  });

  it("括弧の対応が取れていなければ構文エラー", () => {
    for (const s of ["p(1,2", "p1,2)", "p(1,2))", "p((1,2)", "p(", "p)", "p(1)(2)"])
      expect(() => parse(s), s).toThrow();
  });

  it("どのコマンドにも解釈されない文字・数値は黙って捨てずに構文エラー", () => {
    for (const s of ["p1 2", "p1,2 ;", "p1,2 5 p3,0", "p1,2 `", "p1,2 #", "; p1,2", "p1,2 .", "$x"])
      expect(() => parse(s), s).toThrow();
  });

  it("空白・改行・コメントだけの読み飛ばしは構文エラーにならない", () => {
    expect(() => parse("  p1,2 \n // c\n /* c */ w1 \n p3,4  ")).not.toThrow();
    expect(() => parse("")).not.toThrow();
    expect(() => parse("   ")).not.toThrow();
  });

  it("関数形式の ( ) は数式の括弧: p(1,2)*3 は p1,2*3", () => {
    expect(last("da90 p(1,2)*3")).toEqual(last("da90 p1,2*3"));
  });

  it("引数には数式を使える", () => {
    expect(last("#A{p$1,$2} &A 1+2,3*4")).toEqual([3, 12]);
  });

  it("ラベルは最長一致で選ばれる", () => {
    expect(last("#A{p1,0} #AB{p2,0} &AB")).toEqual([2, 0]);
    expect(last("#A{p1,0} #AB{p2,0} &A")).toEqual([1, 0]);
  });

  // 仕様: 接頭辞だけが定義済みなら、残りは引数にもラベルにもならず構文エラー（最長一致の制限）
  it("定義済みラベルの接頭辞だけでは &AB と解釈されない（B が構文エラー）", () => {
    expect(() => parse("#A{p5,0} &AB")).toThrow(/B \?/);
  });

  it("ラベルが無いとき未定義の &name は、BUG ではなく &name の構文エラーになる", () => {
    for (const s of ["&noargs", "&noargs()", "&", "& p1,0"]) {
      expect(() => parse(s), s).toThrow();
      expect(() => parse(s), s).not.toThrow(/BUG/);
    }
    expect(() => parse("&noargs")).toThrow("&noargs ?");
  });

  it("& を付けないラベル名は構文エラー", () => {
    expect(() => parse("#A{p5,0} A")).toThrow();
    expect(() => parse("#A{p5,0} f0 A")).toThrow();
    expect(() => parse("#A{p5,0} {A}")).toThrow();
  });

  it("&{...} は構文エラー", () => {
    expect(() => parse("&{p5,0}")).toThrow();
  });
});

describe("待機", () => {
  it("w n は n フレーム待つ", () => {
    const x = xs(run("p1,0 w3 p2,0", 8).trace);
    expect(firstFrame(x, v => v === 2) - firstFrame(x, v => v === 1)).toBe(3);
  });

  it("w の引数を省略すると前回と同じフレーム数待つ", () => {
    const x = xs(run("w2 p1,0 w p2,0", 8).trace);
    expect(firstFrame(x, v => v === 2) - firstFrame(x, v => v === 1)).toBe(2);
  });

  it("w0 は待機せず、同じフレームで次のコマンドに移動する", () => {
    expect(xs(run("p1,0 w0 p2,0", 2).trace)).toEqual([2, 2]);
  });

  it("w0 の後も、フレームをまたいで順に実行される", () => {
    expect(xs(run("w0 p1,0 w0 p2,0 w1 p3,0", 3).trace)).toEqual([2, 3, 3]);
  });

  it("w? は式が 0 になるまで待つ", () => {
    const x = xs(run("l$1=1 {w4 l$1=0} w?$1 p9,0", 8).trace);
    expect(x[3]).toBe(0);
    expect(x[7]).toBe(9);
  });

  it("w? は式が最初から 0 なら待たない", () => {
    expect(last("w?0 p9,0")).toEqual([9, 0]);
  });
});

describe("待機の引数（変数・負の値）", () => {
  it("変数の値で待機フレーム数を決める（w$1 は $1 のフレーム数だけ待つ）", () => {
    expect(xs(run("l$1=3 w$1 p1,0", 5).trace)).toEqual([0, 0, 0, 1, 1]);
    expect(xs(run("w3 p1,0", 5).trace)).toEqual([0, 0, 0, 1, 1]);
  });

  it("負の待機フレーム数は実行時エラー", () => {
    expect(() => run("w-1 p1,0", 2)).toThrow("Wait count cannot be negative");
  });

  it("負の補間フレーム数は実行時エラー", () => {
    expect(() => run("i-1 p1,0 ~", 2)).toThrow("Interpolation frames cannot be negative");
  });
});

describe("シーケンスの再呼出 {.}", () => {
  // 子の x は生成後 3 フレーム後に読む（p の移動量）
  const childXs = script => run(script, 3).spawned.map(o => o.pos.x);

  it("f の {.} は、前回 f で起動したシーケンスを再利用する", () => {
    expect(childXs("f0{p1,0} f0{p2,0} w1 f0{.}")).toEqual([1, 2, 2]);
  });

  it("f の {.} は、@ や {...} で起動したシーケンスを使わない", () => {
    expect(childXs("f0{p1,0} {w1 p5,0} w1 f0{.}")).toEqual([1, 1]);
  });

  it("f の {.} は、&label で起動したシーケンスを再利用する", () => {
    expect(childXs("f0{p1,0} #L{p3,0} w1 f0&L f0{.}")).toEqual([1, 3, 3]);
  });

  it("{.} は前回 {...} で起動したシーケンスを子ファイバとして起動する", () => {
    expect(run("{w1 f0} w2 {.}", 5).spawned.length).toBe(2);
  });

  it("@x&label で起動した子ファイバも、親の前回のシーケンスを引き継ぐ", () => {
    const r = run("#L{w1 {.}} {w1 f0{p3,0}} w2 @x1&L", 6);
    expect(r.spawned.map(o => o.pos.x)).toEqual([3, 3]);
  });
});
