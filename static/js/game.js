// ゲーム状態の管理
const gameState = {
    level: new URLSearchParams(window.location.search).get('level') || 'beginner',
    lives: 3,
    currentProblem: null,
    problemIndex: 0,
    attempts: 0,           // 同じ問題に対する試行回数
    lastExpectedPattern: null,
    correctAnswers: 0,
    totalAttempts: 0,
    startTime: null,
    endTime: null,
    questionCount: 0,      // 何問目か (1-5)
    usedProblems: new Set() // 出題済みインデックス
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
    finalAnswer: document.getElementById('final-answer'),
    resultStats: document.getElementById('result-stats'),
    invader: document.getElementById('invader'),
    hint: document.getElementById('hint'),
    answer: document.getElementById('answer'),
    questionCounter: document.getElementById('question-counter')
};

const invaders = ['👾', '👽', '🛸', '🤖', '👹'];

function initGame() {
    elements.levelDisplay.textContent = gameState.level === 'beginner' ? '初級' :
                                        gameState.level === 'intermediate' ? '中級' : '上級';
    updateLives();
    gameState.startTime = new Date();
    loadNextProblem();
    elements.invader.textContent = getRandomInvader();

    elements.submitBtn.addEventListener('click', checkAnswer);
    elements.nextBtn.addEventListener('click', nextProblem);
    elements.regexPattern.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
}

function getRandomInvader() {
    return invaders[Math.floor(Math.random() * invaders.length)];
}

// 元 /api/problem 相当: ローカルの PROBLEMS から未出題のものをランダムに1問選ぶ
function loadNextProblem() {
    // 5問終わったらゲームクリア
    if (gameState.questionCount >= QUESTIONS_PER_GAME) {
        gameCompleted();
        return;
    }

    const levelProblems = PROBLEMS[gameState.level] || PROBLEMS.beginner;
    let availableIndices = levelProblems
        .map((_, i) => i)
        .filter(i => !gameState.usedProblems.has(i));

    // 候補が尽きたら出題済みリセット (1ゲーム5問だが、レベルの問題数 < 5 のフェイルセーフ)
    if (availableIndices.length === 0) {
        gameState.usedProblems.clear();
        availableIndices = levelProblems.map((_, i) => i);
    }

    const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    gameState.usedProblems.add(chosenIndex);
    gameState.problemIndex = chosenIndex;
    gameState.currentProblem = levelProblems[chosenIndex];
    gameState.questionCount += 1;
    gameState.attempts = 0;

    if (elements.questionCounter) {
        elements.questionCounter.textContent = `STAGE: ${gameState.questionCount}/${QUESTIONS_PER_GAME}`;
    }

    displayProblem(gameState.currentProblem);

    if (elements.hint) {
        elements.hint.textContent = '';
        elements.hint.style.display = 'none';
    }
    if (elements.answer) {
        elements.answer.textContent = '';
        elements.answer.style.display = 'none';
    }
}

function displayProblem(problem) {
    if (!problem || !problem.description) {
        console.error('問題データが不正です:', problem);
        elements.feedback.textContent = '問題データの取得に失敗しました。ページを再読み込みしてください。';
        elements.feedback.className = 'feedback error';
        return;
    }

    elements.problemDescription.textContent = problem.description;

    elements.matchExamples.innerHTML = '';
    problem.examples.forEach(example => {
        const li = document.createElement('li');
        li.textContent = example;
        elements.matchExamples.appendChild(li);
    });

    elements.nonMatchExamples.innerHTML = '';
    problem.non_examples.forEach(example => {
        const li = document.createElement('li');
        li.textContent = example;
        elements.nonMatchExamples.appendChild(li);
    });

    elements.regexPattern.value = '';
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback';
    elements.nextBtn.style.display = 'none';
    elements.regexPattern.focus();
}

