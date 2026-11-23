'use strict';

(() => {
  const { background, line, box, label, pill, easing, arrow, subtitle } = nnlm;
  const words = ['猫', '会', '抓', '老', '鼠'];
  const inputValues = [0.2, -0.1, 0.4, -0.3, 0.2, 0.1, 0.5, 0.1, -0.2];
  const weightsBefore = [-0.095, 0.048, -0.190, 0.143, -0.095, -0.048, -0.238, -0.048, 0.095];
  const weightsAfter = [-0.092, 0.047, -0.185, 0.139, -0.092, -0.047, -0.232, -0.047, 0.092];
  const gold = '#f9e777';
  const cyan = '#8dffeb';
  const violet = '#d1cfff';
  const steel = 'rgba(173,180,255,.48)';
  const navy = 'rgba(12,17,65,.88)';
  const dot = (ctx, x, y, radius, fill) => box(ctx, x - radius, y - radius, radius * 2, radius * 2, radius, fill);
  const mix = (a, b, p) => a + (b - a) * p;
  const number = (value, decimals = 3) => value.toFixed(decimals).replace('-', '−');
  const positions = (count, start, step) => Array.from({ length: count }, (_, index) => start + index * step);
  const sourceStyle = { numeric: true, size: 34, weight: 650 };

  function caption(ctx, text, opacity = 1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    subtitle(ctx, text);
    ctx.restore();
  }

  function smallNetwork(ctx, x, y, kind, progress) {
    const isShape = kind === 'shape';
    const input = positions(9, y + 102, 51);
    const hidden = positions(3, y + 147, 160);
    const output = isShape ? [y + 307] : positions(5, y + 117, 95);
    const lanes = [x + 244, x + 462, x + 625];
    const lineOpacity = 0.24 + progress * 0.38;

    label(ctx, isShape ? '分辨正方形' : '预测下一个词', x + 335, y, { size: 58, weight: 720 });
    ['输入层', '隐藏层', '输出层'].forEach((name, index) => {
      label(ctx, name, lanes[index], y + 59, { size: 35, weight: 650, color: violet });
    });

    if (isShape) {
      box(ctx, x + 12, y + 226, 128, 128, 7, 'rgba(80,82,173,.43)', violet);
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          const border = row === 0 || row === 4 || column === 0 || column === 4;
          box(ctx, x + 27 + column * 20, y + 241 + row * 20, 18, 18, 2,
            border ? 'rgba(169,184,244,.68)' : navy);
        }
      }
      arrow(ctx, x + 146, y + 290, x + 212, y + 290, steel, 2, 12);
    } else {
      words.slice(0, 3).forEach((word, index) => {
        const center = input[index * 3 + 1];
        pill(ctx, word, x + 70, center, 81, 58, { size: 40, color: gold, weight: 650 });
        line(ctx, x + 112, center, lanes[0] - 13, input[index * 3], steel, 1.6);
        line(ctx, x + 112, center, lanes[0] - 13, center, steel, 1.6);
        line(ctx, x + 112, center, lanes[0] - 13, input[index * 3 + 2], steel, 1.6);
      });
    }

    for (const [index, start] of input.entries()) {
      for (const [column, end] of hidden.entries()) {
        const rgb = (index + column) % 3 === 0 ? '103,233,217' : '244,194,112';
        line(ctx, lanes[0] + 9, start, lanes[1] - 11, end, `rgba(${rgb},${lineOpacity})`, 1.5);
      }
    }
    hidden.forEach((start, index) => output.forEach(end => {
      line(ctx, lanes[1] + 11, start, lanes[2] - 28, end, index === 1 ? 'rgba(120,238,224,.45)' : steel, 1.7);
    }));
    input.forEach(start => dot(ctx, lanes[0], start, 9, violet));
    hidden.forEach(start => dot(ctx, lanes[1], start, 13, progress > .3 ? gold : violet));
    output.forEach((start, index) => pill(ctx, isShape ? '是' : words[index], lanes[2], start, 66, 48,
      { size: 34, color: index === 3 || isShape ? gold : violet, weight: 650 }));
  }

  function classifier(ctx, t) {
    background(ctx);
    const reveal = easing(t, .2, .93);
    const connect = easing(t, .86, 1.74);
    smallNetwork(ctx, 156, 235, 'shape', reveal);
    line(ctx, 960, 280, 960, 760, 'rgba(190,198,255,.22)', 2);
    ctx.save();
    ctx.globalAlpha = .25 + .75 * reveal;
    smallNetwork(ctx, 1070, 235, 'next-word', connect);
    ctx.restore();
    if (connect > 0) {
      ctx.save();
      ctx.globalAlpha = connect;
      arrow(ctx, 918, 540, 1001, 540, cyan, 3, 18);
      ctx.restore();
    }
    caption(ctx, '这个结构和上文分辨正方形的网络很像', easing(t, .15, .42));
  }

  const feed = {
    inputs: positions(9, 180, 85),
    hidden: [225, 520, 815],
    outputs: positions(5, 213, 154),
    xInput: 525,
    xWeight: 784,
    xHidden: 1115,
    xOutput: 1580,
  };

  function feedForward(ctx, { selected, outputText, labels, values, updateGlow = 0, focusToken = false }) {
    const { inputs, hidden, outputs, xInput, xWeight, xHidden, xOutput } = feed;
    label(ctx, '输入层', xInput, 99, { size: 47, weight: 680 });
    label(ctx, '隐藏层', xHidden, 99, { size: 47, weight: 680 });
    label(ctx, '输出层', xOutput, 99, { size: 47, weight: 680 });
    if (labels > .01) {
      ctx.save();
      ctx.globalAlpha = labels;
      label(ctx, '连线权重', xWeight, 99, { size: 36, color: cyan, weight: 650 });
      ctx.restore();
    }

    for (const [i, y] of inputs.entries()) {
      for (const [j, target] of hidden.entries()) {
        const active = j === 1 && labels > 0;
        const tint = (i + j) % 3 === 0 ? '99,232,209' : '224,167,104';
        const opacity = active ? .62 + updateGlow * .26 : .28;
        line(ctx, xInput + 79, y, xHidden - 85, target, `rgba(${tint},${opacity})`, active ? 2.5 : 1.55);
      }
    }
    hidden.forEach((y, i) => outputs.forEach(end => {
      const tint = i === 1 && selected ? 'rgba(247,222,107,.63)' : 'rgba(138,148,220,.29)';
      line(ctx, xHidden + 85, y, xOutput - 88, end, tint, i === 1 && selected ? 2.4 : 1.35);
    }));

    words.slice(0, 3).forEach((token, i) => {
      const middle = inputs[i * 3 + 1];
      pill(ctx, token, 262, middle, 80, 64, { size: 47, color: gold, weight: 700 });
      line(ctx, 319, inputs[i * 3] - 24, 319, inputs[i * 3 + 2] + 24, steel, 2);
      line(ctx, 302, middle, 319, middle, steel, 2);
      for (let k = 0; k < 3; k += 1) line(ctx, 319, inputs[i * 3 + k], xInput - 80, inputs[i * 3 + k], steel, 2);
    });

    inputs.forEach((y, i) => {
      pill(ctx, number(inputValues[i], 1), xInput, y, 158, 54, {
        ...sourceStyle, color: gold,
      });
      if (labels < .01) return;
      const weightX = xWeight;
      const pathFraction = (weightX - xInput - 79) / (xHidden - 85 - xInput - 79);
      const weightY = mix(y, hidden[1], pathFraction);
      const changed = values[i] !== weightsBefore[i];
      ctx.save();
      ctx.globalAlpha = labels;
      const tint = changed && updateGlow > .1 ? gold : i % 3 === 0 ? cyan : violet;
      box(ctx, weightX - 68, weightY - 24, 136, 48, 12, navy, changed ? 'rgba(248,226,130,.65)' : 'rgba(162,173,244,.55)');
      label(ctx, number(values[i]), weightX, weightY, { ...sourceStyle, color: tint, size: 39 });
      ctx.restore();
    });

    hidden.forEach((y, i) => pill(ctx, outputText[i], xHidden, y, 170, 60, {
      size: 38, weight: 700, color: selected && i === 1 ? gold : violet,
      active: selected && i === 1,
    }));
    outputs.forEach((y, i) => pill(ctx, words[i], xOutput, y, 178, 67, {
      size: 45, weight: 700, color: focusToken && i === 3 ? gold : violet,
      active: focusToken && i === 3,
    }));
  }

  function weightedCue(ctx, t) {
    background(ctx);
    const onset = 1.43;
    const weightsIn = easing(t, onset, onset + .32);
    const summed = t >= 2.48;
    const results = t >= 4.48;
    feedForward(ctx, {
      selected: summed,
      outputText: results ? ['得分 1', '得分 2', '得分 3'] : ['●', summed ? 'Σ' : '●', '●'],
      labels: weightsIn,
      values: weightsBefore,
      updateGlow: .50 * (1 - easing(t, onset + .32, 2.72)),
    });
    const text = results ? '产生三个不同的总分'
      : summed ? '再全部加起来得到总分'
      : '输入层的数字也会乘以每条线上的权重';
    caption(ctx, text);
  }

  function stableNumbers(ctx, t) {
    background(ctx);
    const state = weightsBefore.map((weight, index) => {
      const p = easing(t, .46 + index * .23, 1.03 + index * .23);
      return Math.round(mix(weight, weightsAfter[index], p) * 1000) / 1000;
    });
    const emphasis = easing(t, .36, .62) * (1 - easing(t, 2.67, 3.25));
    const prediction = t >= 1.90;
    feedForward(ctx, {
      selected: prediction,
      outputText: ['0.600', '−0.300', '0.500'],
      labels: 1,
      values: state,
      updateGlow: emphasis,
      focusToken: prediction,
    });
    caption(ctx, prediction ? '增大神经网络预测出“老”字的概率' : '调整神经网络里每一个参数');
  }

  const beforeTable = [
    [0.200, -0.100, 0.400, 0.350],
    [-0.300, 0.200, 0.100, -0.190],
    [0.500, 0.100, -0.200, 0.170],
    [-0.100, 0.300, 0.200, -0.050],
    [0.400, -0.200, 0.300, 0.450],
  ];
  const afterTable = [
    [-0.225, 0.038, 0.426, 0.118],
    [-0.288, 0.230, 0.331, 0.016],
    [0.427, 0.188, -0.379, -0.001],
    [-0.300, 0.700, 0.100, 0.404],
    [-0.200, 0.600, 0.300, 0.266],
  ];

  function lossTiming(ctx, t) {
    background(ctx);
    const update = easing(t, .20, 1.68);
    const focus = easing(t, 1.93, 2.40);
    const columns = [416, 824, 1107, 1374, 1628];
    const rows = beforeTable.map((row, i) => row.map((value, j) => mix(value, afterTable[i][j], update)));
    const exponents = rows.map(row => Math.exp(row[3]));
    const total = exponents.reduce((sum, value) => sum + value, 0);
    const probabilities = exponents.map(value => value / total);
    const panel = ctx.createLinearGradient(0, 190, 0, 874);
    panel.addColorStop(0, 'rgba(108,95,218,.60)');
    panel.addColorStop(.60, 'rgba(32,36,115,.48)');
    panel.addColorStop(1, 'rgba(65,49,151,.57)');
    box(ctx, columns[2] - 114, 196, 228, 681, 27, panel);
    ['词向量', '得分', '预测概率', '正确概率', '损失值'].forEach((heading, i) => {
      label(ctx, heading, columns[i], 120, { size: 45, color: violet, weight: 690 });
    });

    rows.forEach((row, i) => {
      const center = 254 + i * 139;
      const correct = i === 3;
      if (correct && focus > 0) {
        const light = ctx.createLinearGradient(136, 0, 1770, 0);
        light.addColorStop(0, 'rgba(101,102,246,.10)');
        light.addColorStop(.62, `rgba(147,117,242,${focus * .30})`);
        light.addColorStop(1, 'rgba(109,88,209,.10)');
        box(ctx, 130, center - 51, 1651, 102, 20, light, `rgba(205,173,249,${focus * .65})`);
      }
      const accent = correct && focus > .2 ? gold : violet;
      pill(ctx, words[i], 205, center, 87, 67, { size: 46, weight: 690, color: accent, active: correct && focus > .2 });
      pill(ctx, row.slice(0, 3).map(value => number(value)).join('  '), 469, center, 411, 67,
        { ...sourceStyle, size: 36, color: accent });
      pill(ctx, number(row[3]), columns[1], center, 177, 67, { ...sourceStyle, size: 42, color: accent });
      label(ctx, `${(probabilities[i] * 100).toFixed(1)}%`, columns[2], center, {
        ...sourceStyle, size: correct ? 48 : 43, color: correct ? gold : '#dfd9ff',
      });
      pill(ctx, correct ? '100%' : '0%', columns[3], center, 173, 67, { ...sourceStyle, size: 42, color: accent });
      pill(ctx, correct ? (-Math.log(probabilities[i])).toFixed(3) : '0', columns[4], center, 173, 67,
        { ...sourceStyle, size: 42, color: accent });
    });
    caption(ctx, t < 1.93 ? '词向量里的数也在被同步调整' : '目的也是让“老”字更容易被预测出来');
  }

  const clip = {
    1436: {
      marker: '14:36', title: '更换神经网络示意素材', range: '14:34.8–14:38.0',
      duration: 3.2, previewTime: 2.15, draw: classifier,
      description: '用新绘制的并排网络简图，把分辨正方形与预测下一个词对应起来。',
    },
    1445: {
      marker: '14:45', title: '连线权重数字与口播对齐', range: '14:38.2–14:43.6',
      duration: 5.4, previewTime: 2.10, draw: weightedCue,
      note: '14:45 是悦流标记位置。本段从原片 14:38.2 开始，便于对比约 14:39.6 的口播和约 14:42 的原片数字入场。',
      description: '口播说到“每条线上的权重”时让权重直接出现在对应连线上，随后才聚合。',
    },
    1550: {
      marker: '15:50', title: '固定网络中的数字位置', range: '15:48.6–15:52.6',
      duration: 4.0, previewTime: 2.55, draw: stableNumbers,
      description: '保持画幅、节点与数字标签的锚点固定，用等宽数字展示权重更新。',
    },
    1557: {
      marker: '15:57', title: '概率与损失画面的卡点', range: '15:55.6–16:00.0',
      duration: 4.4, previewTime: 3.15, draw: lossTiming,
      description: '词向量、得分、概率与损失一起更新，之后高亮“老”字的预测概率。',
    },
  };
  const clipKey = document.currentScript.dataset.clip;
  const activeClip = clip[clipKey];

  mountRevisionClip({ ...activeClip, backHref: `../../#yueliu-${clipKey}` });
  if (activeClip.note) {
    const note = document.createElement('p');
    note.textContent = activeClip.note;
    document.querySelector('.clip-header').append(note);
  }
})();
