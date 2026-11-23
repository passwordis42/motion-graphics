'use strict';

function mountRevisionClip(clip) {
  const player = document.querySelector('#player');
  const renderOnly = new URLSearchParams(location.search).has('render');
  const originalOnly = !renderOnly && document.documentElement.dataset.review === 'no-change';
  const generated = !renderOnly && document.documentElement.hasAttribute('data-generated');
  const originalDuration = clip.originalDuration ?? clip.duration;
  const duration = originalOnly ? originalDuration : clip.duration;
  const originalStage = '<video class="stage original" muted playsinline preload="auto" aria-label="原片画面"></video>';
  const modifiedTitle = '<h2 id="modified-heading">修改后</h2>';
  document.title = `${clip.marker} ${clip.title} · 修改合集`;
  document.documentElement.classList.toggle('render-only', renderOnly);

  player.innerHTML = `
    <header class="clip-header">
      <a>返回修改合集</a>
      <h1></h1>
      <p></p>
    </header>
    <div class="comparison">
      <section class="comparison-pane original-pane" aria-labelledby="original-heading">
        <h2 id="original-heading">原片</h2>
        ${originalOnly ? `<div class="review-stage">${originalStage}<span class="review-watermark">不用改</span></div>` : originalStage}
      </section>
      ${originalOnly ? '' : `<section class="comparison-pane modified-pane" aria-labelledby="modified-heading"${generated ? ' aria-describedby="generated-badge"' : ''}>
        ${generated ? `<div class="comparison-pane-title">
          ${modifiedTitle}
          <span id="generated-badge" class="comparison-badge">自动生成，非参考</span>
        </div>` : modifiedTitle}
        ${clip.modifiedVideo
          ? '<video class="stage modified" muted playsinline preload="auto"></video>'
          : '<canvas class="stage modified" width="1920" height="1080" role="img"></canvas>'}
      </section>`}
    </div>
    <p class="clip-status" role="status" hidden></p>
    <div class="transport">
      <button type="button" class="toggle">播放</button>
      <button type="button" class="replay">重播</button>
      <input type="range" min="0" value="0" step="0.01" aria-label="播放进度">
      <output aria-hidden="true"></output>
    </div>`;

  const header = player.querySelector('header');
  header.querySelector('a').href = clip.backHref ?? `../../#t${clip.marker.replace(':', '')}`;
  header.querySelector('h1').textContent = clip.title;
  header.querySelector('p').textContent = `原片 ${clip.marker} · ${originalOnly ? '' : '替换范围 '}${clip.range}`;
  header.hidden = renderOnly;

  const comparison = player.querySelector('.comparison');
  const originalPane = player.querySelector('.original-pane');
  const original = renderOnly ? null : player.querySelector('.original');
  const modified = player.querySelector('.modified');
  const modifiedVideo = clip.modifiedVideo ? modified : null;
  const differentDurations = originalDuration !== duration;
  const ctx = modifiedVideo ? null : modified?.getContext('2d', { alpha: false });
  modified?.setAttribute('aria-label', clip.description || clip.title);
  originalPane.hidden = renderOnly;
  comparison.classList.toggle('single', renderOnly || originalOnly);
  const modifiedHeading = player.querySelector('#modified-heading');
  if (modifiedHeading) modifiedHeading.hidden = renderOnly;
  if (differentDurations && modifiedHeading) {
    player.querySelector('#original-heading').textContent = `原片 · ${originalDuration.toFixed(1)} 秒`;
    modifiedHeading.textContent = `修改后 · ${duration.toFixed(1)} 秒`;
  }
  player.querySelector('.transport').hidden = renderOnly;

  const status = player.querySelector('.clip-status');
  const toggle = player.querySelector('.toggle');
  const replay = player.querySelector('.replay');
  const slider = player.querySelector('input[type="range"]');
  const elapsed = player.querySelector('output');
  slider.max = duration;

  const videos = [original, modifiedVideo].filter(Boolean);
  const unavailable = new Set();
  let currentTime = 0;
  let frame = 0;
  let startedAt = 0;
  let playAttempt = 0;

  function clock() {
    if (differentDurations && modifiedVideo && !unavailable.has(modifiedVideo)) return modifiedVideo;
    return videos.find(video => !unavailable.has(video));
  }

  function videoLimit(video) {
    const planned = video === original ? originalDuration : duration;
    return Number.isFinite(video.duration) ? Math.min(video.duration, planned) : planned;
  }

  function setVideoTime(video, seconds) {
    if (unavailable.has(video)) return;
    const target = Math.min(videoLimit(video), seconds);
    if (Math.abs(video.currentTime - target) > 0.001) video.currentTime = target;
  }

  function paint(seconds) {
    currentTime = Math.min(duration, Math.max(0, seconds));
    if (ctx) {
      ctx.save();
      ctx.fillStyle = '#080b21';
      ctx.fillRect(0, 0, modified.width, modified.height);
      try {
        clip.draw(ctx, currentTime);
      } finally {
        ctx.restore();
      }
    }
    slider.value = currentTime;
    const display = `${currentTime.toFixed(1)} / ${duration.toFixed(1)} 秒`;
    if (elapsed.value !== display) {
      elapsed.value = display;
      slider.setAttribute('aria-valuetext', display);
    }
  }

  function seek(seconds) {
    paint(seconds);
    videos.forEach(video => setVideoTime(video, currentTime));
    startedAt = performance.now() - currentTime * 1000;
  }

  function showFallback(video) {
    if (unavailable.has(video)) return;
    const wasClock = video === clock();
    unavailable.add(video);
    video.pause();
    if (wasClock) {
      startedAt = performance.now() - currentTime * 1000;
      const nextClock = clock();
      if (nextClock) setVideoTime(nextClock, currentTime);
    }
    if (video === original) {
      originalPane.hidden = true;
      comparison.classList.add('single');
      if (originalOnly) {
        pause();
        toggle.disabled = replay.disabled = slider.disabled = true;
      }
    }
    const messages = [];
    if (unavailable.has(original)) messages.push('原片暂时无法加载。');
    if (unavailable.has(modifiedVideo)) messages.push('修改后的视频暂时无法加载。');
    status.textContent = messages.join('');
    status.hidden = false;
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    playAttempt++;
    videos.forEach(video => video.pause());
    toggle.textContent = currentTime > 0 && currentTime < duration ? '继续' : '播放';
  }

  function tick(now) {
    const active = clock();
    const seconds = active ? active.currentTime : (now - startedAt) / 1000;
    if (active?.ended || seconds >= duration) {
      seek(duration);
      pause();
      return;
    }
    if (!active?.seeking) {
      paint(seconds);
      for (const video of videos) {
        if (video === active || unavailable.has(video) || video.seeking) continue;
        const limit = videoLimit(video);
        if (currentTime >= limit) {
          video.pause();
          setVideoTime(video, limit);
        } else if (Math.abs(video.currentTime - currentTime) > 0.08) {
          setVideoTime(video, currentTime);
        }
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function play() {
    if (currentTime >= duration) seek(0);
    startedAt = performance.now() - currentTime * 1000;
    toggle.textContent = '暂停';
    const attempt = ++playAttempt;
    videos.forEach(video => {
      if (unavailable.has(video) || currentTime >= videoLimit(video)) return;
      video.play().catch(() => {
        if (frame && attempt === playAttempt) showFallback(video);
      });
    });
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

  videos.forEach(video => video.addEventListener('error', () => showFallback(video)));
  if (original) original.src = './original.mp4';
  if (modifiedVideo) modifiedVideo.src = clip.modifiedVideo;

  window.revisionClip = Object.freeze({
    title: clip.title,
    marker: clip.marker,
    range: clip.range,
    originalDuration,
    duration,
    previewTime: clip.previewTime,
    seek,
  });
  seek(clip.startTime ?? 0);
  if (!renderOnly && !originalOnly && clip.autoplay) play();
}
