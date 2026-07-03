import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedGridPattern({ className, width = 60, height = 60, x = -1, y = -1, strokeDasharray = "4 4", numSquares = 10, duration = 4, repeatDelay = 0.5, ...props }) {
  const id = useId();
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [squares, setSquares] = useState([]);

  useEffect(() => {
    const generateGrid = () => {
      if (!containerRef.current) return [];
      const rect = containerRef.current.getBoundingClientRect();
      const cols = Math.ceil(rect.width / 60);
      const rows = Math.ceil(rect.height / 60);
      const result = [];
      for (let i = 0; i < numSquares; i++) {
        result.push({
          x: rect.x + Math.floor(Math.random() * cols) * 60,
          y: rect.y + Math.floor(Math.random() * rows) * 60,
          w: 60,
          h: 60,
        });
      }
      return result;
    };
    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: rect.width, h: rect.height });
        setSquares(generateGrid());
      }
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, [strokeDasharray, numSquares]);

  const squarePositions = squares.map((sq) => ({
    x: sq.x % (dims.w || 1),
    y: sq.y % (dims.h || 1),
    w: sq.w,
    h: sq.h,
  }));

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full fill-[#F97316]/10 stroke-[#F97316]/10", className)}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M ${width} 0 L 0 0 0 ${height}`} fill="none" stroke="currentColor" strokeDasharray={strokeDasharray} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <g>
        {squarePositions.map((pos, i) => (
          <motion.rect
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration,
              repeat: Infinity,
              delay: i * 0.1,
              repeatDelay,
              ease: "easeInOut",
            }}
            x={pos.x}
            y={pos.y}
            width={pos.w}
            height={pos.h}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0"
          />
        ))}
      </g>
    </svg>
  );
}
