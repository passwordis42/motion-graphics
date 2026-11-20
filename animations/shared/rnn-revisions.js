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


  const sourceWords = ['我','吃','了','一','个'];
  // 三维示例保留原片中“苹果”相对各词的相关度顺序。
  const sourceVectors = [
    [-.507,.089,.217], [.901,-.879,-.684], [.007,.437,.575],
    [.345,.374,.753], [.448,-.432,-.367],
  ];
  const appleVector = [1.168,0,0];
  const scores = sourceVectors.map(vector => vector.reduce((sum,n,index)=>sum+n*appleVector[index],0));
  const denominator = scores.reduce((sum,score) => sum + Math.exp(score),0);
  const relevanceWeights = scores.map(score => Math.exp(score)/denominator);
  const resultVector = appleVector.map((n,i)=>n+sourceVectors.reduce((sum,vector,j)=>sum+vector[i]*relevanceWeights[j],0));
  const rowPositions = [271,543,815,1087,1359];
  const appleX = 1632;
  const vectorNumber = (n) => n.toFixed(3).replace('-','−');

  function verticalVector(ctx, word, vector, x, y, color, typography = 32) {
    const compact = typography < 32;
    const columnWidth = compact ? 156 : 178;
    const rowHeight = compact ? 35 : 43;
    const columnHeight = 3*rowHeight+18;
    const gradient = ctx.createLinearGradient(x-columnWidth/2,y,x+columnWidth/2,y);
    gradient.addColorStop(0,'#303164');
    gradient.addColorStop(.45,'#282054');
    gradient.addColorStop(1,'#534687');
    box(ctx,x-columnWidth/2,y+44,columnWidth,columnHeight,25,gradient,color);
    pill(ctx,word,x,y+13,word==='苹果' ? 120 : 66,47,{
      size:compact ? 30 : 36,color,weight:700,
    });
    vector.forEach((value,i)=>{
      pill(ctx,vectorNumber(value),x,y+44+rowHeight/2+9+i*rowHeight,columnWidth-28,rowHeight-5,{
        size:typography,numeric:true,color:colors.white,
      });
    });
  }

  function contribution(ctx,x, endX, color, weight, sweep) {
    const y=793;
    const drop=171;
    const width=endX-x;
    ctx.save();
    ctx.strokeStyle=color;
    ctx.globalAlpha=.6;
    ctx.lineWidth=1.5+8*weight;
    ctx.setLineDash([7,10]);
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.bezierCurveTo(x,y+drop,endX,y+drop,endX,y+8);
    ctx.stroke();
    ctx.setLineDash([]);
    const q=1-sweep;
    const pX=x+(3*q*sweep*sweep+sweep*sweep*sweep)*width;
    const pY=y+3*drop*sweep*q+8*sweep*sweep*sweep;
    ctx.globalAlpha=1;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(pX,pY,4+6*weight,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  function attention(ctx,t) {
    background(ctx);
    const comparing = t < 2.62;
    const weightsVisible = easing(t,2.30,2.9);
    const grouped = easing(t,3.92,5.00);
    const combined = easing(t,4.6,5.82);
    const yellow = colors.yellow;
    const stepLabels = [
      ['1','逐个比较'],
      ['2','相关度转成权重'],
      ['3','按权重叠加'],
    ];
    const selected = t < 2.62 ? 0 : t < 4.48 ? 1 : 2;
    for (const [i,[step,stage]] of stepLabels.entries()) {
      const x=258+i*465;
      pill(ctx,step,x,93,45,45,{size:25,color:i===selected ? yellow : colors.muted,active:i===selected,weight:700});
      label(ctx,stage,x+43,93,{size:32,color:i===selected ? yellow : colors.muted,align:'left',weight:i===selected ? 700 : 500});
    }

    const sourceY=align(564,449,grouped);
    const appleY=align(180,449,grouped);
    const currentWord= t >= .42 && t < 2.38 ? Math.min(4,Math.floor((t-.42)/.38)) : -1;
    for (const [i,x] of rowPositions.entries()) {
      const col = stackColor[i];
      const clone = easing(t,.21+i*.12,1.04+i*.14);
      const leaving = easing(t,2.02+i*.045,2.79+i*.05);
      const cloneX = align(align(appleX,x,clone),appleX,leaving);
      const darkened = Math.max(0,.76*clone*(1-leaving));
      const hit = currentWord===i;
      if (darkened > .025) {
        ctx.save();
        ctx.globalAlpha=hit ? Math.min(1,darkened*1.6) : darkened*.8;
        verticalVector(ctx,'苹果',appleVector,cloneX,190,hit ? yellow : '#8d87c4',28);
        ctx.restore();
      }
      verticalVector(ctx,sourceWords[i],sourceVectors[i],x,sourceY,hit ? yellow : col);
      if (hit && comparing) {
        const progress=easing(t,.51+i*.38,.78+i*.38);
        const a=399;
        const b=sourceY-12;
        arrow(ctx,x,a,x,align(a,b,progress),col,3.5,13);
      }

      const weight = relevanceWeights[i];
      if (weightsVisible>.015) {
        ctx.save();
        ctx.globalAlpha=weightsVisible;
        const barY=sourceY+218;
        box(ctx,x-93,barY,186,13,6,'#28294f');
        box(ctx,x-93,barY,Math.max(2,186*weight),13,6,col);
        label(ctx,(100*weight).toFixed(1)+'%',x,barY+39,{
          size:39,numeric:true,color:col,weight:700,
        });
        ctx.restore();
      }

      if (combined > .015) {
        const sweep=easing(t,4.65+i*.07,5.56+i*.05);
        if (sweep > 0) contribution(ctx,x,appleX,col,weight,sweep);
      }
    }

    const updated = appleVector.map((n,i)=>align(n,resultVector[i],combined));
    verticalVector(ctx,'苹果',updated,appleX,appleY,combined>.02 ? yellow : '#b6abd7');
    let explanation = '用“苹果”的词向量逐个比较';
    if (selected===1) explanation='把相关度归一化成权重';
    if (selected===2) explanation='各词的词向量 × 权重，再叠加到“苹果”';
    if (t >= 3.05) {
      label(ctx,explanation,960,245,{size:47,weight:700,color:selected===2 ? yellow : colors.white});
    } else {
      label(ctx,explanation,947,139,{size:34,color:colors.muted});
    }
    subtitles(ctx,t<.58 ? '我们可以让“苹果”的词向量'
      : t<3.93 ? '和句子里的其他所有词向量挨个计算相关度'
      : t<5.30 ? '再按照这个相关度的大小'
      : '成比例地把其他词的语义加在苹果身上');
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

  return {windowFit,memoryVector,attention,qkvFlow};
})();
