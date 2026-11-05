# 残タスク（2026-11-05 時点）

現状: `npm run typecheck` / `npm test` ともに通る（215 件、`it.fails` なし、`@ts-expect-error` なし）。
言語は v3（仕様: `docs/reference/v3/cannonML.md`）。バグ修正や仕様変更は、リファクタとは別のコミットで行うこと。

## 1. demo

- `demo/main.js` のエディタの初期値が空（`editor.setValue("")`）。v3 のサンプルスクリプトを入れると、起動直後に動作を確認できる。
- ブラウザでの動作確認は人手。自動化するなら Playwright などを検討。

## 2. 型と可読性

- `any` が 9 か所。`null!` は 10 か所。
  - `null!` はすべて、破棄・プール返却で意図的に null に戻る instance フィールド。型は非 null のまま。`Fiber._object` / `_target` / `_pointer` / `seqFiber` / `seqFired`、`CMLObject._parent`。`_parent` は `| null` に変えると約 25 か所の絞り込みが要る。
  - `new CannonML()` で設定される static 9 か所（`Fiber._globalVariables` `Fiber._defaultTarget` `Sequence._parser` など）は、実体を `_xValue: T | null` にして、読み出しを `required()` の getter（`CMLGlobal.ts`）に集約済み。未初期化のアクセスは例外になる。`null` はこの 10 か所の実体にだけ現れる。この形を維持する（型が「未設定」を正直に表し、`!` で検査を捨てない）。
  - 将来の候補: static を全廃して、`CannonML` から各クラスへ `Global` を渡す（依存性の注入）。`Fiber._freeFibers` `_rootFiber` `CMLObject._activeObjects` など static メソッドから使う状態があり、ほぼ全ファイルに波及する。要るなら static の洗い出しから始める。
  - `BarrageElem._globalVariables` は `rand()` を呼ぶためだけに持っている。`init` / `update` に `Global` を引数で渡せば、この static を減らせる（`CannonML` を直接 import すると循環 import になるので不可）。
  - `ListElem.prev` / `next` と `List` の取り出し系が `any`（State / Fiber / Object の混在のため）。ジェネリクス化で絞れる。
  - `State.jump` の扱い。
- 型で表せていない暗黙の約束:
  - `State.operators` の各 `func` は `(state, $, fiber, object)` の位置引数。未使用は `_` 始まり。
  - `CML.String` / `CML.Object` は組み込みと同名のため、クラス名は `CMLString` / `CMLObject`。
- パーサの正規表現は JS 文字列リテラルで組み立てている（`\\s` / `\\w` と書く）。単一の `\s` は黙って `s` になり、`tsc` で検出できない。過去に 2 回これで壊れた。テスト以外に守る手段がないので、リテラルの書き方を変えるか、検出するテストを足す。

## 3. 環境・ドキュメント

- `README.md` が v2（プレーン JS・ビルドなし・`docs/reference/v2/`）のまま。TS 版・v3 に書き直す。内容: ビルド手順（`npm run build`）、`import { CML, CannonML } from ".../dist/index.js"`、demo の起動方法、v3 仕様へのリンク。API 表のシグネチャは `args` を外し `mirror` にしただけで、他は古い。
- 開発環境:
  - `npm run test:watch` はテスト用バンドルを起動時に 1 回しか作らない。`src/` を変えたら再起動が必要（`test/helpers/global-setup.js`）。必要なら vitest のプラグイン化か `src` の監視で再ビルドする。
  - lint と CI は未導入。
  - `tsconfig.json` の `lib` に `DOM` が入っている。ライブラリ本体がブラウザ API を使っていなければ外せる。
  - `package.json` の `name` / `version` は暫定値（`cannonml` / `0.0.0`）。`CannonML.VERSION` は `"0.5.0"` で食い違っている。
- `old/` は v1・v2 の凍結アーカイブ。編集しない。不要になった時点で消してよい（git 履歴にも残る）。
