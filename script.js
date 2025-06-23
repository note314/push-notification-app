// グローバル変数
let currentCharacterIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
let db = null;

// キャラクター設定
const characters = [
    {
        id: 'friend',
        name: '親友',
        image: 'character1.png',
        greetings: [
            'よ〜！元気してる？',
            '何か面白いことない？',
            '一緒に頑張ろうぜ！',
            'お疲れ様！'
        ]
    },
    {
        id: 'obachan',
        name: 'おばちゃん',
        image: 'character2.png',
        greetings: [
            'あら〜、お元気？',
            'また会えて嬉しいわ〜',
            '何か用事があるん？',
            'お疲れ様やで〜'
        ]
    },
    {
        id: 'ojisan',
        name: 'おじさん',
        image: 'character3.png',
        greetings: [
            'こんにちは。いかがお過ごしですか？',
            '何かお手伝いできることはありますか？',
            'お疲れ様でした',
            '穏やかな一日ですね'
        ]
    }
];

// DOM要素の取得
const characterSlider = document.getElementById('characterSlider');
const navDots = document.querySelectorAll('.nav-dot');
const speechText = document.getElementById('speechText');
const messageButton = document.getElementById('messageButton');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeButton = document.getElementById('closeButton');

// アプリ初期化（重複削除済み - 下の拡張版を使用）

// アプリ初期化
async function initializeApp() {
    // Service Worker登録（強制更新）
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js', {
                updateViaCache: 'none'
            });
            
            // Service Worker更新チェック
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 新しいバージョンが利用可能
                        showUpdateAvailable();
                    }
                });
            });
            
            console.log('Service Worker registered');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }

    // IndexedDB初期化
    await initDatabase();
    
    // 通知権限リクエスト
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    // PWAインストールプロンプト設定
    setupPWAInstall();
}

// 更新通知表示
function showUpdateAvailable() {
    const updateNotice = document.createElement('div');
    updateNotice.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 10px;
        text-align: center;
        z-index: 2000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    updateNotice.innerHTML = `
        🔄 新しいバージョンが利用可能です
        <button onclick="window.location.reload()" style="
            background: white;
            color: #4CAF50;
            border: none;
            padding: 8px 15px;
            margin-left: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        ">更新</button>
    `;
    document.body.appendChild(updateNotice);
}

// イベントリスナー設定
function setupEventListeners() {
    // キャラクター切り替えナビゲーション
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            switchCharacter(index);
        });
    });

    // タッチスワイプ対応
    characterSlider.addEventListener('touchstart', handleTouchStart, { passive: true });
    characterSlider.addEventListener('touchend', handleTouchEnd, { passive: true });

    // マウスドラッグ対応
    characterSlider.addEventListener('mousedown', handleMouseDown);
    characterSlider.addEventListener('mouseup', handleMouseUp);

    // 伝言ボタン
    messageButton.addEventListener('click', openModal);

    // モーダル制御
    closeButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // キーボード対応
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
        if (e.key === 'ArrowLeft') {
            switchCharacter((currentCharacterIndex - 1 + characters.length) % characters.length);
        }
        if (e.key === 'ArrowRight') {
            switchCharacter((currentCharacterIndex + 1) % characters.length);
        }
    });
}

// キャラクター切り替え
function switchCharacter(index) {
    if (index === currentCharacterIndex) return;

    const prevIndex = currentCharacterIndex;
    currentCharacterIndex = index;

    updateCharacterDisplay();
    updateNavDots();
    updateSpeechBubble();
}

// キャラクター表示更新
function updateCharacterDisplay() {
    const items = document.querySelectorAll('.character-item');
    
    items.forEach((item, index) => {
        item.classList.remove('active', 'prev');
        if (index === currentCharacterIndex) {
            item.classList.add('active');
        } else if (index < currentCharacterIndex) {
            item.classList.add('prev');
        }
    });
}

// ナビゲーションドット更新
function updateNavDots() {
    navDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCharacterIndex);
    });
}

