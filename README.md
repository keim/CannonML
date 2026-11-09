# CannonML

CannonML (Cannon Macro Language) は、2D シューティングゲームの弾幕パターンを短いテキストで記述・実行するためのブラウザ向けスクリプトエンジンです。TypeScript で実装され、ESM としてビルドされます（v0.5.0）。

```cml
[8 o$l*20-70,-100 da0 f10{ {[w20-$r*16 f6]} i30 dt0 ~v0 ~v-10 } w4]
```

上の 1 行で、扇状に弾を撒きながら旋回する敵の動きを表現できます。

- 言語仕様: **[CannonML マニュアル（v3）](docs/reference/v3/cannonML.md)**（コマンドリファレンス）
- バージョン: `CannonML.VERSION`（現在 `"0.5.0"`）

## 1. セットアップ

npm パッケージとしては公開していません（`package.json` は `private`）。リポジトリを取得してビルドし、`dist/` を直接利用します。

```sh
npm install
npm run build
```

`npm run build`（`tsc`）は ESM の JavaScript と型定義を `dist/` に出力します。エントリは `dist/index.js` です。

```html
<script type="module">
  import { CannonML, CML } from "./dist/index.js";
  // ...
</script>
```

Node からも同じ ESM をそのまま import できます。

## 2. 使い方

最小構成は「インスタンス生成 → シーケンス作成 → ランナー生成・実行 → 毎フレーム更新」です。`update()` を呼ばないと何も動きません（フレーム駆動はホスト側の責任です）。

```js
import { CannonML } from "./dist/index.js";

// 1. インスタンス生成（シングルトン。2 回目の new は例外）
const cml = new CannonML();

// 画面外に出たランナーを自動破棄する範囲（既定は 200 x 200）
cml.setScreenSize(400, 400);

// 2. CML スクリプトからシーケンスを作成
const seq = cml.sequence("bs4,10bm5,360f10{i30vw90}");

// 3. ランナーを生成して実行
const runner = cml.runner(0, 0, 0, seq);

// 4. 毎フレーム呼ぶ
function loop() {
  cml.update();
  requestAnimationFrame(loop);
}
loop();
```

自機・敵機と連動させる場合は、`onCreateNewRunner` / `onDestroy` / `onUpdate` のコールバックを使います。新しく生成された弾の `CML.Runner` が `onCreateNewRunner` に渡るので、そこで描画オブジェクトを紐付けます。

```js
cml.setDefaultTarget(playerRunner); // 弾の狙撃対象（既定は CML.Object.root）

const enemy = cml.runner(0, 160, 0);
enemy.setCallbackFunctions({
  onCreateNewRunner(runner) { /* 弾スプライト生成・runner と紐付け */ },
  onDestroy(runner)         { /* スプライト破棄 */ },
  onUpdate(runner)          { /* runner.pos をスプライト位置に反映 */ },
});
enemy.execute(cml.sequence("[w30[$x>0?bm1,1f10:bm7,120f5]]"));
```

完全な実装例は `demo/actor.js` / `demo/main.js` を参照してください。

## 3. マニュアルの概要

言語仕様の全体は [CannonML マニュアル（v3）](docs/reference/v3/cannonML.md) にあります。以下はその構成の要約です。

### 3-1. 3 つの概念

- **CML スクリプト**: コマンドを並べた「手順書」。`コマンド + 引数` の形で、意味が確定すれば空白は不要です。
- **CML オブジェクト**: 敵機・弾・自機などの「物」。位置・速度・加速度・旋回などのパラメータを持ち、スクリプトがそれを書き換えます。
- **CML ファイバ**: スクリプトを読んでオブジェクトを動かす「操縦者」。1 オブジェクトは複数ファイバを並行実行できます。

### 3-2. マニュアルの構成

