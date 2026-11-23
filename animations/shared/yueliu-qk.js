'use strict';

(() => {
  const { background, label, pill, box, arrow, easing, subtitle } = nnlm;
  const gold = '#fff0a1';
  const cyan = '#c1f4ff';
  const lilac = '#d4ccff';
  const query = [0.60, -0.40, 0.80];
  const examples = [
    { word: '我', key: [-0.20, 0.30, 0.10] },
    { word: '猫', key: [0.80, -0.40, 0.80] },
    { word: '五岁', key: [0.10, -0.50, 0.15] },
  ];
  const rows = examples.map(({ word, key }) => {
    const products = key.map((value, index) => value * query[index]);
    return { word, key, products, score: products.reduce((sum, value) => sum + value, 0) };
  });
  const cat = rows[1];
  const denominator = rows.reduce((sum, row) => sum + Math.exp(row.score), 0);
  const number = value => value.toFixed(2).replace('-', '−');
  const percent = value => (100 * Math.exp(value) / denominator).toFixed(1) + '%';

  function vectorStage(ctx, time) {
    label(ctx, '它的 Q', 337, 276, { size: 52, color: cyan, weight: 700 });
    label(ctx, '猫的 K', 715, 276, { size: 52, color: lilac, weight: 700 });
    label(ctx, '逐项相乘', 1087, 276, { size: 48, color: '#e8e5ff', weight: 700 });

    cat.products.forEach((product, index) => {
      const y = 382 + index * 107;
      pill(ctx, number(query[index]), 337, y, 249, 66, { size: 48, color: cyan, numeric: true });
      pill(ctx, number(cat.key[index]), 715, y, 249, 66, { size: 48, color: lilac, numeric: true });
      label(ctx, '×', 526, y, { size: 44, color: '#e5e4ff' });
      label(ctx, '=', 897, y, { size: 44, color: '#e5e4ff' });
      const reveal = easing(time, 0.63 + index * 0.31, 1.17 + index * 0.31);
      ctx.save();
      ctx.globalAlpha = 0.33 + 0.67 * reveal;
      pill(ctx, reveal > 0.2 ? number(product) : '· · ·', 1087, y + (1 - reveal) * 10, 249, 66, {
        size: 48, color: gold, numeric: true, active: reveal > 0.65,
      });
      ctx.restore();
    });
  }

  function scoreStage(ctx, time) {
    const reveal = easing(time, 1.71, 2.28);
    ctx.save();
    ctx.globalAlpha = 0.28 + reveal * 0.72;
    arrow(ctx, 1248, 489, 1331, 489, gold, 3.2, 18);
    box(ctx, 1361, 337, 380, 304, 28, 'rgba(29, 28, 81, .8)', '#b7afd7');
    label(ctx, '相加得到得分', 1551, 400, { size: 43, color: '#eeeaff', weight: 700 });
    label(ctx, reveal > 0.20 ? number(cat.score) : '· · ·', 1551, 513, {
      size: 86, color: gold, weight: 700, numeric: true,
    });
    ctx.restore();
  }

  function weightsStage(ctx, time) {
    const reveal = easing(time, 2.5, 3.14);
    if (reveal === 0) return;
    ctx.save();
    ctx.globalAlpha = reveal;
    label(ctx, '三个词的得分经 Softmax 转成权重', 960, 727, { size: 43, color: '#e8e5ff', weight: 600 });
    rows.forEach(({ word, score }, index) => {
      const x = 465 + index * 495;
      const highlight = word === cat.word;
      const color = highlight ? gold : '#dddfff';
      box(ctx, x - 217, 786, 434, 126, 24, 'rgba(28, 29, 79, .79)', highlight ? '#ffe66f' : '#8f8bb5');
      label(ctx, word, x - 144, 848, { size: 52, color, weight: 700 });
      label(ctx, number(score), x + 1, 848, { size: 38, color: '#d9d8f0', numeric: true });
      label(ctx, '→', x + 69, 848, { size: 37, color: '#d9d8f0' });
      label(ctx, percent(score), x + 149, 848, { size: 43, color, weight: 700, numeric: true });
    });
    ctx.restore();
  }

  function draw(ctx, time) {
    background(ctx);
    label(ctx, 'Q 和 K 怎么算出注意力权重？', 960, 136, { size: 59, color: '#f7f6ff', weight: 700 });
    label(ctx, '用「我」「猫」「五岁」三个词演示', 960, 200, { size: 38, color: '#d7d8ff' });
    vectorStage(ctx, time);
    scoreStage(ctx, time);
    weightsStage(ctx, time);
    subtitle(ctx, time < 2.64 ? '对应分量相乘后相加，得到每个词的得分' : '把所有示例得分归一化，得到各词的关注比例');
  }

  mountRevisionClip({
    title: '从 Q、K 点积到注意力权重',
    description: '以三个词为例，依次显示 Q 和 K 的各分量乘积、点积得分与归一化后的权重。',
    marker: '23:58',
    range: '23:57.20–24:01.60',
    duration: 4.4,
    previewTime: 3.76,
    backHref: '../../#yueliu-2358',
    draw,
  });
})();
