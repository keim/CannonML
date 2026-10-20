import { describe, it, expect } from "vitest";
import { loadCML } from "./helpers/load.js";

const { CML } = loadCML();

describe("RangeLimitNumber", () => {
  it("max > min のとき範囲に丸める", () => {
    const n = new CML.RangeLimitNumber(0, -1, 1);
    n.val = 5;
    expect(n.val).toBe(1);
    n.val = -5;
    expect(n.val).toBe(-1);
    n.val = 0.25;
    expect(n.val).toBe(0.25);
  });

  it("max <= min のときは制限なし", () => {
    const n = new CML.RangeLimitNumber();
    n.val = 123;
    expect(n.val).toBe(123);
  });
});

describe("SinTable", () => {
  const t = new CML.SinTable();

  it("サイズは table_size + cos_shift", () => {
    expect(t.cos_shift).toBe(1024);
    expect(t.length).toBe(4096 + 1024);
  });

  it("index(deg) は度数を 360 周期のテーブル添字にする", () => {
    expect(t[t.index(0)]).toBeCloseTo(0);
    expect(t[t.index(90)]).toBeCloseTo(1);
    expect(t[t.index(180)]).toBeCloseTo(0, 5);
    expect(t[t.index(-90)]).toBeCloseTo(-1);
    expect(t.index(360)).toBe(t.index(0));
  });

  it("cos_shift を足すと cos になる", () => {
    expect(t[t.index(0) + t.cos_shift]).toBeCloseTo(1);
    expect(t[t.index(90) + t.cos_shift]).toBeCloseTo(0, 5);
  });
});

describe("List / ListElem", () => {
  const make = () => ({ list: new CML.List(), a: new CML.ListElem(), b: new CML.ListElem(), c: new CML.ListElem() });

  it("空リスト", () => {
    const { list } = make();
    expect(list.isEmpty()).toBe(true);
    expect(list.shift()).toBeNull();
    expect(list.pop()).toBeNull();
    expect(list.begin).toBe(list.end);
  });

  it("push / unshift / head / tail", () => {
    const { list, a, b, c } = make();
    list.push(a);
    list.push(b);
    list.unshift(c);
    expect(list.head).toBe(c);
    expect(list.tail).toBe(b);
    expect(list.head.next).toBe(a);
    expect(list.isEmpty()).toBe(false);
  });

  it("shift / pop は取り出した要素の前後リンクを切る", () => {
    const { list, a, b } = make();
    list.push(a);
    list.push(b);
    expect(list.shift()).toBe(a);
    expect(a.next).toBeNull();
    expect(list.pop()).toBe(b);
    expect(list.isEmpty()).toBe(true);
  });

  it("remove は途中の要素を外す。term は外せない", () => {
    const { list, a, b, c } = make();
    [a, b, c].forEach(e => list.push(e));
    expect(list.remove(b)).toBe(b);
    expect(a.next).toBe(c);
    expect(c.prev).toBe(a);
    expect(list.remove(list.term)).toBeNull();
  });

  it("insert_before / insert_after", () => {
    const { list, a, b, c } = make();
    list.push(a);
    b.insert_after(a);
    c.insert_before(a);
    const order = [];
    for (let e = list.begin; e !== list.end; e = e.next) order.push(e);
    expect(order).toEqual([c, a, b]);
  });

  it("cat は他のリストを末尾に連結して空にする", () => {
    const { list, a, b, c } = make();
    const other = new CML.List();
    list.push(a);
    other.push(b);
    other.push(c);
    list.cat(other);
    expect(other.isEmpty()).toBe(true);
    expect(list.tail).toBe(c);
    expect(a.next).toBe(b);
  });
});
