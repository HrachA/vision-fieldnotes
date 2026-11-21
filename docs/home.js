const digits = [7, 2, 1];
let sample = 0;
function showSample(step) {
  sample = (sample + step + digits.length) % digits.length;
  const image = document.getElementById("plate-image");
  image.src = "assets/field-" + sample + ".webp";
  image.alt = "Handwritten " + digits[sample] + " rendered as raised pixels, with brighter pixels standing taller";
  document.getElementById("plate-caption").textContent = "DIGIT " + digits[sample] + " / 28 × 28 PX";
}
document.getElementById("prev").onclick = () => showSample(-1);
document.getElementById("next").onclick = () => showSample(1);

const classCount = document.querySelectorAll("#classes .course").length;
document.querySelector("#classes .count").textContent =
  String(classCount).padStart(2, "0") + (classCount === 1 ? " class" : " classes");
