# 残タスク（2026-11-06 時点）

現状: `npm run typecheck` が通る。`npm test` は通常の 241 件が通り、既知の不具合 1 件が `it.fails` で固定されている（root 直下の子リスト）。`@ts-expect-error` なし。
言語は v3（仕様: `docs/reference/v3/cannonML.md`）。バグ修正や仕様変更は、リファクタとは別のコミットで行うこと。

## 1. demo

- `demo/main.js` のエディタの初期値が空（`editor.setValue("")`）。v3 のサンプルスクリプトを入れると、起動直後に動作を確認できる。
- ブラウザでの動作確認は人手。自動化するなら Playwright などを検討。

## 2. 挙動・バグ候補（要対応）

実測で確認したもの。直したらテストを足して、ここから消す。

- **root 直下の ID 付き子が、破棄後も root の子リストに残る（`it.fails` で固定済み）**: `CMLObject._finalize` は `parent !== root` のときだけ `_accessibleChildren` から外す。修正したら `test/spec/03-spawn.test.js` の `it.fails` を外す。
- **`_pointer` に `undefined` が入る経路の確認（未実施）**: `ListElem.next` は `null` で初期化済み（完了）。`Fiber.isActive` / `isExecuting` / `_pointer === null` の判定が外れないよう、`_pointer` に入る値（`ref.jump`、`state.prev`、`jstc.pop()!`）を棚卸しする。
- **残りの `!` と `as any` の棚卸し（未実施）**: `grep` で全件を洗い出し、「不変条件」「実行時検査」「型で保証済み」に分類する。`any` 9 か所のうち、`ListElem` は型を決めれば減る。
- **`$o` の仕様の文言**: `$o`（総数）は ID 0 や 10 以上も数えるが、仕様書は「1~9 以外は参照する方法がない」とだけ書いている。`$o` の総数と `$o1`〜`$o9` を分けて書く。
- **ID 0 を登録するようになった影響が未計測**: `f10,0` のような末尾の `,0` も登録される。破棄時の `splice(indexOf)` が線形なので、弾が多いと遅くなる可能性がある。弾数を増やして計測する。
- **破棄後のオブジェクトが長く残る経路（未計測）**: `Runner._createdby`（生成元の連鎖を保持する）、`Fiber._target` と子の `_parent`（遅延して初めて解放される）、`Fiber._defaultTarget`。`_createdby` は生成時のコールバック継承にしか使っていないので、不要になった時点で外せる。

## 3. 型と可読性

- `any` は型の制約の `ListElem<any>` だけ（F 有界の制約なので残す）。`null!` は 4 か所（`Fiber._object` / `_target` の初期化と `_finalize`）。`var` は 0 か所。
  - `Fiber._object` / `_target` は破棄・プール返却で意図的に null に戻る。型は非 null のまま。`| null` にすると参照が約 20 か所あり、絞り込みが要る。
  - `CMLObject._parent` は `CMLObject | null` にして、`getParent()`（アクティブでなければ例外）で読む。`Fiber._pointer` も `State | null`。`seqFiber` / `seqFired` は `Sequence.nop()` で初期化済み。
  - `new CannonML()` で設定される static 9 か所（`Fiber._globalVariables` `Fiber._defaultTarget` `Sequence._parser` など）は、実体を `_xValue: T | null` にして、読み出しを `required()` の getter（`CMLGlobal.ts`）に集約済み。未初期化のアクセスは例外になる。この形を維持する（型が「未設定」を正直に表し、`!` で検査を捨てない）。
  - 将来の候補: static を全廃して、`CannonML` から各クラスへ `Global` を渡す（依存性の注入）。`Fiber._freeFibers` `_rootFiber` `CMLObject._activeObjects` など static メソッドから使う状態があり、ほぼ全ファイルに波及する。要るなら static の洗い出しから始める。
  - `BarrageElem._globalVariables` は `rand()` を呼ぶためだけに持っている。`init` / `update` に `Global` を引数で渡せば、この static を減らせる（`CannonML` を直接 import すると循環 import になるので不可）。
  - リストの分離（進行中）: `State` の基底を `ChainListElem<T>` / `ChainList<T>`（null 終端の線形の鎖）に分けた（完了）。次の段階で、`ListElem<T>` / `List<T>`（`Fiber` / `CMLObject` / `BarrageElem` の番兵付きの環）の `prev` / `next` を非 null（未接続は `next = prev = this`）にするかを決める。`State` の鎖は null 終端のまま（`_pointer === null` が実行終了）。
  - リストの型付け: 完了。`ListElem<T>` / `List<T>` は既定値なし。`Fiber` / `State` / `CMLObject` / `BarrageElem` が自分の型を渡し、各 `List` に要素の型を付けた。`List<Fiber>` に `State` を入れると型検査で落ちる（確認済み）。走査ループは、毎ステップ null 判定（`while (elem && elem != end)`）で書く。残った `!` は、リストの内部操作（`List` / `ListElem` の繋ぎ替え）と、1 段だけの参照（`bul.next!`、`state.prev!`）のみ。
  - 名前の表（`_mapUsrDefRef` / `_mapUsrDefCmd` / `_childSequences`）は `Object.create(null)`。組み込み変数の表 `FormulaLiteral.operators` は `hasOwnProperty` で引く（完了）。
  - `State.jump` の扱い。
- 型で表せていない暗黙の約束:
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
