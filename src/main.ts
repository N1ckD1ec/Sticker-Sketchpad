import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

// Add an app title programmatically (do not edit index.html)
const appTitle = document.createElement("h1");
appTitle.textContent = "Sticker Sketchpad";
document.body.appendChild(appTitle);

// Create a 256x256 canvas and append it to the document
const canvas = document.createElement("canvas");
canvas.id = "sketch-canvas";
// Set the drawing buffer size
canvas.width = 256;
canvas.height = 256;
canvas.setAttribute("aria-label", "Drawing canvas");
document.body.appendChild(canvas);

// Keep the example image asset below the canvas
const info = document.createElement("p");
info.innerHTML =
  `Example image asset: <img src="${exampleIconUrl}" class="icon" />`;
document.body.appendChild(info);

// Create a control bar with a Clear button
const controls = document.createElement("div");
controls.className = "controls";
const clearBtn = document.createElement("button");
clearBtn.type = "button";
clearBtn.textContent = "Clear";
controls.appendChild(clearBtn);
document.body.appendChild(controls);

// Get the 2D drawing context
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D context not available");
}

// Drawing state
let drawing = false;

function getCanvasCoords(ev: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((ev.clientX - rect.left) * (canvas.width / rect.width)),
    y: Math.round((ev.clientY - rect.top) * (canvas.height / rect.height)),
  };
}

canvas.addEventListener("mousedown", (ev) => {
  drawing = true;
  const { x, y } = getCanvasCoords(ev);
  ctx.beginPath();
  ctx.moveTo(x + 0.5, y + 0.5);
});

globalThis.addEventListener("mousemove", (ev) => {
  if (!drawing) return;
  const { x, y } = getCanvasCoords(ev as MouseEvent);
  ctx.lineTo(x + 0.5, y + 0.5);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
});

globalThis.addEventListener("mouseup", () => {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
});

canvas.addEventListener("mouseleave", () => {
  if (!drawing) return;
  drawing = false;
  ctx.closePath();
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
