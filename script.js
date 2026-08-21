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
        // 次のシーンがない場合（終了時）
        // 「最初に戻る」ボタンとして利用する
        nextButton.style.display = "block";
        nextButton.textContent = "最初に戻る"; // ボタンの文字を一時的に変更
        nextButton.onclick = () => {
            gameState.inventory = []; // 持ち物をリセットする場合
            renderScene("SCENE_START"); // 最初のシーンIDに戻す
        };
    }
}

// スタートボタンのイベント
startButton.addEventListener('click', async () => {
    startButton.style.display = 'none';
    uiLayer.style.display = 'block';
    await loadGame();
    renderScene(currentId);
});
