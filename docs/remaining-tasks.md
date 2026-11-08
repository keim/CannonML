# 残タスク（2026-11-08 時点）

現状: `npm run typecheck` が通る。`npm test` は 249 件すべて通る（`it.fails` なし）。`@ts-expect-error` なし。`any` 0 件、`var` 0 件、`null!` 4 件、`shift()!` / `pop()!` 0 件。
言語は v3（仕様: `docs/reference/v3/cannonML.md`）。バグ修正や仕様変更は、リファクタとは別のコミットで行うこと。

## 1. demo

- `demo/main.js` のエディタの初期値が空（`editor.setValue("")`）。v3 のサンプルスクリプトを入れると、起動直後に動作を確認できる。
- ブラウザでの動作確認は人手。自動化するなら Playwright などを検討。

## 2. 挙動・バグ候補

実測で確認したもの。直したらテストを足して、ここから消す。

- **破棄後のオブジェクトが長く残る経路（未計測）**: `Runner._createdby`（生成元の連鎖を保持する）、`Fiber._target` と子の `_parent`（遅延して初めて解放される）、`Fiber._defaultTarget`。`_createdby` は生成時のコールバック継承にしか使っていないので、不要になった時点で外せる。

## 3. 型と可読性

### 3-1. 現状

- `any` は 0 か所（リストの制約は F 有界 `T extends ListElem<T>`）。`var` は 0 か所。
- `null!` は 4 か所（`Fiber._object` / `_target` の初期化と `_finalize`）。破棄・プール返却で意図的に null に戻る。型は非 null のまま。`| null` にすると参照が約 20 か所あり、絞り込みが要る。
- `shift()!` / `pop()!` は 0 か所。`undefined` を検査する形に統一済み（`Formula` `Parser` `Fiber._popMirrorFlag` `}` の `jstc.pop()`）。
- `new CannonML()` で設定される static 9 か所は、実体を `_xValue: T | null` にして、`required()` の getter（`CMLGlobal.ts`）に集約済み。未初期化のアクセスは例外になる。この形を維持する。
- リスト: `State` は `ChainListElem<T>` / `ChainList<T>`（null 終端の線形の鎖）。`Fiber` / `CMLObject` / `BarrageElem` は `ListElem<T>` / `List<T>`（番兵付きの環、`prev` / `next` は非 null、未接続は自己ループ、`is_linked()` で判定）。`List<Fiber>` に `State` を入れると型検査で落ちる（確認済み）。
- 名前の表（`_mapUsrDefRef` / `_mapUsrDefCmd` / `_childSequences`）は `Object.create(null)`。`FormulaLiteral.operators` は `hasOwnProperty` で引く。
- `Refer.jump` は `Sequence | null` に狭めてある。`State.jump` は `State | null`。

### 3-2. 非 null表明 `!` の内訳（コードの `!` 40 か所）

宣言の `x!: T` 20 か所、`null!` 4 か所、文字列中の `BUG!!` 2 か所は除く。

| 分類 | 数 | 場所 | 根拠 | 方針 |
|---|---|---|---|---|
| ChainList / ChainListElem の繋ぎ替え | 16 | `CMLChainList.ts` `CMLChainListElem.ts` | null 終端の鎖を番兵の環で組み立てる内部操作 | 残す。`ListElem` と同じ環にはしない（`cut` が null 終端を作る設計のため） |
| State / Fiber の鎖の参照 | 10 | `CMLState.ts` | `state.jump!`（`[` `]` `?` `:` は対で `jump` を持つ）、`fiber._pointer!.next`、`state.prev!` | 残す。パーサが保証する不変条件。壊れたスクリプトは構文エラーで止まる |
| Formula の演算子 | 6 | `CMLFormula.ts` `CMLFormulaOperator.ts` | `opr0!` / `opr1!` / `_rootOperator!` は `construct()` が個数を検査した後にだけ使う | 残す。`construct()` が失敗すれば構文エラー |
| Fiber の getter と待機 | 3 | `CMLFiber.ts` | `_pointer!.next`（`string` `sequence` の getter）、`_seqWaitDest.next!` | 下の候補 A |
| Sequence の検証 | 3 | `CMLSequence.ts` | `ref._label!`（`isLabelUnsolved()` で検査済みだが、呼び出しをまたぐ）、`cmd.next!` | 下の候補 B |
| Parser | 2 | `CMLParser.ts` | `_regexp!`（`_createCMLRegExp` が必ず設定） | 下の候補 C |

