# Description

Markdown, CSV, SVGから成るプリミティブな軽量ドキュメントを
WEB上で参照可能なhtmlページに変換する

# Requirement

- Node 18.16

# Installation

```
npm install
```

# Configuration

### app.json

```
{
  "srcDir" : "./docs",
  "distDir" : "./docs_html",
  "server" : {
    "host" : "<host>",
    "port" : 22,
    "username" : "<username>",
    "deployTo": "<remote derectory path>"
  }
}
```

### AppConfig

|key|type|value|
|:--:|:--:|:--|
|srcDir|string|ドキュメントのソースディレクトリ|
|distDir|string|ビルド先のディレクトリ|
|server|ServerConfig|デプロイサーバーの設定|

### ServerConfig

|key|type|value|
|:--:|:--:|:--|
|host|string|ホスト名|
|port|number|SSHポート|
|username|string|SSHユーザ名|
|deployTo|string|デプロイ先のリモートディレクトリ|


# Usage

### ビルド

AppConfig.srcDirで指定されたディレクトリ内のドキュメントファイルをhtmlに変換し
AppConfig.distDirで指定されたディレクトリに出力する

```
npm run build
```

### デプロイ

AppConfig.distDirで指定されたディレクトリ（ビルドされたhtml）を
ServerConfig.deployToで指定されたリモートサーバのディレクトリにデプロイする

```
npm run deploy
```

### パブリッシュ

ビルドとデプロイを両方実行するショートハンド

```
npm run publish
```