// 元 /api/check 相当: ローカルで RegExp 判定する
function checkAnswer() {
    const userPattern = elements.regexPattern.value.trim();

    if (!userPattern) {
        elements.feedback.textContent = '正規表現を入力してください。';
        elements.feedback.className = 'feedback error';
        return;
    }

    gameState.attempts++;
    gameState.totalAttempts++;

    const problem = gameState.currentProblem;
    const expectedPattern = problem.pattern;

    // ユーザー入力の例・非例マッチ結果
    const exampleResults = problem.examples.map(ex => fullMatch(userPattern, ex));
    const nonExampleResults = problem.non_examples.map(ex => fullMatch(userPattern, ex));

    // 無効な正規表現 (null が含まれる) を弾く
    if (exampleResults.includes(null) || nonExampleResults.includes(null)) {
        elements.feedback.textContent = '無効な正規表現です';
        elements.feedback.className = 'feedback error';
        return;
    }

    const allExamplesMatch = exampleResults.every(Boolean);
    const noNonExamplesMatch = nonExampleResults.every(r => !r);

    if (allExamplesMatch && noNonExamplesMatch) {
        // 正解
        elements.feedback.textContent = `正解です! 模範解答: ${expectedPattern}`;
        elements.feedback.className = 'feedback success';
        gameState.correctAnswers++;

        if (elements.hint) elements.hint.style.display = 'none';
        if (elements.answer) elements.answer.style.display = 'none';

        elements.invader.textContent = '💥';

        const isFinalQuestion = gameState.questionCount >= QUESTIONS_PER_GAME;
        if (isFinalQuestion) {
            gameState.endTime = new Date();
            setTimeout(() => gameCompleted(), 1000);
        } else {
            setTimeout(() => {
                elements.invader.style.visibility = 'hidden';
                setTimeout(() => nextProblem(), 500);
            }, 1000);
        }
        return;
    }

    // 不正解
    elements.feedback.textContent = '不正解です。もう一度試してください。';
    elements.feedback.className = 'feedback error';
    gameState.lastExpectedPattern = expectedPattern;

    // 試行回数に応じたヒント
    let hintText = null;
    if (gameState.attempts === 1) {
        hintText = problem.hint1;
    } else if (gameState.attempts >= 2) {
        hintText = problem.hint2;
    }
    if (hintText && elements.hint) {
        elements.hint.textContent = `ヒント: ${hintText}`;
        elements.hint.style.display = 'block';
    }

    // 最後のライフなら正解も表示 (元実装に合わせる)
    if (gameState.lives <= 1 && elements.answer) {
        elements.answer.textContent = `正解: ${expectedPattern}`;
        elements.answer.style.display = 'block';
    }

    // マッチ結果の詳細
    let matchDetails = '';
    exampleResults.forEach((matched, i) => {
        if (!matched) {
            matchDetails += `「${problem.examples[i]}」にマッチしませんでした。`;
        }
    });
    nonExampleResults.forEach((matched, i) => {
        if (matched) {
            matchDetails += `「${problem.non_examples[i]}」にマッチしてしまいました。`;
        }
    });
    if (matchDetails) {
        elements.feedback.textContent += ' ' + matchDetails;
    }

    gameState.lives--;
    updateLives();

    if (gameState.lives <= 0) {
        gameState.endTime = new Date();
        gameOver();
    }
}

function nextProblem() {
    elements.invader.style.visibility = 'visible';
    elements.invader.textContent = getRandomInvader();
    loadNextProblem();
}

function updateLives() {
    elements.livesDisplay.textContent = '❤️'.repeat(gameState.lives);
}

function gameOver() {
    displayResultStats(false);
    if (gameState.lastExpectedPattern && elements.finalAnswer) {
        elements.finalAnswer.textContent = `最後の問題の正解: ${gameState.lastExpectedPattern}`;
    }
    elements.gameOver.style.display = 'flex';
}

function gameCompleted() {
    if (!gameState.endTime) gameState.endTime = new Date();
    displayResultStats(true);
    if (elements.finalAnswer) {
        elements.finalAnswer.textContent = `おめでとうございます! 全ての問題をクリアしました!`;
    }
    elements.gameOver.style.display = 'flex';
}

function displayResultStats(completed) {
    if (!elements.resultStats) return;

    const playTime = gameState.endTime - gameState.startTime;
    const minutes = Math.floor(playTime / 60000);
    const seconds = Math.floor((playTime % 60000) / 1000);
    const accuracy = gameState.totalAttempts > 0
        ? Math.round((gameState.correctAnswers / gameState.totalAttempts) * 100)
        : 0;

    const levelLabel = gameState.level === 'beginner' ? '初級' :
                       gameState.level === 'intermediate' ? '中級' : '上級';

    elements.resultStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">難易度:</div>
            <div class="stat-value">${levelLabel}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">クリア状況:</div>
            <div class="stat-value">${completed ? '完了' : '未完了'}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">正解数:</div>
            <div class="stat-value">${gameState.correctAnswers}/${QUESTIONS_PER_GAME}</div>
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
}

document.addEventListener('DOMContentLoaded', initGame);
