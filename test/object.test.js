import { describe, it, expect } from "vitest";
import { createCML } from "./helpers/load.js";
import { xy } from "./helpers/run.js";

const setup = () => {
  const { cml, CML } = createCML();
  const spawn = (x = 0, y = 0, ...rest) => new CML.Object().create(x, y, 0, ...rest);
  return { cml, CML, spawn };
};

describe("Object: 生成と破棄", () => {
  it("create で active になり位置が入る。二重 create は例外", () => {
    const { spawn } = setup();
    const o = spawn(3, 4);
    expect(o.isActive).toBe(true);
    expect(xy(o.pos)).toEqual([3, 4]);
    expect(() => o.create(0, 0, 0)).toThrow("inactive");
  });

  it("create の z は位置に反映される", () => {
    const { CML } = setup();
    const o = new CML.Object().create(3, 4, 5);
    expect(o.pos.z).toBe(5);
  });

  it("親省略時の parent は root", () => {
    const { spawn, CML } = setup();
    expect(spawn().parent).toBe(CML.Object.root);
  });

  it("destroy は次の update で finalize され、id が増えて inactive になる", () => {
    const { spawn, cml } = setup();
    const o = spawn();
    const id = o.id;
    o.destroy(7);
    expect(o.destructionStatus).toBe(7);
    expect(o.isActive).toBe(true);
    cml.update();
    expect(o.isActive).toBe(false);
    expect(o.id).toBe(id + 1);
  });

  it("destroy(負数) は 0 にそろえる", () => {
    const { spawn } = setup();
    const o = spawn();
    o.destroy(-5);
    expect(o.destructionStatus).toBe(0);
  });

  it("onCreate / onDestroy / onUpdate フック", () => {
    const { CML, cml } = setup();
    const log = [];
    class T extends CML.Object {
      onCreate() { log.push("create"); }
      onUpdate() { log.push("update"); }
      onDestroy() { log.push("destroy"); }
    }
    const t = new T().create(0, 0, 0);
    cml.update();
    t.destroy(0);
    cml.update();
    expect(log).toEqual(["create", "update", "destroy"]);
  });

  it("age はフレームごとに増える", () => {
    const { spawn, cml } = setup();
    const o = spawn();
    cml.update();
    cml.update();
    expect(o.age).toBe(2);
  });

  it("親が破棄されると parent は root に戻る", () => {
    const { spawn, cml, CML } = setup();
    const p = spawn();
    const c = spawn(0, 0, p);
    expect(c.parent).toBe(p);
    p.destroy(0);
    cml.update();
    expect(c.parent).toBe(CML.Object.root);
  });

  it("access_id を付けた子は findChild / findAllChildren / count で引ける", () => {
    const { spawn } = setup();
    const p = spawn();
    const a = spawn(0, 0, p, false, 1);
    const b = spawn(0, 0, p, false, 1);
    spawn(0, 0, p, false, 2);
    spawn(0, 0, p);
    expect(p.findChild(1)).toBe(a);
    expect(p.findAllChildren(1)).toEqual([a, b]);
    expect(p.countIDedChildren(1)).toBe(2);
    expect(p.countIDedChildren(2)).toBe(1);
    expect(p.countAllIDedChildren()).toBe(3);
  });

  it("destroyAll(status) で全 Object に status が入る", () => {
    const { spawn, CML } = setup();
    const a = spawn(), b = spawn();
    CML.Object.destroyAll(3);
    expect(a.isActive).toBe(false);
    expect(b.isActive).toBe(false);
    expect(a.destructionStatus).toBe(3);
  });
});

