'use strict';

(() => {
  const source = document.currentScript.dataset.clip;
  const { arrow, background, box, easing, label, line } = nnlm;
  const paper = '#fafaff';
  const lemon = '#ffe183';
  const aqua = '#9af2f4';
  const lilac = '#c4b3ff';

  function heading(ctx, text, y = 140, size = 70) {
    label(ctx, text, 960, y, { size, color: paper, weight: 700 });
  }

  function caption(ctx, text) {
    ctx.save();
    ctx.shadowColor = '#020513';
    ctx.shadowBlur = 9;
    box(ctx, 85, 946, 1750, 93, 20, '#0a1028');
    label(ctx, text, 960, 993, { size: 50, color: paper, weight: 700 });
    ctx.restore();
  }

  function drawMobileType(ctx, t) {
    background(ctx, true);
    heading(ctx, 'Transformer', 138, 78);
    label(ctx, '注意力机制', 960, 238, { size: 64, weight: 700, color: aqua });

    const tokens = ['我', '养', '的', '这', '只', '猫', '已经', '五岁', '了，', '它', '会', '抓', '老鼠。'];
    const linkAt = [0, 2, 4, 5, 6, 7, 8];
    const tokenFont = '700 65px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.font = tokenFont;
    const widths = tokens.map((token) => ctx.measureText(token).width + 18);
    const wordWidth = widths.reduce((sum, width) => sum + width, 0);
    let x = (1920 - wordWidth) / 2;
    const positions = widths.map((width) => {
      const center = x + width / 2;
      x += width;
      return center;
    });

    box(ctx, 125, 332, 1670, 487, 30, '#101d3e', '#384568');
    for (const [index, end] of linkAt.entries()) {
      const from = positions[end];
      const to = positions[9];
      const rise = 100 + 26 * (linkAt.length - index);
      const progress = easing(t, 0.30 + index * 0.12, 1.10 + index * 0.14);
      ctx.save();
      ctx.globalAlpha = progress * (end === 5 ? 1 : 0.65);
      ctx.strokeStyle = end === 5 ? lemon : '#83a8f7';
      ctx.lineWidth = end === 5 ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(from, 661);
      ctx.bezierCurveTo(from, 661 - rise, to, 661 - rise, to, 661);
      ctx.stroke();
      ctx.restore();
    }

    for (const [index, token] of tokens.entries()) {
      const focus = index === 5 || index === 9;
      if (focus) box(ctx, positions[index] - 44, 671, 88, 96, 14, '#50422d', '#ad924a');
      label(ctx, token, positions[index], 720, { size: 65, weight: 700, color: focus ? lemon : paper });
    }
    caption(ctx, t < 0.60 ? '因为输入的每个token' : '都要和句子里的所有token单独计算注意力');
  }

  const modelRows = [
    { fields: ['BASE URL', '（OpenAI 格式）'], common: ['https://api.deepseek.com'], height: 96 },
    { fields: ['BASE URL', '（Anthropic 格式）'], common: ['https://api.deepseek.com/anthropic'], height: 96 },
    { fields: ['模型版本'], values: ['DeepSeek-V4-Flash', 'DeepSeek-V4-Pro'], height: 75 },
    { fields: ['思考模式'], common: ['支持非思考与思考模式（默认）', '切换方式详见思考模式'], height: 108 },
    { fields: ['上下文长度'], common: ['1M'], height: 92, focus: true },
    { fields: ['输出长度'], common: ['最大 384K'], height: 80 },
    { fields: ['Json Output'], values: ['支持', '支持'], height: 70 },
    { fields: ['Tool Calls'], values: ['支持', '支持'], height: 70 },
  ];

  function tableLines(ctx, lines, x, centerY, options) {
    const leading = 48;
    for (const [index, text] of lines.entries()) {
      label(ctx, text, x, centerY + (index - (lines.length - 1) / 2) * leading, options);
    }
  }

  function drawTextContrast(ctx, t) {
    background(ctx, true);
    heading(ctx, '模型细节', 119, 68);
    const x = 140, width = 1640, labelEdge = 625, divider = 1200;
    let top = 178;
    const tableHeight = modelRows.reduce((sum, row) => sum + row.height, 0);
    box(ctx, x - 6, top - 6, width + 12, tableHeight + 12, 20, '#263651', '#455574');

    for (const [index, row] of modelRows.entries()) {
      const lit = row.focus ? easing(t, 0.58, 1.15) : 0;
      const middle = top + row.height / 2;
      box(ctx, x, top, width, row.height, 0, row.focus ? '#443925' : index % 2 ? '#172648' : '#10203d');
      if (lit > 0) {
        ctx.save();
        ctx.globalAlpha = lit;
        box(ctx, x, top, width, row.height, 0, '#574827', '#d5ae54');
        ctx.restore();
      }
      line(ctx, x, top, x + width, top, '#43516b', 2);
      line(ctx, labelEdge, top, labelEdge, top + row.height, '#43516b', 2);
      tableLines(ctx, row.fields, 207, middle, { size: 48, align: 'left', weight: 700, color: row.focus ? lemon : paper });
      if (row.common) {
        tableLines(ctx, row.common, (labelEdge + x + width) / 2, middle, {
          size: row.focus ? 67 : 48, weight: row.focus ? 700 : 500, color: row.focus ? lemon : paper,
        });
      } else {
        line(ctx, divider, top, divider, top + row.height, '#43516b', 2);
        for (const [column, value] of row.values.entries()) {
          const textX = column === 0 ? (labelEdge + divider) / 2 : (divider + x + width) / 2;
          label(ctx, value, textX, middle, { size: 48, color: paper, weight: 600 });
        }
      }
      top += row.height;
    }
    caption(ctx, t < 0.65 ? '最新的大模型' : '已经支持了上百万上下文的TOKEN了');
  }

  function drawArchitecture(ctx, t) {
    background(ctx, true);
    heading(ctx, 'Transformer 块', 126);
    const inX = 168, bodyX = 483, repeatX = 1430;
    box(ctx, inX, 445, 224, 146, 23, '#192b4d', '#536f9f');
    label(ctx, '词向量', inX + 112, 518, { size: 50, color: paper, weight: 700 });
    arrow(ctx, 410, 518, 469, 518, aqua, 4, 17);

    box(ctx, bodyX, 313, 800, 390, 29, '#101f3d', '#786fb8');
    const activeAttention = easing(t, 0.2, 0.85);
    const activeFeed = easing(t, 0.85, 1.60);
    box(ctx, 540, 410, 319, 215, 20, '#1d3a57', '#72c6d4');
    box(ctx, 915, 410, 319, 215, 20, '#383458', '#8f7fd3');

    for (const [index, x] of [626, 699, 775].entries()) {
      if (index > 0) line(ctx, x, 480, 625, 480, '#a1f3f8', 2 + activeAttention);
      box(ctx, x - 9, 471, 18, 18, 9, aqua);
    }
    const top = [1025, 1074, 1123], bottom = [1011, 1053, 1095, 1137];
    for (const x of top) {
      for (const nodeX of bottom) line(ctx, x, 462, nodeX, 510, '#9f8bdf', 1.5 + activeFeed);
      box(ctx, x - 6, 456, 12, 12, 6, lilac);
    }
    for (const x of bottom) box(ctx, x - 6, 504, 12, 12, 6, lilac);
    label(ctx, '自注意力', 699, 560, { size: 51, color: aqua, weight: 700 });
    label(ctx, '前馈网络', 1074, 560, { size: 51, color: lilac, weight: 700 });
    arrow(ctx, 866, 518, 904, 518, '#b3bfdc', 4, 15);
    arrow(ctx, 1296, 518, 1408, 518, '#b3bfdc', 4, 18);

    for (const [index, offset] of [0, 23, 46].entries()) {
      const visible = easing(t, 1.66 + (2 - index) * 0.13, 2.42 + (2 - index) * 0.13);
      ctx.save();
      ctx.globalAlpha = visible;
      box(ctx, repeatX - offset, 417 + offset, 304, 158, 20, '#253959', '#8073bb');
      if (index === 2) {
        label(ctx, '可重复堆叠', repeatX - offset + 152, 497 + offset, { size: 49, color: paper, weight: 700 });
      }
      ctx.restore();
    }
    const waveX = 392 + 1000 * easing(t, 0.1, 2.6);
    if (t < 2.75) box(ctx, waveX - 6, 511, 13, 13, 6, lemon);
    caption(ctx, t < 1.26 ? '有了Transformer这样的结构' : t < 3.9
      ? '我们就可以开始训练语言模型了' : '在训练开始前');
  }

  const samples = [
    ['我养的这只猫已经五岁了，', '它会抓老鼠。'],
    ['今天的天气很好。', '我们到公园走一走。'],
    ['山脚下有一条小河。', '河水沿着山谷流下。'],
  ];

  function drawTrainingData(ctx, t) {
    background(ctx, true);
    const phase = easing(t, 2.36, 3.40);
    const architectureX = 960 - 492 * phase;
    if (phase < 0.58) heading(ctx, '训练语言模型', 130);
    else heading(ctx, '准备训练数据', 130);
    for (const [index, shift] of [42, 21, 0].entries()) {
      const labelX = architectureX + shift;
      box(ctx, labelX - 270, 353 - shift, 540, 250, 23, '#162646', index === 2 ? '#78a5c1' : '#4e557b');
      if (index === 2) {
        label(ctx, 'Transformer', labelX, 440, { size: 67, color: aqua, weight: 700 });
        label(ctx, '自注意力 + 前馈网络', labelX, 535, { size: 48, color: paper, weight: 600 });
      }
    }
    if (phase > 0) {
      ctx.save();
      ctx.globalAlpha = phase;
      arrow(ctx, 981, 483, 840, 483, aqua, 4, 20);
      const cardsX = 1035, cardsY = 312, cardsW = 690;
      for (const [index, sample] of samples.entries()) {
        const settle = easing(t, 2.60 + index * 0.13, 3.22 + index * 0.13);
        const offset = (samples.length - index - 1) * 28;
        const x = cardsX + offset + (1 - settle) * 44;
        const y = cardsY + offset + 7 * (1 - settle);
        box(ctx, x, y, cardsW, 257, 20, index === 2 ? '#243455' : '#1b2a48', '#627392');
        if (index === 2) {
          label(ctx, '大量的文本', x + cardsW / 2, y + 64, { size: 68, color: lemon, weight: 700 });
          const selected = Math.min(samples.length - 1, Math.max(0, Math.floor(t - 3)));
          label(ctx, samples[selected][0], x + cardsW / 2, y + 143, { size: 49, color: paper });
          label(ctx, samples[selected][1], x + cardsW / 2, y + 204, { size: 49, color: paper });
        }
      }
      ctx.restore();
    }
    caption(ctx, t < 2.65
      ? '有了Transformer这样的架构，我们就可以开始训练语言模型了。'
      : '首先，我们需要准备训练数据，也就是大量的文本。');
  }

  const scenes = {
    '2518': {
      title: '放大注意力示意中的文字', marker: '25:18', range: '25:16.30–25:19.85',
      duration: 3.55, previewTime: 2.36,
      description: '加大 Transformer、注意力机制和例句的字号，让手机端能看清。',
      draw: drawMobileType,
    },
    '2602': {
      title: '提高模型详情的文字对比度', marker: '26:02', range: '26:00.10–26:03.86',
      duration: 3.76, previewTime: 2.20,
      description: '用深色底衬托白色表格文字，标出上下文长度 1M。',
      draw: drawTextContrast,
    },
    '2701': {
      title: '重画 Transformer 结构', marker: '27:01', range: '26:59.00–27:03.60',
      duration: 4.60, previewTime: 3.18,
      description: '用新画面展示词向量依次通过自注意力、前馈网络，以及 Transformer 块的重复堆叠。',
      draw: drawArchitecture,
    },
    '2728': {
      title: '将训练讲解缩为准备文本', marker: '27:28', range: '27:26.20–27:31.80',
      duration: 5.60, previewTime: 4.22,
      description: '有了Transformer这样的架构，我们就可以开始训练语言模型了。首先，我们需要准备训练数据，也就是大量的文本。',
      draw: drawTrainingData,
    },
  };
  mountRevisionClip(scenes[source]);
})();
