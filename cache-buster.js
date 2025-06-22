// キャッシュバスター - 強制更新用
const VERSION = Date.now();
console.log('Cache buster version:', VERSION);

// ページ読み込み時に強制更新チェック
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        // 手動で更新チェック
        registration.update();
    });
}

// 開発者向け: 強制リロード関数
window.forceReload = function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
            window.location.reload(true);
        });
    }
};

console.log('キャッシュを強制クリアするには forceReload() を実行してください');