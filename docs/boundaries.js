"use strict";
(() => {
  // The lone B point on the left makes the effect of changing k visible.
  const groups = [
    [[-.85,.42],[-.69,.63],[-.57,.37],[-.32,.53],[-.74,.16],[-.29,.12],[-.46,-.08],[-.82,-.23],[-.58,-.41],[-.32,-.48],[-.12,-.17],[.05,.24]],
    [[-.52,.19],[.12,.68],[.36,.46],[.64,.64],[.78,.25],[.45,.12],[.17,-.04],[.62,-.13],[.83,-.38],[.39,-.39],[.18,-.64],[.64,-.68]]
  ];
  const points = groups.flatMap((group, label) => group.map(([x,y]) => ({x,y,label})));
  const map = document.getElementById("boundary-map");
  const ctx = map.getContext("2d");
  const kInput = document.getElementById("boundary-k");
  const metricInput = document.getElementById("boundary-metric");
  const output = document.getElementById("boundary-readout");
  const original = {x:-.55, y:.21};
  let query = {...original};
  const margin = 36, size = map.width - margin * 2;
  const region = document.createElement("canvas");
  region.width = region.height = 160;
  const fill = region.getContext("2d");
  const backgrounds = [[220,236,207], [228,219,243]];
  const inks = ["#46733f", "#7954a3"];

  function nearest(x, y) {
    const manhattan = metricInput.value === "l1";
    return points.map(point => {
      const dx = x - point.x, dy = y - point.y;
      const distance = manhattan ? Math.abs(dx) + Math.abs(dy) : dx*dx + dy*dy;
      return {point,distance};
    }).sort((a,b) => a.distance - b.distance).slice(0, Number(kInput.value));
  }
  function countB(neighbors) {
    return neighbors.reduce((votes,n) => votes + n.point.label, 0);
  }
  const px = x => margin + (x+1) * size/2;
  const py = y => margin + (1-y) * size/2;
  function line(x1,y1,x2,y2) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }
  function paintRegions() {
    const width = region.width;
    const pixels = fill.createImageData(width,width);
    for (let row=0; row<width; row++) {
      for (let col=0; col<width; col++) {
        const neighbors = nearest(2*(col+.5)/width-1, 1-2*(row+.5)/width);
        const color = backgrounds[Number(countB(neighbors) > neighbors.length/2)];
        const i = 4*(row*width+col);
        pixels.data[i] = color[0]; pixels.data[i+1] = color[1];
        pixels.data[i+2] = color[2]; pixels.data[i+3] = 255;
      }
    }
    fill.putImageData(pixels,0,0);
    draw();
  }
  function draw() {
    const neighbors = nearest(query.x,query.y);
    const b = countB(neighbors), a = neighbors.length - b;
    ctx.clearRect(0,0,map.width,map.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(region,margin,margin,size,size);
    ctx.strokeStyle = "#ffffffb0"; ctx.lineWidth = 1;
    for (const t of [-.5,0,.5]) {
      line(px(t),margin,px(t),margin+size); line(margin,py(t),margin+size,py(t));
    }
    ctx.font = "16px sans-serif"; ctx.fillStyle = "#454d43"; ctx.textAlign = "center";
    for (const t of [-1,0,1]) {
      ctx.fillText(String(t),px(t),margin+size+19);
      ctx.fillText(String(t),margin-18,py(t)+5);
    }
    ctx.fillText("x₁",margin+size+17,margin+size+20); ctx.fillText("x₂",margin-18,margin-16);
    ctx.strokeStyle = "#2b362bc7"; ctx.lineWidth = 2;
    ctx.setLineDash([4,3]);
    for (const {point} of neighbors) line(px(query.x),py(query.y),px(point.x),py(point.y));
    ctx.setLineDash([]);
    for (const {x,y,label} of points) {
      const u=px(x), v=py(y);
      ctx.beginPath();
      if (label === 0) ctx.arc(u,v,5.8,0,2*Math.PI);
      else {ctx.moveTo(u,v-7); ctx.lineTo(u+7,v+5.5); ctx.lineTo(u-7,v+5.5); ctx.closePath();}
      ctx.fillStyle=inks[label]; ctx.fill(); ctx.strokeStyle="white"; ctx.lineWidth=1.5; ctx.stroke();
    }
    const u=px(query.x), v=py(query.y);
    ctx.beginPath(); ctx.arc(u,v,8,0,2*Math.PI); ctx.strokeStyle="#fff"; ctx.lineWidth=5; ctx.stroke();
    ctx.strokeStyle="#20241e"; ctx.lineWidth=2; ctx.stroke();
    line(u-6,v,u+6,v); line(u,v-6,u,v+6);
    output.textContent="Prediction " + (a>b ? "A" : "B") + " · A votes: " + a + " · B votes: " + b
      + " · Query (" + query.x.toFixed(2) + ", " + query.y.toFixed(2) + ")";
  }
  const clamp = v => Math.max(-1,Math.min(1,v));
  map.addEventListener("pointerdown", event => {
    const rect = map.getBoundingClientRect();
    query.x = clamp(((event.clientX-rect.left)*map.width/rect.width-margin)*2/size-1);
    query.y = clamp(1-((event.clientY-rect.top)*map.height/rect.height-margin)*2/size);
    map.focus({preventScroll:true}); draw();
  });
  map.addEventListener("keydown", event => {
    const steps = {ArrowRight:[.05,0],ArrowLeft:[-.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault(); query.x=clamp(query.x+step[0]); query.y=clamp(query.y+step[1]); draw();
  });
  kInput.onchange = metricInput.onchange = paintRegions;
  document.getElementById("boundary-reset").onclick = () => {
    kInput.value="1"; metricInput.value="l2"; query={...original}; paintRegions();
  };
  paintRegions();
})();
