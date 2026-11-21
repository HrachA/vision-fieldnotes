"use strict";
const KNN = (() => {
  const side = 28;
  const recordSize = side * side + 1;
  function transform(pixels, variant) {
    const output = new Uint8Array(pixels);
    for (let i = 0; i < pixels.length; i++) {
      if (variant === "shift") output[i] = i % side < 3 ? 0 : pixels[i - 3];
      if (variant === "dim") output[i] = Math.floor(pixels[i] * 0.5);
      if (variant === "cover" && i >= 12 * side && i < 17 * side) output[i] = 0;
    }
    return output;
  }
  function classify(reference, pixels, k, metric) {
    const candidates = [];
    for (let offset = 0; offset < reference.length; offset += recordSize) {
      let sum = 0;
      for (let i = 0; i < pixels.length; i++) {
        const difference = pixels[i] - reference[offset + 1 + i];
        sum += metric === "l1" ? Math.abs(difference) : difference * difference;
      }
      candidates.push({offset, label: reference[offset], distance: (metric === "l1" ? sum : Math.sqrt(sum)) / 255});
    }
    candidates.sort((a, b) => a.distance - b.distance || a.offset - b.offset);
    const neighbors = candidates.slice(0, k);
    const votes = Array(10).fill(0);
    for (const neighbor of neighbors) votes[neighbor.label]++;
    const count = Math.max(...votes);
    return {neighbors, label: votes.indexOf(count), count};
  }
  return {classify, transform, recordSize};
})();