describe("Object: 運動", () => {
  it("等速（MT_CONST）", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setVelocity(1, 2, 3);
    o.update();
    o.update();
    expect([o.pos.x, o.pos.y, o.pos.z]).toEqual([2, 4, 6]);
  });

  it("setAccel: 位置は 0.5at^2、counter=0 なら加速し続ける", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setAccel(2, 0, 0, 0);
    expect(o.motionType).toBe(1);
    o.update(); o.update(); o.update();
    expect(o.pos.x).toBe(9); // 0.5 * a * t^2 = 0.5 * 2 * 9
    expect(o.vel.x).toBe(6);
  });

  it("setAccel(0,0,0) は等速に戻る", () => {
    const { spawn, CML } = setup();
    const o = spawn();
    o.setAccel(1, 0, 0);
    o.setAccel(0, 0, 0);
    expect(o.motionType).toBe(CML.Object.MT_CONST);
  });

  it("setPosition(frames>0) は frames 後にちょうど目標へ着地して等速に戻る", () => {
    const { spawn, CML } = setup();
    const o = spawn(0, 0);
    o.setPosition(100, -40, 0, 5);
    expect(o.motionType).toBe(CML.Object.MT_INTERPOL);
    for (let i = 0; i < 5; i++) o.update();
    expect(o.pos.x).toBeCloseTo(100, 9);
    expect(o.pos.y).toBeCloseTo(-40, 9);
    expect(o.motionType).toBe(CML.Object.MT_CONST);
  });

  it("setVelocity(frames>0) は frames 後に目標速度になる", () => {
    const { spawn, CML } = setup();
    const o = spawn();
    o.setVelocity(4, 0, 0, 4);
    expect(o.motionType).toBe(CML.Object.MT_ACCEL);
    for (let i = 0; i < 4; i++) o.update();
    expect(o.vel.x).toBeCloseTo(4, 9);
    expect(o.motionType).toBe(CML.Object.MT_CONST);
  });

  it("setPositionX/Y は他方の成分を保つ", () => {
    const { spawn } = setup();
    const o = spawn(1, 2);
    o.setPositionX(10);
    expect(xy(o.pos)).toEqual([10, 2]);
    o.setPositionY(20);
    expect(xy(o.pos)).toEqual([10, 20]);
  });

  it("setVelocityX/Y は他方の成分を保つ", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setVelocity(1, 2, 0);
    o.setVelocityX(5);
    expect([o.vel.x, o.vel.y]).toEqual([5, 2]);
    o.setVelocityY(7);
    expect([o.vel.x, o.vel.y]).toEqual([5, 7]);
  });

  it("setVelocityByDirection: 角度 90 度、v=2 で (0,2)", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setVelocityByDirection(Math.PI / 2, 2, 0);
    expect(o.vel.x).toBeCloseTo(0, 9);
    expect(o.vel.y).toBeCloseTo(2, 9);
  });

  it("velocity getter/setter は速さのみを変える", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setVelocity(3, 4, 0);
    expect(o.velocity).toBe(5);
    o.velocity = 10;
    expect(o.vel.x).toBeCloseTo(6, 9);
    expect(o.vel.y).toBeCloseTo(8, 9);
  });

  it("head（euler.z）を設定すると angleOnScreen に反映される", () => {
    const { spawn } = setup();
    const o = spawn();
    o.head = 1;
    expect(o.angleOnScreen).toBe(1);
    expect(o.euler.changed).toBe(true);
  });

  it("angle は scrollAngle 分だけ angleOnScreen からずれる", () => {
    const { spawn } = setup(); // vertical = true -> scrollAngle -90 度
    const o = spawn();
    o.angle = 0;
    expect(o.angleOnScreen).toBeCloseTo(Math.PI / 2, 9);
    expect(o.angle).toBeCloseTo(0, 9);
  });

  it("setRotation(frames=0, 最短回転) は即座に向きを変える", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setRotation(Math.PI / 2, 0);
    expect(o.head).toBeCloseTo(Math.PI / 2, 9);
  });

  it("setRotation(frames>0) は update ごとに補間され frames 後に目標へ着く", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setRotation(Math.PI / 2, 4);
    for (let i = 0; i < 4; i++) o.update();
    expect(o.head).toBeCloseTo(Math.PI / 2, 9);
  });

  it("setConstantRotation は 1 フレームあたりの回転量 rmax で制限される", () => {
    const { spawn } = setup();
    const o = spawn();
    o.setConstantRotation(Math.PI / 2, 0, 0.5);
    expect(o.head).toBeCloseTo(0.5, 9);
  });

  it("getDistance / getAimingAngleOnScreen は projected 座標で計算する", () => {
    const { spawn } = setup();
    const a = spawn(0, 0), b = spawn(3, 4);
    a.update(); b.update(); // projected を更新
    expect(a.getDistance(b)).toBe(5);
    expect(a.getAimingAngleOnScreen(b)).toBeCloseTo(Math.atan2(4, 3), 9);
  });

  it("projected は update で pos をコピーする", () => {
    const { spawn } = setup();
    const o = spawn(1, 2);
    expect(xy(o.projected)).toEqual([0, 0]);
    o.update();
    expect(xy(o.projected)).toEqual([1, 2]);
  });
});
