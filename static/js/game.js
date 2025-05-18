// ゲーム状態の管理
const gameState = {
    level: gameLevel,
    lives: 3,
    currentProblem: null,
    problemIndex: 0,
    attempts: 0,  // 試行回数を追加
    lastExpectedPattern: null,  // 最後の正解パターンを保存
    correctAnswers: 0,  // 正解数
    totalAttempts: 0,   // 総試行回数
    startTime: null,    // ゲーム開始時間
    endTime: null       // ゲーム終了時間
};

// DOM要素
const elements = {
    levelDisplay: document.getElementById('level-display'),
    livesDisplay: document.getElementById('lives'),
    problemDescription: document.getElementById('problem-description'),
    matchExamples: document.getElementById('match-examples'),
    nonMatchExamples: document.getElementById('non-match-examples'),
    regexPattern: document.getElementById('regex-pattern'),
    submitBtn: document.getElementById('submit-btn'),
    feedback: document.getElementById('feedback'),
    nextBtn: document.getElementById('next-btn'),
    gameOver: document.getElementById('game-over'),
    finalAnswer: document.getElementById('final-answer'),  // ゲームオーバー時の正解表示
    resultStats: document.getElementById('result-stats'),  // リザルト統計表示
    invader: document.getElementById('invader'),
    hint: document.getElementById('hint'),  // ヒント表示用の要素
    answer: document.getElementById('answer'),  // 正解表示用の要素
    questionCounter: document.getElementById('question-counter')  // 問題カウンター
};

// インベーダーの絵文字
const invaders = ['👾', '👽', '🛸', '🤖', '👹'];

// ゲームの初期化
function initGame() {
    // レベル表示を更新
    elements.levelDisplay.textContent = gameState.level === 'beginner' ? '初級' : 
                                       gameState.level === 'intermediate' ? '中級' : '上級';
    
    // ライフの表示を更新
    updateLives();
    
    // ゲーム開始時間を記録
    gameState.startTime = new Date();
    
    // 最初の問題を取得
    fetchProblem();
    
    // ランダムなインベーダーを表示
    elements.invader.textContent = getRandomInvader();
    
    // イベントリスナーの設定
    elements.submitBtn.addEventListener('click', checkAnswer);
    elements.nextBtn.addEventListener('click', nextProblem);
    elements.regexPattern.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
}

// ランダムなインベーダーを取得
function getRandomInvader() {
    return invaders[Math.floor(Math.random() * invaders.length)];
}

// 問題を取得
function fetchProblem() {
    fetch(`/api/problem?level=${gameState.level}&session_id=${gameState.sessionId}&question_count=${gameState.questionCount}`)
        .then(response => response.json())
        .then(data => {
            // ゲーム完了の場合
            if (data.game_completed) {
                gameCompleted();
                return;
            }
            
            gameState.currentProblem = data;
            // サーバーから返された問題インデックスを使用
            gameState.problemIndex = data.problem_index;
            // 問題カウントを更新
            gameState.questionCount = data.question_count;
            
            // 問題カウンターを更新
            if (elements.questionCounter) {
                elements.questionCounter.textContent = `STAGE: ${gameState.questionCount}/5`;
            }
            
            displayProblem(data);
            // 新しい問題に切り替わったら試行回数をリセット
            gameState.attempts = 0;
            // ヒントと正解表示をクリア
            if (elements.hint) {
                elements.hint.textContent = '';
                elements.hint.style.display = 'none';
            }
            if (elements.answer) {
                elements.answer.textContent = '';
                elements.answer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('問題の取得に失敗しました:', error);
            elements.feedback.textContent = '問題の取得に失敗しました。もう一度お試しください。';
            elements.feedback.className = 'feedback error';
        });
}

// 問題を表示
function displayProblem(problem) {
    if (!problem || !problem.description) {
        console.error('問題データが不正です:', problem);
        elements.feedback.textContent = '問題データの取得に失敗しました。ページを再読み込みしてください。';
        elements.feedback.className = 'feedback error';
        return;
    }

    elements.problemDescription.textContent = problem.description;
    
    // マッチする例を表示
    elements.matchExamples.innerHTML = '';
    problem.examples.forEach(example => {
        const li = document.createElement('li');
        li.textContent = example;
        elements.matchExamples.appendChild(li);
    });
    
    // マッチしない例を表示
    elements.nonMatchExamples.innerHTML = '';
    problem.non_examples.forEach(example => {
        const li = document.createElement('li');
        li.textContent = example;
        elements.nonMatchExamples.appendChild(li);
    });
    
    // 入力フィールドをクリア
    elements.regexPattern.value = '';
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback';
    
    // 次へボタンを非表示
    elements.nextBtn.style.display = 'none';
    
    // フォーカスを入力フィールドに設定
    elements.regexPattern.focus();
}

// 回答をチェック
function checkAnswer() {
    const pattern = elements.regexPattern.value.trim();
    
    if (!pattern) {
        elements.feedback.textContent = '正規表現を入力してください。';
        elements.feedback.className = 'feedback error';
        return;
    }
    
    // 試行回数をインクリメント
    gameState.attempts++;
    gameState.totalAttempts++;
    
    // APIに回答を送信
    fetch('/api/check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            pattern: pattern,
            level: gameState.level,
            problem_index: gameState.problemIndex,
            attempts: gameState.attempts,
            lives: gameState.lives,  // 現在のライフ数を送信
            question_count: gameState.questionCount  // 問題カウントを送信
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            // 正解の場合
            elements.feedback.textContent = `${data.message} 模範解答: ${data.expected_pattern}`;
            elements.feedback.className = 'feedback success';
            
            // 正解数をインクリメント
            gameState.correctAnswers++;
            
            // ヒントと正解を非表示
            if (elements.hint) {
                elements.hint.style.display = 'none';
            }
            if (elements.answer) {
                elements.answer.style.display = 'none';
            }
            
            // インベーダーを爆発させるアニメーション
            elements.invader.textContent = '💥';
            
            // ゲーム完了の場合
            if (data.game_completed) {
                // ゲーム終了時間を記録
                gameState.endTime = new Date();
                setTimeout(() => {
                    gameCompleted();
                }, 1000);
            } else {
                // 自動的に次の問題へ進む
                setTimeout(() => {
                    elements.invader.style.visibility = 'hidden';
                    setTimeout(() => {
                        nextProblem();
                    }, 500);
                }, 1000);
            }
        } else {
            // 不正解の場合
            elements.feedback.textContent = data.message;
            elements.feedback.className = 'feedback error';
            
            // 最後の正解パターンを保存
            if (data.expected_pattern) {
                gameState.lastExpectedPattern = data.expected_pattern;
            }
            
            // ヒントを表示（試行回数に応じて）
            if (data.hint && elements.hint) {
                elements.hint.textContent = `ヒント: ${data.hint}`;
                elements.hint.style.display = 'block';
            }
            
            // 最後のライフの場合は正解も表示
            if (data.expected_pattern && elements.answer && gameState.lives <= 1) {
                elements.answer.textContent = `正解: ${data.expected_pattern}`;
                elements.answer.style.display = 'block';
            }
            
            // マッチ結果の詳細を表示
            if (data.match_results) {
                let matchDetails = '';
                
                // マッチする例の結果
                const exampleResults = data.match_results.examples;
                for (let i = 0; i < exampleResults.length; i++) {
                    const example = gameState.currentProblem.examples[i];
                    const matched = exampleResults[i];
                    
                    if (!matched) {
                        matchDetails += `「${example}」にマッチしませんでした。`;
                    }
                }
                
                // マッチしない例の結果
                const nonExampleResults = data.match_results.non_examples;
                for (let i = 0; i < nonExampleResults.length; i++) {
                    const example = gameState.currentProblem.non_examples[i];
                    const matched = nonExampleResults[i];
                    
                    if (matched) {
                        matchDetails += `「${example}」にマッチしてしまいました。`;
                    }
                }
                
                if (matchDetails) {
                    elements.feedback.textContent += ' ' + matchDetails;
                }
            }
            
            // ライフを減らす
            gameState.lives--;
            updateLives();
            
            // ゲームオーバーのチェック
            if (gameState.lives <= 0) {
                // ゲーム終了時間を記録
                gameState.endTime = new Date();
                gameOver();
            }
        }
    })
    .catch(error => {
        console.error('回答の送信に失敗しました:', error);
        elements.feedback.textContent = '回答の送信に失敗しました。もう一度お試しください。';
        elements.feedback.className = 'feedback error';
    });
}

