let scenarios = {};
let currentId = "SCENE_START";

// ゲームの状態（持ち物やフラグを管理）
const gameState = {
    inventory: []
};

const gameContainer = document.getElementById('game-container');
const uiLayer = document.getElementById('ui-layer');
const startButton = document.getElementById('start-button');
const charName = document.getElementById('character-name');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');
const nextButton = document.getElementById('next-button');
const endButton = document.getElementById('end-button');

// 1. JSONの読み込み
async function loadGame() {
    try {
        const response = await fetch('scenario.json');
        scenarios = await response.json();
    } catch (error) {
        console.error("シナリオの読み込みに失敗しました:", error);
        alert("JSONファイルの読み込みエラーです。ローカルサーバーで起動しているか確認してください。");
    }
}

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
        gameContainer.style.backgroundImage = `url('${data.bg}')`;
    }

    // テキストの更新
    charName.textContent = data.name || "";
    dialogueText.textContent = data.text || "";

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