### 3-3. 宣言の definite assignment `x!: T`（20 か所）

- `Parser.REX_*`（13）: `_createCMLRegExp` で設定。インスタンスごとに遅延設定しているため `!`。
- `FormulaOperator.func` / `priorL` / `priorR`（3）: `Object.assign` で設定。
- `Global._scrollAngle` / `_scrollRadian`（2）: `vertical` の setter で設定。
- `Vector.w` / `changed`（2）。

### 3-4. 次の作業の候補（小さく、効果がある順）

- **候補 A（Fiber の getter）**: `this._pointer?.next` と書けば、`!` が消える。ただし `_pointer` が null のとき、今は `TypeError`、変更後は `null` を返す（挙動が変わるので、テストで固定してから変える）。`_seqWaitDest.next!` は代入先なので、残す。
- **候補 B（Sequence の検証）**: `const label = ref._label; if (label === null) throw ...;` の形にすると、`!` が消える。`cmd.next!` は `cmd.next?.type` で書けるが、`verify()` の不変条件（コマンド列は `$end` で終わる）に依るので、確認してから変える。
- **候補 C（Parser の `_regexp`）**: 戻り値を局所変数にすると、`_regexp!` が消える。
- **候補 D（宣言の `REX_*`）**: `static` の定数（または初期値のある `const`）にすると、13 か所の `!` が消える。`_createCMLRegExp` で正規表現の組み立てと一緒に扱っている点は変える必要がある。
- **候補 E（`null!` の 4 か所）**: `Fiber._object` / `_target` を `| null` にする。参照が約 20 か所あり、大きい作業。費用に対する効果は小さいので、当面は見送る。

### 3-5. 型で表せていない暗黙の約束

- `State.operators` の各 `func` は `(state, $, fiber, object)` の位置引数。未使用は `_` 始まり。
- `CML.String` / `CML.Object` は組み込みと同名のため、クラス名は `CMLString` / `CMLObject`。
- パーサの正規表現は JS 文字列リテラルで組み立てている（`\\s` / `\\w` と書く）。単一の `\s` は黙って `s` になり、`tsc` で検出できない。過去に 2 回これで壊れた。テスト以外に守る手段がないので、リテラルの書き方を変えるか、検出するテストを足す。

## 4. 環境・ドキュメント

- `README.md` が v2（プレーン JS・ビルドなし・`docs/reference/v2/`）のまま。TS 版・v3 に書き直す。内容: ビルド手順（`npm run build`）、`import { CML, CannonML } from ".../dist/index.js"`、demo の起動方法、v3 仕様へのリンク。API 表のシグネチャは `args` を外し `mirror` にしただけで、他は古い。
- 開発環境:
  - `npm run test:watch` はテスト用バンドルを起動時に 1 回しか作らない。`src/` を変えたら再起動が必要（`test/helpers/global-setup.js`）。必要なら vitest のプラグイン化か `src` の監視で再ビルドする。
  - lint と CI は未導入。
  - `tsconfig.json` の `lib` に `DOM` が入っている。ライブラリ本体がブラウザ API を使っていなければ外せる。
  - `package.json` の `name` / `version` は暫定値（`cannonml` / `0.0.0`）。`CannonML.VERSION` は `"0.5.0"` で食い違っている。
- `old/` は v1・v2 の凍結アーカイブ。編集しない。不要になった時点で消してよい（git 履歴にも残る）。
