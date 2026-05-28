// solutions.html を PROBLEMS / PROBLEM_COUNTS から描画する
(function () {
    const params = new URLSearchParams(window.location.search);
    const requestedLevel = params.get('level');
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const currentLevel = validLevels.includes(requestedLevel) ? requestedLevel : null;

    // ナビゲーションボタンのアクティブ状態
    const navButtons = document.querySelectorAll('#solutions-nav-buttons [data-level]');
    navButtons.forEach(btn => {
        const lvl = btn.dataset.level;
        if ((currentLevel === null && lvl === 'all') || lvl === currentLevel) {
            btn.classList.add('active');
        }
    });

    const levelsToRender = currentLevel
        ? { [currentLevel]: PROBLEMS[currentLevel] }
        : PROBLEMS;

    const container = document.getElementById('top');

    Object.entries(levelsToRender).forEach(([level, problems]) => {
        const section = document.createElement('div');
        section.className = 'level-section';

        const list = document.createElement('div');
        list.className = 'problem-list';

        problems.forEach(problem => {
            list.appendChild(buildProblemCard(problem));
        });

        // 元実装: 実際の問題数より少なければ「ここでは一部のみ表示」カードを追加
        const totalForLevel = PROBLEM_COUNTS[level];
        if (totalForLevel && problems.length < totalForLevel) {
            list.appendChild(buildMoreProblemsCard(totalForLevel));
        }

        section.appendChild(list);
        container.appendChild(section);
    });

    function buildProblemCard(problem) {
        const card = document.createElement('div');
        card.className = 'problem-card';

        const desc = document.createElement('div');
        desc.className = 'problem-description';
        desc.textContent = problem.description;

        const examples = document.createElement('div');
        examples.className = 'problem-examples';
        examples.appendChild(buildExampleGroup('マッチする例:', problem.examples));
        examples.appendChild(buildExampleGroup('マッチしない例:', problem.non_examples));

        const solution = document.createElement('div');
        solution.className = 'problem-solution';

        const sp = document.createElement('div');
        sp.className = 'solution-pattern';
        sp.appendChild(document.createTextNode('解答: '));
        const code = document.createElement('code');
        code.textContent = problem.pattern;
        sp.appendChild(code);

        const h1 = document.createElement('div');
        h1.className = 'solution-hint';
        h1.textContent = `ヒント1: ${problem.hint1}`;

        const h2 = document.createElement('div');
        h2.className = 'solution-hint';
        h2.textContent = `ヒント2: ${problem.hint2}`;

        solution.append(sp, h1, h2);
        card.append(desc, examples, solution);
        return card;
    }

    function buildExampleGroup(title, items) {
        const group = document.createElement('div');
        group.className = 'example-group';
        const h4 = document.createElement('h4');
        h4.textContent = title;
        const ul = document.createElement('ul');
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
        group.append(h4, ul);
        return group;
    }

    function buildMoreProblemsCard(total) {
        const card = document.createElement('div');
        card.className = 'problem-card more-problems';
        const p1 = document.createElement('p');
        p1.textContent = `実際のゲームでは ${total}問の問題が用意されています。`;
        const p2 = document.createElement('p');
        p2.textContent = 'ここでは一部のみ表示しています。';
        card.append(p1, p2);
        return card;
    }
})();
