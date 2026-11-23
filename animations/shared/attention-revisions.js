'use strict';

(() => {
  const id = document.currentScript.dataset.revision;
  const { background, label, pill, box, arrow, easing, subtitle } = nnlm;
  const cyan = '#a8edf9';
  const gold = '#ffe28b';
  const violet = '#b3b7ff';
  const panel = 'rgba(14, 19, 60, .73)';
  const rim = 'rgba(168, 185, 247, .72)';
  const query = [0.461, -0.476, -0.624];
  const samples = [
    { word: '我', key: [0.220, 0.290, 0.700], value: [-0.143, -0.495, 1.353], tint: '#b6a7fa' },
    { word: '这只', key: [-0.120, 0.360, 0.220], value: [-0.546, -0.426, 0.334], tint: '#9cccf7' },
    { word: '猫', key: [-0.151, -0.573, -0.321], value: [-0.573, 4.341, 5.417], tint: gold },
    { word: '五岁', key: [0.020, -0.120, 0.190], value: [-0.022, -0.691, -0.190], tint: '#bfd1f8' },
    { word: '它', key: [-0.040, 0.880, 0.570], value: [-0.324, -0.229, 0.082], tint: cyan },
  ];
  const own = samples.at(-1);
  const cat = samples[2];
  for (const sample of samples) {
    sample.score = query.reduce((sum, entry, index) => sum + entry * sample.key[index], 0) / Math.sqrt(3);
  }
  const normalizer = samples.reduce((denom, sample) => denom + Math.exp(sample.score), 0);
  const result = [0, 0, 0];
  for (const sample of samples) {
    const weight = Math.exp(sample.score) / normalizer;
    sample.value.forEach((entry, index) => {
      result[index] += entry * weight;
    });
  }

  const decimals = value => (Object.is(value, -0) ? 0 : value).toFixed(3).replace('-', '−');
  const mix = (from, to, amount) => from + (to - from) * amount;
  const interpolatedVector = (from, to, amount) => from.map((entry, index) => mix(entry, to[index], amount));

  function block(ctx, x, y, w, h, edge = rim) {
    box(ctx, x, y, w, h, 22, panel, edge);
  }

  function sequence(ctx, x, y, target, maxWidth = 1500) {
    const tokens = ['我养的这只', '猫', '已经五岁了，', '它', '会抓老鼠。'];
    ctx.font = '600 61px "Microsoft YaHei", sans-serif';
    const widths = tokens.map(token => ctx.measureText(token).width);
    const full = Math.min(maxWidth, widths.reduce((sum, width) => sum + width, 0));
    let offset = x - full / 2;
    tokens.forEach((token, index) => {
      const width = widths[index];
      const active = token === target;
      if (active) box(ctx, offset - 7, y - 43, width + 14, 86, 13, 'rgba(236, 208, 106, .19)', gold);
      label(ctx, token, offset + width / 2, y, { size: 61, color: active ? gold : '#edf1fb', weight: 600 });
      offset += width;
    });
  }

  function axes(ctx, t) {
    background(ctx, true);
    sequence(ctx, 960, 153, '它');
    const startX = 492, startY = 807;
    const projection = (values) => [
      startX + values[0] * 114 + values[2] * 65,
      startY - values[1] * 107 - values[2] * 21,
    ];
    arrow(ctx, 205, startY, 952, startY, '#8caffb', 2.6);
    arrow(ctx, startX, 898, startX, 272, '#86eab5', 2.6);
    arrow(ctx, 265, 880, 827, 699, '#d4a2f6', 2.6);
    label(ctx, 'X', 988, startY, { size: 48, color: '#8caffb' });
    label(ctx, 'Y', startX, 239, { size: 48, color: '#86eab5' });
    label(ctx, 'Z', 856, 685, { size: 48, color: '#d4a2f6' });
    box(ctx, startX - 5, startY - 5, 10, 10, 5, '#dbf5ff');

    const progress = easing(t, 1.72, 3.18);
    const current = interpolatedVector(own.value, result, progress);
    const [catX, catY] = projection(cat.value);
    const [itX, itY] = projection(current);
    arrow(ctx, startX, startY, catX, catY, gold, 4.6, 23);
    label(ctx, '猫', catX + 44, catY - 12, { size: 56, color: gold, weight: 700 });
    arrow(ctx, startX, startY, itX, itY, cyan, 4.1, 18);
    label(ctx, '它', itX - 34, itY - 19, { size: 50, color: cyan, weight: 700 });

    block(ctx, 1116, 281, 564, 570, violet);
    label(ctx, t < 2.3 ? '“它”的 V 向量' : '“它”的新 V 向量', 1398, 357, { size: 63, weight: 700, color: cyan });
    label(ctx, '3 个分量', 1398, 442, { size: 48, color: '#c6d9f6' });
    current.forEach((entry, index) => {
      const y = 543 + 100 * index;
      const colors = ['#8caffb', '#86eab5', '#d4a2f6'];
      label(ctx, ['X', 'Y', 'Z'][index], 1227, y, { size: 49, color: colors[index] });
      pill(ctx, decimals(entry), 1457, y, 265, 73, { size: 54, numeric: true });
    });
    subtitle(ctx, t < 2.16 ? '原来的“它”只是一个很模糊的代词' : '但经过这次注意力计算之后');
  }

  const revisions = {
    '2234': {
      title: '直接切到“猫”和“五岁”', marker: '22:34', range: '22:34.0–22:38.8',
      duration: 4.8, previewTime: 1.75, modifiedVideo: './modified.mp4', revisedDuration: 2.12,
      description: '直接切到“猫”“已”“经”“五岁”的对应内容。',
    },
    '2309': {
      title: '跳过 23:09 的闪切', marker: '23:09', range: '23:08.2–23:10.8',
      duration: 2.6, previewTime: 1.05, modifiedVideo: './modified.mp4', revisedDuration: 1.68,
      description: '从得分画面直接切到依据查询排序的画面。',
    },
    '2312': {
      title: '在同一画面引出 V', marker: '23:12', range: '23:12.6–23:18.8',
      duration: 6.2, previewTime: 5.88, modifiedVideo: './modified.mp4',
      description: '保留 Q、K 和得分。说到 V 时，V 在原位置下方出现。',
    },
    '2323': {
      title: '用柱状图标出不同得分', marker: '23:23', range: '23:21.4–23:26.6',
      duration: 5.2, previewTime: 4.10, modifiedVideo: './modified.mp4',
      description: '始终显示同一组向量，将 Q 与 K 的得分转换成可比较的权重比例。',
    },
    '2338': {
      title: '展示“它”的 V 并按比例合并', marker: '23:38', range: '23:36.0–23:40.6',
      duration: 4.6, previewTime: .91, modifiedVideo: './modified.mp4',
      description: '每个词的向量按权重相加，包括“它”原来的 V。',
    },
    '2342': {
      title: '坐标轴和词向量统一为三维', marker: '23:42', range: '23:41.6–23:45.6',
      duration: 4, previewTime: 3.1, draw: axes,
      description: '左侧是 X、Y、Z 三维坐标，右侧对应显示三个分量。',
    },
    '2359': {
      title: '后续加权和合并保持三维', marker: '23:59', range: '23:58.0–24:03.2',
      duration: 5.2, previewTime: 4.20, modifiedVideo: './modified.mp4',
      description: '继续用同一组词的三个分量乘各自权重后相加。',
    },
  };
  const config = revisions[id];
  mountRevisionClip(config);

  const modifiedHeading = document.querySelector('#modified-heading');
  if (config.revisedDuration && modifiedHeading) {
    document.querySelector('#original-heading').textContent = '原片 · ' + config.duration.toFixed(1) + ' 秒';
    modifiedHeading.textContent = '修改后 · ' + config.revisedDuration.toFixed(2) + ' 秒';
  }
})();
