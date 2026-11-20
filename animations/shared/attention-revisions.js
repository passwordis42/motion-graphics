'use strict';

(() => {
  const id = document.currentScript.dataset.revision;
  const { background, label, pill, box, line, arrow, easing, subtitle } = nnlm;
  const cyan = '#a8edf9';
  const gold = '#ffe28b';
  const violet = '#b3b7ff';
  const barTrack = '#252451';
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
    sample.weight = Math.exp(sample.score) / normalizer;
    sample.term = sample.value.map((entry, index) => {
      const scaled = entry * sample.weight;
      result[index] += scaled;
      return scaled;
    });
  }

  const decimals = value => (Object.is(value, -0) ? 0 : value).toFixed(3).replace('-', '−');
  const vectorText = values => '[' + values.map(decimals).join(', ') + ']';
  const percent = value => (value * 100).toFixed(1) + '%';
  const mix = (from, to, amount) => from + (to - from) * amount;
  const interpolatedVector = (from, to, amount) => from.map((entry, index) => mix(entry, to[index], amount));

  function fade(ctx, alpha, draw) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    draw();
    ctx.restore();
  }

  function block(ctx, x, y, w, h, edge = rim) {
    box(ctx, x, y, w, h, 22, panel, edge);
  }

  function heading(ctx, title, caption) {
    label(ctx, title, 960, 123, { size: 67, weight: 700, color: '#f3f5ff' });
    if (caption) label(ctx, caption, 960, 205, { size: 49, color: '#c8d3f2' });
  }

  function number(ctx, value, x, y, color = '#eef5ff', size = 49) {
    label(ctx, value, x, y, { size, color, numeric: true, weight: 600 });
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

  function continuousV(ctx, t) {
    background(ctx);
    sequence(ctx, 960, 164, '它');
    block(ctx, 142, 252, 1636, 602);
    label(ctx, '用 Q、K 计算应关注谁、关注多少', 950, 315, { size: 50, weight: 700 });
    pill(ctx, '它的 Q', 275, 470, 204, 74, { size: 48, color: cyan, active: true });
    arrow(ctx, 386, 470, 490, 470, cyan, 2.3);
    for (const [index, sample] of samples.entries()) {
      const x = 612 + index * 238;
      pill(ctx, sample.word + '的 K', x, 463, 187, 68, {
        size: 44, color: sample.tint, active: sample === cat,
      });
      number(ctx, decimals(sample.score), x, 544, sample.tint, 43);
    }
    line(ctx, 201, 602, 1716, 602, 'rgba(169,185,247,.44)', 1.5);
    const reveal = easing(t, 3.87, 4.55);
    fade(ctx, reveal, () => {
      label(ctx, '真正存储词向量信息的是 V', 950, 670, { size: 55, weight: 700, color: gold });
      for (const [index, sample] of samples.entries()) {
        pill(ctx, sample.word + '的 V', 612 + index * 238, 768, 187, 67, {
          size: 43, color: sample.tint, active: sample === own,
        });
      }
    });
    const cue = t < 1.15 ? '我们刚才拿Q和K算出来的'
      : t < 3.86 ? '只是应该关注谁以及关注多少'
        : t < 5.55 ? '真正用来存储词向量信息的' : '是第三个向量V';
    subtitle(ctx, cue);
  }

  function scoreBars(ctx, t) {
    background(ctx);
    heading(ctx, '按照得分分配注意力权重', '同一组 V 始终保留在画面中');
    block(ctx, 215, 278, 1490, 591);
    label(ctx, '词', 344, 328, { size: 48, weight: 700 });
    label(ctx, '三维词向量 V', 677, 328, { size: 48, weight: 700 });
    const scaled = easing(t, 1.36, 2.27);
    const labelWeights = t >= 1.62;
    label(ctx, labelWeights ? '相对比例' : '相关度得分', 1265, 328, { size: 48, weight: 700 });
    for (const [index, sample] of samples.entries()) {
      const y = 421 + 90 * index;
      const appear = easing(t, .1 + index * .10, .87 + index * .10);
      pill(ctx, sample.word, 344, y, 130, 62, { size: 48, color: sample.tint, active: sample === cat });
      number(ctx, vectorText(sample.value), 708, y, '#eaf1ff', 39);
      box(ctx, 980, y - 12, 480, 24, 12, barTrack);
      const travel = mix((sample.score + 0.56) / 0.85, sample.weight, scaled);
      const width = Math.max(4, travel * 460 * appear);
      box(ctx, 980, y - 12, width, 24, 12, sample.tint);
      number(ctx, labelWeights ? percent(sample.weight) : decimals(sample.score), 1566, y, sample.tint, 46);
    }
    subtitle(ctx, t < 1.90 ? '模型会按照刚才询问提出的得分大小' : '按比例把每个词的V拿过来');
  }

  function mergeRows(ctx, t) {
    background(ctx);
    heading(ctx, '按比例合并成“它”的新 V', '示意使用同一组词的三维向量');
    const partial = [0, 0, 0];
    for (const [index, sample] of samples.entries()) {
      const y = 330 + index * 115;
      const progress = easing(t, .72 + index * .31, 1.38 + index * .31);
      for (let dimension = 0; dimension < 3; dimension++) partial[dimension] += progress * sample.term[dimension];
      block(ctx, 125, y - 43, 920, 86, sample === own ? cyan : rim);
      label(ctx, sample.word + '的 V', 248, y, { size: 47, weight: 700, color: sample.tint });
      number(ctx, vectorText(sample.value), 594, y, '#eaf0ff', 36);
      number(ctx, '× ' + percent(sample.weight), 933, y, sample.tint, 41);
      fade(ctx, progress, () => {
        arrow(ctx, 1065, y, 1260, 554, sample.tint, 2.2);
        const x = mix(1071, 1244, progress);
        const py = mix(y, 554, progress);
        box(ctx, x - 5, py - 5, 10, 10, 5, sample.tint);
      });
    }
    block(ctx, 1265, 330, 470, 420, gold);
    label(ctx, '“它”的新 V', 1501, 393, { size: 57, color: gold, weight: 700 });
    for (const [index, value] of partial.entries()) {
      pill(ctx, decimals(value), 1500, 485 + 91 * index, 264, 66, {
        size: 55, color: '#f2f5ff', numeric: true, active: t > 2.60,
      });
    }
    subtitle(ctx, t < 2.12 ? '然后把这些信息全部加在一起' : '合并成一个“它”的新的V向量');
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

  function keepThree(ctx, t) {
    background(ctx);
    heading(ctx, '三维向量乘权重后再相加', '每个词的 V 保留同样的三个分量');
    const scale = easing(t, 1.12, 2.95);
    const merge = easing(t, 3.15, 4.11);
    for (const [sampleIndex, sample] of samples.entries()) {
      const x = 327 + sampleIndex * 316;
      const y = 459;
      const values = interpolatedVector(sample.value, sample.term, scale);
      block(ctx, x - 134, 286, 268, 415, sample.tint);
      label(ctx, sample.word + '的 V', x, 342, { size: 53, color: sample.tint, weight: 700 });
      values.forEach((entry, i) => {
        pill(ctx, decimals(entry), x, y + i * 68, 181, 54, { size: 43, numeric: true, color: '#edf5ff' });
      });
      label(ctx, (scale >= 1 ? '权重 ' : '× ') + percent(sample.weight), x, 660, { size: 40, color: sample.tint, weight: 600 });
      fade(ctx, merge, () => arrow(ctx, x, 706, 960, 783, sample.tint, 2.4, 15));
    }
    fade(ctx, merge, () => {
      block(ctx, 565, 786, 790, 128, gold);
      label(ctx, '新 V（它）', 714, 851, { size: 47, color: gold, weight: 700 });
      number(ctx, vectorText(result), 1094, 851, cyan, 42);
    });
    subtitle(ctx, t < .98 ? '得分决定权重'
      : t < 3.44 ? '让每个词的V分别乘上自己的权重' : '把加权后的三维向量相加');
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
      duration: 6.2, previewTime: 5.35, draw: continuousV,
      description: '保留 Q、K 和得分。说到 V 时，V 在原位置下方出现。',
    },
    '2323': {
      title: '用柱状图标出不同得分', marker: '23:23', range: '23:21.4–23:26.6',
      duration: 5.2, previewTime: 3.45, draw: scoreBars,
      description: '始终显示同一组向量，将 Q 与 K 的得分转换成可比较的权重比例。',
    },
    '2338': {
      title: '展示“它”的 V 并按比例合并', marker: '23:38', range: '23:36.0–23:40.6',
      duration: 4.6, previewTime: 3.2, draw: mergeRows,
      description: '每个词的向量按权重相加，包括“它”原来的 V。',
    },
    '2342': {
      title: '坐标轴和词向量统一为三维', marker: '23:42', range: '23:41.6–23:45.6',
      duration: 4, previewTime: 3.1, draw: axes,
      description: '左侧是 X、Y、Z 三维坐标，右侧对应显示三个分量。',
    },
    '2359': {
      title: '后续加权和合并保持三维', marker: '23:59', range: '23:58.0–24:03.2',
      duration: 5.2, previewTime: 4.44, draw: keepThree,
      description: '继续用同一组词的三个分量乘各自权重后相加。',
    },
  };
  const config = revisions[id];
  mountRevisionClip(config);

  if (config.revisedDuration) {
    document.querySelector('#original-heading').textContent = '原片 · ' + config.duration.toFixed(1) + ' 秒';
    document.querySelector('#modified-heading').textContent = '修改后 · ' + config.revisedDuration.toFixed(2) + ' 秒';
  }
})();
