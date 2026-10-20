# CannonML

## 1. 概要

CannonML (Cannon Macro Language) は、シューティングゲームの弾幕パターンを極めて短いテキストで記述・実行するためのブラウザ用 JavaScript ライブラリです。

```cml
bs,4,,10bm5,360f10{i30vw90br5,360,2,2f4{i30v~ko}w10ay0.05}
```

上記のような短いスクリプト1行で、複雑な弾幕パターンを生成できます。元は Flash (ActionScript) 用に開発され、現行版 (v0.5.0) は依存ライブラリなしのプレーンな JavaScript に移植されています。

言語仕様の詳細は [言語リファレンス(英語)](docs/reference/v2/cannonML_e.html) / [言語リファレンス(日本語)](docs/reference/v2/cannonML.html) を参照してください。

## 2. インストール

npm パッケージやビルド手順はありません。リポジトリを取得し、`src/` 以下のスクリプトを HTML に読み込むだけです。

```html
<script src="src/core/namespace.js"></script>
<script src="src/core/interpolation.js"></script>
<script src="src/core/RangeLimitNumber.js"></script>
<script src="src/core/CMLVector.js"></script>
<script src="src/core/CMLListElem.js"></script>
<script src="src/core/CMLList.js"></script>
<script src="src/core/CMLSinTable.js"></script>
<script src="src/core/CMLGlobal.js"></script>
<script src="src/core/CMLState.js"></script>
<script src="src/core/CMLAssign.js"></script>
<script src="src/core/CMLBarrageElem.js"></script>
<script src="src/core/CMLBarrage.js"></script>
<script src="src/core/CMLFormulaLiteral.js"></script>
<script src="src/core/CMLFormulaOperator.js"></script>
<script src="src/core/CMLFormula.js"></script>
<script src="src/core/CMLObject.js"></script>
<script src="src/core/CMLRefer.js"></script>
<script src="src/core/CMLString.js"></script>
<script src="src/core/CMLUserDefine.js"></script>
<script src="src/core/CMLParser.js"></script>
<script src="src/CMLSequence.js"></script>
<script src="src/CMLFiber.js"></script>
<script src="src/CMLRunner.js"></script>
<script src="src/CannonML.js"></script>
```

注意点:

- モジュールシステム(ESM/CommonJS)には対応していません。各ファイルは `namespace.js` が作るグローバル `CML` オブジェクトにクラスを追加する形式です。ソース内の `//import` 行は無効なコメントなので、ESM 化しないでください。
- 読み込み順序は厳密です。`namespace.js` が最初、`CannonML.js` が最後になるよう、上記の順序を維持してください。

## 3. 使い方

最小構成の実行フローは「インスタンス生成 → シーケンス作成 → ランナー生成・実行 → 毎フレーム更新」です。

```js
// 1. インスタンス生成(シングルトン。2回目の new は例外になります)
const cml = new CannonML();

// 画面サイズ(ランナーが画面外に出たら自動破棄される範囲)を設定
cml.setScreenSize(400, 400, 0);

// 2. CML スクリプトからシーケンスを作成
const seq = cml.sequence("bs,4,,10bm5,360f10{i30vw90}");

// 3. ランナーを生成し、シーケンスを実行
const runner = cml.runner(0, 0, 0, seq);

// 4. 毎フレーム呼び出す(これを呼ばないと何も動きません)
function loop() {
  cml.update();
  requestAnimationFrame(loop);
}
loop();
```

自機や敵機と連動させる場合は、`onCreateNewRunner` / `onDestroy` / `onUpdate` のコールバックを登録します。新規に発射された弾の `CML.Runner` が `onCreateNewRunner` に渡されるので、そこで描画オブジェクトを紐付けます。

```js
cml.setDefaultTarget(playerRunner); // 弾の狙撃対象(デフォルトのターゲット)

const enemy = cml.runner(0, 160, 0);
enemy.setCallbackFunctions({
  onCreateNewRunner(runner) { /* 弾スプライト生成・runner と紐付け */ },
  onDestroy(runner)         { /* スプライト破棄 */ },
  onUpdate(runner)          { /* runner.pos をスプライト位置に反映 */ },
});
enemy.execute(cml.sequence("[w30[$x>0?bm1,1f10:bm7,120f5]]"));
```

完全な実装例は `demo/actor.js` / `demo/main.js` を参照してください。

## 4. 主要 API リファレンス

### CannonML (`src/CannonML.js`)

