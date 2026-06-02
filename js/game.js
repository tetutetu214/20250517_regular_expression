const urlParams = new URLSearchParams(location.search);
const gameLevel = RegexInvadersCore.normalizeLevel(urlParams.get("level"));

const gameState = {
    level: gameLevel,
    lives: 3,
    currentProblem: null,
    problemIndex: 0,
    attempts: 0,
    lastExpectedPattern: null,
    correctAnswers: 0,
    totalAttempts: 0,
    startTime: null,
    endTime: null,
    usedProblemIndexes: [],
    questionCount: 0,
};

const elements = {
    levelDisplay: document.getElementById("level-display"),
    livesDisplay: document.getElementById("lives"),
    problemDescription: document.getElementById("problem-description"),
    matchExamples: document.getElementById("match-examples"),
    nonMatchExamples: document.getElementById("non-match-examples"),
    regexPattern: document.getElementById("regex-pattern"),
    submitBtn: document.getElementById("submit-btn"),
    feedback: document.getElementById("feedback"),
    nextBtn: document.getElementById("next-btn"),
    gameOver: document.getElementById("game-over"),
    finalAnswer: document.getElementById("final-answer"),
    resultStats: document.getElementById("result-stats"),
    invader: document.getElementById("invader"),
    hint: document.getElementById("hint"),
    answer: document.getElementById("answer"),
    questionCounter: document.getElementById("question-counter"),
    retryLink: document.getElementById("retry-link"),
};

const invaders = ["👾", "👽", "🛸", "🤖", "👹"];

function getLevelLabel(level) {
    if (level === "intermediate") {
        return "中級";
    }
    if (level === "advanced") {
        return "上級";
    }
    return "初級";
}

function initGame() {
    elements.levelDisplay.textContent = getLevelLabel(gameState.level);

    if (elements.retryLink) {
        elements.retryLink.href = `game.html?level=${gameState.level}`;
    }

    updateLives();
    gameState.startTime = new Date();
    fetchProblem();

    elements.invader.textContent = getRandomInvader();
    elements.submitBtn.addEventListener("click", checkAnswer);
    elements.nextBtn.addEventListener("click", nextProblem);
    elements.regexPattern.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            checkAnswer();
        }
    });
}

function getRandomInvader() {
    return invaders[Math.floor(Math.random() * invaders.length)];
}

function fetchProblem() {
    const data = RegexInvadersCore.selectProblem(
        LEVELS[gameState.level],
        gameState.usedProblemIndexes,
        gameState.questionCount,
        Math.random
    );

    gameState.usedProblemIndexes = data.usedProblemIndexes;

    if (data.game_completed) {
        gameCompleted();
        return;
    }

    gameState.currentProblem = data;
    gameState.problemIndex = data.problem_index;
    gameState.questionCount = data.question_count;

    if (elements.questionCounter) {
        elements.questionCounter.textContent = `STAGE: ${gameState.questionCount}/5`;
    }

    displayProblem(data);
    gameState.attempts = 0;
    clearHintAndAnswer();
}

function displayProblem(problem) {
    if (!problem || !problem.description) {
        elements.feedback.textContent = "問題データの取得に失敗しました。ページを再読み込みしてください。";
        elements.feedback.className = "feedback error";
        return;
    }

    elements.problemDescription.textContent = problem.description;

    elements.matchExamples.innerHTML = "";
    problem.examples.forEach((example) => {
        const item = document.createElement("li");
        item.textContent = example;
        elements.matchExamples.appendChild(item);
    });

    elements.nonMatchExamples.innerHTML = "";
    problem.non_examples.forEach((example) => {
        const item = document.createElement("li");
        item.textContent = example;
        elements.nonMatchExamples.appendChild(item);
    });

    elements.regexPattern.value = "";
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
    elements.nextBtn.style.display = "none";
    elements.regexPattern.focus();
}

