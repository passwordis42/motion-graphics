'use strict';

(() => {
  const mode = document.currentScript.dataset.scene;
  const { background, box, label, line, pill, arrow, easing, subtitle } = nnlm;
  const cyan = '#abecff', gold = '#ffe590', red = '#ffa5b7';
  const dark = 'rgba(21, 25, 76, .86)';
  const scenes = {
    ffn: ['前馈网络升维再降维', '24:23', '24:20.4–24:25.8', 5.4, 2.6],
    position: ['最后一个位置汇总上文', '24:21', '24:16.6–24:22.6', 6, 3.9],
    positionB: ['最后一个向量对词表打分', '24:21', '24:22.6–24:29.0', 6.4, 4.8],
    scores: ['从最后一个向量到词表得分', '24:27', '24:24.4–24:29.8', 5.4, 4.4],
    randomA: ['随机初始化 · 权重与得分', '24:41', '24:40.3–24:46.0', 5.7, 2.8],
    randomB: ['随机初始化 · 做出预测', '24:41', '24:46.0–24:51.2', 5.2, 4],
    randomC: ['随机初始化 · 核对训练目标', '24:41', '24:51.2–24:56.8', 5.6, 3.6],
    randomD: ['随机初始化 · 反向传播与重复训练', '24:41', '24:56.8–25:03.0', 6.2, 4.7],
  };
  const [title, marker, range, duration, previewTime] = scenes[mode];

  function text(ctx, value, x, y, size = 48, color = '#f0f1ff', weight = 600) {
    label(ctx, value, x, y, { size, color, weight });
  }

  function panel(ctx, x, y, w, h, active = false) {
    box(ctx, x, y, w, h, 26, dark, active ? gold : '#7077b7');
  }

  function suppliedCaption(ctx, cues, time) {
    const entry = cues.findLast(([start]) => start <= time) || cues[0];
    subtitle(ctx, entry[1]);
  }

  function layeredBlocks(ctx, x, y, active, width = 395) {
    for (let depth = 2; depth > 0; depth--) {
      const offset = depth * 15;
      box(ctx, x + offset, y - offset, width, 321, 23, '#262250', '#545e9d');
    }
    panel(ctx, x, y, width, 321, active);
    text(ctx, 'Transformer 块', x + width / 2, y + 53, 48, active ? gold : cyan, 700);
    line(ctx, x + 30, y + 99, x + width - 30, y + 99, '#555d98', 1.2);
    text(ctx, '因果自注意力', x + width / 2, y + 152, 43);
    text(ctx, '前馈网络', x + width / 2, y + 221, 43);
    text(ctx, 'GPT‑3 175B · 96 层', x + width / 2, y + 282, 27, '#c4caef');
  }

  function drawExpansion(ctx, t) {
    text(ctx, 'GPT‑3 175B 的前馈网络', 960, 128, 64, gold, 700);
    const columns = [
      { x: 397, n: 5, count: '12,288', title: '输入词向量' },
      { x: 957, n: 11, count: '49,152', title: '隐藏层 · ×4' },
      { x: 1517, n: 5, count: '12,288', title: '输出词向量' },
    ];
    const active = t < .8 ? 0 : t < 2.5 ? 1 : 2;
    const rows = columns.map(({ n }) => Array.from({ length: n }, (_, index) => 521 + (index - (n - 1) / 2) * 39));
    for (let layer = 0; layer < 2; layer++) {
      for (const [i, from] of rows[layer].entries()) {
        for (const [j, to] of rows[layer + 1].entries()) {
          const strong = layer === active - 1 && (i + j) % 5 === 0;
          line(ctx, columns[layer].x + 54, from, columns[layer + 1].x - 54, to,
            strong ? cyan : (i + j) % 2 ? 'rgba(107,186,229,.29)' : 'rgba(246,178,108,.26)', strong ? 2.5 : 1);
        }
      }
    }
    for (const [index, { x, title, count }] of columns.entries()) {
      text(ctx, title, x, 236, 44, index === active ? gold : '#d5d9fb');
      rows[index].forEach((y) => pill(ctx, '', x, y, 108, 29, { active: index === active }));
      text(ctx, count, x, 806, 72, index === active ? gold : cyan, 700);
    }
    suppliedCaption(ctx, [
      [0, '它其实就是再接一个小神经网络'],
      [1, '词向量经过前馈网络，先升维四倍'],
      [2.55, '算完再回到 12,288 维'],
      [3.75, '更多神经元提供更多参数，提取更复杂的特征'],
    ], t);
  }

  const tokenNames = ['我', '养', '了', '一只', '猫', '它', '会', '捉'];
  function tokens(ctx, highlighted) {
    tokenNames.forEach((word, index) => {
      const picked = highlighted && index === tokenNames.length - 1;
      pill(ctx, word, 395 + 160 * index, 237, 135, 75, { size: 49, active: picked, color: picked ? gold : '#f3f1ff', weight: 700 });
    });
  }

  function drawPosition(ctx, t) {
    text(ctx, '最后一个位置', 960, 122, 68, gold, 700);
    tokens(ctx, t >= 1.7);
    const px = 1515;
    layeredBlocks(ctx, 313, 392, t < 3.4);
    for (let index = 0; index < tokenNames.length - 1; index++) {
      const x = 395 + 160 * index;
      line(ctx, x, 283, x, 320, 'rgba(130,177,236,.55)', 1.6);
      line(ctx, x, 320, px, 320, 'rgba(130,177,236,.22)', 1.1);
    }
    const focus = easing(t, 1.15, 3.42);
    arrow(ctx, px, 282, 1325, 468, focus > .3 ? gold : '#9096bf', 3, 22);
    panel(ctx, 956, 468, 678, 258, focus > .55);
    text(ctx, '已汇总上文的最后一个向量', 1295, 540, 52, focus > .55 ? gold : cyan, 700);
    text(ctx, '[0.62, −0.24, 0.53]', 1295, 648, 63);
    suppliedCaption(ctx, [
      [0, '注意力加前馈网络，合在一起算一层'],
      [1.7, '经过多层这样的计算后，最后一个位置上的向量'],
      [3.65, '已经浓缩了整段话最完整的上文信息'],
    ], t);
  }

  const exampleVector = [.62, -.24, .53];
  const lexicon = [
    { word: '老鼠', values: [.81, -.12, .64] }, { word: '小鱼', values: [.20, -.08, .51] },
    { word: '桌子', values: [.16, .38, .08] }, { word: '沙发', values: [-.40, .20, .21] },
  ].map((candidate) => ({
    ...candidate, score: candidate.values.reduce((sum, value, i) => sum + value * exampleVector[i], 0),
  }));

  function drawScores(ctx, t) {
    tokens(ctx, true);
    text(ctx, '三维得分示例', 960, 121, 62, gold, 700);
    layeredBlocks(ctx, 155, 442, t < 1.75);
    panel(ctx, 647, 455, 468, 214, t >= 1.15);
    text(ctx, '最后位置 · 三维示意', 881, 514, 42, cyan);
    text(ctx, '[0.62, −0.24, 0.53]', 881, 603, 44, t > 1.15 ? gold : '#f3f3ff');
    arrow(ctx, 578, 561, 639, 561, t >= 1.15 ? cyan : '#646ea7', 3, 19);
    arrow(ctx, 1120, 561, 1182, 561, t >= 2.25 ? cyan : '#646ea7', 3, 19);

    panel(ctx, 1190, 368, 556, 444, t >= 3.4);
    text(ctx, '和词表打分', 1468, 419, 49, cyan, 700);
    lexicon.forEach(({ word, values, score }, index) => {
      const y = 506 + index * 81;
      const winner = index === 0 && t >= 3.4;
      const color = winner ? gold : '#f3f3ff';
      if (winner) box(ctx, 1209, y - 29, 516, 58, 12, 'rgba(228,203,97,.15)');
      text(ctx, word, 1281, y, 45, color);
      text(ctx, values.map((value) => value.toFixed(2)).join(' / '), 1472, y, 32, '#c6d3ee');
      text(ctx, t >= 2.25 ? score.toFixed(3) : '…', 1680, y, 38, color, winner ? 700 : 500);
    });
    suppliedCaption(ctx, [
      [0, '这时，只要拿这最后一个向量，去和词表里所有词计算得分'],
      [2.68, '按最简单的筛选原则，得分最高的那个'],
      [4.28, '就是预测出的下一个词'],
    ], t);
  }

  // 用实采的随机初始权重重现同一训练示例，便于各段衔接。
  const weights = [-0.46512,-0.02158,-0.03826,-0.00378,0.21267,0.30941,0.04053,-0.45105,-0.43531,-0.44285,0.27078,-0.33669,-0.09021,-0.31723,-0.20525,-0.08233,0.07903,-0.43789,-0.11644,0.45128,-0.49574];
  const outcomes = ['桌子', '老鼠', '小鱼', '沙发'];
  const feature = [.8, -.25, .42];
  const target = 1;
  function exampleProbabilities() {
    const w = weights.slice();
    const trials = [];
    for (let iteration = 0; iteration <= 32; iteration++) {
      const hidden = Array.from({ length: 3 }, (_, i) =>
        Math.tanh(feature.reduce((sum, value, j) => sum + value * w[i * 3 + j], 0)));
      const logits = outcomes.map((_, i) =>
        hidden.reduce((sum, value, j) => sum + value * w[9 + i * 3 + j], 0));
      const exps = logits.map((value) => Math.exp(value - Math.max(...logits)));
      const total = exps.reduce((sum, value) => sum + value, 0);
      const probabilities = exps.map((value) => value / total);
      trials.push(probabilities);
      const logitError = probabilities.map((value, i) => value - (i === target ? 1 : 0));
      const hiddenError = hidden.map((value, j) =>
        logitError.reduce((sum, error, i) => sum + error * w[9 + i * 3 + j], 0) * (1 - value * value));
      for (const [i, error] of logitError.entries()) hidden.forEach((value, j) => { w[9 + i * 3 + j] -= .35 * error * value; });
      for (const [i, error] of hiddenError.entries()) feature.forEach((value, j) => { w[i * 3 + j] -= .35 * error * value; });
    }
    return trials;
  }

  function drawScoresBar(ctx, probabilities, chosen, x = 1030, y = 410) {
    outcomes.forEach((word, index) => {
      const row = y + index * 105;
      const color = index === chosen ? gold : cyan;
      text(ctx, word, x, row, 47, color, index === chosen ? 700 : 500);
      box(ctx, x + 105, row - 13, 424, 26, 8, '#343963');
      box(ctx, x + 105, row - 13, 424 * probabilities[index], 26, 8, color);
      text(ctx, (probabilities[index] * 100).toFixed(1) + '%', x + 601, row, 42, color);
    });
  }

  const trials = mode.startsWith('random') ? exampleProbabilities() : null;
  function drawTraining(ctx, t) {
    text(ctx, '我养了一只猫，它会捉…', 960, 135, 68, gold, 700);
    text(ctx, '三维训练示例', 960, 222, 36, '#c9c7ed', 600);
    layeredBlocks(ctx, 206, 411, mode === 'randomA' || mode === 'randomD');
    const backward = mode === 'randomD' && t < 2.65;
    if (backward) arrow(ctx, 936, 602, 667, 602, red, 3.5, 24);
    else arrow(ctx, 670, 602, 924, 602, cyan, 3.5, 24);

    if (mode === 'randomA') {
      panel(ctx, 961, 381, 737, 435);
      text(ctx, '随机抽样的初始权重', 1330, 446, 52, gold, 700);
      for (let row = 0; row < 3; row++) {
        const numbers = weights.slice(row * 3, row * 3 + 3);
        numbers.forEach((value, index) => pill(ctx, value.toFixed(4), 1128 + index * 196, 535 + row * 85, 167, 61,
          { size: 40, numeric: true, color: cyan, active: t > .55 + row * .6 }));
      }
      suppliedCaption(ctx, [
        [0, '刚开始训练时，模型的权重经过随机初始化'],
        [2.95, '所以最初得到的分数也会受这些随机权重影响'],
      ], t);
      return;
    }

    let step = 0;
    if (mode === 'randomD') step = Math.round(easing(t, .65, 5.55) * (trials.length - 1));
    panel(ctx, 936, 318, 795, 477, mode === 'randomC' || mode === 'randomD');
    const highlighted = mode === 'randomB' ? 0 : target;
    drawScoresBar(ctx, trials[step], highlighted);
    if (mode === 'randomB') {
      text(ctx, '初次预测', 411, 824, 44, gold);
      subtitle(ctx, '输入这句话，模型可能认为下一个词是“桌子”');
    } else if (mode === 'randomC') {
      text(ctx, '训练目标：老鼠', 411, 824, 51, gold, 700);
      const loss = -Math.log(trials[0][target]);
      text(ctx, '损失 = −ln(p老鼠) ≈ ' + loss.toFixed(3), 1326, 857, 40, red);
      suppliedCaption(ctx, [
        [0, '但训练数据会告诉它：正确答案是“老鼠”'],
        [2.6, '根据正确答案计算损失，准备更新参数'],
      ], t);
    } else {
      text(ctx, backward ? '反向传播' : '重复训练 · 第 ' + step + ' 次', 411, 824, 48, backward ? red : gold, 700);
      suppliedCaption(ctx, [
        [0, '然后通过反向传播调整模型里的参数'],
        [2.37, '增大这种情况下“老鼠”的得分'],
        [4.15, '模型在重复训练中把这个规律编进参数里'],
      ], t);
    }
  }

  function draw(ctx, t) {
    background(ctx);
    if (mode === 'ffn') drawExpansion(ctx, t);
    else if (mode === 'position') drawPosition(ctx, t);
    else if (mode === 'positionB' || mode === 'scores') drawScores(ctx, t);
    else drawTraining(ctx, t);
  }

  mountRevisionClip({ title, marker, range, duration, previewTime, description: title, draw });
  if (new URLSearchParams(location.search).has('render')) return;
  const sceneLinks = mode.startsWith('random') ? [
    ['2441-random-a', '随机权重'], ['2441-random-b', '初次预测'],
    ['2441-random-c', '训练目标'], ['2441-random-d', '反向传播与重复训练'],
  ] : (mode === 'position' || mode === 'positionB') ? [
    ['2421-last-position', '最后一个位置'], ['2421-last-position-b', '对词表打分'],
  ] : [];
  if (!sceneLinks.length) return;
  const nav = document.createElement('nav');
  nav.className = 'training-nav training-steps';
  nav.setAttribute('aria-label', '同一修改的其他片段');
  for (const [folder, caption] of sceneLinks) {
    const link = document.createElement('a');
    link.href = '../' + folder + '/';
    link.textContent = caption;
    if (location.pathname.endsWith('/' + folder + '/')) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  document.querySelector('.clip-header').after(nav);
})();
