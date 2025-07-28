import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";

let handLandmarker;
let video;
let canvas;
let ctx;
let animationId;

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;

let lastClickTime = 0;
const clickCooldown = 800;

let isScrolling = false;
let gestureEnabled = true;

// Toggle gesture on/off using checkbox
const toggleCheckbox = document.getElementById("gestureToggle");
if (toggleCheckbox) {
  gestureEnabled = toggleCheckbox.checked;

  toggleCheckbox.addEventListener("change", () => {
    gestureEnabled = toggleCheckbox.checked;

    if (gestureEnabled) {
      initHandTracking();
      document.getElementById("custom-pointer").style.display = "block";
    } else {
      stopGesture();
    }
  });
}

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function stopGesture() {
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    video.srcObject = null;
  }

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  const pointer = document.getElementById("custom-pointer");
  if (pointer) pointer.style.display = "none";

  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function initHandTracking() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "./assets/models/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });

  setupCamera();
}

function setupCamera() {
  canvas = document.getElementById("gesture-canvas");
  ctx = canvas.getContext("2d");

  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "user" } })
    .then((stream) => {
      video.srcObject = stream;

      video.addEventListener("loadeddata", () => {
        drawLoop();
      });
    })
    .catch((err) => {
      console.error("Webcam access denied:", err);
    });
}

function drawLoop() {
  canvas.width = 120;
  canvas.height = 120;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror the canvas horizontally
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const nowInMs = Date.now();
  const result = handLandmarker.detectForVideo(video, nowInMs);

  if (result.landmarks?.length > 0 && gestureEnabled) {
    const landmarks = result.landmarks[0];
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    // Smooth pointer tracking (already mirrored)
    const targetX = (1 - indexTip.x) * window.innerWidth;
    const targetY = indexTip.y * window.innerHeight;
    smoothX = lerp(smoothX, targetX, 0.25);
    smoothY = lerp(smoothY, targetY, 0.25);

    const pointer = document.getElementById("custom-pointer");
    if (pointer) {
      pointer.style.left = `${smoothX}px`;
      pointer.style.top = `${smoothY}px`;
    }

    // Click via pinch
    const pinchDistance = distance(indexTip, thumbTip);
    if (pinchDistance < 0.05 && nowInMs - lastClickTime > clickCooldown) {
      const elem = document.elementFromPoint(smoothX, smoothY);
      if (elem) elem.click();
      lastClickTime = nowInMs;
      isScrolling = true;
    }

    // Glow hover effect (optional, non-blocking)
    const allHoverables = document.querySelectorAll(".hover-glow");
    allHoverables.forEach((el) => el.classList.remove("gesture-hover"));
    const hoveredElem = document.elementFromPoint(smoothX, smoothY);
    if (hoveredElem && hoveredElem.classList.contains("hover-glow")) {
      hoveredElem.classList.add("gesture-hover");
    }

    // Scroll logic
    if (pinchDistance < 0.06 && isScrolling) {
      const offsetY = indexTip.y - 0.5;
      let velocity = offsetY * 50;
      velocity = Math.max(Math.min(velocity, 30), -30);
      window.scrollBy(0, velocity);
    } else {
      isScrolling = false;
    }

    // Draw mirrored landmarks
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    for (const pt of landmarks) {
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
    ctx.restore();
  }

  animationId = requestAnimationFrame(drawLoop);
}

// Initial run
if (gestureEnabled) {
  initHandTracking();
}