// 吹き出し更新
function updateSpeechBubble() {
    const character = characters[currentCharacterIndex];
    const randomGreeting = character.greetings[Math.floor(Math.random() * character.greetings.length)];
    
    speechText.textContent = randomGreeting;
}

// タッチイベント処理
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
}

// マウスイベント処理
function handleMouseDown(e) {
    touchStartX = e.clientX;
    document.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e) {
    e.preventDefault();
}

function handleMouseUp(e) {
    touchEndX = e.clientX;
    document.removeEventListener('mousemove', handleMouseMove);
    handleSwipe();
}

// スワイプ処理
function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            // 右スワイプ（前のキャラクター）
            switchCharacter((currentCharacterIndex - 1 + characters.length) % characters.length);
        } else {
            // 左スワイプ（次のキャラクター）
            switchCharacter((currentCharacterIndex + 1) % characters.length);
        }
    }
}

// モーダル開閉
function openModal() {
    renderModalContent();
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// モーダル内容レンダリング
async function renderModalContent() {
    modalBody.innerHTML = `
        <div class="modal-tabs">
            <button class="tab-button active" data-tab="create">新規作成</button>
            <button class="tab-button" data-tab="list">通知一覧</button>
        </div>
        <div class="tab-content" id="createTab">
            ${renderCreateNotificationForm()}
        </div>
        <div class="tab-content" id="listTab" style="display: none;">
            ${await renderNotificationList()}
        </div>
    `;

    // タブ切り替え
    const tabButtons = modalBody.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // フォーム処理を設定
    setupFormHandlers();
    
    // スヌーズ・繰り返し設定のイベントリスナー
    setupAdvancedOptions();
}

// タブ切り替え
function switchTab(tabName) {
    const tabButtons = modalBody.querySelectorAll('.tab-button');
    const tabContents = modalBody.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.style.display = 'none');

    modalBody.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    modalBody.querySelector(`#${tabName}Tab`).style.display = 'block';
}

// 通知作成フォーム
// フォーム基本フィールド生成
function renderBasicFields() {
    return `
        <div class="form-group">
            <label for="notificationTitle">通知タイトル</label>
            <input type="text" id="notificationTitle" maxlength="50" required>
        </div>
        
        <div class="form-group">
            <label for="notificationMessage">メッセージ</label>
            <textarea id="notificationMessage" maxlength="200" required></textarea>
        </div>
        
        <div class="form-group">
            <label for="notificationType">通知タイプ</label>
            <select id="notificationType" required>
                <option value="timer">タイマー（○分後）</option>
                <option value="schedule">スケジュール（日時指定）</option>
            </select>
        </div>
    `;
}

// タイマー設定フィールド生成
function renderTimerOptions() {
    return `
        <div class="form-group" id="timerGroup">
            <label for="timerMinutes">何分後？</label>
            <input type="number" id="timerMinutes" min="1" max="1440" value="5">
            <div class="form-group" style="margin-top: 10px;">
                <label>
                    <input type="checkbox" id="snoozeEnabled"> スヌーズ機能を有効にする
                </label>
            </div>
            <div class="form-group" id="snoozeGroup" style="display: none; margin-top: 10px;">
                <label for="snoozeMinutes">スヌーズ間隔（分）</label>
                <input type="number" id="snoozeMinutes" min="1" max="60" value="5">
                <label for="snoozeCount">最大スヌーズ回数</label>
                <input type="number" id="snoozeCount" min="1" max="10" value="3">
            </div>
        </div>
    `;
}

// スケジュール設定フィールド生成
function renderScheduleOptions() {
    return `
        <div class="form-group" id="scheduleGroup" style="display: none;">
            <label for="scheduleDateTime">日時指定</label>
            <input type="datetime-local" id="scheduleDateTime">
            <div class="form-group" style="margin-top: 10px;">
                <label>
                    <input type="checkbox" id="repeatEnabled"> 繰り返し設定
                </label>
            </div>
            <div class="form-group" id="repeatGroup" style="display: none; margin-top: 10px;">
                <label>繰り返し曜日</label>
                ${renderWeekdaySelector()}
            </div>
        </div>
    `;
}

