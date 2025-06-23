# JavaScript モジュール構成

## Phase2リファクタリング計画

### 現在の状況
- `script.js`: 1099行の巨大ファイル（Phase1で緊急修正済み）

### Phase2実装予定
```
js/
├── app.js           # メイン制御・初期化
├── character.js     # キャラクター切り替え機能
├── notification.js  # 通知管理システム
├── database.js      # IndexedDB操作
├── pwa.js          # PWA機能（インストール等）
└── ui.js           # UI制御（モーダル、フォーム等）
```

### Phase3実装予定
- TypeScript移行
- ES6モジュール化
- 設定ファイル外部化

### 実装ステータス
- [x] Phase1: 画像非表示問題修正（非侵襲的画像保護）
- [x] Phase2: 大きな関数の分割（62行→小関数群に分割完了）
- [ ] Phase3: ファイル分割とモジュール化

### Phase2完了詳細
- `renderCreateNotificationForm` (62行) → `renderBasicFields` + `renderTimerOptions` + `renderScheduleOptions` + `renderWeekdaySelector`
- `handleFormSubmit` (66行) → `validateFormData` + `buildTimerNotification` + `buildScheduleNotification` + `processSnoozeSettings` + `processRepeatSettings`
- `startNotificationChecker` (62行) → `shouldTriggerNotification` + `showBrowserNotification` + `updateSpeechBubble` + `handleTimerNotification` + `handleScheduleNotification` + `processTriggeredNotification` + `checkAndProcessNotifications`
- `showFallbackInstallHint` (44行) → `createInstallHintElement` + `applyInstallHintStyles` + `setupAutoRemoveTimer`