"use strict";

// MNIST digits occupy about 20 pixels along their longest axis inside a 28px image.
function readHandwriting(pad) {
  const {width, height} = pad;
  const ink = pad.getContext("2d").getImageData(0, 0, width, height).data;
  let left = width, top = height, right = -1, bottom = -1;
  let mass = 0, weightedX = 0, weightedY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = ink[4 * (y * width + x) + 3];
      if (!alpha) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
      mass += alpha;
      weightedX += (x + 0.5) * alpha;
      weightedY += (y + 0.5) * alpha;
    }
  }
  if (!mass) return null;
  const boxWidth = right - left + 1, boxHeight = bottom - top + 1;
  const scale = 20 / Math.max(boxWidth, boxHeight);
  const w = boxWidth * scale, h = boxHeight * scale;
  const dx = Math.max(0, Math.min(28 - w, 14 - (weightedX / mass - left) * scale));
  const dy = Math.max(0, Math.min(28 - h, 14 - (weightedY / mass - top) * scale));
  const scaled = document.createElement("canvas");
  scaled.width = scaled.height = 28;
  const ctx = scaled.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(pad, left, top, boxWidth, boxHeight, dx, dy, w, h);
  const image = ctx.getImageData(0, 0, 28, 28).data;
  return Uint8Array.from({length: 784}, (_, i) => image[4 * i + 3]);
}

function enableDrawing(pad, onChange) {
  const ctx = pad.getContext("2d", {willReadFrequently: true});
  ctx.lineWidth = 16;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.fillStyle = ctx.strokeStyle = "#cbf498";
  let pointer = null;
  function position(event) {
    const rect = pad.getBoundingClientRect();
    return [(event.clientX - rect.left) * pad.width / rect.width,
            (event.clientY - rect.top) * pad.height / rect.height];
  }
  pad.onpointerdown = event => {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    pad.setPointerCapture(pointer);
    const [x, y] = position(event);
    ctx.beginPath(); ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  pad.onpointermove = event => {
    if (event.pointerId !== pointer) return;
    const [x, y] = position(event);
    ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  function finish(event) {
    if (event.pointerId !== pointer) return;
    if (event.type === "pointerup") {
      ctx.lineTo(...position(event)); ctx.stroke();
    }
    pointer = null;
    onChange(readHandwriting(pad));
  }
  pad.onpointerup = pad.onpointercancel = pad.onlostpointercapture = finish;
  return () => {
    pointer = null;
    ctx.clearRect(0, 0, pad.width, pad.height);
    onChange(null);
  };
}