// 曜日選択UI生成
function renderWeekdaySelector() {
    const weekdays = [
        { value: 0, name: '日' },
        { value: 1, name: '月' },
        { value: 2, name: '火' },
        { value: 3, name: '水' },
        { value: 4, name: '木' },
        { value: 5, name: '金' },
        { value: 6, name: '土' }
    ];
    
    return `
        <div class="weekday-selector">
            ${weekdays.map(day => 
                `<label><input type="checkbox" value="${day.value}"> ${day.name}</label>`
            ).join('')}
        </div>
    `;
}

// 通知作成フォーム全体生成
function renderCreateNotificationForm() {
    return `
        <form id="notificationForm" class="notification-form">
            ${renderBasicFields()}
            ${renderTimerOptions()}
            ${renderScheduleOptions()}
            <button type="submit" class="submit-button">通知を作成</button>
        </form>
    `;
}

// 通知一覧
async function renderNotificationList() {
    const notifications = await getNotifications();
    
    if (notifications.length === 0) {
        return `
            <div id="notificationsList" class="notifications-list">
                <p>まだ通知が登録されていません。</p>
            </div>
        `;
    }

    const notificationItems = notifications.map(notification => `
        <div class="notification-item ${notification.active ? 'active' : 'inactive'}" data-id="${notification.id}">
            <div class="notification-header">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-toggle ${notification.active ? 'active' : ''}" onclick="toggleNotification(${notification.id})"></div>
            </div>
            <div class="notification-details">
                ${formatNotificationDetails(notification)}
            </div>
            <div class="notification-actions">
                <button class="action-button edit-button" onclick="editNotification(${notification.id})">編集</button>
                <button class="action-button delete-button" onclick="deleteNotification(${notification.id})">削除</button>
            </div>
        </div>
    `).join('');

    return `
        <div id="notificationsList" class="notifications-list">
            ${notificationItems}
        </div>
    `;
}

// 通知詳細フォーマット
function formatNotificationDetails(notification) {
    let details = '';
    switch (notification.type) {
        case 'timer':
            details = `タイマー: ${notification.timerMinutes}分後`;
            if (notification.snoozeEnabled) {
                details += ` (スヌーズ: ${notification.snoozeMinutes}分×${notification.snoozeCount}回)`;
            }
            return details;
        case 'schedule':
            const date = new Date(notification.scheduleDateTime);
            details = `スケジュール: ${date.toLocaleString('ja-JP')}`;
            if (notification.isRepeating && notification.repeatWeekdays) {
                const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];
                const weekdayStr = notification.repeatWeekdays.map(day => weekdayNames[day]).join('・');
                details += ` (毎週: ${weekdayStr})`;
            }
            return details;
        default:
            return notification.type;
    }
}

// 高度なオプション設定
function setupAdvancedOptions() {
    // スヌーズ有効/無効切り替え
    const snoozeEnabled = document.getElementById('snoozeEnabled');
    const snoozeGroup = document.getElementById('snoozeGroup');
    
    if (snoozeEnabled && snoozeGroup) {
        snoozeEnabled.addEventListener('change', () => {
            snoozeGroup.style.display = snoozeEnabled.checked ? 'block' : 'none';
        });
    }
    
    // 繰り返し有効/無効切り替え
    const repeatEnabled = document.getElementById('repeatEnabled');
    const repeatGroup = document.getElementById('repeatGroup');
    
    if (repeatEnabled && repeatGroup) {
        repeatEnabled.addEventListener('change', () => {
            repeatGroup.style.display = repeatEnabled.checked ? 'block' : 'none';
        });
    }
}

