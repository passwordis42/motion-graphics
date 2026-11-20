const nnlm = (() => {
  const sans = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  const mono = '"Cascadia Mono", Consolas, "Noto Sans Mono", monospace';
  const cache = new Map();

  const words = [
    { name: '猫', vector: '0.2  −0.1   0.4', score: '0.35', probability: 23.8, trained: 18.9 },
    { name: '会', vector: '−0.3   0.2   0.1', score: '−0.19', probability: 13.9, trained: 17.1 },
    { name: '抓', vector: '0.5   0.1  −0.2', score: '0.17', probability: 19.9, trained: 16.8 },
    { name: '老', vector: '−0.1   0.3   0.2', score: '−0.05', probability: 16, trained: 25.2 },
    { name: '鼠', vector: '0.4  −0.2   0.3', score: '0.45', probability: 26.4, trained: 22 },
  ];

  function easing(time, start, end) {
    const ratio = Math.min(1, Math.max(0, (time - start) / (end - start)));
    return ratio * ratio * (3 - 2 * ratio);
  }

  function line(ctx, ax, ay, bx, by, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  function box(ctx, x, y, w, h, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function label(ctx, value, x, y, options = {}) {
    const { size = 32, color = '#ececff', align = 'center', weight = 500, numeric = false } = options;
    ctx.font = `${weight} ${size}px ${numeric ? mono : sans}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function pill(ctx, value, x, y, w, h, options = {}) {
    const shade = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    shade.addColorStop(0, options.active ? 'rgba(101, 89, 168, .82)' : 'rgba(90, 90, 155, .55)');
    shade.addColorStop(1, 'rgba(25, 24, 69, .72)');
    box(ctx, x - w / 2, y - h / 2, w, h, h / 2, shade, options.active ? '#f5ed6c' : '#8d8ec1');
    label(ctx, value, x, y, options);
  }

  function spotlight(ctx, x, y, radius, color) {
    const glow = ctx.createRadialGradient(x, y, 5, x, y, radius);
    glow.addColorStop(0, `rgba(${color}, .91)`);
    glow.addColorStop(0.42, `rgba(${color}, .4)`);
    glow.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1920, 1080);
  }

  function background(ctx, axes = false) {
    if (!cache.has(axes)) {
      const sheet = document.createElement('canvas');
      sheet.width = 1920;
      sheet.height = 1080;
      const bg = sheet.getContext('2d');
      const wash = bg.createLinearGradient(0, 0, 1500, 1040);
      wash.addColorStop(0, axes ? '#030624' : '#271542');
      wash.addColorStop(0.54, axes ? '#06092c' : '#0b1148');
      wash.addColorStop(1, '#07031b');
      bg.fillStyle = wash;
      bg.fillRect(0, 0, 1920, 1080);

      if (axes) {
        spotlight(bg, 1390, 910, 940, '25, 7, 90');
        spotlight(bg, 640, 110, 1100, '5, 12, 75');
      } else {
        spotlight(bg, 764, 130, 860, '33, 32, 169');
        spotlight(bg, 1830, -70, 830, '115, 106, 218');
        spotlight(bg, 1050, 655, 680, '7, 33, 132');
        spotlight(bg, 730, 1065, 560, '2, 44, 77');
        spotlight(bg, -90, 790, 575, '79, 32, 23');
        for (const x of [240, 560, 960, 1375, 1690]) {
          line(bg, x, 0, x, 1080, 'rgba(199, 199, 255, .15)');
          for (const y of [150, 746, 932]) {
            bg.fillStyle = 'rgba(199, 199, 255, .48)';
            bg.fillRect(x - 2, y - 2, 4, 4);
          }
        }
        for (const y of [150, 746, 932]) line(bg, 0, y, 1920, y, 'rgba(199, 199, 255, .12)');
        for (const [x, y] of [[154, 614], [1770, 614]]) {
          line(bg, x - 18, y, x + 18, y, '#7060f4', 8);
          line(bg, x, y - 18, x, y + 18, '#7060f4', 8);
        }
        const tilePalette = ['#6d65ee', '#131022', '#acdd91', '#edf18b'];
        for (const [x, y] of [[122, 93], [1670, 854], [449, 876]]) {
          tilePalette.forEach((color, index) => {
            bg.fillStyle = color;
            bg.fillRect(x + index * 15, y + (index % 3) * 13, 15, 15);
          });
        }
      }
      cache.set(axes, sheet);
    }
    ctx.drawImage(cache.get(axes), 0, 0);
  }

  function subtitle(ctx, text) {
    ctx.save();
    ctx.shadowColor = '#03020e';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 3;
    label(ctx, text, 960, 1002, { size: 44, weight: 700, color: '#fff' });
    ctx.restore();
  }

  function arrow(ctx, ax, ay, bx, by, color, width, head = 21) {
    const angle = Math.atan2(by - ay, bx - ax);
    line(ctx, ax, ay, bx, by, color, width);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(-head, -head * 0.4);
    ctx.lineTo(-head, head * 0.4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  return { words, easing, line, box, label, pill, background, subtitle, arrow };
})();
