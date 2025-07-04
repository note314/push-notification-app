# 何でもプッシュ通知 PWA

PWA（Progressive Web App）プッシュ通知アプリです。

## 特徴

- 🎯 **3種類のキャラクター** - 左右スワイプで切り替え
- ⏰ **タイマー通知** - スヌーズ機能付き
- 📅 **スケジュール通知** - 曜日指定繰り返し機能付き
- 📱 **PWA対応** - オフライン動作・インストール可能
- 🗄️ **IndexedDB** - データ永続化

## デモ

[GitHub Pages でデモを確認](https://あなたのユーザー名.github.io/リポジトリ名/)

## 使い方

1. 「伝言する」ボタンをタップ
2. 通知タイプを選択（タイマー/スケジュール）
3. メッセージと時間を設定
4. 通知権限を許可
5. 設定時刻に通知が表示

## 機能詳細

### タイマー通知
- 1分〜24時間後の通知設定
- スヌーズ機能（1-60分間隔、最大10回）

### スケジュール通知
- 日時指定での通知
- 曜日指定での繰り返し通知

### キャラクター
- 親友（熱血男子高校生）
- おばちゃん（大阪のおばちゃん）
- おじさん（物腰穏やかなおじさん）

## 技術仕様

- **フロントエンド**: Vanilla JavaScript, CSS3, HTML5
- **データベース**: IndexedDB
- **通知**: Web Notification API
- **オフライン**: Service Worker
- **PWA**: Web App Manifest

## ローカル実行

```bash
python3 -m http.server 8000
```

http://localhost:8000 でアクセス

## ブラウザサポート

- Chrome/Edge 50+
- Firefox 44+
- Safari 11+（通知機能は制限あり）