// IndexedDB初期化
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotificationDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // 通知テーブル
            if (!db.objectStoreNames.contains('notifications')) {
                const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('active', 'active', { unique: false });
                store.createIndex('nextTrigger', 'nextTrigger', { unique: false });
            }
            
            // 履歴テーブル  
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                historyStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// フォーム処理設定
function setupFormHandlers() {
    // 通知タイプ選択の処理
    const notificationTypeSelect = document.getElementById('notificationType');
    if (notificationTypeSelect) {
        notificationTypeSelect.addEventListener('change', handleNotificationTypeChange);
        // 初期状態の設定
        handleNotificationTypeChange();
    }

    // フォーム送信の処理
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', handleFormSubmit);
    }
}

// 通知タイプ変更処理
function handleNotificationTypeChange() {
    const notificationType = document.getElementById('notificationType').value;
    const timerGroup = document.getElementById('timerGroup');
    const scheduleGroup = document.getElementById('scheduleGroup');

    // 全て非表示にする
    timerGroup.style.display = 'none';
    scheduleGroup.style.display = 'none';

    // 選択されたタイプのみ表示
    switch (notificationType) {
        case 'timer':
            timerGroup.style.display = 'block';
            break;
        case 'schedule':
            scheduleGroup.style.display = 'block';
            // 最小値を現在時刻に設定
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            document.getElementById('scheduleDateTime').min = now.toISOString().slice(0, 16);
            break;
    }
}

// フォームデータ検証
function validateFormData() {
    const title = document.getElementById('notificationTitle').value;
    const message = document.getElementById('notificationMessage').value;
    const type = document.getElementById('notificationType').value;
    
    if (!title.trim() || !message.trim() || !type) {
        throw new Error('必須項目を入力してください');
    }
    
    if (type === 'schedule') {
        const scheduleDateTime = document.getElementById('scheduleDateTime').value;
        if (!scheduleDateTime) {
            throw new Error('日時を指定してください');
        }
        
        const scheduleTime = new Date(scheduleDateTime);
        if (scheduleTime <= new Date()) {
            throw new Error('未来の日時を指定してください');
        }
    }
    
    return {
        title: title.trim(),
        message: message.trim(),
        type
    };
}

// タイマー通知データ構築
function buildTimerNotification(baseData) {
    const timerMinutes = parseInt(document.getElementById('timerMinutes').value);
    const notificationData = {
        ...baseData,
        timerMinutes,
        nextTrigger: new Date(Date.now() + timerMinutes * 60000).toISOString()
    };
    
    // スヌーズ設定処理
    if (document.getElementById('snoozeEnabled').checked) {
        Object.assign(notificationData, processSnoozeSettings());
    }
    
    return notificationData;
}

// スケジュール通知データ構築
function buildScheduleNotification(baseData) {
    const scheduleDateTime = document.getElementById('scheduleDateTime').value;
    const notificationData = {
        ...baseData,
        scheduleDateTime,
        nextTrigger: new Date(scheduleDateTime).toISOString()
    };
    
    // 繰り返し設定処理
    if (document.getElementById('repeatEnabled').checked) {
        Object.assign(notificationData, processRepeatSettings());
    }
    
    return notificationData;
}

// スヌーズ設定処理
function processSnoozeSettings() {
    return {
        snoozeEnabled: true,
        snoozeMinutes: parseInt(document.getElementById('snoozeMinutes').value),
        snoozeCount: parseInt(document.getElementById('snoozeCount').value),
        snoozeRemaining: parseInt(document.getElementById('snoozeCount').value)
    };
}

// 繰り返し設定処理
function processRepeatSettings() {
    const weekdays = Array.from(document.querySelectorAll('.weekday-selector input[type="checkbox"]:checked'))
        .map(cb => parseInt(cb.value));
    
    if (weekdays.length > 0) {
        return {
            repeatWeekdays: weekdays,
            isRepeating: true
        };
    }
    
    return {};
}

