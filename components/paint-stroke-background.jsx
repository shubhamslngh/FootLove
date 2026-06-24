"use client";

import { useEffect, useRef } from "react";

export function PaintStrokeBackground({ colors, baseColor, intensity = 1 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchDevice = window.matchMedia("(hover: none)");
    let frameId = 0;
    let resizeObserver;
    let strokes = [];
    let width = 0;
    let height = 0;
    let hovering = false;
    let darkMode = document.documentElement.classList.contains("dark");
    let motion = touchDevice.matches ? 0.22 : 0.3;
    let previousTime = 0;

    function createStroke(randomProgress = false) {
      const startX = Math.random() * width * 1.5 - width * 0.7;
      const startY = Math.random() * height * 1.35 - height * 0.45;
      const progress = randomProgress ? Math.random() : 0;
      return {
        startX,
        startY,
        headX: startX + progress * 380,
        headY: startY + progress * 330,
        length: progress * 500,
        maxLength: Math.random() * 420 + 100,
        speed: (Math.random() * 4 + 7) * intensity,
        width:
          Math.random() > 0.9 ? Math.random() * 3 + 2.5 : Math.random() + 0.45,
        opacity: Math.random() * 0.34 + 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        bend: Math.random() * 12,
      };
    }

    function drawStroke(stroke) {
      const spanX = stroke.headX - stroke.startX;
      const spanY = stroke.headY - stroke.startY;
      const controlX = stroke.startX + spanX * 0.82;
      const controlY = stroke.startY + spanY * 0.82 + stroke.bend;

      context.beginPath();
      context.globalCompositeOperation = darkMode ? "overlay" : "source-over";
      context.globalAlpha = darkMode
        ? stroke.opacity
        : Math.min(stroke.opacity + 0.18, 1);
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.lineCap = "round";
      context.moveTo(stroke.startX, stroke.startY);
      context.quadraticCurveTo(controlX, controlY, stroke.headX, stroke.headY);
      context.stroke();
    }

    function paintStaticTexture() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = darkMode ? baseColor : "#f8fafc";
      context.fillRect(0, 0, width, height);
      strokes.forEach(drawStroke);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
    }

    function resize() {
      const bounds = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      strokes = Array.from({ length: 260 }, () => createStroke(true));
      paintStaticTexture();
    }

    function animate(time = 0) {
      const delta = Math.min(previousTime ? (time - previousTime) / 16 : 1, 2);
      previousTime = time;
      const target = hovering ? 1 : touchDevice.matches ? 0.22 : 0.3;
      motion += (target - motion) * 0.045;

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.fillStyle = darkMode
        ? `${baseColor}18`
        : "rgba(255, 255, 255, 0.09)";
      context.fillRect(0, 0, width, height);

      const angle = Math.PI / 4.6;
      strokes.forEach((stroke, index) => {
        if (motion > 0.002 && index % (touchDevice.matches ? 3 : 1) === 0) {
          const distance = stroke.speed * motion * delta;
          stroke.headX += Math.cos(angle) * distance;
          stroke.headY += Math.sin(angle) * distance;
          stroke.length += distance;
          if (stroke.length > stroke.maxLength) {
            stroke.startX += Math.cos(angle) * distance;
            stroke.startY += Math.sin(angle) * distance;
          }
          if (stroke.startX > width + 80 || stroke.startY > height + 80) {
            strokes[index] = createStroke();
          }
        }
        drawStroke(strokes[index]);
      });
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      frameId = window.requestAnimationFrame(animate);
    }

    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
    };

    resizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      darkMode = document.documentElement.classList.contains("dark");
      paintStaticTexture();
    });
    resizeObserver.observe(container);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    container.addEventListener("mouseenter", enter);
    container.addEventListener("mouseleave", leave);
    resize();
    if (!reducedMotion.matches) frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      themeObserver.disconnect();
      container.removeEventListener("mouseenter", enter);
      container.removeEventListener("mouseleave", leave);
    };
  }, [baseColor, colors, intensity]);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="size-full" aria-hidden="true" />
    </div>
  );
}
