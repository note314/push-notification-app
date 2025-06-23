// Service Worker - 何でもプッシュ通知
const CACHE_NAME = 'push-notification-app-v6-pc-fix';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './character1.png',
    './character2.png',
    './character3.png',
    './icon-192.png',
    './icon-512.png'
];

// インストール時のキャッシュ設定
self.addEventListener('install', (event) => {
    // 即座に新しいService Workerをアクティブにする
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 新しいService Workerをすべてのタブで制御開始
            return self.clients.claim();
        })
    );
});

// リクエストの処理（オフライン対応）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュがあれば返す、なければネットワークから取得
                return response || fetch(event.request);
            })
    );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 通知のクリック処理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // アプリを開く
    event.waitUntil(
        clients.matchAll().then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('push-notification-app') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

// メッセージ受信処理
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        scheduleNotification(event.data.notification);
    }
});

// 通知のスケジューリング
async function scheduleNotification(notification) {
    const now = new Date().getTime();
    const triggerTime = new Date(notification.nextTrigger).getTime();
    const delay = triggerTime - now;
    
    if (delay > 0) {
        setTimeout(() => {
            showNotification(notification);
        }, delay);
    }
}

// 通知の表示
async function showNotification(notification) {
    const options = {
        body: notification.message,
        icon: './character1.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            id: notification.id,
            type: notification.type
        },
        actions: [
            {
                action: 'view',
                title: '確認'
            },
            {
                action: 'dismiss',
                title: '閉じる'
            }
        ]
    };
    
    await self.registration.showNotification(notification.title, options);
    
    // ループ通知の場合は次の通知をスケジュール
    if (notification.type === 'loop') {
        const nextTime = new Date(Date.now() + notification.loopHours * 3600000);
        const nextNotification = {
            ...notification,
            nextTrigger: nextTime.toISOString()
        };
        scheduleNotification(nextNotification);
    }
}

// バックグラウンド同期処理
async function doBackgroundSync() {
    try {
        // IndexedDBから通知を取得
        const notifications = await getNotificationsFromDB();
        const now = new Date();
        
        for (const notification of notifications) {
            if (notification.active && new Date(notification.nextTrigger) <= now) {
                await showNotification(notification);
                
                // 履歴に保存
                await saveNotificationHistory(notification);
                
                // 一回限りの通知（タイマー、スケジュール）は無効化
                if (notification.type === 'timer' || notification.type === 'schedule') {
                    notification.active = false;
                    await updateNotificationInDB(notification);
                }
            }
        }
    } catch (error) {
        console.error('バックグラウンド同期エラー:', error);
    }
}

// IndexedDBからの通知取得（Service Worker用）
function getNotificationsFromDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['notifications'], 'readonly');
            const store = transaction.objectStore('notifications');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result);
            };
            
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// 通知履歴の保存
function saveNotificationHistory(notification) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['history'], 'readwrite');
            const store = transaction.objectStore('history');
            
            const historyItem = {
                notificationId: notification.id,
                title: notification.title,
                message: notification.message,
                timestamp: new Date().toISOString(),
                type: notification.type
            };
            
            const addRequest = store.add(historyItem);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// 通知の更新
function updateNotificationInDB(notification) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            
            const updateRequest = store.put(notification);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// 定期的な通知チェック（1分ごと）
setInterval(() => {
    doBackgroundSync();
}, 60000);

console.log('Service Worker が読み込まれました');