// フォーム送信処理
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        // フォームデータ検証
        const validatedData = validateFormData();
        
        // 基本データ構築
        const baseData = {
            ...validatedData,
            active: true,
            createdAt: new Date().toISOString()
        };
        
        // タイプ別データ構築
        let notificationData;
        switch (baseData.type) {
            case 'timer':
                notificationData = buildTimerNotification(baseData);
                break;
            case 'schedule':
                notificationData = buildScheduleNotification(baseData);
                break;
            default:
                throw new Error('無効な通知タイプです');
        }
        
        // データベースに保存
        const notificationId = await saveNotification(notificationData);
        
        // Service Workerに通知をスケジュール
        await scheduleNotificationWithServiceWorker({
            ...notificationData,
            id: notificationId
        });
        
        // 成功時の処理
        showMessage('通知を作成しました！');
        e.target.reset();
        handleNotificationTypeChange();
        await refreshNotificationList();
        
    } catch (error) {
        console.error('通知の保存に失敗しました:', error);
        showMessage(error.message || '通知の作成に失敗しました。', 'error');
    }
}

// メッセージ表示
function showMessage(text, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff6b6b' : '#4CAF50'};
        color: white;
        padding: 12px 20px;
        border-radius: 15px;
        border: 3px solid #000;
        font-weight: bold;
        z-index: 2000;
        box-shadow: 4px 4px 0px #000;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// 通知一覧更新
async function refreshNotificationList() {
    const listTab = document.getElementById('listTab');
    if (listTab) {
        listTab.innerHTML = await renderNotificationList();
    }
}

// 通知の保存
async function saveNotification(notificationData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        const request = store.add(notificationData);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 通知の取得
async function getNotifications() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notifications'], 'readonly');
        const store = transaction.objectStore('notifications');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 通知のON/OFF切り替え
async function toggleNotification(id) {
    try {
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const notification = getRequest.result;
            notification.active = !notification.active;
            
            const updateRequest = store.put(notification);
            updateRequest.onsuccess = () => {
                refreshNotificationList();
                showMessage(`通知を${notification.active ? '有効' : '無効'}にしました`);
            };
        };
    } catch (error) {
        console.error('通知の更新に失敗しました:', error);
        showMessage('通知の更新に失敗しました', 'error');
    }
}

// 通知の削除
async function deleteNotification(id) {
    if (!confirm('この通知を削除しますか？')) {
        return;
    }
    
    try {
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        
        const request = store.delete(id);
        request.onsuccess = () => {
            refreshNotificationList();
            showMessage('通知を削除しました');
        };
    } catch (error) {
        console.error('通知の削除に失敗しました:', error);
        showMessage('通知の削除に失敗しました', 'error');
    }
}

// 通知の編集（簡易版）
function editNotification(id) {
    showMessage('編集機能は今後実装予定です');
}

// Service Workerに通知をスケジュール
async function scheduleNotificationWithServiceWorker(notification) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            notification: notification
        });
    }
}

// 通知権限のチェックと要求
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showMessage('このブラウザは通知をサポートしていません', 'error');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission === 'denied') {
        showMessage('通知が無効になっています。ブラウザの設定で有効にしてください', 'error');
        return false;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
        showMessage('通知を有効にしました！');
        return true;
    } else {
        showMessage('通知を有効にしてください', 'error');
        return false;
    }
}

// 最新の通知メッセージを表示（初期化時はスキップ）
async function updateLatestMessage() {
    try {
        const history = await getNotificationHistory();
        if (history.length > 0) {
            const latestMessage = history[0];
            // 初期化時以外のみ更新（greetingを保護）
            if (speechText.textContent !== characters[currentCharacterIndex].greetings[0]) {
                speechText.textContent = latestMessage.message;
            }
        }
    } catch (error) {
        console.error('履歴の取得に失敗しました:', error);
    }
}

// 通知履歴の取得
async function getNotificationHistory() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const index = store.index('timestamp');
        const request = index.getAll();
        
        request.onsuccess = () => {
            const history = request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            resolve(history.slice(0, 10)); // 最新10件
        };
        request.onerror = () => reject(request.error);
    });
}

// 通知実行判定
function shouldTriggerNotification(notification, now) {
    return notification.active && new Date(notification.nextTrigger) <= now;
}

// ブラウザ通知表示
function showBrowserNotification(notification) {
    if (Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: characters[currentCharacterIndex].image,
            vibrate: [200, 100, 200]
        });
    }
}

