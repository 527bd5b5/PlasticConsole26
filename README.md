# PC-26: Plastic Console 26

![サムネイル](./thumbnail.jpg)

## 概要

「PC-26: Plastic Console 26」は純粋なHTML（HyperText Markup Language）、CSS（Cascading Style Sheets）、JavaScriptでレトロ風のゲームを簡単に制作・実行するためのテンプレート、フレームワーク、ゲームエンジンの一種です。多くのプラットフォームに対応した標準的かつ最小限の入力機能と出力機能が用意されているため、開発者はゲームの開発に集中することができます。

## 仕様

デフォルトの仕様は以下の通りです。

- 入力
    - 2個のスライダー (音量調整用)
    - 4個のボタン
    - 1個の十字キー
- 出力
    - ゲーム画面
        - 横解像度: 512 px (32タイル)
        - 縦解像度: 384 px (24タイル)
        - リフレッシュレート: 30 Hz
    - ゲーム音源
        - 効果音: 4トラック
        - 背景音: 2トラック
- 推奨環境
    - レンダリングエンジン:
        - Gecko (Firefox等)
        - WebKit (Safari等)
        - Blink (Google Chrome等)
    - ディスプレイ
        - 横解像度: 960 px以上
        - 縦解像度: 960 px以上
- 利用API:
    - Canvas API
    - Web Audio API

## 操作方法

キーボード操作（PC想定）とマルチタッチ操作（モバイル想定）に対応しています。マルチタッチ操作の場合、十字キーの斜め入力やAボタンとBボタンの同時押しが可能です。キーとコマンドの対応については以下の通りです。

| キー | コマンド | キー | コマンド |
| --- | --- | --- | --- |
| `W`, `↑` | 上 | `L`, `X` | Aボタン |
| `A`, `←` | 左 | `K`, `Z` | Bボタン |
| `S`, `↓` | 下 | `P` | STARTボタン |
| `D`, `→` | 右 | `O` | SELECTボタン |

## 使用物

- ソフトウェア
    - [FontForge](https://fontforge.org/en-US/)
    - [Bits'N'Picas](https://github.com/kreativekorp/bitsnpicas)
- フォント
    - [UFO: Unicode Font, Organized](https://akahuku.github.io/ufo/)
- 音源
    - [PeriTune](https://peritune.com/)
    - [効果音ラボ](https://soundeffect-lab.info/)

## ライセンス

全てのコード、及び私が作成した画像は[WTFPL](https://ja.wikipedia.org/wiki/WTFPL)に基いて利用、複製、頒布が可能です（つまり、自由です）。その他のメディアについては配布元のライセンスを遵守してください。

## ローカル環境での実行について

本ウェブサイトをローカル環境で実行した（ファイルとして開いた）場合、ブラウザーのセキュリティー機能によりエラーが発生する可能性があります。この問題は以下の手順で解決できます。

参考: https://yujisoftware.hatenablog.com/entry/20100815/1281885412

### Firefoxの場合

アドレスバーに「[about:config](about:config)」と入力し、`security.fileuri.strict_origin_policy`を`false`に設定します。

### Google Chromeの場合

実行引数に`--allow-file-access-from-files`を追加します。

## 構成

### generate-subset-list-for-font-forge.html

[FontForge](https://fontforge.org/en-US/)でサブセットに含まれないシンボルを（削除するために）一括選択するFontForgeスクリプトを作成する簡易的なユーティリティーです。他のフォントや言語をサブセットする場合に便利です。

### index.html

PC-26を実行するためのHTMLファイルです。開発者は後半に記述された説明書を編集する必要があります。デザインやシステムを正しく改造する場合はCSSやJavaScriptに関する中級程度の知識とソースコードの理解が要求されます。

### index-init.html

[index.html](./index.html)の初期状態が記述されています。

### README.md

本プロジェクトの説明をMarkdown形式で纏めたファイル（これ）です。

### thumbnail.jpg

ゲームのパッケージ画像です。横1920 px、縦640 px、縦横比3対1の画像が推奨されます。

### fonts/

ゲーム画面（キャンバス）で使用するフォントを格納する場所です。デフォルトでは全角・半角のラテン文字（ラテン1補助等を含む）、キリル文字（拡張を含まない）、ひらがな、カタカナ、漢字（JIS第2水準まで）、数字、記号をサブセットしたTTF（TrueType Font）形式のコンソール向けビットマップフォント「[UFO: Unicode Font, Organized](https://akahuku.github.io/ufo/)」が含まれています。他のフォントを使用する場合は[system.js](./scripts/system.js)に設定を追加する必要があります。

### images/

ゲーム画面に描画するキャクターや背景のグラフィックを格納する場所です。JavaScriptで画像を拡縮する場合、デフォルトではピクセルアートの表現を優先して画像が平滑化（スムージング）されないことに注意してください。サンプルとしてキャラクターのスプライト画像が含まれています。

### scripts/

PC-26に必要なJavaScriptファイルを格納する場所です。一部のファイルについては、不用意に改変するとシステムが正常に動作しなくなる場合があります。

- 座標や寸法の単位はピクセルです。
- 座標は左上が基準（X: 0, Y: 0）です。
- 色はキーワード（例: `white`）、16進数カラーコード（例: `#fff`）、RGB（例: `rgb(255, 255, 255)`）、HSL（例: `hsl(0, 0%, 100%)`）等の形式に対応しています。

### scripts/audio.js

ゲーム音源に関する汎用的なクラスや関数が記述されています。

### scripts/canvas.js

ゲーム画面に関する汎用的なクラスや関数が記述されています。

### scripts/control.js

キーボード操作やマルチタッチ操作を処理・管理します。

### scripts/document.js

ドキュメントの表示・非表示を切り替えます。

### scripts/game.js

開発者がゲームに関するロジックを記述するためのファイルです。サンプルとしてPC-26の機能を紹介する簡易的なスクリプトが記述されています。

### scripts/game-init.js

[game.js](./scripts/game.js)の初期状態が記述されています。

### scripts/system.js

ゲームを実行します。

### scripts/util.js

開発者がゲームに関するユーティリティーを記述するためのファイルです。サンプルとしてプレイヤーを描画・管理するクラス等が記述されています。

### sounds/

ゲームに必要な音源ファイルを格納する場所です。

### styles/

PC-26に必要なCSSファイルを格納する場所です。

### styles/control.css

コントローラー（ページ下部）に関するスタイルを定義します。

### styles/display.css

ディスプレイ（ページ上部）に関するスタイルを定義します。

### styles/document.css

説明書に関するスタイルを定義します。

### styles/root.css

全体の色やサイズを定義します。
