(function(global) {
    const MAX_QUESTIONS = 5;
    const VALID_LEVELS = ["beginner", "intermediate", "advanced"];

    function normalizeLevel(level) {
        return VALID_LEVELS.includes(level) ? level : "beginner";
    }

    function buildFullmatchRegex(pattern) {
        return new RegExp("^(?:" + pattern + ")$");
    }

    function judgePattern(pattern, problem) {
        let regex;

        try {
            regex = buildFullmatchRegex(pattern);
        } catch (error) {
            return {
                valid: false,
                invalidPattern: true,
                message: "無効な正規表現です",
            };
        }

        const exampleResults = problem.examples.map((example) => regex.test(example));
        const nonExampleResults = problem.non_examples.map((example) =>
            regex.test(example)
        );
        const allExamplesMatch = exampleResults.every(Boolean);
        const noNonExamplesMatch = nonExampleResults.every((matched) => !matched);

        return {
            valid: allExamplesMatch && noNonExamplesMatch,
            message: allExamplesMatch && noNonExamplesMatch
                ? "正解です！"
                : "不正解です。もう一度試してください。",
            match_results: {
                examples: exampleResults,
                non_examples: nonExampleResults,
            },
        };
    }

    function selectProblem(levelProblems, usedProblemIndexes, questionCount, randomValue) {
        if (questionCount >= MAX_QUESTIONS) {
            return {
                game_completed: true,
                message: "おめでとうございます！全ての問題をクリアしました！",
                usedProblemIndexes,
            };
        }

        let nextUsedProblemIndexes = usedProblemIndexes.slice();
        let availableIndexes = levelProblems
            .map((problem, index) => index)
            .filter((index) => !nextUsedProblemIndexes.includes(index));

        if (availableIndexes.length === 0) {
            nextUsedProblemIndexes = [];
            availableIndexes = levelProblems.map((problem, index) => index);
        }

        const choice = Math.floor(randomValue() * availableIndexes.length);
        const problemIndex = availableIndexes[choice];
        const problem = levelProblems[problemIndex];
        nextUsedProblemIndexes.push(problemIndex);

        return {
            description: problem.description,
            examples: problem.examples,
            non_examples: problem.non_examples,
            hint1: problem.hint1,
            hint2: problem.hint2,
            problem_index: problemIndex,
            question_count: questionCount + 1,
            usedProblemIndexes: nextUsedProblemIndexes,
        };
    }

    global.RegexInvadersCore = {
        MAX_QUESTIONS,
        normalizeLevel,
        buildFullmatchRegex,
        judgePattern,
        selectProblem,
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = global.RegexInvadersCore;
    }
})(typeof globalThis !== "undefined" ? globalThis : window);
