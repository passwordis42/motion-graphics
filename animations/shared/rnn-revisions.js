'use strict';

const rnnRevisions = (() => {
  const {background, box, pill, line, arrow, label, easing} = nnlm;
  const colors = {white:'#f6f4ff', muted:'#c7c7ec', frame:'#6975b9', yellow:'#f7e984', mint:'#9ce8cc', red:'#ffa99d', cyan:'#8bdef5'};
  const stackColor = ['#a7a0f2','#ffd875','#7ac5f4','#8cddbf','#de9bd7'];
  const align = (x1,x2,t) => x1 + (x2-x1)*t;
  const subtitles = (ctx, text) => {
    ctx.save();
    ctx.shadowColor = '#050615';
    ctx.shadowBlur = 14;
    label(ctx,text,960,1003,{size:49,weight:700});
    ctx.restore();
  };

  function panel(ctx, x, y, w, h, stroke = colors.frame) {
    box(ctx,x,y,w,h,25,'rgba(11,18,56,.82)',stroke);
  }

  function tags(ctx, values, x, y, step, options = {}) {
    const {size = 50, width = step-20, height = 74, active = false} = options;
    values.forEach((value,i) => pill(ctx,value,x+i*step,y,width,height,{
      size, numeric:true, active, color:active ? colors.yellow : colors.white,
    }));
  }

  function windowFit(ctx,t) {
    background(ctx);
    const tokens = [...'我养的这只猫已经五岁了，它很会抓'];
    const start = 307;
    const step = 87;
    const top = 497;
    const cat = start+step*5;
    const highlights = [12,13,14,15];
    const glow = easing(t,.15,.67);
    tokens.forEach((token,i) => {
      const x = start+i*step;
      const current = highlights.includes(i);
      const remembered = i === 5;
      if (current || remembered) {
        ctx.save();
        ctx.globalAlpha = remembered ? .48+.52*glow : 1;
        box(ctx,x-40,top,80,89,7,remembered ? '#472e59' : '#3b405d',remembered ? colors.red : colors.yellow);
        ctx.restore();
      }
      label(ctx,token,x,top+45,{
        size:66,weight:current || remembered ? 700 : 400,
        color:current ? colors.white : remembered ? colors.red : '#929bcf',
      });
    });
    const leftEdge = start+step*12-40;
    const rightEdge = start+step*15+40;
    line(ctx,leftEdge,625,rightEdge,625,colors.yellow,2);
    line(ctx,leftEdge,604,leftEdge,625,colors.yellow,2);
    line(ctx,rightEdge,604,rightEdge,625,colors.yellow,2);
    label(ctx,'当前窗口', (leftEdge+rightEdge)/2,681,{size:48,color:colors.yellow,weight:700});
    label(ctx,'窗口外', cat,681,{size:48,color:colors.red,weight:700});
    subtitles(ctx,t<1.21 ? '“猫”早就在窗口外面了' : '模型根本不知道它是什么动物');
  }

  function network(ctx,x,y,width,height,t) {
    const columns = [6,3,6];
    panel(ctx,x,y,width,height,'#536199');
    const positions = columns.map((size,col) => Array.from({length:size},(_,row) => [
      x+64+col*(width-128)/2,
      y+40+row*(height-80)/(size-1),
    ]));
    const flow = Math.min(1,t);
    for (let col=0; col<positions.length-1; col++) {
      for (const [a,[ax,ay]] of positions[col].entries()) {
        for (const [b,[bx,by]] of positions[col+1].entries()) {
          const lit = flow>col/2 && flow<(col+1)/2 && (a+b)%3===0;
          line(ctx,ax,ay,bx,by,lit ? '#e8ce67' : 'rgba(153,174,244,.48)',lit ? 2.5 : 1);
        }
      }
    }
    positions.forEach((nodes,col) => nodes.forEach(([nx,ny],i) => {
      const active = flow>col/2 && (i+col)%3===0;
      box(ctx,nx-7,ny-7,14,14,3,active ? colors.yellow : '#37467b',active ? '#fff0a8' : '#8292d3');
    }));
  }

  function memoryVector(ctx,t) {
    background(ctx);
    const reveal = easing(t,.13,.7);
    const w = 640+reveal*110;
    const x = 960-w/2;
    label(ctx,'RNN 循环神经网络',960,99,{size:55,weight:700,color:colors.white});
    ctx.save();
    ctx.shadowColor = colors.cyan;
    ctx.shadowBlur = 22*reveal;
    panel(ctx,x,188,w,241,colors.cyan);
    ctx.restore();
    label(ctx,'记忆向量',960,264,{size:82,weight:700,color:colors.yellow});
    tags(ctx,['0','0','0'],765,358,195,{size:52,width:137,height:72,active:true});
    network(ctx,498,538,924,314,easing(t,2.14,3.25));
    arrow(ctx,958,435,958,527,colors.cyan,3);
    line(ctx,580,313,431,313,colors.muted,2);
    line(ctx,431,313,431,680,colors.muted,2);
    arrow(ctx,431,680,492,680,colors.cyan,2);
    label(ctx,'输入层',555,895,{size:48, color:colors.muted});
    label(ctx,'输出层',1364,895,{size:48, color:colors.muted});
    if (t>2.14) label(ctx,'我养的这只猫…',445,165,{size:49,align:'center'});
    subtitles(ctx,t<2.14 ? '它新增了一个记忆向量' : '还是这句话');
  }

  function raiseMemory(ctx,t) {
    background(ctx);
    const reveal = easing(t,.5,1.05);
    label(ctx,'我养的这只猫已经五岁了，它会抓…',960,106,{size:54,color:colors.muted});
    panel(ctx,450,190,1020,309,colors.cyan);
    label(ctx,'记忆向量',960,248,{size:56,weight:700,color:colors.cyan});
    ctx.save();
    ctx.shadowColor=colors.yellow;
    ctx.shadowBlur=24*reveal;
    label(ctx,t<.59 ? '我' : '我养',960,348,{size:align(92,142,reveal),color:colors.yellow,weight:700});
    ctx.restore();
    tags(ctx,t<.59 ? ['0.0868','−0.0420','0.0460'] : ['0.0211','0.1375','−0.0708'],730,444,230,{
      size:48,width:212,height:64,
    });
    network(ctx,641,624,638,232,easing(t,.04,1.15));
    arrow(ctx,960,617,960,518,colors.cyan,3);
    label(ctx,'同一个神经网络',960,908,{size:48,color:colors.muted});
    subtitles(ctx,t<.72 ? '同一个神经网络' : t<2.48 ? '输出的记忆向量就编码着“我养”' : '就这样一个词一个词地滚下去');
  }

  const oldMemory = [0.0211,0.1375,-0.0708];
  const weightedMemory = oldMemory.map(n=>n*.5);
  const digits = (n, count) => Object.is(n,-0) ? (0).toFixed(count) : n.toFixed(count).replace('-','−');

  function memoryWeight(ctx,t) {
    background(ctx);
    const showMultiplier = easing(t,1.38,1.85);
    const showResult = easing(t,1.85,2.35);
    label(ctx,'记忆向量 t₂',960,138,{size:80,weight:700,color:colors.yellow});
    panel(ctx,183,216,1554,321,colors.frame);
    label(ctx,'原数值',430,279,{size:52,color:colors.muted,weight:700});
    label(ctx,'乘以权重',960,279,{size:52,color:colors.muted,weight:700});
    label(ctx,'保留的信息',1490,279,{size:52,color:colors.muted,weight:700});
    oldMemory.forEach((n,i) => label(ctx,digits(n,4),430,355+i*63,{size:52,numeric:true}));
    ctx.save();
    ctx.globalAlpha=showMultiplier;
    pill(ctx,'× 0.5',960,420,292,109,{size:70,numeric:true,active:true,color:colors.yellow});
    arrow(ctx,681,421,791,421,colors.yellow,3);
    arrow(ctx,1139,421,1251,421,colors.yellow,3);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha=showResult;
    weightedMemory.forEach((n,i) => label(ctx,digits(n,5),1490,355+i*63,{size:52,numeric:true,color:colors.yellow,weight:700}));
    ctx.restore();

    panel(ctx,254,609,1368,280,showResult>.5 ? colors.cyan : colors.frame);
    label(ctx,'下方输入 · 向量拼接',960,668,{size:53,color:colors.white,weight:700});
    label(ctx,'当前词',553,735,{size:48,color:colors.muted});
    label(ctx,'保留的旧记忆',1281,735,{size:48,color:showResult>.5 ? colors.cyan : colors.muted});
    tags(ctx,['0.20','0.11','−0.08'],374,817,178,{size:50,width:160});
    label(ctx,'+',901,817,{size:67,color:colors.cyan});
    const updated = oldMemory.map((n,i)=>digits(align(n,weightedMemory[i],showResult),5));
    tags(ctx,updated,1071,817,210,{size:48,width:205,active:showResult>.5});
    arrow(ctx,1490,542,1490,598,showResult>.1 ? colors.cyan : '#818aca',2);
    subtitles(ctx,t<1.38 ? '旧的信息都要乘一次权重才能保留下来' : '假设这个权重是 0.5');
  }

  const wordLabels = ['我','吃','了','一','个'];
  const relevance = [-.76128,1.0515,.0082,.4019,.5223];
  const z = relevance.reduce((sum,score)=>sum+Math.exp(score),0);
  const weights = relevance.map(score=>Math.exp(score)/z);

  function attention(ctx,t) {
    background(ctx);
    const compared = easing(t,.67,2.18);
    const combined = easing(t,3.47,5.61);
    label(ctx,'我吃了一个',755,161,{size:68,weight:700,color:colors.white});
    pill(ctx,'苹果',1129,162,208,93,{size:66,weight:700,active:true,color:colors.yellow});
    label(ctx,'词向量',960,263,{size:50,color:colors.muted});
    for (const [i,word] of wordLabels.entries()) {
      const cx=311+i*318;
      const stroke=stackColor[i];
      panel(ctx,cx-130,324,260,350,stroke);
      label(ctx,word,cx,373,{size:65,weight:700});
      pill(ctx,'v'+(i+1),cx,473,184,79,{size:52,numeric:true,color:stroke});
      box(ctx,cx-101,567,202,24,12,'#26294f');
      box(ctx,cx-101,567,Math.max(3,202*weights[i]*compared),24,12,stroke);
      label(ctx,(compared*100*weights[i]).toFixed(1)+'%',cx,627,{size:52,numeric:true,color:stroke,weight:700});
      if (combined>0) {
        ctx.save();
        ctx.globalAlpha=combined*.68;
        arrow(ctx,cx,680,960+(cx-960)*.52,770,stroke,2.4);
        ctx.restore();
      }
    }
    label(ctx,combined>0 ? '按相关度加权叠加' : '归一化相关度',960,799,{
      size:51,color:combined>0 ? colors.yellow : colors.muted,weight:700,
    });
    if (combined>0) {
      const full=1120;
      let x=400;
      box(ctx,400,848,full,35,16,'#20244e');
      weights.forEach((w,i) => {
        const width=full*w;
        box(ctx,x,848,Math.max(2,width*combined-4),35,9,stackColor[i]);
        x+=width;
      });
      label(ctx,'更新后的“苹果”向量',960,924,{size:48,color:colors.white,weight:700});
    }
    subtitles(ctx,t<.58 ? '我们可以让“苹果”的词向量'
      : t<3.48 ? '和句子里的其他所有词向量挨个计算相关度'
      : '再按照这个相关度的大小');
  }

  const qkv = [
    ['Q',colors.yellow,['−0.337','−0.522','4.341']],
    ['K',colors.cyan,['−0.151','−0.573','−0.321']],
    ['V','#dea9ef',['−0.573','4.341','5.417']],
  ];
  function qkvFlow(ctx,t) {
    background(ctx);
    const active=t<.64 ? -1 : t<1.88 ? 0 : t<3.27 ? 1 : 2;
    panel(ctx,538,114,844,274,colors.frame);
    label(ctx,'“猫”的三维词向量',960,183,{size:58,weight:700});
    tags(ctx,['0.060','−0.884','0.190'],741,296,219,{size:48,width:199});
    line(ctx,960,389,960,456,colors.frame,3);
    line(ctx,372,456,1548,456,colors.frame,3);
    for (const [i,[key,color,values]] of qkv.entries()) {
      const x=372+i*588;
      arrow(ctx,x,456,x,536,i===active ? color : colors.frame,i===active ? 4 : 2);
      panel(ctx,x-267,554,534,285,i===active ? color : colors.frame);
      label(ctx,key,x,633,{size:82,weight:700,color:i===active ? color : colors.muted});
      tags(ctx,values,x-170,751,170,{size:48,width:164,active:i===active});
    }
    const cue=active<0 ? '得到三个新的向量' : active===2 ? '还有“猫”的 V 向量' : '“猫”的 '+qkv[active][0]+' 向量';
    subtitles(ctx,cue);
  }

  return {windowFit,memoryVector,raiseMemory,memoryWeight,attention,qkvFlow};
})();
