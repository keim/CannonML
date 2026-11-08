// docs/reference/v3/cannonML.md: 「数式」（演算子・変数・変数代入）と「ユーザー定義コマンド」
import { describe, it, expect } from "vitest";
import { run, last, parse, withTarget, at } from "../helpers/run.js";
import { createCML, loadCML } from "../helpers/load.js";

const pos = o => [Math.round(o.pos.x * 1e6) / 1e6, Math.round(o.pos.y * 1e6) / 1e6];

describe("演算子", () => {
  it("四則演算と括弧（演算の優先順位あり）", () => {
    expect(last("p1+2*3,(1+2)*3")).toEqual([7, 9]);
    expect(last("p10-4-3,2*3-1")).toEqual([3, 5]);
    expect(last("p7/2,0")).toEqual([3.5, 0]);
  });

  it("% は余剰計算", () => {
    expect(last("p7%4,10%5")).toEqual([3, 0]);
  });

  it("単項のマイナス", () => {
    expect(last("p-3,2*-3")).toEqual([-3, -6]);
  });

  it("小数を使える", () => {
    expect(last("p1.5,0.25")).toEqual([1.5, 0.25]);
  });

  it("比較演算の結果は 1(true) または 0(false)", () => {
    expect(last("p1==1,1!=1")).toEqual([1, 0]);
    expect(last("p3>=3,3<=2")).toEqual([1, 0]);
    expect(last("p3>2,3<2")).toEqual([1, 0]);
    expect(last("p2>=3,2<=2")).toEqual([0, 1]);
  });

  it("! は論理反転（0→1、非 0→0）", () => {
    expect(last("p!0,!2")).toEqual([1, 0]);
  });

  it("$sin $cos $tan は度数で、$asn $acs $atn は度数を返す", () => {
    expect(last("p$sin90,$cos0")).toEqual([1, 1]);
    expect(last("p$tan45,$sin30")).toEqual([1, 0.5]);
    expect(last("p$asn1,$acs0")).toEqual([90, 90]);
    expect(last("p$atn1,0")).toEqual([45, 0]);
  });

  it("$sqr $int $abs", () => {
    expect(last("p$sqr16,$int3.7")).toEqual([4, 3]);
    expect(last("p$abs-3,0")).toEqual([3, 0]);
  });

  it("関数の引数に括弧付きの式を使える", () => {
    expect(last("p$sqr(8+8),0")).toEqual([4, 0]);
  });
});

