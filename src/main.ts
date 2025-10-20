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

// Add marker tool buttons (thin / thick)
const tools = document.createElement("div");
tools.className = "tools";

const thinBtn = document.createElement("button");
thinBtn.type = "button";
thinBtn.textContent = "Thin";
thinBtn.className = "tool selected";
tools.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.type = "button";
thickBtn.textContent = "Thick";
thickBtn.className = "tool";
tools.appendChild(thickBtn);

document.body.appendChild(tools);

// selected marker thickness (default thin)
let selectedThickness = 2;

thinBtn.addEventListener("click", () => {
  selectedThickness = 2;
  thinBtn.classList.add("selected");
  thickBtn.classList.remove("selected");
});

thickBtn.addEventListener("click", () => {
  selectedThickness = 6;
  thickBtn.classList.add("selected");
  thinBtn.classList.remove("selected");
});

// Get the 2D drawing context and narrow to a non-nullable variable
const rawCtx = canvas.getContext("2d");
if (!rawCtx) {
  throw new Error("2D context not available");
}
const ctx: CanvasRenderingContext2D = rawCtx;

// Drawing state and data model
type Point = { x: number; y: number };

// Command/Display object for a marker stroke. Stores an ordered list of points
// and knows how to draw itself on a CanvasRenderingContext2D.
class MarkerLine {
  points: Point[] = [];
  // line thickness in pixels
  thickness: number;
  constructor(x: number, y: number, thickness = 2) {
    this.thickness = thickness;
    this.points.push({ x: Math.round(x), y: Math.round(y) });
  }
  // extend the stroke with a new point
  drag(x: number, y: number) {
    this.points.push({ x: Math.round(x), y: Math.round(y) });
  }
  // render the stroke onto the provided context
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    const oldLineWidth = ctx.lineWidth;
    const p0 = this.points[0];
    ctx.moveTo(p0.x + 0.5, p0.y + 0.5);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i];
      ctx.lineTo(p.x + 0.5, p.y + 0.5);
    }
    ctx.lineWidth = this.thickness;
    ctx.stroke();
    ctx.lineWidth = oldLineWidth;
    ctx.closePath();
  }
}

const strokes: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;
let drawing = false;
// Tool preview: an object with a draw(ctx) method shown when the mouse is over
// the canvas and not currently drawing.
type Previewable = { draw(ctx: CanvasRenderingContext2D): void };
let toolPreview: Previewable | null = null;

// Redraw all strokes
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    stroke.display(ctx);
  }

  // draw tool preview on top when present and not drawing
  if (!drawing && toolPreview) {
    // draw preview with a semi-transparent style
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#000";
    toolPreview.draw(ctx);
    ctx.restore();
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

  currentStroke = new MarkerLine(x, y, selectedThickness);
  strokes.push(currentStroke);
  // notify observers that the drawing changed
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

globalThis.addEventListener("mousemove", (ev) => {
  const { x, y } = getCanvasCoords(ev as MouseEvent);
  if (drawing && currentStroke) {
    currentStroke.drag(x, y);
    // notify observers that the drawing changed
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    return;
  }

  // when not drawing, update the tool preview and dispatch an event
  toolPreview = {
    draw(ctx) {
      // show a circle whose radius matches half the selected thickness
      ctx.beginPath();
      ctx.arc(
        x,
        y,
        Math.max(1, Math.round(thisRadius(selectedThickness))),
        0,
        Math.PI * 2,
      );
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.closePath();
    },
  };
  // custom event for tool moved
  canvas.dispatchEvent(new CustomEvent("tool-moved", { detail: { x, y } }));
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

function thisRadius(thickness: number) {
  // visual radius for the preview circle
  return thickness / 2;
}

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

// clear preview when the mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
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
