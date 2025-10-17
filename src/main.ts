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

// Create a control bar with Undo / Redo / Clear buttons
const controls = document.createElement("div");
controls.className = "controls";

const undoBtn = document.createElement("button");
undoBtn.type = "button";
undoBtn.textContent = "Undo";
undoBtn.disabled = true;
controls.appendChild(undoBtn);

const redoBtn = document.createElement("button");
redoBtn.type = "button";
redoBtn.textContent = "Redo";
redoBtn.disabled = true;
controls.appendChild(redoBtn);

const clearBtn = document.createElement("button");
clearBtn.type = "button";
clearBtn.textContent = "Clear";
controls.appendChild(clearBtn);

document.body.appendChild(controls);

// Get the 2D drawing context and narrow to a non-nullable variable
const rawCtx = canvas.getContext("2d");
if (!rawCtx) {
  throw new Error("2D context not available");
}
const ctx: CanvasRenderingContext2D = rawCtx;

// Drawing state and data model
type Point = { x: number; y: number };
const strokes: Point[][] = [];
const redoStack: Point[][] = [];
let currentStroke: Point[] | null = null;
let drawing = false;

// Redraw all strokes
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx.beginPath();
    const p0 = stroke[0];
    ctx.moveTo(p0.x + 0.5, p0.y + 0.5);
    for (let i = 1; i < stroke.length; i++) {
      const p = stroke[i];
      ctx.lineTo(p.x + 0.5, p.y + 0.5);
    }
    ctx.stroke();
    ctx.closePath();
  }
}

// Observer: redraw when drawing changes
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

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
  // start a new stroke and add the initial point
  // starting a new user action invalidates the redo stack
  redoStack.length = 0;
  redoBtn.disabled = true;

  currentStroke = [];
  strokes.push(currentStroke);
  currentStroke.push({ x, y });
  // notify observers that the drawing changed
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

globalThis.addEventListener("mousemove", (ev) => {
  if (!drawing || !currentStroke) return;
  const { x, y } = getCanvasCoords(ev as MouseEvent);
  currentStroke.push({ x, y });
  // notify observers that the drawing changed
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

globalThis.addEventListener("mouseup", () => {
  if (!drawing) return;
  drawing = false;
  currentStroke = null;
  // enable undo if there are strokes
  undoBtn.disabled = strokes.length === 0;
});

canvas.addEventListener("mouseleave", () => {
  if (!drawing) return;
  drawing = false;
  currentStroke = null;
});

clearBtn.addEventListener("click", () => {
  // clear the data model and notify observer to redraw (which will clear)
  strokes.length = 0;
  redoStack.length = 0;
  currentStroke = null;
  undoBtn.disabled = true;
  redoBtn.disabled = true;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

// Undo behavior: move last stroke to redo stack
undoBtn.addEventListener("click", () => {
  if (strokes.length === 0) return;
  const last = strokes.pop()!;
  redoStack.push(last);
  // update button states
  undoBtn.disabled = strokes.length === 0;
  redoBtn.disabled = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

// Redo behavior: move last redo back to strokes
redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const last = redoStack.pop()!;
  strokes.push(last);
  // update button states
  redoBtn.disabled = redoStack.length === 0;
  undoBtn.disabled = false;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
