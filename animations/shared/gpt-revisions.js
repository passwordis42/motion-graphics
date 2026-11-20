'use strict';

(() => {
  const scene = document.currentScript.dataset.scene;
  const clips = {
    ffn: ['前馈网络升维再降维', '24:23', '24:20.4–24:25.8', 5.4, 2.6, '保留原片左侧的层级和镜头，右侧用 12,288 到 49,152 再回到 12,288 的图表示前馈计算。'],
    position: ['最后一个位置汇总上文', '24:21', '24:16.6–24:22.6', 6, 4.9, '原画面不变，用修改后的字幕讲解最后一个位置汇总上文。'],
    positionB: ['最后一个向量对词表打分', '24:21', '24:22.6–24:29.0', 6.4, 4.8, '保留原片镜头，续接最后一个位置的向量如何与词表中的候选词计算得分。'],
    scores: ['从最后一个向量到词表得分', '24:27', '24:24.4–24:29.8', 5.4, 4.4, '沿用原片上方的词表和下方的输出布局，使用三维教学示例计算相似度，突出得分最高的“老鼠”。'],
    randomA: ['随机初始化 · 权重与得分', '24:41', '24:40.3–24:46.0', 5.7, 3.6, '保留镜头和网络结构，显示抽样初始化的三维教学网络权重。'],
    randomB: ['随机初始化 · 做出预测', '24:41', '24:46.0–24:51.2', 5.2, 4.2, '沿用原片词表的列与输出的位置，由随机初始化的教学网络算出第一次猜测“桌子”。'],
    randomC: ['随机初始化 · 核对训练目标', '24:41', '24:51.2–24:56.8', 5.6, 3.6, '真实训练目标是“老鼠”，与初始预测放在同一画面中，显示交叉熵的代入值。'],
    randomD: ['随机初始化 · 反向传播与重复训练', '24:41', '24:56.8–25:03.0', 6.2, 5.39, '沿用网络层镜头，用教学网络实际计算的梯度更新及分数显示“老鼠”的概率逐步上升。'],
  };
  const [title, marker, range, duration, previewTime, description] = clips[scene];
  mountRevisionClip({ title, marker, range, duration, previewTime, description, modifiedVideo: './modified.mp4' });
  if (new URLSearchParams(location.search).has('render')) return;

  const sceneLinks = scene.startsWith('random') ? [
    ['2441-random-a', '随机权重'], ['2441-random-b', '初次预测'],
    ['2441-random-c', '训练目标'], ['2441-random-d', '反向传播与重复训练'],
  ] : (scene === 'position' || scene === 'positionB') ? [
    ['2421-last-position', '最后一个位置'], ['2421-last-position-b', '对词表打分'],
  ] : [];

  if (!sceneLinks.length) return;

  const nav = document.createElement('nav');
  nav.className = 'training-nav training-steps';
  nav.setAttribute('aria-label', '同一修改的其他片段');
  for (const [folder, caption] of sceneLinks) {
    const link = document.createElement('a');
    link.href = '../' + folder + '/';
    link.textContent = caption;
    if (location.pathname.endsWith('/' + folder + '/')) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  document.querySelector('.clip-header').after(nav);
})();