// 次の問題へ
function nextProblem() {
    elements.invader.style.visibility = 'visible';
    elements.invader.textContent = getRandomInvader();
    fetchProblem();
}

// ライフの更新
function updateLives() {
    elements.livesDisplay.textContent = '❤️'.repeat(gameState.lives);
}

// ゲームオーバー
function gameOver() {
    // リザルト統計を表示
    displayResultStats(false);
    
    // 最後の問題の正解をゲームオーバーモーダルに表示
    if (gameState.lastExpectedPattern && elements.finalAnswer) {
        elements.finalAnswer.textContent = `最後の問題の正解: ${gameState.lastExpectedPattern}`;
    }
    
    // ゲームオーバーモーダルを表示
    elements.gameOver.style.display = 'flex';
}

// ゲーム完了
function gameCompleted() {
    // リザルト統計を表示
    displayResultStats(true);
    
    // ゲーム完了メッセージを表示
    if (elements.finalAnswer) {
        elements.finalAnswer.textContent = `おめでとうございます！全ての問題をクリアしました！`;
    }
    
    // ゲームオーバーモーダルを表示
    elements.gameOver.style.display = 'flex';
}

// リザルト統計を表示
function displayResultStats(completed) {
    if (!elements.resultStats) return;
    
    // プレイ時間を計算
    const playTime = gameState.endTime - gameState.startTime;
    const minutes = Math.floor(playTime / 60000);
    const seconds = Math.floor((playTime % 60000) / 1000);
    
    // 正答率を計算
    const accuracy = Math.round((gameState.correctAnswers / gameState.totalAttempts) * 100);
    
    // リザルト統計を表示
    let statsHTML = `
        <div class="stat-item">
            <div class="stat-label">難易度:</div>
            <div class="stat-value">${gameState.level === 'beginner' ? '初級' : gameState.level === 'intermediate' ? '中級' : '上級'}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">クリア状況:</div>
            <div class="stat-value">${completed ? '完了' : '未完了'}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">正解数:</div>
            <div class="stat-value">${gameState.correctAnswers}/5</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">正答率:</div>
            <div class="stat-value">${accuracy}%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">プレイ時間:</div>
            <div class="stat-value">${minutes}分${seconds}秒</div>
        </div>
    `;
    
    elements.resultStats.innerHTML = statsHTML;
}

// セッションIDを生成
gameState.sessionId = Date.now().toString();
gameState.questionCount = 0;

// ゲームの初期化
document.addEventListener('DOMContentLoaded', initGame);