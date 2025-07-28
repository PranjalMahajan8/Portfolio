import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";

let handLandmarker;
let video;
let canvas;
let ctx;
let scrollVelocity = 0;

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;

function lerp(a, b, t) {
  return a + (b - a) * t;
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
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const nowInMs = Date.now();
          const result = handLandmarker.detectForVideo(video, nowInMs);

          if (result.landmarks?.length > 0) {
            const landmarks = result.landmarks[0];
            const indexTip = landmarks[8];

            // Calculate screen position from normalized coordinates
            const targetX = (1 - indexTip.x) * window.innerWidth;
            const targetY = indexTip.y * window.innerHeight;

            // Smooth movement using lerp
            smoothX = lerp(smoothX, targetX, 0.2);
            smoothY = lerp(smoothY, targetY, 0.2);

            // Update pointer position
            const pointer = document.getElementById("custom-pointer");
            if (pointer) {
              pointer.style.left = `${smoothX}px`;
              pointer.style.top = `${smoothY}px`;
            }
            if (landmarks && landmarks.length > 0) {
              const indexTip = landmarks[8];
              const screenCenter = 0.5;
              const offsetFromCenter = indexTip.y - screenCenter;
              const sensitivity = 50;
              let scrollVelocity = offsetFromCenter * sensitivity;
              scrollVelocity = Math.max(Math.min(scrollVelocity, 30), -30);
              window.scrollBy(0, scrollVelocity);
            }

            // Optional: draw red dots on canvas
            for (const point of landmarks) {
              ctx.beginPath();
              ctx.arc(
                point.x * canvas.width,
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