| 節 | 内容 | 主なコマンド・記法 |
|---|---|---|
| [概要](docs/reference/v3/cannonML.md#概要) | 概念と実行モデル | — |
| [CMLスクリプトの構成要素](docs/reference/v3/cannonML.md#cmlスクリプトの構成要素) | コメント、コマンド、数式、シーケンス定義 | `//` `/* */`、`#ラベル{...}` |
| [制御構文](docs/reference/v3/cannonML.md#制御構文) | 繰り返し・条件分岐・並列実行・呼出 | `[...]` `[?...:...]` `{...}` `&ラベル` |
| [待機](docs/reference/v3/cannonML.md#待機) | フレーム待ち | `w` `w?` |
| [オブジェクト制御](docs/reference/v3/cannonML.md#オブジェクト制御) | 遷移時間・方向・位置・速度・加速度・旋回 | `i` `~` `da` `dt` `p` `v` `a` `r` など |
| [オブジェクト生成](docs/reference/v3/cannonML.md#オブジェクト生成) | 原点・弾幕設定・生成 | `o` `ox` `oy` `bm` `bs` `br` `f` `fs` |
| [特殊ファイバ起動](docs/reference/v3/cannonML.md#特殊ファイバ起動) | 排他・ミラー・子オブジェクト・破棄時 | `@x` `@m` `@o` `@ko` |
| [その他](docs/reference/v3/cannonML.md#その他) | 破棄・全ファイバ停止・再呼出・ターゲット | `ko` `kf` `{.}` `td` `tp` `to` |
| [数式](docs/reference/v3/cannonML.md#数式) | 演算子、組み込み変数、代入 | `$x` `$y` `$t` `$l` `$1`〜`$9`、`l$1=` |
| [ユーザー定義コマンド](docs/reference/v3/cannonML.md#ユーザー定義コマンド) | ホスト側で拡張するコマンド・変数 | `registerUserCommand` / `registerUserVariable` |

### 3-3. スクリプトの例

```cml
#shot { p0,0 da0 v3 w10 ko }        // ラベル定義
#main { [20 &shot w5] }             // 5 フレームごとに shot を 20 回呼ぶ
[8 o$l*20-70,-100 da0 f10{ &main }] // 8 方向に main を並列実行
```

コマンドの引数には四則演算・組み込み変数・ユーザー定義変数が使えます。ローカル変数 `$1`〜`$9` はオブジェクトに属し、同じオブジェクトの全ファイバで共有されます。

## 4. 主要 API

### CannonML (`src/CannonML.ts`)

| メソッド | 説明 |
|---|---|
| `new CannonML(vertical = true, callbacks = {})` | インスタンス生成。シングルトンのため 2 回呼ぶと例外。`vertical` はスクロール方向、`callbacks` は `onCreateNewRunner` / `onDestroy` / `onUpdate` |
| `update()` | 全ファイバ・全オブジェクトを 1 フレーム進める。毎フレーム必須 |
| `runner(x = 0, y = 0, z = 0, seq = null, mirror = false)` | `CML.Runner` を生成。`seq` を渡すと同時に実行開始 |
| `sequence(cmlScript, globalFlag = false)` | CML 文字列から `CML.Sequence` を生成 |
| `setDefaultTarget(target)` | 弾の狙撃対象。既定は `CML.Object.root` |
| `setScreenSize(width, height, bias = 0)` | 画面外判定のサイズ。範囲外のランナーは自動破棄（既定 200 x 200） |

### CML.Sequence (`src/CMLSequence.ts`)

パース済みスクリプトの保持・参照単位。`#LABEL{...}` で子シーケンスを定義し、`&LABEL` で参照します。

| メソッド / プロパティ | 説明 |
|---|---|
| `new CML.Sequence(data, globalSequence = false)` | CML 文字列からパースして生成 |
| `findSequence("A.B")` | `.` 区切りで子シーケンスを検索 |
| `getParameter(idx)` | シーケンス引数（`#A{10,20}` の各値）を取得 |
| `parse(data)` / `clear()` | 再パース / チェーンを切断 |
| `root` / `label` / `childLabels` / `isEmpty` | ルート・ラベル・子ラベル一覧・空判定 |

### CML.Runner (`src/CMLRunner.ts`)

`CML.Object` を継承し、シーケンス実行機能（ファイバ）を持つ移動体。敵機・自機・弾の実体です。

| メソッド | 説明 |
|---|---|
| `execute(seq, mirror = false)` | シーケンスを実行し、`CML.Fiber` を返す |
| `halt()` | 自身の全ファイバの実行を停止 |
| `destroy(status)` | オブジェクトを破棄（子ファイバも停止） |
| `setCallbackFunctions({ onCreateNewRunner, onDestroy, onUpdate })` | 描画連携用コールバックを登録 |

`scopeEnabled = false` にすると画面外自動破棄を無効化できます（自機など画面外に出ない前提のオブジェクト用）。

### CML.Fiber (`src/CMLFiber.ts`)

シーケンスを解釈して `CML.Object` のパラメータを書き換える実行単位（マイクロスレッド）。`runner.execute()` の戻り値です。

| メソッド / プロパティ | 説明 |
|---|---|
| `destroy()` | ファイバ（および子ファイバ）を停止 |
| `object` / `target` | 操作対象 / 狙撃対象の `CML.Object` |
| `isActive` / `isExecuting` | 生存 / 実行中か |
| `string` / `sequence` | 直後の文字列コメント / シーケンス参照（実行終了後は `null`） |
| `getVariable(idx)` / `getLoopCounter(nest = 0)` | ローカル変数 `$1`〜`$9` / ループカウンタ |

### CML.Object (`src/core/CMLObject.ts`)

全オブジェクトの基底クラス。位置（`pos`）・速度（`vel`）・加速度（`acc`）・向きなどのベクトルと、`setPosition` / `setVelocity` / `setAccel` / `setRotation` などの補間付きセッターを持ちます。

### ユーザー定義

```js
cml.globalVariables.registerUserCommand(name, func, argc, requireSequence?);
cml.globalVariables.registerUserVariable(name, func);
cml.globalVariables.funcRand = () => 0.5; // $? / $?? の乱数
cml.globalVariables.setRank(value);         // $r の難易度値
```

## 5. demo

`demo/` は Three.js 製の動作確認用シューティングデモ（エディタ付き弾幕ワークベンチ）です。

```sh
npm run build && python3 -m http.server 8000
```

→ ブラウザで `http://localhost:8000/demo/` を開きます。`demo/index.html` は `../dist/` と `three.min.js` / `ptolemy.js` を相対参照するため、リポジトリのトップ階層でサーバを起動し、`file://` ではなく HTTP 経由で開いてください。エディタ（ace）は CDN から読み込むためネットワーク接続が必要です。

| ファイル | 役割 |
|---|---|
| `index.html` | エントリ。`dist/index.js`・Three.js・ace を読み込む |
| `main.js` | ゲームループ・自機操作・スクリプト実行（`Ctrl+Enter`）の配線 |
| `actor.js` | `CML.Runner` と Three.js メッシュを結ぶ `Actor` クラス（コールバック実装の参考例） |
| `ptolemy.js` | Three.js の簡易ラッパー |
| `three.min.js` / `three.module.js` | Three.js（ローカル同梱） |

## 6. 開発

```sh
npm run typecheck   # tsc --noEmit
npm test            # Vitest（test/spec/ はマニュアルの節ごと）
npm run test:watch  # 監視実行。src/ を変えたら再起動が必要
```

- 言語仕様: [`docs/reference/v3/cannonML.md`](docs/reference/v3/cannonML.md)
- 未着手の作業: [`docs/remaining-tasks.md`](docs/remaining-tasks.md)
- `test/` はマニュアルの節番号ごとにファイルを分け、位置・生成数・フレームを実測して検証します。コマンドや仕様を変えたらテストも更新してください。
- `old/` は v1（ActionScript）・v2（JavaScript）の凍結アーカイブです。編集しないでください。

ライセンスは各ソースファイルのヘッダを参照してください（BSD-style）。
