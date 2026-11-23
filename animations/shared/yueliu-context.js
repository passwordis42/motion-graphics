'use strict';

(() => {
  const { clip } = document.currentScript.dataset;
  const { arrow, box, easing, label, line, pill, subtitle } = nnlm;
  const light = '#edf0ff';
  const gold = '#fff285';
  const typeface = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  const mainLine = '我养的这只猫已经五岁了，';
  const rnnLine = mainLine + '它很会抓';
  const attentionLine = mainLine + '它会抓老鼠。';
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const decimal = (number) => number.toFixed(3).replace('-', '−');

  function loadImage(path) {
    const image = new Image();
    image.src = path;
    return image.decode().then(() => image);
  }

  function sentenceSlots(ctx, text, size) {
    ctx.font = `600 ${size}px ${typeface}`;
    const widths = [...text].map(character => ctx.measureText(character).width);
    let x = (1920 - widths.reduce((sum, width) => sum + width, 0)) / 2;
    return [...text].map((character, index) => {
      const width = widths[index];
      const slot = { x, width, character };
      x += width;
      return slot;
    });
  }

  function drawSentenceSlot(ctx, slot, y, size, color) {
    label(ctx, slot.character, slot.x + slot.width / 2, y, { size, weight: 600, color });
  }

  function drawRnn(ctx, t, background) {
    ctx.drawImage(background, 0, 0, 1920, 1080);
    const slots = sentenceSlots(ctx, rnnLine + '老鼠', 81);
    const windowProgress = easing(t, 2.84, 3.87);
    const start = lerp(slots[0].x, slots[12].x, windowProgress);
    const end = lerp(slots[4].x, slots[16].x, windowProgress);
    box(ctx, start - 9, 493, end - start + 18, 94, 8, '#fce97718', '#f5e887');
    slots.forEach((slot, index) => {
      ctx.save();
      if (index >= rnnLine.length) {
        ctx.globalAlpha = easing(t, 2.04, 2.29) * (1 - easing(t, 2.79, 3.08));
      } else if (index < mainLine.length) {
        ctx.globalAlpha = 1 - windowProgress * 0.42;
      }
      drawSentenceSlot(ctx, slot, 540, 81, index >= rnnLine.length ? gold : light);
      ctx.restore();
    });
    subtitle(ctx, t < 1 ? '我们一看就知道' : t < 2.42
      ? '后面接的应该是老鼠' : '但当模型预测“抓”后面是什么的时候');
  }

  function drawMobile(ctx, t, background) {
    ctx.drawImage(background, 0, 0, 1920, 1080);
    const slots = sentenceSlots(ctx, attentionLine, 92);
    const subject = slots[mainLine.length];
    const reveal = easing(t, 2.49, 2.95);
    const y = 498;
    slots.forEach((slot, index) => {
      ctx.save();
      ctx.globalAlpha = index < 8 ? 1 : easing(t, (index - 8) * 0.13, (index - 8) * 0.13 + 0.17);
      drawSentenceSlot(ctx, slot, y, 92, index === mainLine.length && reveal > 0.5 ? gold : light);
      ctx.restore();
    });
    ctx.save();
    ctx.globalAlpha = reveal;
    box(ctx, subject.x - 5, y - 56, subject.width + 10, 112, 9, '#f9e16f15', '#ee9f8b');
    const center = subject.x + subject.width / 2;
    arrow(ctx, center, 665, center, 578, '#e1ddff', 3.4, 15);
    pill(ctx, '代词', center, 716, 220, 75, { size: 50, color: light, weight: 600 });
    ctx.restore();
    subtitle(ctx, t < 2.18 ? '“我养的这只猫已经五岁了，它会抓老鼠。”' : '这句话里“它”是个代词');
  }

  const examples = {
    '2002': {
      word: '种草', context: '相机', sentence: '好多人在用那个相机，被种草了', rowLeft: 942, rowY: 278,
      start: [1046, 448], end: [1257, 427], icons: 0, side: 1,
      captionBefore: '不同的语境', captionAfter: '最终就得到了不同的词向量', cue: 0.86,
    },
    '2004': {
      word: '种草', context: '地', sentence: '这块儿地真空，需要种草了', rowLeft: 224, rowY: 265,
      start: [1257, 427], end: [595, 568], icons: 0, side: -1,
      captionBefore: '最终就得到了不同的词向量', captionAfter: '歧义问题就这样被解决了', cue: 0.9,
    },
    '2007': {
      word: '云', context: '办公', sentence: '云办公，就是换个地方加班', rowLeft: 205, rowY: 263,
      start: [1046, 457], end: [593, 567], icons: 2, side: -1,
      captionBefore: '歧义问题就这样被解决了', captionAfter: '这个“问关系、叠加语义”的过程', cue: 0.62,
    },
    '2009': {
      word: '云', context: '朵', sentence: '远处有朵云像小猪', rowLeft: 1047, rowY: 278,
      start: [593, 567], end: [1292, 425], icons: 2, side: 1,
      captionBefore: '这个“问关系、叠加语义”的过程', captionAfter: '就叫做注意力机制', cue: 0.49,
    },
  };

  function tokenTile(ctx, value, x, y, width, active = false) {
    box(ctx, x, y - 30, width, 60, 3, active ? '#e8cb6c43' : '#12194755', active ? gold : '#b9ac7db7');
    label(ctx, value, x + width / 2, y, { size: 34, weight: 650, color: active ? gold : light });
  }

  function drawExample(ctx, t, plane, icons, example) {
    ctx.drawImage(plane, 0, 0, 1920, 1080);
    const leftIcon = example.icons === 0 ? [561, 422] : [538, 422];
    ctx.drawImage(icons, example.icons * 100, 0, 100, 106, ...leftIcon, 150, 159);
    ctx.drawImage(icons, (example.icons + 1) * 100, 0, 100, 106, 1278, 435, 150, 159);

    const charWidth = 59;
    const contextIndex = example.sentence.indexOf(example.context);
    for (const [i, character] of [...example.sentence].entries()) {
      const isContext = i >= contextIndex && i < contextIndex + example.context.length;
      tokenTile(ctx, character, example.rowLeft + i * charWidth, example.rowY, charWidth, isContext);
    }

    const shift = easing(t, 0.57, 1.12);
    const tipX = lerp(example.start[0], example.end[0], shift);
    const tipY = lerp(example.start[1], example.end[1], shift);
    const tipGlow = 3 * (1 - Math.abs(shift - 0.5) * 2);
    ctx.save();
    ctx.setLineDash([6, 6]);
    line(ctx, tipX, tipY, tipX, 810 + (915 - tipX) * 0.17, '#f3df9385', 2);
    ctx.restore();
    arrow(ctx, 915, 733, tipX, tipY, '#fff3a3', 2.8 + tipGlow, 23);
    box(ctx, tipX - 9, tipY - 9, 18, 18, 9, '#fff5a1');
    label(ctx, example.word, tipX + 17, tipY - 4, { size: 32, weight: 650, color: light, align: 'left' });

    const travel = easing(t, 0.12, 0.72);
    const tileWidth = example.context.length * 52 + 25;
    const sourceX = example.rowLeft + (contextIndex + example.context.length / 2) * charWidth;
    const addX = tipX + (example.side > 0 ? -70 : -9);
    const addY = tipY - 55;
    const x = lerp(sourceX, addX, travel);
    const y = lerp(example.rowY, addY, travel) - 30 * Math.sin(travel * Math.PI);
    ctx.save();
    ctx.globalAlpha = easing(t, 0.10, 0.28);
    tokenTile(ctx, example.context, x - tileWidth / 2, y, tileWidth, true);
    if (travel > 0.81) {
      label(ctx, '+', x + tileWidth / 2 + 17, y, { size: 34, color: gold, weight: 650 });
    }
    ctx.restore();
    subtitle(ctx, t < example.cue ? example.captionBefore : example.captionAfter);
  }

  const wordVectors = [
    ['我', [0.112, 0.141, -0.676, -0.153, -0.561]],
    ['吃', [-0.920, -0.551, 0.663, 0.434, -0.788]],
    ['了', [0.436, 0.573, 0.214, -0.466, -0.005]],
    ['一', [0.358, 0.798, -0.602, -0.245, -0.300]],
    ['个', [-0.452, -0.300, -0.248, 0.473, 0.627]],
  ];
  const originalApple = [-0.054, 0.171, 0.002, 0.660, -0.451];
  const similarities = wordVectors.map(([, vector]) =>
    vector.reduce((score, value, i) => score + value * originalApple[i], 0));
  const normalizer = similarities.reduce((sum, score) => sum + Math.exp(score), 0);
  const newApple = originalApple.map((entry, i) =>
    wordVectors.reduce((total, [, vector], j) =>
      total + vector[i] * Math.exp(similarities[j]) / normalizer, entry));

  function vectorCard(ctx, word, vector, x, center, width, strong = false) {
    const row = width * 0.26;
    const cardY = center - row * 2.61;
    const shade = ctx.createLinearGradient(x - width / 2, cardY, x + width / 2, cardY + row * 5.3);
    shade.addColorStop(0, '#5654a9ce');
    shade.addColorStop(1, '#27275fd0');
    const tileWidth = word.length * row * 0.75 + row * 0.39;
    box(ctx, x - tileWidth / 2, cardY - row * 1.29, tileWidth, row * 0.94, 4, '#29255799', strong ? gold : '#ded393bf');
    label(ctx, word, x, cardY - row * 0.81, { size: row * 0.6, weight: 620, color: light });
    box(ctx, x - width / 2, cardY, width, row * 5.22, row * 0.7, shade, '#9893e385');
    vector.forEach((entry, i) => {
      pill(ctx, decimal(entry), x, center + row * (i - 2), width * 0.81, row * 0.81, {
        size: row * 0.55, weight: 650, numeric: true, color: light, active: strong,
      });
    });
  }

  function drawFive(ctx, t, background) {
    ctx.drawImage(background, 0, 0, 1920, 1080);
    const groupExit = easing(t, 1.82, 2.43);
    const pairEntry = easing(t, 2.46, 3.04);
    const appleEntry = easing(t, 0.07, 0.70);
    ctx.save();
    ctx.globalAlpha = 1 - groupExit;
    wordVectors.forEach(([word, values], i) => {
      const x = 283 + 245 * i;
      vectorCard(ctx, word, values, x, 523, 168, word === '吃');
      label(ctx, decimal(similarities[i]), x, 680, { size: 32, color: gold, weight: 700, numeric: true });
    });
    label(ctx, '相关度', 122, 680, { size: 36, color: gold, weight: 700 });
    vectorCard(ctx, '苹果', originalApple, 1510, lerp(361, 523, appleEntry), 168, true);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = pairEntry;
    vectorCard(ctx, '苹果', originalApple, 660, 558, 228);
    vectorCard(ctx, '苹果', newApple, 1260, 558, 228, true);
    arrow(ctx, 835, 554, 1085, 554, gold, 3.4, 24);
    label(ctx, '按相关度叠加', 960, 496, { size: 37, color: gold, weight: 700 });
    label(ctx, '原词向量', 660, 747, { size: 34, color: '#ccd2f2', weight: 600 });
    label(ctx, '叠加后的词向量', 1260, 747, { size: 34, color: gold, weight: 650 });
    ctx.restore();
    subtitle(ctx, t < 1.42 ? '再按照这个相关度的大小' : '成比例地把其他词的语义加在苹果身上');
  }

  const timings = {
    '1700': {
      title: '放大整句并调整「它」的字号', marker: '17:00', range: '16:58.80–17:02.80',
      duration: 4, previewTime: 2.31, draw: drawRnn, images: ['./source-background.webp'],
      description: '放大整句，代词“它”和其他字同高。跟随原片节奏显示预期答案，再收回答案并把输入窗口移到“它很会抓”。',
    },
    '2002': {
      title: '在「种草」上叠加「相机」', marker: '20:02', range: '20:01.48–20:03.00',
      duration: 1.52, previewTime: 1.22,
    },
    '2004': {
      title: '在「种草」上叠加「地」', marker: '20:04', range: '20:03.68–20:05.20',
      duration: 1.52, previewTime: 1.22,
    },
    '2007': {
      title: '在「云」上叠加「办公」', marker: '20:07', range: '20:06.48–20:08.04',
      duration: 1.56, previewTime: 1.26,
    },
    '2009': {
      title: '在「云」上叠加「朵」', marker: '20:09', range: '20:08.88–20:10.72',
      duration: 1.84, previewTime: 1.41,
    },
    '2019': {
      title: '词向量维度与新增旁白', marker: '20:19', range: '20:18.80–20:23.60',
      duration: 4.8, previewTime: 3.71, draw: drawFive, images: ['../yueliu-2120/source-background.webp'],
      description: '用五维词向量展示相关度和语义叠加。结果画面留出停留时间供新增旁白对齐。',
    },
    '2120': {
      title: '放大例句的手机端文字', marker: '21:20', range: '21:18.56–21:22.80',
      duration: 4.24, previewTime: 3.68, draw: drawMobile, images: ['./source-background.webp'],
      description: '放大整句并保留逐字出现、框出“它”和标注“代词”的顺序。',
    },
  };

  function addExampleNav(basePath) {
    const nav = document.createElement('nav');
    nav.className = 'training-nav';
    nav.setAttribute('aria-label', '词语叠加的四个片段');
    for (const [id, example] of Object.entries(examples)) {
      const link = document.createElement('a');
      link.href = basePath + (id === '2002' ? '' : id + '/');
      link.textContent = timings[id].marker + ' ' + example.context;
      if (id === clip) link.setAttribute('aria-current', 'page');
      nav.append(link);
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'training-steps';
    wrapper.append(nav);
    document.querySelector('.clip-header').after(wrapper);
  }

  const config = timings[clip];
  const example = examples[clip];
  const nested = example && clip !== '2002';
  const basePath = nested ? '../' : './';
  const images = example ? ['source-plane.webp', 'source-icons.webp'].map(name => basePath + name) : config.images;
  const collection = nested ? '../../../#yueliu-2002' : '../../#yueliu-' + clip;
  Promise.all(images.map(loadImage)).then((art) => {
    mountRevisionClip({
      ...config,
      backHref: collection,
      description: example ? config.title + '，随后词向量方向向相应语义转移。' : config.description,
      draw: example
        ? (ctx, t) => drawExample(ctx, t, art[0], art[1], example)
        : (ctx, t) => config.draw(ctx, t, art[0]),
    });
    if (example && !new URLSearchParams(location.search).has('render')) addExampleNav(basePath);
  }).catch(() => {
    document.querySelector('#player').textContent = '修改画面加载失败，请刷新后重试。';
  });
})();