describe("変数", () => {
  it("$? は 0<=n<1、$?? は -1<=n<1 の乱数（funcRand を差し替えられる）", () => {
    expect(last("p$?,$??", 1, { rand: () => 0.75 })).toEqual([0.75, 0.5]);
    expect(last("p$?,$??", 1, { rand: () => 0 })).toEqual([0, -1]);
  });

  it("$r は globalVariables.setRank() で設定した値を返す（既定は 0）", () => {
    expect(last("p$r,0")).toEqual([0, 0]);
    expect(last("p$r,0", 1, { before: cml => cml.globalVariables.setRank(0.3) })).toEqual([0.3, 0]);
  });

  it("$r は setRankRange(min, max) の範囲に丸められる（既定は 0〜1）", () => {
    expect(last("p$r,0", 1, { before: cml => cml.globalVariables.setRank(5) })).toEqual([1, 0]);
    expect(last("p$r,0", 1, { before: cml => cml.globalVariables.setRank(-1) })).toEqual([0, 0]);
    const wide = cml => { cml.globalVariables.setRankRange(0, 10); cml.globalVariables.setRank(5); };
    expect(last("p$r,0", 1, { before: wide })).toEqual([5, 0]);
  });

  it("$i は i コマンドで現在指定されている値", () => {
    expect(last("p$i,0")).toEqual([0, 0]);
    expect(last("i7 l$1=$i i0 p$1,0")).toEqual([7, 0]);
  });

  it("$x $y はオブジェクトの座標", () => {
    expect(last("p3,4 p$y,$x")).toEqual([4, 3]);
  });

  it("$sx $sy は座標の符号（0 以上は 1）", () => {
    expect(last("p-3,4 p$sx,$sy")).toEqual([-1, 1]);
    expect(last("p3,-4 p$sx,$sy")).toEqual([1, -1]);
    expect(last("p0,0 p$sx,$sy")).toEqual([1, 1]);
  });

  // da0 v3,4 は画面の (4, -3) へ進む速さ 5。da90 で読むと画面の座標がそのまま得られる
  it("$v は速度、$vx $vy は速度の x/y 成分", () => {
    expect(last("da0 v3,4 l$1=$v v0 da90 p$1,0")).toEqual([5, 0]);
    expect(last("da0 v3,4 l$1=$vx l$2=$vy v0 da90 p$1,$2")).toEqual([4, -3]);
  });

  it("$ho はオブジェクトの角度（度）", () => {
    // da で指定した値（スクロール方向を 0 度）がそのまま返る
    expect(last("da45 r1,1 w1 l$1=$ho da90 p$1,0", 2)).toEqual([45, 0]);
    expect(last("da-30 r1,1 w1 l$1=$ho da90 p$1,0", 2)).toEqual([-30, 0]);
  });

  it("$td はターゲットまでの距離", () => {
    expect(last("w1 p$td,0", 2, { before: withTarget(3, 4) })).toEqual([5, 0]);
  });

  it("$o は f の第 2 引数で ID を指定した子の数、$o1〜$o9 は ID ごとの数（ID 0 も数え、無指定は数えない）", () => {
    // $o1 = 2、$o2 = 1。p は da0（画面の下）の向きで、2 下・1 右
    const r = run("da0 f0{} f0,1{} f0,1{} f0,2{} w1 p$o1,$o2 pz$o", 3);
    expect(r.trace.at(-1)).toEqual(at(0, 2, 1));
    expect(r.runner.pos.z).toBe(3);
    expect(run("f0,0{w9} w1 p$o,0", 3).trace.at(-1)).toEqual([1, 0]);
    expect(run("f0,0{w9} w1 p$o1,0", 3).trace.at(-1)).toEqual([0, 0]);
    expect(run("f0,10{w9} w1 p$o,0", 3).trace.at(-1)).toEqual([1, 0]);
  });

  it("$p.* は親オブジェクトのパラメータ", () => {
    expect(pos(run("p3,4 w1 f0{p$p.x,$p.y}", 4).spawned[0])).toEqual([3, 4]);
    expect(pos(run("p-3,4 w1 f0{p$p.sx,$p.sy}", 4).spawned[0])).toEqual([-1, 1]);
    // 親の速度は画面の (3, -2)。子は向き 0 度（画面の右）なので、そのまま位置になる
    expect(pos(run("da0 v2,3 f0{w1 p$p.vx,$p.vy}", 4).spawned[0])).toEqual([3, -2]);
  });

  it("$p.o1 などは親の持つ子の数", () => {
    expect(pos(run("f0,1{} f0,1{} f0,2{p$p.o1,$p.o2}", 3).spawned[2])).toEqual([2, 1]);
  });

  it("$t.* はターゲットオブジェクトのパラメータ", () => {
    const before = withTarget(-3, 4);
    expect(last("p$t.x,$t.y", 1, { before })).toEqual([-3, 4]);
    expect(last("p$t.sx,$t.sy", 1, { before })).toEqual([-1, 1]);
  });

  it("$t.td は常に 0", () => {
    expect(last("p$t.td,1", 1, { before: withTarget(-3, 4) })).toEqual([0, 1]);
  });

  it("$t.v $t.vx $t.vy はターゲットの速度", () => {
    // ターゲットの速度は画面の (0, -2)。vx は 0、速さ v は 2
    const before = withTarget(0, 0, "da0 v2,0");
    expect(last("w2 p$t.vx,$t.v", 3, { before })).toEqual([0, 2]);
  });
});

