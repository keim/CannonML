import { describe, it, expect } from "vitest";
import { loadCML } from "./helpers/load.js";

const { CML } = loadCML();
const V = (x, y, z) => new CML.Vector(x, y, z);
const a = v => [v.x, v.y, v.z];

describe("Vector", () => {
  it("引数省略は 0", () => {
    expect(a(V())).toEqual([0, 0, 0]);
    expect(V().isZero()).toBe(true);
    expect(V(0, 0, 1).isZero()).toBe(false);
  });

  it("set / setScalar / clone / copy", () => {
    expect(a(V().set(1, 2, 3))).toEqual([1, 2, 3]);
    expect(a(V().setScalar(7))).toEqual([7, 7, 7]);
    const v = V(1, 2, 3);
    const c = v.clone();
    c.x = 9;
    expect(v.x).toBe(1);
    expect(a(V().copy(v))).toEqual([1, 2, 3]);
  });

  it("加減算はミュータブルで this を返す", () => {
    const v = V(1, 2, 3);
    expect(v.add(V(1, 1, 1))).toBe(v);
    expect(a(v)).toEqual([2, 3, 4]);
    expect(a(v.sub(V(2, 2, 2)))).toEqual([0, 1, 2]);
    expect(a(v.addScalar(1))).toEqual([1, 2, 3]);
    expect(a(v.subScalar(1))).toEqual([0, 1, 2]);
    expect(a(V().addVectors(V(1, 2, 3), V(4, 5, 6)))).toEqual([5, 7, 9]);
    expect(a(V().subVectors(V(4, 5, 6), V(1, 2, 3)))).toEqual([3, 3, 3]);
    expect(a(V(1, 1, 1).addScaledVector(V(1, 2, 3), 2))).toEqual([3, 5, 7]);
  });

  it("乗除算", () => {
    expect(a(V(1, 2, 3).multiplyScalar(2))).toEqual([2, 4, 6]);
    expect(a(V(1, 2, 3).multiply(V(2, 3, 4)))).toEqual([2, 6, 12]);
    expect(a(V(2, 4, 6).divideScalar(2))).toEqual([1, 2, 3]);
    expect(a(V(2, 6, 12).divide(V(2, 3, 4)))).toEqual([1, 2, 3]);
  });

  it("multiplyScalar は有限でない値だとゼロベクトルにする", () => {
    expect(a(V(1, 2, 3).multiplyScalar(Infinity))).toEqual([0, 0, 0]);
    expect(a(V(1, 2, 3).multiplyScalar(NaN))).toEqual([0, 0, 0]);
  });

  it("長さ・正規化", () => {
    expect(V(3, 4, 0).length()).toBe(5);
    expect(V(3, 4, 0).lengthSq()).toBe(25);
    expect(V(1, -2, 3).lengthManhattan()).toBe(6);
    expect(V(3, 4, 0).normalize().length()).toBeCloseTo(1);
    expect(V(3, 4, 0).setLength(10).length()).toBeCloseTo(10);
  });

  it("内積・外積", () => {
    expect(V(1, 2, 3).dot(V(4, 5, 6))).toBe(32);
    expect(a(V(1, 0, 0).cross(V(0, 1, 0)))).toEqual([0, 0, 1]);
    expect(a(V().crossVectors(V(0, 1, 0), V(1, 0, 0)))).toEqual([0, 0, -1]);
  });

  it("距離・角度", () => {
    expect(V(0, 0, 0).distanceTo(V(3, 4, 0))).toBe(5);
    expect(V(0, 0, 0).distanceToSquared(V(3, 4, 0))).toBe(25);
    expect(V(0, 0, 0).distanceToManhattan(V(3, -4, 0))).toBe(7);
    expect(V(1, 0, 0).angleTo(V(0, 1, 0))).toBeCloseTo(Math.PI / 2);
  });

  it("min / max / clamp / negate", () => {
    expect(a(V(1, 5, 3).min(V(2, 2, 2)))).toEqual([1, 2, 2]);
    expect(a(V(1, 5, 3).max(V(2, 2, 2)))).toEqual([2, 5, 3]);
    expect(a(V(-5, 5, 0).clamp(V(-1, -1, -1), V(1, 1, 1)))).toEqual([-1, 1, 0]);
    expect(a(V(1, -2, 3).negate())).toEqual([-1, 2, -3]);
  });

  it("lerp / lerpVectors", () => {
    expect(a(V(0, 0, 0).lerp(V(10, 20, 30), 0.5))).toEqual([5, 10, 15]);
    expect(a(V().lerpVectors(V(0, 0, 0), V(10, 0, 0), 0.25))).toEqual([2.5, 0, 0]);
  });

  it("euler2Quat: ゼロ回転は単位クォータニオン、z 軸 90 度回転で (1,0,0)→(0,1,0)", () => {
    const q0 = V().euler2Quat(V(0, 0, 0));
    expect([q0.x, q0.y, q0.z, q0.w]).toEqual([0, 0, 0, 1]);
    const q = V().euler2Quat(V(0, 0, Math.PI / 2));
    const r = V(1, 0, 0).applyQuat(q);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
    expect(r.z).toBeCloseTo(0);
  });
});