function checkAnswer() {
    const pattern = elements.regexPattern.value.trim();

    if (!pattern) {
        elements.feedback.textContent = "正規表現を入力してください。";
        elements.feedback.className = "feedback error";
        return;
    }

    gameState.attempts++;
    gameState.totalAttempts++;

    const sourceProblem = LEVELS[gameState.level][gameState.problemIndex];
    const data = buildAnswerResult(pattern, sourceProblem);

    if (data.valid) {
        elements.feedback.textContent = `${data.message} 模範解答: ${data.expected_pattern}`;
        elements.feedback.className = "feedback success";
        gameState.correctAnswers++;
        clearHintAndAnswer();
        elements.invader.textContent = "💥";

        if (data.game_completed) {
            gameState.endTime = new Date();
            setTimeout(() => {
                gameCompleted();
            }, 1000);
            return;
        }

        setTimeout(() => {
            elements.invader.style.visibility = "hidden";
            setTimeout(() => {
                nextProblem();
            }, 500);
        }, 1000);
        return;
    }

    elements.feedback.textContent = data.message;
    elements.feedback.className = "feedback error";

    if (data.expected_pattern) {
        gameState.lastExpectedPattern = data.expected_pattern;
    }

    if (data.hint && elements.hint) {
        elements.hint.textContent = `ヒント: ${data.hint}`;
        elements.hint.style.display = "block";
    }

    if (data.expected_pattern && elements.answer && gameState.lives <= 1) {
        elements.answer.textContent = `正解: ${data.expected_pattern}`;
        elements.answer.style.display = "block";
    }

    appendMatchDetails(data.match_results);
    gameState.lives--;
    updateLives();

    if (gameState.lives <= 0) {
        gameState.endTime = new Date();
        gameOver();
    }
}

function buildAnswerResult(pattern, problem) {
    const result = RegexInvadersCore.judgePattern(pattern, problem);

    if (result.invalidPattern) {
        return result;
    }

    if (result.valid) {
        return {
            ...result,
            expected_pattern: problem.pattern,
            game_completed: gameState.questionCount >= RegexInvadersCore.MAX_QUESTIONS,
            question_count: gameState.questionCount,
        };
    }

    return {
        ...result,
        hint: getHint(problem),
        expected_pattern: gameState.lives <= 1 ? problem.pattern : null,
    };
}

function getHint(problem) {
    if (gameState.attempts === 1) {
        return problem.hint1;
    }
    if (gameState.attempts >= 2) {
        return problem.hint2;
    }
    return null;
}

function appendMatchDetails(matchResults) {
    if (!matchResults) {
        return;
    }

    let matchDetails = "";

    matchResults.examples.forEach((matched, index) => {
        if (!matched) {
            const example = gameState.currentProblem.examples[index];
            matchDetails += `「${example}」にマッチしませんでした。`;
        }
    });

    matchResults.non_examples.forEach((matched, index) => {
        if (matched) {
            const example = gameState.currentProblem.non_examples[index];
            matchDetails += `「${example}」にマッチしてしまいました。`;
        }
    });

    if (matchDetails) {
        elements.feedback.textContent += " " + matchDetails;
    }
}

function clearHintAndAnswer() {
    if (elements.hint) {
        elements.hint.textContent = "";
        elements.hint.style.display = "none";
    }
    if (elements.answer) {
        elements.answer.textContent = "";
        elements.answer.style.display = "none";
    }
}

function nextProblem() {
    elements.invader.style.visibility = "visible";
    elements.invader.textContent = getRandomInvader();
    fetchProblem();
}

function updateLives() {
    elements.livesDisplay.textContent = "❤️".repeat(gameState.lives);
}

function gameOver() {
    displayResultStats(false);

    if (gameState.lastExpectedPattern && elements.finalAnswer) {
        elements.finalAnswer.textContent = `最後の問題の正解: ${gameState.lastExpectedPattern}`;
    }

    elements.gameOver.style.display = "flex";
}

function gameCompleted() {
    displayResultStats(true);

    if (elements.finalAnswer) {
        elements.finalAnswer.textContent = "おめでとうございます！全ての問題をクリアしました！";
    }

    elements.gameOver.style.display = "flex";
}

function displayResultStats(completed) {
    if (!elements.resultStats) {
        return;
    }

    const playTime = gameState.endTime - gameState.startTime;
    const minutes = Math.floor(playTime / 60000);
    const seconds = Math.floor((playTime % 60000) / 1000);
    const accuracy = gameState.totalAttempts === 0
        ? 0
        : Math.round((gameState.correctAnswers / gameState.totalAttempts) * 100);

    elements.resultStats.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">難易度:</div>
            <div class="stat-value">${getLevelLabel(gameState.level)}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">クリア状況:</div>
            <div class="stat-value">${completed ? "完了" : "未完了"}</div>
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
}

document.addEventListener("DOMContentLoaded", initGame);
