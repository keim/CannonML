import { describe, it, expect } from "vitest";
import { createCML } from "./helpers/load.js";

const seq = (s, global = false) => createCML().cml.sequence(s, global);
const parseError = s => { try { seq(s); } catch (e) { return e.message; } return null; };

describe("Sequence: 構造", () => {
  it("空文字列/省略は isEmpty", () => {
    const { cml, CML } = createCML();
    expect(new CML.Sequence().isEmpty).toBe(true);
    expect(cml.sequence("").isEmpty).toBe(true);
    expect(cml.sequence("px1").isEmpty).toBe(false);
  });

  it("#LABEL{...} は childSequences に登録され、findSequence で引ける", () => {
    const s = seq("#A{px1} #B{py2}");
    expect(Object.keys(s.childSequences).sort()).toEqual(["A", "B"]);
    expect(s.childLabels.sort()).toEqual(["A", "B"]);
    expect(s.findSequence("A").label).toBe("A");
    expect(s.findSequence("A").root).toBe(s);
    expect(s.findSequence("Z")).toBeNull();
  });

  it("ネストしたラベルは 'A.B' で引ける。先頭 '.' は root 起点", () => {
    const s = seq("#A{ #B{px1} #C{px2} }");
    const ab = s.findSequence("A.B");
    expect(ab).toBe(s.findSequence("A").findSequence("B"));
    expect(ab.root).toBe(s);
    expect(s.findSequence("A").findSequence(".A.C")).toBe(s.findSequence("A.C"));
  });

  it("無名 {...} は '#0','#1',.. の内部ラベルになり childLabels に出ない", () => {
    const s = seq("{px1} {px2}");
    expect(Object.keys(s.childSequences)).toEqual(["#0", "#1"]);
    expect(s.childLabels).toEqual([]);
  });

  it("ラベル定義の先頭の数値が getParameter で取れる", () => {
    const a = seq("#A{10,20 v0,2[w30f3]}").findSequence("A");
    expect([a.getParameter(0), a.getParameter(1), a.getParameter(2)]).toEqual([10, 20, 0]);
  });

  it("同じラベルの重複は例外", () => {
    expect(parseError("#A{px1} #A{px2}")).toMatch(/label confliction/);
  });

  it("clear() で内容が空になる", () => {
    const s = seq("#A{px1} px2");
    s.clear();
    expect(s.isEmpty).toBe(true);
    expect(Object.keys(s.childSequences)).toEqual([]);
  });

  it("parse() で再パースできる", () => {
    const s = seq("px1");
    s.parse("py2");
    expect(s.isEmpty).toBe(false);
  });

  it("global を立てるとほかの Sequence のラベルを参照できる", () => {
    const { cml } = createCML();
    const g = cml.sequence("#G{px7}");
    expect(() => cml.sequence("&G")).toThrow();
    g.global = true;
    expect(() => cml.sequence("&G")).not.toThrow();
    g.global = false;
    expect(() => cml.sequence("&G")).toThrow();
  });

  it("nop() / rapid() は共有インスタンス", () => {
    const { CML } = createCML();
    expect(CML.Sequence.nop()).toBe(CML.Sequence.nop());
    expect(CML.Sequence.rapid()).toBe(CML.Sequence.rapid());
  });
});

describe("Sequence: 構文エラー", () => {
  it.each([
    ["[[1]", "[[...] ?"],
    ["px1}", "{...}} ?"],
    ["{px1", "{{...} ?"],
    ["]", "[...]] ?"],
    ["zz", "zz ?"],
    ["[:", ": should be after ?"],
    ["?", "? should be after [ or :"],
  ])("%j -> %j", (src, msg) => {
    expect(parseError(src)).toBe(msg);
  });

  it("エラー後も同じ Parser で次のスクリプトがパースできる", () => {
    const { cml } = createCML();
    expect(() => cml.sequence("[[1]")).toThrow();
    expect(cml.sequence("px1").isEmpty).toBe(false);
  });

  it("定義されていないラベルの呼び出しは例外", () => {
    expect(parseError("&Z")).not.toBeNull();
  });

  it("コメントは無視される", () => {
    expect(seq("/* c */ // only comment").isEmpty).toBe(true);
  });
});
