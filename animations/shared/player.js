'use strict';

function mountRevisionClip(clip) {
  const player = document.querySelector('#player');
  const renderOnly = new URLSearchParams(location.search).has('render');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.title = `${clip.marker} ${clip.title} · 修改合集`;
  document.documentElement.classList.toggle('render-only', renderOnly);

  player.innerHTML = `
    <header class="clip-header">
      <a href="../../#t${clip.marker.replace(':', '')}">返回修改合集</a>
      <h1></h1>
      <p></p>
    </header>
    <canvas class="stage" width="1920" height="1080" role="img"></canvas>
    <div class="transport">
      <button type="button" class="toggle">播放</button>
      <button type="button" class="replay">重播</button>
      <input type="range" min="0" value="0" step="0.01" aria-label="播放进度">
      <output aria-hidden="true"></output>
    </div>`;

  const header = player.querySelector('header');
  header.querySelector('h1').textContent = clip.title;
  header.querySelector('p').textContent = `原片 ${clip.marker} · 替换范围 ${clip.range}`;
  header.hidden = renderOnly;
  player.querySelector('.transport').hidden = renderOnly;

  const canvas = player.querySelector('canvas');
  canvas.setAttribute('aria-label', clip.description || clip.title);
  const ctx = canvas.getContext('2d', { alpha: false });
  const toggle = player.querySelector('.toggle');
  const replay = player.querySelector('.replay');
  const slider = player.querySelector('input');
  const elapsed = player.querySelector('output');
  slider.max = clip.duration;

  let currentTime = 0;
  let frame = 0;
  let startedAt = 0;

  function seek(seconds) {
    currentTime = Math.min(clip.duration, Math.max(0, seconds));
    ctx.save();
    ctx.fillStyle = '#080b21';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      clip.draw(ctx, currentTime);
    } finally {
      ctx.restore();
    }
    slider.value = currentTime;
    const display = `${currentTime.toFixed(1)} / ${clip.duration.toFixed(1)} 秒`;
    if (elapsed.value !== display) {
      elapsed.value = display;
      slider.setAttribute('aria-valuetext', display);
    }
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    toggle.textContent = currentTime > 0 && currentTime < clip.duration ? '继续' : '播放';
  }

  function tick(now) {
    seek((now - startedAt) / 1000);
    if (currentTime < clip.duration) frame = requestAnimationFrame(tick);
    else pause();
  }

  function play() {
    if (currentTime >= clip.duration) seek(0);
    startedAt = performance.now() - currentTime * 1000;
    toggle.textContent = '暂停';
    frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    if (frame) pause();
    else play();
  });
  replay.addEventListener('click', () => {
    pause();
    seek(0);
    play();
  });
  slider.addEventListener('input', () => {
    seek(slider.valueAsNumber);
    pause();
  });

  window.revisionClip = Object.freeze({
    title: clip.title,
    marker: clip.marker,
    range: clip.range,
    duration: clip.duration,
    previewTime: clip.previewTime,
    seek,
  });
  seek(0);
  if (!renderOnly && !reducedMotion) play();
}
