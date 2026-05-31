const LEVEL_LABELS = {
    beginner: "初級問題",
    intermediate: "中級問題",
    advanced: "上級問題",
};

function getCurrentLevel() {
    const level = new URLSearchParams(location.search).get("level");

    if (level === "all" || !level) {
        return "all";
    }

    return Object.prototype.hasOwnProperty.call(LEVELS, level) ? level : "all";
}

function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }
    if (textContent !== undefined) {
        element.textContent = textContent;
    }

    return element;
}

function renderNavigation(currentLevel) {
    const nav = document.getElementById("solutions-nav-buttons");
    const navItems = [
        ["beginner", "初級問題", "solutions.html?level=beginner"],
        ["intermediate", "中級問題", "solutions.html?level=intermediate"],
        ["advanced", "上級問題", "solutions.html?level=advanced"],
        ["all", "全問題", "solutions.html"],
    ];

    nav.innerHTML = "";
    navItems.forEach(([level, label, href]) => {
        const link = createElement("a", "btn", label);
        link.href = href;
        if (currentLevel === level) {
            link.classList.add("active");
        }
        nav.appendChild(link);
    });
}

function renderSolutions(currentLevel) {
    const container = document.getElementById("top");
    const levels = currentLevel === "all" ? Object.keys(LEVELS) : [currentLevel];

    container.innerHTML = "";
    levels.forEach((level) => {
        const section = createElement("div", "level-section");
        const list = createElement("div", "problem-list");
        const problems = LEVELS[level];

        problems.forEach((problem) => {
            list.appendChild(createProblemCard(problem));
        });

        if (problems.length < PROBLEM_COUNTS[level]) {
            list.appendChild(createMoreProblemsCard(level));
        }

        section.appendChild(list);
        container.appendChild(section);
    });
}

function createProblemCard(problem) {
    const card = createElement("div", "problem-card");
    const description = createElement(
        "div",
        "problem-description",
        problem.description
    );
    const examples = createElement("div", "problem-examples");
    const solution = createElement("div", "problem-solution");

    examples.appendChild(createExampleGroup("マッチする例:", problem.examples));
    examples.appendChild(createExampleGroup("マッチしない例:", problem.non_examples));

    const pattern = createElement("div", "solution-pattern", "解答: ");
    const code = createElement("code", null, problem.pattern);
    pattern.appendChild(code);

    solution.appendChild(pattern);
    solution.appendChild(createElement("div", "solution-hint", `ヒント1: ${problem.hint1}`));
    solution.appendChild(createElement("div", "solution-hint", `ヒント2: ${problem.hint2}`));

    card.appendChild(description);
    card.appendChild(examples);
    card.appendChild(solution);

    return card;
}

function createExampleGroup(title, items) {
    const group = createElement("div", "example-group");
    const heading = createElement("h4", null, title);
    const list = document.createElement("ul");

    items.forEach((item) => {
        list.appendChild(createElement("li", null, item));
    });

    group.appendChild(heading);
    group.appendChild(list);

    return group;
}

function createMoreProblemsCard(level) {
    const card = createElement("div", "problem-card more-problems");
    const countMessage = createElement(
        "p",
        null,
        `実際のゲームでは ${PROBLEM_COUNTS[level]}問の問題が用意されています。`
    );
    const partialMessage = createElement("p", null, "ここでは一部のみ表示しています。");

    card.appendChild(countMessage);
    card.appendChild(partialMessage);

    return card;
}

document.addEventListener("DOMContentLoaded", function() {
    const currentLevel = getCurrentLevel();

    renderNavigation(currentLevel);
    renderSolutions(currentLevel);
});
