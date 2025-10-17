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
info.innerHTML = `Example image asset: <img src="${exampleIconUrl}" class="icon" />`;
document.body.appendChild(info);
