import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";

let handLandmarker;
let video;
let canvas;
let ctx;

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;

let lastClickTime = 0;
const clickCooldown = 800; // ms

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
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
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;

      video.addEventListener("loadeddata", () => {
        function drawFrame() {
          canvas.width = 120;
          canvas.height = 120;
          ctx.save(); // Save current state
          ctx.translate(canvas.width, 0); // Move to right edge
          ctx.scale(-1, 1); // Flip horizontally
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore(); // Restore to normal

          const nowInMs = Date.now();
          const result = handLandmarker.detectForVideo(video, nowInMs);

          if (result.landmarks?.length > 0) {
            const landmarks = result.landmarks[0];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // ---- POINTER MOVEMENT ----
            const targetX = (1 - indexTip.x) * window.innerWidth;
            const targetY = indexTip.y * window.innerHeight;
            smoothX = lerp(smoothX, targetX, 0.3);
            smoothY = lerp(smoothY, targetY, 0.3);

            const pointer = document.getElementById("custom-pointer");
            if (pointer) {
              pointer.style.left = `${smoothX}px`;
              pointer.style.top = `${smoothY}px`;
            }

            // ---- CLICK GESTURE (Pinch) ----
            const pinchDist = distance(indexTip, thumbTip);
            if (pinchDist < 0.05) {
              const now = Date.now();
              if (now - lastClickTime > clickCooldown) {
                const clickedElem = document.elementFromPoint(smoothX, smoothY);
                if (clickedElem) clickedElem.click();
                lastClickTime = now;
              }

              // ---- SCROLLING WHILE PINCHING ----
              const screenCenter = 0.5;
              const offsetFromCenter = indexTip.y - screenCenter;
              const sensitivity = 50;
              let scrollVelocity = offsetFromCenter * sensitivity;
              scrollVelocity = Math.max(Math.min(scrollVelocity, 30), -30);
              window.scrollBy(0, scrollVelocity);
            }

            // ---- DRAW LANDMARKS ----
            for (const point of landmarks) {
              ctx.beginPath();
              ctx.arc(
                (1-point.x) * canvas.width,
                point.y * canvas.height,
                4,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = "red";
              ctx.fill();
            }
          }

          requestAnimationFrame(drawFrame);
        }

        drawFrame();
      });
    })
    .catch((err) => {
      console.error("Webcam access denied:", err);
    });
}

initHandTracking();