describe("ローカル変数 $1〜$9 と変数代入", () => {
  it("l$N= で代入し、$N で参照する。初期値は 0", () => {
    expect(last("p$1,$5")).toEqual([0, 0]);
    expect(last("l$1=5 p$1,0")).toEqual([5, 0]);
    expect(last("l$9=3 p$9,0")).toEqual([3, 0]);
  });

  // 変数はオブジェクト単位。同じオブジェクトの別ファイバからも見え、後から代入した値で上書きされる
  it("同じオブジェクトの別ファイバと変数を共有する", () => {
    expect(run("{w2 p$1,0} w1 l$1=7", 3).trace.at(-1)).toEqual([7, 0]);
    expect(last("#A{p$1,0} {&A 5} w1 {&A 8} w1 f0{p$1,0}", 3)).toEqual([8, 0]);
  });

  it("代入値には数式や他の変数を使える", () => {
    expect(last("l$1=2+3 p$1,0")).toEqual([5, 0]);
    expect(last("l$1=3 l$2=$1*2 p$2,0")).toEqual([6, 0]);
  });

  it("l$N+= -= *= /= は四則計算の結果を代入する", () => {
    expect(last("l$1=2 l$1*=3 l$1+=1 l$1-=3 l$1/=2 p$1,0")).toEqual([2, 0]);
  });

  it("仕様の例: l$1=0 [p$1,$y l$1+=10 w5] は 5 フレームごとに 10 ずつ右へ動く", () => {
    const x = run("l$1=0 [p$1,$y l$1+=10 w5]", 11).trace.map(([v]) => v);
    expect(x[0]).toBe(0);
    expect(x[4]).toBe(0);
    expect(x[5]).toBe(10);
    expect(x[10]).toBe(20);
  });

  it("同じオブジェクトをコントロールするファイバ間で共有される", () => {
    expect(last("{l$1=7} w1 p$1,0", 2)).toEqual([7, 0]);
    expect(last("l$1=4 {p$1,0}", 1)).toEqual([4, 0]);
  });

  it("変数はオブジェクト毎に持つので、子オブジェクトには引き継がれない", () => {
    expect(pos(run("l$1=9 f0{p$1,0}", 3).spawned[0])).toEqual([0, 0]);
  });
});

describe("ユーザー定義変数 $name", () => {
  const withVariable = (name, func) => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    cml.globalVariables.registerUserVariable(name, func);
    return cml;
  };
  const exec = (cml, script, frames = 1) => {
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence(script));
    for (let i = 0; i < frames; i++) cml.update();
    return r;
  };

  it("登録した関数の戻り値が、数式の中で参照できる", () => {
    const cml = withVariable("life", () => 40);
    expect(pos(exec(cml, "p$life+1,$life*2"))).toEqual([41, 80]);
  });

  it("変数名の直後の数字が、関数の第 2 引数（index）になる。省略すると 0", () => {
    const calls = [];
    const cml = withVariable("life", (fbr, idx) => (calls.push(idx), 10 + idx));
    expect(pos(exec(cml, "p$life,$life3"))).toEqual([10, 13]);
    expect(calls).toEqual([0, 3]);
  });

  it("関数は実行中のファイバを受け取り、参照するたびに呼ばれる（実行時の値）", () => {
    let n = 0;
    const cml = withVariable("count", fbr => (typeof fbr.getVariable === "function" ? ++n : -1));
    exec(cml, "[3 l$1=$count w1]", 4);
    expect(n).toBe(3);
  });

  it("名前に _ を含められる", () => {
    expect(pos(exec(withVariable("a_b", () => 7), "p$a_b,0"))).toEqual([7, 0]);
  });

  it("定義済みの変数と同じ名前は、定義済みの変数が優先される", () => {
    expect(pos(exec(withVariable("x", () => 99), "p$x,0"))).toEqual([0, 0]);
  });

  it("末尾が数字の名前は、数字が index として扱われるので参照できない", () => {
    const cml = withVariable("a1", () => 5);
    expect(() => cml.sequence("p$a1,0")).toThrow();
  });

  it("$p. $t. ではユーザー定義変数を参照できない", () => {
    const cml = withVariable("life", () => 5);
    expect(() => cml.sequence("p$t.life,0")).toThrow();
    expect(() => cml.sequence("p$p.life,0")).toThrow();
  });

  it("登録していない名前は構文エラー", () => {
    expect(() => parse("p$nosuch,0")).toThrow();
  });
});

