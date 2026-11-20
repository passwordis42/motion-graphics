'use strict';

(() => {
  const scene = document.currentScript.dataset.clip;
  const clips = {
    '2518': ['放大注意力示意中的文字', '25:18', '25:16.30–25:19.85', 3.55, 2.36, '保留原片的镜头和背景，按原位置放大并重绘同一例句和黄色注意力线。'],
    '2602': ['提高模型详情的文字对比度', '26:02', '26:00.10–26:03.86', 3.76, 2.20, '直接提高原片模型详情表中文字和底色的亮度差，保持原来的滚动。'],
    '2701': ['重画 Transformer 结构', '27:01', '26:59.00–27:03.60', 4.60, 3.18, '换用新的示意图，依次显示掩码自注意力、前馈网络和残差路径，再显示模块堆叠。'],
    '2728': ['将训练讲解缩为准备文本', '27:28', '27:26.20–27:31.80', 5.60, 4.22, '有了Transformer这样的架构，我们就可以开始训练语言模型了。首先，我们需要准备训练数据，也就是大量的文本。'],
  };
  const [title, marker, range, duration, previewTime, description] = clips[scene];
  mountRevisionClip({ title, marker, range, duration, previewTime, description, modifiedVideo: './modified.mp4' });
})();