| メソッド | 説明 |
|---|---|
| `new CannonML(vertical = true, callbacks = {})` | インスタンス生成。シングルトンのため2回呼ぶと例外。`vertical` はスクロール方向、`callbacks` は `onCreateNewRunner` / `onDestroy` / `onUpdate` |
| `update()` | 全ファイバー・全オブジェクトを1フレーム進める。毎フレーム必須 |
| `runner(x, y, z, seq, args, invFlag)` | `CML.Runner` を生成。`seq` を渡すと同時に実行開始 |
| `sequence(cmlScript, globalFlag = false)` | CML 文字列から `CML.Sequence` を生成 |
| `setDefaultTarget(target)` | 弾の狙撃対象のデフォルト(初期値は `CML.Object.root`) |
| `setScreenSize(width, height, bias = 0)` | 画面外判定サイズ。範囲外のランナーは自動破棄される |

### CML.Sequence (`src/CMLSequence.js`)

パース済みスクリプトの保持・参照単位。`#LABEL{...}` で子シーケンスを定義し、`&LABEL` で参照できる。

| メソッド | 説明 |
|---|---|
| `new CML.Sequence(data, globalSequence = false)` | CML 文字列からパースして生成 |
| `findSequence("A.B")` | `.` 区切りで子シーケンスを検索 |
| `getParameter(idx)` | シーケンス引数(`#A{10,20}` の各値)を取得 |
| `parse(data)` | 既存シーケンスをクリアして再パース |
| `clear()` | チェーンを切断して GC 可能にする |
| `cml.globalVariables.registerUserCommand(name, func, argc, requireSequence)` | CML 内から呼べる独自コマンドを登録 |
| `cml.globalVariables.registerUserVariable(name, func)` | CML 内から参照できる独自変数を登録 |

### CML.Runner (`src/CMLRunner.js`)

`CML.Object` を継承し、シーケンス実行機能(ファイバー)を持つ移動体。敵機・自機・弾の実体。

| メソッド | 説明 |
|---|---|
| `execute(seq, args = null, invertFlag = 0)` | シーケンスを実行し、`CML.Fiber` を返す |
| `halt()` | 自身の全ファイバーの実行を停止 |
| `destroy(status)` | オブジェクトを破棄(子ファイバーも停止) |
| `setCallbackFunctions({onCreateNewRunner, onDestroy, onUpdate})` | 描画連携用コールバックを登録 |
| `setPosition / setVelocity(x, y, z, frames)` | 位置・速度を設定(`frames` で補間可能) |
| `setAccel(x, y, z, frames)` | 加速度を設定(`frames` は加速終了までのフレーム数) |

`scopeEnabled = false` にすると画面外自動破棄を無効化できます(自機など画面外に出ない前提のオブジェクト用)。

### CML.Fiber (`src/CMLFiber.js`)

シーケンスを解釈して `CML.Object` のパラメータを書き換える実行単位(マイクロスレッド)。`runner.execute()` の戻り値として取得します。

| メソッド / プロパティ | 説明 |
|---|---|
| `destroy()` | ファイバー(および子ファイバー)を停止 |
| `object` / `target` | 操作対象 / 狙撃対象の `CML.Object` |
| `getVariable(idx)` | シーケンス変数 `$1`〜`$9` を取得 |
| `getLoopCounter(nest = 0)` | ループカウンタを取得 |

### CML.Object (`src/core/CMLObject.js`)

全オブジェクトの基底クラス。位置(`pos`)・速度(`vel`)・加速度(`acc`)・向き(`euler`)などのベクトルを持ちます。

## 5. demo について

`demo/` は Three.js 製の動作確認用シューティングデモ(エディタ付き弾幕ワークベンチ)です。

実行方法:

```sh
python3 -m http.server 8000
```

→ ブラウザで `http://localhost:8000/demo/` を開きます。`demo/index.html` は `../src/` を相対参照しているため、リポジトリのトップ階層でサーバを起動してください(`demo/` ディレクトリ内では `src/` が解決できません)。`file://` 直開きではなく HTTP 経由で開いてください。エディタ部分(ace)は CDN から読み込むため、ネットワーク接続が必要です。

| ファイル | 役割 |
|---|---|
| `index.html` | エントリ。`src/` 全スクリプトと Three.js・ace を読み込む |
| `main.js` | ゲームループ・自機操作・スクリプト実行ボタン(`Ctrl+Enter`)の配線 |
| `actor.js` | `CML.Runner` と Three.js メッシュを結ぶ `Actor` クラス(コールバック実装の参考例) |
| `ptolemy.js` | Three.js の簡易ラッパー |
| `three.min.js` / `three.module.js` | Three.js(ローカル同梱) |

操作: エディタに CML スクリプトを記述し、`Run` ボタンまたは `Ctrl+Enter` で敵弾パターンを実行します。方向キーで自機を移動できます。
