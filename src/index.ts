// 評価順に注意: State ⇄ Sequence ⇄ Fiber は循環 import で、Sequence が State の評価前に走ると `extends State` が落ちる。
// CMLSequence を最初に読めば、依存を辿る順で State → Sequence の順に評価される。順序を変えるときはテストで確認すること。
import { Sequence } from "./CMLSequence.js"
import { Fiber } from "./CMLFiber.js"
import { Runner } from "./CMLRunner.js"
import { CannonML } from "./CannonML.js"
import { Interpolation } from "./core/interpolation.js"
import { RangeLimitNumber } from "./core/RangeLimitNumber.js"
import { Vector } from "./core/CMLVector.js"
import { ListElem } from "./core/CMLListElem.js"
import { List } from "./core/CMLList.js"
import { SinTable } from "./core/CMLSinTable.js"
import { Global } from "./core/CMLGlobal.js"
import { State } from "./core/CMLState.js"
import { Assign } from "./core/CMLAssign.js"
import { BarrageElem } from "./core/CMLBarrageElem.js"
import { Barrage } from "./core/CMLBarrage.js"
import { FormulaLiteral } from "./core/CMLFormulaLiteral.js"
import { FormulaOperator } from "./core/CMLFormulaOperator.js"
import { Formula } from "./core/CMLFormula.js"
import { CMLObject } from "./core/CMLObject.js"
import { Refer } from "./core/CMLRefer.js"
import { CMLString } from "./core/CMLString.js"
import { UserDefine } from "./core/CMLUserDefine.js"
import { Parser } from "./core/CMLParser.js"

export const CML = {
  interpolation: Interpolation,
  RangeLimitNumber,
  Vector,
  ListElem,
  List,
  SinTable,
  Global,
  State,
  Assign,
  BarrageElem,
  Barrage,
  FormulaLiteral,
  FormulaOperator,
  Formula,
  Object: CMLObject,
  Refer,
  String: CMLString,
  UserDefine,
  Parser,
  Sequence,
  Fiber,
  Runner,
}

export namespace CML {
  export type interpolation = InstanceType<typeof Interpolation>
  export type RangeLimitNumber = InstanceType<typeof RangeLimitNumber>
  export type Vector = InstanceType<typeof Vector>
  export type ListElem = InstanceType<typeof ListElem>
  export type List = InstanceType<typeof List>
  export type SinTable = InstanceType<typeof SinTable>
  export type Global = InstanceType<typeof Global>
  export type State = InstanceType<typeof State>
  export type Assign = InstanceType<typeof Assign>
  export type BarrageElem = InstanceType<typeof BarrageElem>
  export type Barrage = InstanceType<typeof Barrage>
  export type FormulaLiteral = InstanceType<typeof FormulaLiteral>
  export type FormulaOperator = InstanceType<typeof FormulaOperator>
  export type Formula = InstanceType<typeof Formula>
  export type Object = InstanceType<typeof CMLObject>
  export type Refer = InstanceType<typeof Refer>
  export type String = InstanceType<typeof CMLString>
  export type UserDefine = InstanceType<typeof UserDefine>
  export type Parser = InstanceType<typeof Parser>
  export type Sequence = InstanceType<typeof Sequence>
  export type Fiber = InstanceType<typeof Fiber>
  export type Runner = InstanceType<typeof Runner>
}

export { CannonML }
