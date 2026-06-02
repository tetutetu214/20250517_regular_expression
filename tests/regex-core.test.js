const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const context = {
    console,
    module: { exports: {} },
};

vm.createContext(context);
vm.runInContext(
    fs.readFileSync(path.join(rootDir, "js/problems.js"), "utf8"),
    context
);
vm.runInContext(
    fs.readFileSync(path.join(rootDir, "js/regex-core.js"), "utf8"),
    context
);

const LEVELS = vm.runInContext("LEVELS", context);
const core = context.RegexInvadersCore;

function it(name, testCase) {
    try {
        testCase();
        console.log(`ok - ${name}`);
    } catch (error) {
        console.error(`not ok - ${name}`);
        throw error;
    }
}

it("各レベルの模範解答は自分の問題で正解になる", function() {
    Object.values(LEVELS).forEach((problems) => {
        problems.forEach((problem) => {
            const result = core.judgePattern(problem.pattern, problem);

            assert.strictEqual(result.valid, true, problem.description);
        });
    });
});

it("無効な正規表現は専用メッセージを返す", function() {
    const result = core.judgePattern("(", LEVELS.beginner[0]);

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.invalidPattern, true);
    assert.strictEqual(result.message, "無効な正規表現です");
});

it("部分マッチだけでは正解にならない", function() {
    const result = core.judgePattern("A", LEVELS.beginner[0]);

    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual([...result.match_results.examples], [true, false, false]);
});

it("マッチする例すべてとマッチしない例すべてを同時に満たす必要がある", function() {
    const result = core.judgePattern(".*", LEVELS.beginner[0]);

    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual([...result.match_results.examples], [true, true, true]);
    assert.deepStrictEqual([...result.match_results.non_examples], [true, true, true]);
});

it("アンカー付き入力もfullmatch判定で正解になる", function() {
    const result = core.judgePattern("^A+$", LEVELS.beginner[0]);

    assert.strictEqual(result.valid, true);
});

it("\\b付きのメールパターンもfullmatch判定で正解になる", function() {
    const mailProblem = LEVELS.intermediate[1];
    const result = core.judgePattern(mailProblem.pattern, mailProblem);

    assert.strictEqual(result.valid, true);
});

it("未出題の問題から重複なしで選ばれる", function() {
    const randomFirst = () => 0;
    let used = [];

    for (let count = 0; count < LEVELS.beginner.length; count++) {
        const result = core.selectProblem(
            LEVELS.beginner,
            used,
            count,
            randomFirst
        );

        assert.strictEqual(used.includes(result.problem_index), false);
        used = result.usedProblemIndexes;
    }

    assert.deepStrictEqual([...used], [0, 1, 2, 3, 4]);
});

it("全問出し切った後は使用済みをリセットして再利用する", function() {
    const result = core.selectProblem(
        LEVELS.beginner,
        [0, 1, 2, 3, 4],
        0,
        () => 0
    );

    assert.deepStrictEqual([...result.usedProblemIndexes], [0]);
    assert.strictEqual(result.problem_index, 0);
});

it("5問に到達しているとゲームクリアを返す", function() {
    const result = core.selectProblem(LEVELS.beginner, [], 5, () => 0);

    assert.strictEqual(result.game_completed, true);
});

it("無効なレベルはbeginnerにフォールバックする", function() {
    assert.strictEqual(core.normalizeLevel("unknown"), "beginner");
    assert.strictEqual(core.normalizeLevel(null), "beginner");
});
