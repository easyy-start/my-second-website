let scenarios = {};
let currentId = "SCENE_START";

// ゲームの状態（持ち物やフラグを管理）
const gameState = {
    inventory: []
};

// htmlとjs間の対応
const gameContainer = document.getElementById('game-container');
const uiLayer = document.getElementById('ui-layer');
const startButton = document.getElementById('start-button');
const charName = document.getElementById('character-name');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');
const nextButton = document.getElementById('next-button');
const endButton = document.getElementById('end-button');
const screenArea = document.getElementById('screen-area'); // ★これを追加！
const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');

// 0. JSONの読み込み
async function loadGame() {
    try {
        const response = await fetch('scenario.json');
        scenarios = await response.json();
        // ↓すべての背景画像の読み込み
        preloadImages(scenarios);
    } catch (error) {
        console.error("シナリオの読み込みに失敗しました:", error);
        alert("JSONファイルの読み込みエラーです。ローカルサーバーで起動しているか確認してください。");
    }
}

// 1. JSONの背景画像をすべて抽出してロードする
function preloadImages(data) {
    // JSONの中から "bg" に指定されている画像パスをすべて抽出（重複はカット）
    const bgList = [...new Set(Object.values(data).map(scene => scene.bg).filter(Boolean))];

    bgList.forEach(src => {
        const img = new Image();
        img.src = src; // ブラウザのキャッシュに保存される
    });
}

// レイヤー取得（当たり判定）
const hotspotsLayer = document.getElementById('hotspots-layer');

// 2. シーンの描画
function renderScene(id) {
    const data = scenarios[id];
    if (!data) return;

    // --- ロジック処理 ---
    // 条件分岐ノード（Textを持たない判定専用ノード）
    if (data.condition) {
        const hasItem = gameState.inventory.includes(data.condition.item);
        const nextNodeId = hasItem ? data.condition.ifTrue : data.condition.ifFalse;
        renderScene(nextNodeId);
        return;
    }

    // アイテム入手処理
    if (data.getItem && !gameState.inventory.includes(data.getItem)) {
        gameState.inventory.push(data.getItem);
        console.log("持ち物:", gameState.inventory);
    }

    // --- 描画処理 ---
    // 背景画像の変更（指定があれば）
    if (data.bg) {
        gameContainer.style.backgroundImage = `url('images/${data.bg}')`;
        screenArea.style.backgroundImage = `url('images/${data.bg}')`;
    }

    // テキストの更新
    charName.textContent = data.name || "";
    dialogueText.textContent = data.text || "";

    //次へボタンの更新
    nextButton.textContent = "▼"; 

    // 選択肢のクリア
    choicesContainer.innerHTML = "";

    // 選択肢の表示 または 「次へ」ボタンの表示
    if (data.choices && data.choices.length > 0) {
        nextButton.style.display = "none";
        data.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.onclick = () => renderScene(choice.nextId);
            choicesContainer.appendChild(btn);
        });
    } else {
        // 次のシーンがある場合のみボタンを表示
        if (data.nextId) {
            nextButton.style.display = "block";
            nextButton.onclick = () => renderScene(data.nextId);
        } else {
            // 行き止まり・終了時の処理
            nextButton.style.display = "block"; // 1. ボタンを画面に出す
            nextButton.textContent = "最初にもどる"; // 2. ボタンの文字を書き換える
            nextButton.onclick = () => renderScene("SCENE_START"); // 3. 最初のシーン名を渡す
        }
    };

    // 場面切り替え時の、当たり判定の消去・生成
    if (data.hotspots) {
        data.hotspots.forEach(spot => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.left = spot.x + 'px';
            div.style.top = spot.y + 'px';
            div.style.width = spot.width + 'px';
            div.style.height = spot.height + 'px';
            div.style.cursor = 'pointer';

            // ★開発中は以下の行を生かして赤枠を表示。本番では削除（またはコメントアウト）して透明にする！
            div.style.border = '2px solid red'; 

            // クリックされたら指定されたIDのシーンへ飛ぶ
            div.onclick = () => renderScene(spot.actionId);

            hotspotsLayer.appendChild(div);
        });
    };
    // ▼パスワード機能▼
    // 場面切り替え時にリセット
    passwordContainer.style.display = "none";
    passwordInput.value = "";
    choicesContainer.innerHTML = "";
    nextButton.style.display = "none";

    // ▼新機能：パスワード判定システム▼
    if (data.passwordCheck) {
        // パスワード機能が設定されているシーンなら、入力欄を表示
        passwordContainer.style.display = "block";
        
        // 「解除」ボタンが押されたときの処理
        passwordSubmit.onclick = () => {
            const userInput = passwordInput.value; // 入力された文字を取得
            
            // 正解かどうか判定して、指定のシーンへ飛ばす
            if (userInput === data.passwordCheck.correctAnswer) {
                renderScene(data.passwordCheck.ifTrue); // 正解のシーンへ
            } else {
                renderScene(data.passwordCheck.ifFalse); // 不正解のシーンへ
            }
        };
    } 
    // パスワード入力が無い場合は、通常の選択肢か「次へ」ボタンを表示
    else if (data.choices && data.choices.length > 0) {
        // (既存の choices の処理)
    } else if (data.nextId) {
        // (既存の nextId の処理)
    } else {
        // (既存の 最初に戻る処理)
    }
}

// スタートボタンのイベント
// BGM用の変数を作っておく（ファイル名は用意したものに変えてください）
const bgm = new Audio("audio/suitekinoodori.mp3");
bgm.loop = true; // ループ再生をオンにする

startButton.addEventListener('click', async () => {
    startButton.style.display = 'none';
    uiLayer.style.display = 'block';

    // ここでBGMを再生！クリックした後なので確実に鳴ります
    bgm.play();

    await loadGame();
    renderScene(currentId);
});
