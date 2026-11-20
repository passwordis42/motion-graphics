'use strict';

(() => {
  const params = new URLSearchParams(location.search);
  const renderOnly = params.has('render');
  const segments = [
    {
      id: 'a', name: '语料与输入', duration: 4.3,
      cues: [
        [0, 'corpus', '训练过程也是差不多'],
        [0.95, 'text', '我们从训练语料里找到一段文本'],
        [2.2, 'input', '把最开头的三个 token 输入神经网络'],
      ],
    }, {
      id: 'b', name: '前向预测与损失', duration: 4.9,
      cues: [
        [0, 'forward', '接下来神经网络会前向传播'],
        [1.3, 'predict', '预测下一个词是什么'],
        [2.3, 'compare', '预测出的结果会和语料库中的实际结果做对比'],
        [3.85, 'loss', '然后计算损失值'],
      ],
    }, {
      id: 'c', name: '反向传播与更新', duration: 2.3,
      cues: [[0, 'backward', '反向传播调整参数和词向量。']],
    }, {
      id: 'd', name: '滑动窗口并继续预测', duration: 6.5,
      cues: [
        [0, 'slide-first', '算完这一步，输入的窗口会往右滑一格'],
        [1.35, 'predict-first', '去预测下一个字“鼠”'],
        [2.45, 'adjust', '预测完再调整一次参数'],
        [3.75, 'slide-again', '接着再往右滑一格'],
        [5.02, 'predict-again', '再预测一次...'],
      ],
    }, {
      id: 'e', name: '相似词向量靠近', duration: 4.1,
      cues: [
        [0, 'vectors', '经过无数次的训练后'],
        [0.85, 'vectors', '一开始随机的词向量，就慢慢的有了规律'],
        [1.65, 'vectors', '经常出现在相似语境里的词，向量方向就被拽到了一块'],
        [2.98, 'vectors', '意思越接近，在空间里的距离也就越近。'],
      ],
    },
  ];
  let duration = 0;
  for (const part of segments) {
    part.start = duration;
    duration = Math.round((duration + part.duration) * 100) / 100;
  }
  const startTime = segments.find((part) => part.id === params.get('step'))?.start ?? 0;
  let stepButtons = [];
  let stepStatus;
  let visibleStep = -1;
  const { background, box, label, line, pill, arrow, easing, subtitle } = nnlm;
  const mix = (from, to, t) => from + (to - from) * t;
  const gold = '#f7e086';
  const cyan = '#9ceffc';
  const red = '#ffa2ad';
  const tokens = ['猫', '会', '抓', '老', '鼠', '，', '狗', '会', '看', '门', '。'];
  const tokenStart = 410;
  const tokenStep = 100;
  const layerX = [602, 775, 948, 1121, 1288];
  const sampleValues = ['0.200', '−0.100', '0.400', '−0.300', '0.200', '0.100', '0.500', '0.100', '−0.200'];
  const layerNodes = layerX.map((x, layer) => {
    const count = layer === 0 ? 9 : layer === 4 ? 5 : 7;
    return Array.from({ length: count }, (_, row) => ({
      x, y: 623 + (row - (count - 1) / 2) * 54,
      value: layer === 0 ? sampleValues[row] : ((Math.sin(row * 2.17 + layer * 3.01) * 0.8)).toFixed(3),
    }));
  });
  let networkPlate;

  function setOpacity(ctx, amount, paint) {
    ctx.save();
    ctx.globalAlpha = amount;
    paint();
    ctx.restore();
  }

  function drawCorpus(ctx, visible, windowStart, focus, expected) {
    box(ctx, 270, 120, 1378, 228, 24, 'rgba(16, 16, 52, .65)', 'rgba(201, 199, 247, .48)');
    label(ctx, '训练语料', 332, 169, {
      color: focus ? gold : '#dedcff', align: 'left', size: 34, weight: 700,
    });
    if (!visible) {
      for (const [i, length] of [390, 530, 280].entries()) {
        box(ctx, 750, 175 + 36 * i, length, 12, 6, 'rgba(187, 186, 227, .24)');
      }
      return;
    }
    tokens.forEach((token, index) => {
      const x = tokenStart + tokenStep * index;
      const isExpected = index === expected;
      box(ctx, x - 39, 220, 78, 82, 10, 'rgba(37, 42, 102, .83)', isExpected ? red : '#686eb0');
      label(ctx, token, x, 261, { size: 49, weight: 700, color: isExpected ? red : '#eaeaff' });
    });
    if (windowStart !== null) {
      const x = tokenStart + tokenStep * windowStart - 47;
      ctx.save();
      ctx.shadowColor = gold;
      ctx.shadowBlur = 12;
      box(ctx, x, 211, 294, 101, 13, 'rgba(230, 205, 90, .12)', gold);
      ctx.restore();
    }
  }

  function paintNetwork(ctx) {
    box(ctx, 530, 391, 832, 492, 27, 'rgba(12, 23, 74, .58)', 'rgba(182, 190, 247, .4)');
    for (let index = 0; index < layerNodes.length - 1; index++) {
      for (const [i, from] of layerNodes[index].entries()) {
        for (const [j, to] of layerNodes[index + 1].entries()) {
          const tint = (i + j) % 2 ? 'rgba(111, 184, 234, .30)' : 'rgba(229, 171, 103, .28)';
          line(ctx, from.x + 35, from.y, to.x - 35, to.y, tint, 0.86);
        }
      }
    }
    layerNodes.forEach((nodes) => nodes.forEach(({ x, y, value }) => {
      pill(ctx, value, x, y, 72, 26, { size: 15, numeric: true });
    }));
  }

  function routeSignal(ctx, points, color, t, rate = 0.8) {
    const spans = points.slice(1).map(([x,y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
    const total = spans.reduce((sum, value) => sum + value, 0);
    const head = (t * rate % 1) * total;
    let covered = 0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.7;
    ctx.globalAlpha = 0.46;
    ctx.beginPath();
    points.forEach(([x,y], index) => index === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
    ctx.stroke();
    for (const [index,length] of spans.entries()) {
      const [x1,y1] = points[index];
      const [x2,y2] = points[index + 1];
      if (length && head >= covered && head <= covered + length) {
        const progress = (head - covered) / length;
        const tail = Math.max(0, progress - 45 / length);
        const endX = mix(x1,x2,progress);
        const endY = mix(y1,y2,progress);
        const tailX = mix(x1,x2,tail);
        const tailY = mix(y1,y2,tail);
        ctx.globalAlpha = 0.94;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        line(ctx, tailX, tailY, endX, endY, color, 2.6);
        ctx.fillStyle = '#fff9dd';
        ctx.beginPath();
        ctx.arc(endX, endY, 3.1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      covered += length;
    }
    ctx.restore();
  }

  function drawNetwork(ctx, t, phase) {
    if (!networkPlate) {
      networkPlate = document.createElement('canvas');
      networkPlate.width = 1920;
      networkPlate.height = 1080;
      paintNetwork(networkPlate.getContext('2d'));
    }
    ctx.drawImage(networkPlate, 0, 0);
    const backward = phase === 'backward' || phase === 'adjust';
    const forward = ['input', 'forward', 'predict', 'predict-first', 'predict-again'].includes(phase);
    const light = backward ? '#ffe4ef' : gold;
    label(ctx, '神经网络', 947, 440, { size: 33, weight: 700, color: forward || backward ? light : '#c5caee' });
    if (!forward && !backward) return;
    for (let strand = 0; strand < 5; strand++) {
      const wave = ((t * 0.72 + strand * 0.168) % 1) * 4;
      const column = backward ? 3 - Math.floor(wave) : Math.floor(wave);
      const left = layerNodes[column];
      const right = layerNodes[column + 1];
      const from = left[(strand * 2 + column) % left.length];
      const to = right[(strand + column * 2) % right.length];
      const points = [[from.x + 36, from.y], [to.x - 36, to.y]];
      if (backward) points.reverse();
      routeSignal(ctx, points, light, wave % 1, 1);
    }
  }

  function drawInput(ctx, start, phase, t) {
    const active = ['input', 'forward', 'slide-first', 'slide-again'].includes(phase);
    const backward = phase === 'backward' || phase === 'adjust';
    box(ctx, 234, 489, 244, 265, 20, 'rgba(23, 25, 76, .85)', active ? gold : '#757cbb');
    label(ctx, '输入', 356, 547, { size: 34, weight: 700, color: active ? gold : '#dedfff' });
    for (const [i, token] of tokens.slice(start, start + 3).entries()) {
      pill(ctx, token, 290 + i * 66, 645, 55, 61, { size: 32, weight: 700, active });
    }
    if (backward) {
      arrow(ctx, 530, 621, 484, 621, red, 2.5);
      label(ctx, '更新词向量', 356, 700, { size: 25, color: red });
    } else {
      arrow(ctx, 480, 621, 529, 621, active ? gold : '#646ea7', 2.4);
      if (active) routeSignal(ctx, [[480,621],[526,621]], gold, t, 1.35);
    }
  }

  function drawResult(ctx, phase) {
    let labelText;
    let prediction;
    let actual;
    const loss = phase === 'loss';
    const backward = phase === 'backward' || phase === 'adjust';
    if (['forward', 'predict', 'compare', 'loss', 'backward'].includes(phase)) {
      labelText = '预测下一个 Token';
      prediction = '鼠 · 26.4%';
      if (['compare', 'loss', 'backward'].includes(phase)) actual = '老 · 16.0%';
    } else if (phase === 'predict-first' || phase === 'adjust') {
      labelText = '再次预测';
      prediction = '会 抓 老 → 下一词';
      actual = '鼠';
    } else if (phase === 'predict-again') {
      labelText = '再次预测';
      prediction = '抓 老 鼠 → 下一词';
      actual = '，';
    }
    if (!labelText) return;
    const outline = backward || loss ? red : cyan;
    box(ctx, 1390, 487, 294, 316, 20, 'rgba(23, 25, 76, .85)', outline);
    label(ctx, labelText, 1537, 542, { size: 31, weight: 700, color: outline });
    if (phase !== 'forward') label(ctx, prediction, 1537, 604, { size: 32, color: '#f3f3ff' });
    if (actual) {
      line(ctx, 1425, 648, 1648, 648, 'rgba(189, 184, 237, .4)', 1.2);
      label(ctx, '语料中的实际结果', 1537, 679, { size: 23, color: '#cbccef' });
      label(ctx, actual, 1537, 727, { size: 34, color: gold, weight: 700 });
    }
    if (loss || phase === 'backward') {
      label(ctx, '损失 = −ln(0.16) ≈ 1.833', 1537, 841, { size: 25, color: red, weight: 600 });
    }
    if (backward) {
      arrow(ctx, 1384, 621, 1359, 621, red, 2.5);
      label(ctx, '更新权重', 946, 923, { size: 29, color: red, weight: 700 });
    } else if (phase === 'forward' || phase === 'predict') {
      arrow(ctx, 1360, 621, 1386, 621, cyan, 2.5);
    }
  }

  const examples = [
    ['男人', 410, 303, 1260, 254, '#f7c78b'],
    ['女人', 1450, 270, 1327, 347, '#f7c78b'],
    ['小孩', 620, 390, 1192, 393, '#f7c78b'],
    ['麻辣烫', 1438, 470, 1505, 635, '#f48fb5'],
    ['火锅', 1070, 822, 1426, 721, '#f48fb5'],
    ['学校', 540, 780, 415, 499, '#a1e5ad'],
    ['老师', 1540, 775, 439, 401, '#a1e5ad'],
  ];

  function drawVectors(ctx, t, cue) {
    background(ctx, true);
    const x = 947;
    const y = 604;
    line(ctx, x, 152, x, 907, 'rgba(134, 184, 157, .43)', 2);
    line(ctx, 250, 636, 1704, 571, 'rgba(128, 150, 225, .46)', 2);
    line(ctx, 539, 809, 1393, 337, 'rgba(200, 130, 153, .39)', 2);
    const progress = easing(t, 0.74, 3.33);
    for (const [word, startX, startY, endX, endY, color] of examples) {
      const px = mix(startX, endX, progress);
      const py = mix(startY, endY, progress);
      arrow(ctx, x, y, px, py, color, 3, 17);
      label(ctx, word, px + (px > x ? 26 : -26), py - 15, {
        size: 42, weight: 700, color, align: px > x ? 'left' : 'right',
      });
    }
    box(ctx, x - 7, y - 7, 14, 14, 7, '#e2ecff');
    subtitle(ctx, cue[2]);
  }

  function draw(ctx, t) {
    const step = segments.findLastIndex((part) => part.start <= t);
    const segment = segments[step];
    const local = t - segment.start;
    if (step !== visibleStep && stepStatus) {
      if (visibleStep >= 0) stepButtons[visibleStep].removeAttribute('aria-current');
      stepButtons[step].setAttribute('aria-current', 'step');
      stepStatus.textContent = '第 ' + (step + 1) + ' 步，共 ' + segments.length + ' 步';
      visibleStep = step;
    }
    const cue = segment.cues.findLast(([start]) => start <= local) || segment.cues[0];
    const [, phase, caption] = cue;
    if (phase === 'vectors') {
      drawVectors(ctx, local, cue);
      return;
    }
    background(ctx);
    const firstWindow = segment.id === 'd' ? easing(local, 0.08, 0.83) : 0;
    const secondWindow = segment.id === 'd' ? easing(local, 3.78, 4.68) : 0;
    const windowIndex = firstWindow + secondWindow;
    const windowVisible = !['corpus', 'text'].includes(phase);
    const expected = ['compare', 'loss', 'backward', 'predict-first', 'adjust', 'predict-again'].includes(phase)
      ? Math.round(windowIndex) + 3 : -1;

    drawCorpus(ctx, phase !== 'corpus', windowVisible ? windowIndex : null, !windowVisible, expected);
    const context = phase === 'corpus' ? 0.13 : phase === 'text' ? 0.28 : 1;
    setOpacity(ctx, context, () => {
      drawNetwork(ctx, t, phase);
      drawInput(ctx, Math.round(windowIndex), phase, t);
      if (windowVisible) drawResult(ctx, phase);
    });
    if (windowVisible) {
      const x = tokenStart + tokenStep * (windowIndex + 1);
      routeSignal(ctx, [[x,314],[x,374],[176,374],[176,620],[233,620]], gold, t, 0.68);
    }
    if (expected > -1) {
      const x = tokenStart + tokenStep * expected;
      routeSignal(ctx, [[x,308],[x,354],[1735,354],[1735,721],[1689,721]], red, t, 0.62);
    }
    subtitle(ctx, caption);
  }

  mountRevisionClip({
    title: '训练流程逐句对齐',
    marker: '16:20',
    range: '16:17.8–16:39.9',
    duration,
    startTime,
    previewTime: 3.45,
    description: '连续展示训练语料、前三个 token 输入、前向传播、损失、反向传播、滑动窗口和词向量变化。',
    autoplay: !params.has('manual') && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    draw,
  });

  if (!renderOnly) {
    const controls = document.createElement('div');
    controls.className = 'training-steps';
    stepStatus = document.createElement('p');
    const nav = document.createElement('nav');
    nav.className = 'training-nav';
    nav.setAttribute('aria-label', '训练流程片段');
    stepButtons = segments.map((part, position) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = (position + 1) + ' ' + part.name;
      button.addEventListener('click', () => window.revisionClip.seek(part.start));
      nav.append(button);
      return button;
    });
    controls.append(stepStatus, nav);
    document.querySelector('#player .clip-header').after(controls);
    window.revisionClip.seek(startTime);
  }
})();