// UI更新（吹き出し）
function updateSpeechBubble(message) {
    speechText.textContent = message;
}

// タイマー通知処理
async function handleTimerNotification(notification) {
    if (notification.snoozeEnabled && notification.snoozeRemaining > 0) {
        // スヌーズ処理
        notification.snoozeRemaining--;
        notification.nextTrigger = new Date(Date.now() + notification.snoozeMinutes * 60000).toISOString();
        await updateNotification(notification);
    } else {
        // スヌーズ終了または無効の場合は停止
        notification.active = false;
        await updateNotification(notification);
    }
}

// スケジュール通知処理
async function handleScheduleNotification(notification) {
    if (notification.isRepeating && notification.repeatWeekdays) {
        // 次の実行曜日を計算
        const nextTrigger = calculateNextWeeklyTrigger(notification);
        if (nextTrigger) {
            notification.nextTrigger = nextTrigger.toISOString();
            await updateNotification(notification);
        } else {
            notification.active = false;
            await updateNotification(notification);
        }
    } else {
        // 一回限りのスケジュール通知は無効化
        notification.active = false;
        await updateNotification(notification);
    }
}

// 通知処理実行
async function processTriggeredNotification(notification) {
    // 通知表示
    showBrowserNotification(notification);
    
    // UI更新
    updateSpeechBubble(notification.message);
    
    // 履歴保存
    await saveToHistory(notification);
    
    // タイプ別処理
    switch (notification.type) {
        case 'timer':
            await handleTimerNotification(notification);
            break;
        case 'schedule':
            await handleScheduleNotification(notification);
            break;
    }
}

// 通知チェック処理
async function checkAndProcessNotifications() {
    try {
        const notifications = await getNotifications();
        const now = new Date();
        
        for (const notification of notifications) {
            if (shouldTriggerNotification(notification, now)) {
                await processTriggeredNotification(notification);
            }
        }
    } catch (error) {
        console.error('通知チェックエラー:', error);
    }
}

// 定期的な通知チェック開始
function startNotificationChecker() {
    setInterval(async () => {
        await checkAndProcessNotifications();
    }, 30000); // 30秒ごとにチェック
}

// 履歴への保存
async function saveToHistory(notification) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        const historyItem = {
            notificationId: notification.id,
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            type: notification.type
        };
        
        const request = store.add(historyItem);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 通知の更新
async function updateNotification(notification) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');
        const request = store.put(notification);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 次回の週間繰り返し実行時刻を計算
function calculateNextWeeklyTrigger(notification) {
    const baseTime = new Date(notification.scheduleDateTime);
    const currentTime = new Date();
    const weekdays = notification.repeatWeekdays;
    
    // 今日から7日間のうち、次に実行すべき曜日を探す
    for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(currentTime.getTime() + i * 24 * 60 * 60 * 1000);
        const checkWeekday = checkDate.getDay();
        
        if (weekdays.includes(checkWeekday)) {
            // 基準時刻と同じ時分秒に設定
            checkDate.setHours(baseTime.getHours());
            checkDate.setMinutes(baseTime.getMinutes());
            checkDate.setSeconds(baseTime.getSeconds());
            checkDate.setMilliseconds(0);
            
            return checkDate;
        }
    }
    
    return null; // 該当する曜日が見つからない場合
}

// アプリ起動時の初期化を拡張
document.addEventListener('DOMContentLoaded', async () => {
    // 初期化処理を順序立てて実行
    await initializeApp();
    
    // UI初期設定
    setupEventListeners();
    updateCharacterDisplay();
    updateNavDots();
    
    // 初期グリーティング表示（キャラクターの挨拶）
    updateSpeechBubble();
    
    // 通知権限を確認・要求
    await requestNotificationPermission();
    
    // 定期的な通知チェックを開始
    startNotificationChecker();
    
    // 画像保護設定
    setupImageProtection();
    
    // 最新メッセージがあれば表示（greetingを上書きしないよう修正済み）
    await updateLatestMessage();
});

