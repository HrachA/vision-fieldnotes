"use strict";
const field = id => document.getElementById(id);
let reference, queries;
let handwriting = null;

function drawDigit(canvas, pixels, palette) {
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(28, 28);
  for (let i = 0; i < pixels.length; i++) {
    for (let channel = 0; channel < 3; channel++) {
      const [background, foreground] = palette;
      image.data[4*i + channel] = background[channel] + (foreground[channel] - background[channel]) * pixels[i] / 255;
    }
    image.data[4*i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function updateLab() {
  const drawing = field("draw-mode").checked;
  field("drawing-input").hidden = !drawing;
  field("sample-input").hidden = drawing;
  field("clear-drawing").disabled = !handwriting;
  if (drawing && !handwriting) {
    drawDigit(field("digit"), new Uint8Array(784), [[32,36,30], [203,244,152]]);
    field("prediction").textContent = "—";
    field("summary").textContent = "Draw a digit to see the vote.";
    field("neighbors").replaceChildren();
    return;
  }
  const offset = Number(field("query").value) * KNN.recordSize;
  const input = drawing ? handwriting : queries.subarray(offset + 1, offset + KNN.recordSize);
  const pixels = KNN.transform(input, field("variant").value);
  const k = Number(field("k").value);
  const result = KNN.classify(reference, pixels, k, field("metric").value);
  drawDigit(field("digit"), pixels, [[32,36,30], [203,244,152]]);
  field("prediction").textContent = result.label;
  const description = drawing ? "Your drawing" : "True label " + queries[offset];
  field("summary").textContent = description + " · " + result.count + " of " + k + " votes";
  const tiles = result.neighbors.map(({offset, label, distance}, i) => {
    const tile = document.createElement("div");
    tile.className = "neighbor";
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 28;
    canvas.setAttribute("aria-label", "Neighbor " + (i + 1) + ", digit " + label);
    drawDigit(canvas, reference.subarray(offset + 1, offset + KNN.recordSize), [[225,221,240], [52,46,75]]);
    const caption = document.createElement("span");
    caption.textContent = label + " · " + distance.toFixed(1);
    tile.append(canvas, caption);
    return tile;
  });
  field("neighbors").replaceChildren(...tiles);
}

async function loadImages(name, size) {
  const response = await fetch("assets/" + name + ".bin");
  if (!response.ok) throw new Error("Image set unavailable");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length !== size * KNN.recordSize) throw new Error("Incomplete image set");
  return bytes;
}

async function startLab() {
  const controls = [...field("controls").elements];
  controls.forEach(control => control.disabled = true);
  try {
    [reference, queries] = await Promise.all([loadImages("reference", 1000), loadImages("queries", 30)]);
    for (let i = 0; i < 30; i++) {
      const label = queries[i * KNN.recordSize];
      field("query").add(new Option("Digit " + label + " · sample " + (i % 3 + 1), i));
    }
    const initial = "21";
    field("query").value = initial;
    const clearDrawing = enableDrawing(field("drawing-pad"), pixels => {
      handwriting = pixels;
      updateLab();
    });
    field("clear-drawing").onclick = clearDrawing;
    field("controls").onchange = updateLab;
    field("reset").onclick = () => {
      field("controls").reset();
      field("query").value = initial;
      clearDrawing();
    };
    controls.forEach(control => control.disabled = false);
    updateLab();
  } catch {
    field("summary").textContent = "The samples could not load. Refresh the page to retry.";
  }
}
startLab();
