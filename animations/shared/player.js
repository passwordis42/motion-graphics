'use strict';

function mountClipTransport(container, { duration, draw, renderOnly }) {
  container.hidden = renderOnly;
  container.innerHTML = `
    <div class="transport">
      <button type="button" class="toggle">播放</button>
      <button type="button" class="replay">重播</button>
      <button type="button" class="mute" aria-pressed="false">静音</button>
      <input type="range" min="0" value="0" step="0.01" aria-label="播放进度">
      <output aria-hidden="true"></output>
    </div>
    <p class="playback-status" role="status" hidden></p>
    <audio preload="metadata"></audio>`;

  const audio = container.querySelector('audio');
  const toggle = container.querySelector('.toggle');
  const replay = container.querySelector('.replay');
  const mute = container.querySelector('.mute');
  const status = container.querySelector('.playback-status');
  const slider = container.querySelector('input');
  const elapsed = container.querySelector('output');
  slider.max = duration;

  let currentTime = 0;
  let playing = false;
  let frame = 0;
  let silentStartedAt = 0;
  let audioFailed = false;
  let playAttempt = 0;

  function updateFrame(seconds) {
    currentTime = Math.min(duration, Math.max(0, seconds));
    draw(currentTime);
    slider.valueAsNumber = currentTime;
    const display = `${currentTime.toFixed(1)} / ${duration.toFixed(1)} 秒`;
    if (elapsed.value !== display) {
      elapsed.value = display;
      slider.setAttribute('aria-valuetext', display);
    }
  }

  function seek(seconds) {
    updateFrame(seconds);
    if (!renderOnly && !audioFailed) audio.currentTime = currentTime;
    silentStartedAt = performance.now() - currentTime * 1000;
  }

  function pause() {
    playing = false;
    playAttempt++;
    audio.pause();
    cancelAnimationFrame(frame);
    toggle.textContent = currentTime > 0 && currentTime < duration ? '继续' : '播放';
  }

  function finish() {
    updateFrame(duration);
    pause();
  }

  function useSilentPlayback() {
    if (audioFailed) return;
    audioFailed = true;
    audio.pause();
    mute.disabled = true;
    status.hidden = false;
    status.textContent = '旁白暂时无法加载，仍可播放画面。';
    silentStartedAt = performance.now() - currentTime * 1000;
  }

  function tick(now) {
    if (audioFailed) updateFrame((now - silentStartedAt) / 1000);
    else if (audio.readyState > 0 && !audio.seeking) updateFrame(audio.currentTime);

    if (currentTime >= duration) finish();
    else frame = requestAnimationFrame(tick);
  }

  function play() {
    if (currentTime >= duration) seek(0);
    playing = true;
    toggle.textContent = '暂停';
    silentStartedAt = performance.now() - currentTime * 1000;
    if (!audioFailed) {
      const attempt = ++playAttempt;
      audio.play().catch(() => {
        if (playing && attempt === playAttempt) useSilentPlayback();
      });
    }
    frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    if (playing) pause();
    else play();
  });
  replay.addEventListener('click', () => {
    pause();
    seek(0);
    play();
  });
  slider.addEventListener('input', () => {
    const position = slider.valueAsNumber;
    pause();
    seek(position);
    toggle.textContent = currentTime > 0 && currentTime < duration ? '继续' : '播放';
  });
  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    mute.setAttribute('aria-pressed', String(audio.muted));
  });
  audio.addEventListener('error', useSilentPlayback);
  audio.addEventListener('ended', () => {
    if (playing && !audioFailed && audio.ended) finish();
  });

  if (!renderOnly) audio.src = './narration.mp3';
  updateFrame(0);
  return seek;
}

function mountRevisionClip(clip) {
  const player = document.querySelector('#player');
  const renderOnly = new URLSearchParams(location.search).has('render');
  document.title = `${clip.marker} ${clip.title} · 修改合集`;
  document.documentElement.classList.toggle('render-only', renderOnly);

  player.innerHTML = `
    <header class="clip-header">
      <a href="../../#t${clip.marker.replace(':', '')}">返回修改合集</a>
      <h1></h1>
      <p></p>
    </header>
    <canvas class="stage" width="1920" height="1080" role="img"></canvas>
    <div class="transport-shell"></div>`;

  const header = player.querySelector('header');
  header.querySelector('h1').textContent = clip.title;
  header.querySelector('p').textContent = `原片 ${clip.marker} · 替换范围 ${clip.range}`;
  header.hidden = renderOnly;

  const canvas = player.querySelector('canvas');
  canvas.setAttribute('aria-label', clip.description || clip.title);
  const ctx = canvas.getContext('2d', { alpha: false });

  const seek = mountClipTransport(player.querySelector('.transport-shell'), {
    duration: clip.duration,
    renderOnly,
    draw(time) {
      ctx.save();
      ctx.fillStyle = '#080b21';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      try {
        clip.draw(ctx, time);
      } finally {
        ctx.restore();
      }
    },
  });

  window.revisionClip = Object.freeze({
    title: clip.title,
    marker: clip.marker,
    range: clip.range,
    duration: clip.duration,
    previewTime: clip.previewTime,
    seek,
  });
}