// PWAインストール設定
let deferredPrompt;

function setupPWAInstall() {
    // beforeinstallpromptイベントをキャッチ
    window.addEventListener('beforeinstallprompt', (e) => {
        // デフォルトのミニインフォバーを防ぐ
        e.preventDefault();
        // 後で使用するためにイベントを保存
        deferredPrompt = e;
        console.log('PWA install prompt available');
        showInstallButton();
    });

    // アプリがインストールされた後
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        hideInstallButton();
        showMessage('アプリをインストールしました！');
    });
    
    // PWAインストール状態を確認
    checkPWAInstallStatus();
}

// PWAインストール状態確認
function checkPWAInstallStatus() {
    // スタンドアロンモードで実行中かチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA is running in standalone mode');
        document.body.classList.add('pwa-standalone');
    }
    
    // Service Worker準備完了後にインストールボタン表示を検討
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            // インストール可能性をチェック
            setTimeout(() => {
                if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    console.log('PWA install conditions not met yet');
                    showFallbackInstallHint();
                }
            }, 3000);
        });
    }
}

// インストールヒント要素作成
function createInstallHintElement() {
    const hint = document.createElement('div');
    hint.id = 'installHint';
    return hint;
}

// インストールヒントスタイル適用
function applyInstallHintStyles(element) {
    element.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-size: 14px;
            z-index: 1000;
        ">
            📱 ブラウザメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 5px 10px;
                margin-left: 10px;
                border-radius: 5px;
                cursor: pointer;
            ">閉じる</button>
        </div>
    `;
}

// 自動削除タイマー設定
function setupAutoRemoveTimer(element, timeout = 10000) {
    setTimeout(() => {
        if (element.parentElement) {
            element.remove();
        }
    }, timeout);
}

// フォールバック用インストールヒント表示
function showFallbackInstallHint() {
    // 既にインストールボタンがある場合は何もしない
    if (document.getElementById('installButton') || document.getElementById('installHint')) {
        return;
    }
    
    const hint = createInstallHintElement();
    applyInstallHintStyles(hint);
    
    document.body.appendChild(hint);
    setupAutoRemoveTimer(hint);
}

// インストールボタンを表示
function showInstallButton() {
    const installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.textContent = 'アプリをインストール';
    installButton.className = 'install-button';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        border: 3px solid #000;
        border-radius: 15px;
        padding: 12px 20px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 4px 4px 0px #000;
        z-index: 1000;
    `;
    
    installButton.addEventListener('click', installPWA);
    document.body.appendChild(installButton);
}

// インストールボタンを非表示
function hideInstallButton() {
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.remove();
    }
}

// PWAインストール実行
async function installPWA() {
    if (!deferredPrompt) {
        return;
    }
    
    // インストールプロンプトを表示
    deferredPrompt.prompt();
    
    // ユーザーの選択結果を待つ
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // プロンプトを使用済みにする
    deferredPrompt = null;
    hideInstallButton();
}

// Phase1修正: 画像保護設定（非侵襲的）
function setupImageProtection() {
    const characterImages = document.querySelectorAll('.character-img');
    
    characterImages.forEach(img => {
        // 右クリック禁止（バブリング阻害せず）
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // e.stopPropagation() は使用しない - スワイプ機能を保護
        }, { passive: false });
        
        // ドラッグ禁止（バブリング阻害せず）
        img.addEventListener('dragstart', (e) => {
            e.preventDefault();
            // e.stopPropagation() は使用しない
        }, { passive: false });
        
        // 画像選択禁止（バブリング阻害せず）
        img.addEventListener('selectstart', (e) => {
            e.preventDefault();
            // e.stopPropagation() は使用しない
        }, { passive: false });
    });
    
    // キーボードショートカット無効化（軽量版）
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 's' || e.key === 'a')) {
            e.preventDefault();
        }
    });
    
    console.log('Phase1: 非侵襲的画像保護が適用されました');
}

console.log('何でもプッシュ通知アプリが読み込まれました');