describe("ユーザー定義コマンド &name", () => {
  const withCommand = (name, argc) => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    const calls = [];
    cml.globalVariables.registerUserCommand(name, (fbr, args) => calls.push({ fbr, args: args.slice() }), argc);
    return { cml, calls };
  };
  const exec = (cml, script, frames = 2) => {
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence(script));
    for (let i = 0; i < frames; i++) cml.update();
    return r;
  };

  it("登録した関数が、ファイバと引数の配列を受けて呼び出される", () => {
    const { cml, calls } = withCommand("test", 2);
    exec(cml, "&test 3,4");
    expect(calls.length).toBe(1);
    expect(calls[0].args).toEqual([3, 4]);
    expect(typeof calls[0].fbr.getVariable).toBe("function");
  });

  it("スペースなしでも呼び出せる", () => {
    const { cml, calls } = withCommand("test", 2);
    exec(cml, "&test3,4");
    expect(calls[0].args).toEqual([3, 4]);
  });

  it("引数には数式を使える", () => {
    const { cml, calls } = withCommand("test", 2);
    exec(cml, "&test 1+2,$sqr16");
    expect(calls[0].args).toEqual([3, 4]);
  });

  it("関数形式の引数でも呼び出せる", () => {
    const { cml, calls } = withCommand("test", 2);
    exec(cml, "&test(1+2,4)");
    expect(calls[0].args).toEqual([3, 4]);
  });

  it("引数を省略すると 0 になる", () => {
    const { cml, calls } = withCommand("test", 2);
    exec(cml, "&test 5");
    expect(calls[0].args).toEqual([5, 0]);
  });

  it("requireSequence を指定すると、直後のシーケンスが必須で、自動では実行されない", () => {
    const { cml } = createCML();
    const calls = [];
    cml.globalVariables.registerUserCommand("seq", (fbr, args) => calls.push(args.slice()), 1, true);
    expect(() => cml.sequence("&seq 1")).toThrow();
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence("&seq 1 {p5,0}"));
    cml.update();
    expect(calls).toEqual([[1]]);
    expect(r.pos.x).toBe(0);
  });

  it("引数のないコマンド", () => {
    const { cml, calls } = withCommand("noargs", 0);
    exec(cml, "&noargs");
    expect(calls.length).toBe(1);
  });

  it("呼び出したあと、続きのコマンドを実行する", () => {
    const { cml, calls } = withCommand("test", 1);
    const r = exec(cml, "&test 1 p5,0");
    expect(calls.length).toBe(1);
    expect(r.pos.x).toBe(5);
  });

  it("ループの中で、通るたびに呼び出される", () => {
    const { cml, calls } = withCommand("test", 1);
    exec(cml, "[3 &test $l w1]", 5);
    expect(calls.map(c => c.args[0])).toEqual([0, 1, 2]);
  });

  it("登録していないコマンド名は構文エラー", () => {
    expect(() => parse("&nosuchcommand")).toThrow();
  });

  it("コマンド名に _ を含められる", () => {
    const { cml, calls } = withCommand("a_b", 0);
    exec(cml, "&a_b");
    expect(calls.length).toBe(1);
  });
});

describe("CannonML 生成前の static", () => {
  it("new CannonML() より前に Sequence を作ると、未初期化だと分かる例外になる", () => {
    const ctx = loadCML();
    expect(() => new ctx.CML.Sequence("p1,0")).toThrow(/not initialized: Sequence._parser/);
  });
});

