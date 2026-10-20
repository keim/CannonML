import { describe, it, expect } from "vitest";
import { loadCML, createCML } from "./helpers/load.js";

describe("CannonML", () => {
  it("singleton: 2 つ目の new は例外", () => {
    const ctx = loadCML();
    new ctx.CannonML();
    expect(() => new ctx.CannonML()).toThrow("singleton");
  });

  it("VERSION", () => {
    expect(loadCML().CannonML.VERSION).toBe("0.5.0");
  });

  it("vertical フラグで scrollAngle が決まる", () => {
    expect(createCML({ vertical: true }).cml.globalVariables.scrollAngle).toBe(-90);
    expect(createCML({ vertical: true }).cml.globalVariables.vertical).toBe(1);
    expect(createCML({ vertical: false }).cml.globalVariables.scrollAngle).toBe(180);
    expect(createCML({ vertical: false }).cml.globalVariables.vertical).toBe(0);
  });

  it("setScreenSize: 半分の幅/高さ + bias", () => {
    const { cml } = createCML();
    cml.setScreenSize(200, 100, 10);
    expect(cml.globalVariables._halfScreenWidth).toBe(110);
    expect(cml.globalVariables._halfScreenHeight).toBe(60);
  });

  it("sequence() は Sequence、runner() は座標つきで生成される", () => {
    const { cml, CML } = createCML();
    expect(cml.sequence("px1")).toBeInstanceOf(CML.Sequence);
    const r = cml.runner(3, 4);
    expect(r).toBeInstanceOf(CML.Runner);
    expect([r.pos.x, r.pos.y, r.pos.z]).toEqual([3, 4, 0]);
    expect(r.isActive).toBe(true);
  });

  // 既知の不具合: runner() は z を CML.Object.create() の第 3 引数（parent）に渡してしまい z が反映されない
  it.fails("runner(x, y, z) の z が反映される", () => {
    const { cml } = createCML();
    expect(cml.runner(3, 4, 5).pos.z).toBe(5);
  });

  it("画面サイズ未設定（0）だと Runner は最初の update で画面外として破棄される", () => {
    const { cml, CML } = createCML();
    const r = cml.runner(0, 0, 0, cml.sequence("vx2"));
    cml.update();
    expect(r.destructionStatus).toBe(CML.Runner.ESCAPE_STATUS);
  });

  it("runner(…, seq) は即座に実行を始める", () => {
    const { cml } = createCML();
    cml.setScreenSize(1000, 1000);
    const r = cml.runner(0, 0, 0, cml.sequence("vx2"));
    cml.update();
    cml.update();
    expect(r.pos.x).toBe(4);
  });
});

describe("Global", () => {
  it("rank: setRank / getRank とレンジ制限", () => {
    const g = createCML().cml.globalVariables;
    expect(g.getRank(0)).toBe(0);
    g.setRank(0, 0.5);
    expect(g.getRank(0)).toBe(0.5);
    g.setRank(0, 5);
    expect(g.getRank(0)).toBe(1); // 既定は 0..1
    g.setGlobalRankRange(1, 0, 10);
    g.setRank(1, 99);
    expect(g.getRank(1)).toBe(10);
  });

  it("funcRand / rand", () => {
    const g = createCML({ rand: () => 0.25 }).cml.globalVariables;
    expect(g.rand()).toBe(0.25);
    g.funcRand = () => 0.75;
    expect(g.rand()).toBe(0.75);
  });

  it("registerUserVariable / registerUserCommand は map に登録される", () => {
    const g = createCML().cml.globalVariables;
    const f = () => 1;
    g.registerUserVariable("foo", f);
    g.registerUserCommand("bar", f, 2, true);
    expect(g._mapUsrDefRef.foo).toBe(f);
    expect(g._mapUsrDefCmd.bar).toEqual({ func: f, argc: 2, reqseq: true });
  });
});
