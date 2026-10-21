import { describe, it, expect } from "vitest";
import { loadCML } from "./helpers/load.js";

const { CML } = loadCML();
const I = () => new CML.interpolation();

describe("interpolation", () => {
  it("setLinear: 端点と中点", () => {
    const i = I().setLinear(10, 30);
    expect(i.calc(0)).toBe(10);
    expect(i.calc(0.5)).toBe(20);
    expect(i.calc(1)).toBe(30);
  });

  it("setBezier2: 制御点 p を通らず、t=0.5 で (x0+2p+x1)/4", () => {
    const i = I().setBezier2(0, 10, 20);
    expect(i.calc(0)).toBe(0);
    expect(i.calc(1)).toBe(10);
    expect(i.calc(0.5)).toBeCloseTo((0 + 2 * 20 + 10) / 4);
  });

  it("setBezier3: t=0.5 で (x0+3p0+3p1+x1)/8", () => {
    const i = I().setBezier3(0, 10, 20, 30);
    expect(i.calc(0)).toBe(0);
    expect(i.calc(1)).toBeCloseTo(10);
    expect(i.calc(0.5)).toBeCloseTo((0 + 3 * 20 + 3 * 30 + 10) / 8);
  });

  it("setFergusonCoons: 端点の値と速度", () => {
    const i = I().setFergusonCoons(1, 5, 2, -3);
    expect(i.calc(0)).toBeCloseTo(1);
    expect(i.calc(1)).toBeCloseTo(5);
    const d = 1e-6;
    expect((i.calc(d) - i.calc(0)) / d).toBeCloseTo(2, 3);
    expect((i.calc(1) - i.calc(1 - d)) / d).toBeCloseTo(-3, 3);
  });

  it.each([
    ["setLagrange", i => i.setLagrange(0, 1, 4, 9), 1, 4],
    ["setCatmullRom", i => i.setCatmullRom(0, 1, 4, 9), 1, 4],
    ["setCatmullRomStart", i => i.setCatmullRomStart(1, 4, 9), 1, 4],
    ["setCatmullRomEnd", i => i.setCatmullRomEnd(0, 1, 4), 1, 4],
  ])("%s: t=0 で内側の 1 点目、t=1 で 2 点目を通る", (_, set, at0, at1) => {
    const i = set(I());
    expect(i.calc(0)).toBeCloseTo(at0);
    expect(i.calc(1)).toBeCloseTo(at1);
  });

  it("setLagrange: 等差数列は直線になる", () => {
    const i = I().setLagrange(0, 1, 2, 3);
    expect(i.calc(0.25)).toBeCloseTo(1.25);
    expect(i.calc(0.75)).toBeCloseTo(1.75);
  });

  it("各 setter は this を返す（チェーン可能）", () => {
    const i = I();
    expect(i.setLinear(0, 1)).toBe(i);
  });
});