describe("ListElem / List（番兵付きの環。prev / next は非 null、未接続は自分自身）", () => {
  const setup = () => {
    const { CML } = createCML();
    return { CML, list: new CML.List(), mk: () => new CML.BarrageElem() };
  };

  it("未接続の CML.Object・CML.BarrageElem は prev / next が自分自身で、is_linked() は false", () => {
    const { CML } = createCML();
    for (const o of [new CML.Object(), new CML.BarrageElem()]) {
      expect(o.prev).toBe(o);
      expect(o.next).toBe(o);
      expect(o.is_linked()).toBe(false);
    }
  });

  it("State（ChainListElem）は、未接続なら prev / next が null（null 終端の鎖）", () => {
    const { CML } = createCML();
    const st = new CML.State("p");
    expect(st.prev).toBeNull();
    expect(st.next).toBeNull();
  });

  it("push / unshift で接続すると is_linked() は true、pop / shift / remove_from_list で false に戻る", () => {
    const { list, mk } = setup();
    const a = mk(), b = mk(), c = mk();
    list.push(a); list.push(b); list.unshift(c);
    expect([a, b, c].map(e => e.is_linked())).toEqual([true, true, true]);
    expect(list.head).toBe(c);
    expect(list.tail).toBe(b);
    expect(list.pop()).toBe(b);
    expect(b.is_linked()).toBe(false);
    expect(list.shift()).toBe(c);
    expect(c.is_linked()).toBe(false);
    a.remove_from_list();
    expect(a.is_linked()).toBe(false);
    expect(list.isEmpty()).toBe(true);
  });

  it("空のリストの shift / pop は例外", () => {
    const { list } = setup();
    expect(() => list.pop()).toThrow("empty");
    expect(() => list.shift()).toThrow("empty");
  });

  it("接続済みの要素を push / unshift / insert_before / insert_after すると例外", () => {
    const { list, mk } = setup();
    const a = mk(), b = mk();
    list.push(a);
    expect(() => list.push(a)).toThrow("already linked");
    expect(() => list.unshift(a)).toThrow("already linked");
    expect(() => a.insert_before(list.term)).toThrow("already linked");
    expect(() => a.insert_after(list.term)).toThrow("already linked");
    expect(() => b.insert_before(a)).not.toThrow(); // 未接続の b は、接続済みの a の前に入れられる
    expect(b.is_linked()).toBe(true);
    expect(() => b.insert_after(a)).toThrow("already linked");
  });

  it("未接続の要素の remove_from_list は例外", () => {
    const { mk } = setup();
    expect(() => mk().remove_from_list()).toThrow("not linked");
  });

  it("List.remove は番兵や未接続の要素を外せず、接続済みの要素を外して返す", () => {
    const { list, mk } = setup();
    const a = mk();
    expect(() => list.remove(list.term)).toThrow();
    expect(() => list.remove(a)).toThrow("not linked");
    list.push(a);
    expect(list.remove(a)).toBe(a);
    expect(list.isEmpty()).toBe(true);
  });

  it("cat は別のリストの全要素を末尾に移し、元のリストを空にする", () => {
    const { CML, list, mk } = setup();
    const other = new CML.List();
    const a = mk(), b = mk(), c = mk();
    list.push(a); other.push(b); other.push(c);
    list.cat(other);
    expect(other.isEmpty()).toBe(true);
    expect([list.head, list.head.next, list.tail]).toEqual([a, b, c]);
  });
});

describe("State の基底クラス（線形の鎖）", () => {
  it("State は ChainListElem を継承し、ListElem（番兵付きの環の要素）は継承しない", () => {
    const { CML } = createCML();
    const st = new CML.State("p");
    expect(st).toBeInstanceOf(CML.ChainListElem);
    expect(st).not.toBeInstanceOf(CML.ListElem);
    expect(new CML.Object()).toBeInstanceOf(CML.ListElem);
  });

  it("ChainList は ChainListElem を並べる（番兵付きの環）", () => {
    const { CML } = createCML();
    const list = new CML.ChainList();
    const a = new CML.State("p"), b = new CML.State("v");
    expect(list.isEmpty()).toBe(true);
    list.push(a); list.push(b);
    expect(list.head).toBe(a);
    expect(list.tail).toBe(b);
    expect(list.shift()).toBe(a);
    expect(list.pop()).toBe(b);
    expect(list.isEmpty()).toBe(true);
  });
});

describe("プロトタイプのキーとの衝突（constructor / toString などの名前）", () => {
  it("ラベル名 constructor / toString は通常のラベルとして呼べる", () => {
    expect(last("#constructor{p5,0} &constructor", 2)).toEqual([5, 0]);
    expect(last("#toString{p5,0} &toString", 2)).toEqual([5, 0]);
  });

  it("未登録の &hasOwnProperty は、ユーザー命令として誤って解釈されず構文エラー", () => {
    expect(() => parse("&hasOwnProperty")).toThrow("&hasOwnProperty ?");
  });

  it("登録したユーザー変数 constructor は、組み込み表のプロトタイプ（Object）より優先して参照される", () => {
    const { cml } = createCML();
    cml.setScreenSize(10000, 10000);
    cml.globalVariables.registerUserVariable("constructor", () => 5);
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence("p$constructor,0"));
    cml.update();
    expect(pos(r)).toEqual([5, 0]);
  });

  it("登録したユーザー命令の名前が constructor でも呼べる", () => {
    const { cml } = createCML();
    const calls = [];
    cml.globalVariables.registerUserCommand("constructor", (_fbr, args) => calls.push(args.slice()), 1);
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence("&constructor 7"));
    cml.update();
    expect(calls).toEqual([[7]]);
  });
});
