import { describe, it, expect } from "vitest";
import { createCML } from "./helpers/load.js";

describe("ユーザー定義コマンド/変数", () => {
  it("&cmd は argc 個の引数と fiber を受け取る", () => {
    const { cml } = createCML();
    let args, fiber;
    cml.globalVariables.registerUserCommand("test", (fbr, a) => { fiber = fbr; args = a.slice(); }, 2);
    const runner = cml.runner(0, 0, 0);
    runner.execute(cml.sequence("&test3,4"));
    cml.update();
    expect(args).toEqual([3, 4]);
    expect(typeof fiber.getVariable).toBe("function");
  });

  it("$name は登録した関数の戻り値、$1/$2 は execute の args", () => {
    const { cml } = createCML();
    const seen = [];
    const g = cml.globalVariables;
    g.registerUserVariable("answer", () => 42);
    g.registerUserCommand("rec", (fbr, a) => seen.push(a[0]), 1);
    const runner = cml.runner(0, 0, 0);
    runner.execute(cml.sequence("&rec$answer"), [7, 8]);
    runner.execute(cml.sequence("&rec$1"), [7, 8]);
    runner.execute(cml.sequence("&rec$2"), [7, 8]);
    cml.update();
    expect(seen).toEqual([42, 7, 8]);
  });

  it("引数なしのコマンド", () => {
    const { cml } = createCML();
    let called = 0;
    cml.globalVariables.registerUserCommand("noargc", () => { called++; });
    cml.runner(0, 0, 0).execute(cml.sequence("&noargc"));
    cml.update();
    expect(called).toBe(1);
  });

  it("ユーザー変数は式の中でも使える", () => {
    const { cml } = createCML();
    cml.globalVariables.registerUserVariable("ten", () => 10);
    const r = cml.runner(0, 0, 0);
    r.execute(cml.sequence("px$ten*2+1"));
    cml.update();
    expect(r.pos.x).toBe(21);
  });
});
