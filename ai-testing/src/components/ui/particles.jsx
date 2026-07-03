import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const bigint = parseInt(hex, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function Particles({ className = "", quantity = 100, ease = 70, color = "#ffffff", size = 0.5 }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const circlesRef = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const rgb = hexToRgb(color);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const onMouse = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  const init = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    canvasSize.current.w = parent.offsetWidth || window.innerWidth;
    canvasSize.current.h = parent.offsetHeight || window.innerHeight;
    canvas.width = canvasSize.current.w * dpr;
    canvas.height = canvasSize.current.h * dpr;
    canvas.style.width = canvasSize.current.w + "px";
    canvas.style.height = canvasSize.current.h + "px";
    ctxRef.current = canvas.getContext("2d");
    ctxRef.current.scale(dpr, dpr);

    circlesRef.current = Array.from({ length: quantity }, () => ({
      x: Math.random() * canvasSize.current.w,
      y: Math.random() * canvasSize.current.h,
      translateX: 0,
      translateY: 0,
      size: Math.random() * 2 + size,
      alpha: Math.random() * 0.4 + 0.1,
      targetAlpha: Math.random() * 0.6 + 0.1,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
    }));
  }, [quantity, size, dpr]);

  useEffect(() => {
    const handleResize = () => init();
    window.addEventListener("resize", handleResize);
    init();
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    function loop() {
      ctx.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
      const mouseDist = 100;

      circlesRef.current.forEach((c, i) => {
        const dx = mouse.current.x - c.x;
        const dy = mouse.current.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseDist) {
          const force = (mouseDist - dist) / mouseDist;
          c.translateX -= (dx / dist || 0) * force * 0.5;
          c.translateY -= (dy / dist || 0) * force * 0.5;
        }

        c.translateX += (c.dx - c.translateX) / ease;
        c.translateY += (c.dy - c.translateY) / ease;
        c.x += c.translateX;
        c.y += c.translateY;

        if (c.x < 0) c.x = canvasSize.current.w;
        if (c.x > canvasSize.current.w) c.x = 0;
        if (c.y < 0) c.y = canvasSize.current.h;
        if (c.y > canvasSize.current.h) c.y = 0;

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${c.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < circlesRef.current.length; j++) {
          const o = circlesRef.current[j];
          const odx = c.x - o.x;
          const ody = c.y - o.y;
          const od = Math.sqrt(odx * odx + ody * ody);
          if (od < 120) {
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.08 * (1 - od / 120)})`;
            ctx.stroke();
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [ease, rgb, init]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-0", className)}>
      <canvas ref={canvasRef} />
    </div>
  );
}
