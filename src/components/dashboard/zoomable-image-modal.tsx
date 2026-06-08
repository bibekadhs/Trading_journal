"use client";

import { useState, useEffect, useCallback } from "react";

export function ZoomableImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale((s) => Math.min(Math.max(0.5, s - e.deltaY * 0.01), 5));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  }, [pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/95"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="absolute left-6 top-6 z-10 rounded bg-black/50 px-3 py-1.5 text-xs font-mono text-white/50 backdrop-blur-sm">
        Hold Ctrl + Scroll to Zoom • Drag to Pan
      </div>
      <div className="absolute bottom-6 z-10 flex gap-2 rounded-lg bg-black/50 p-2 shadow-xl backdrop-blur-sm">
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="rounded bg-white/10 p-2 text-xs font-bold text-white transition hover:bg-white/20"
        >
          Zoom Out
        </button>
        <button
          onClick={() => { setScale(1); setPos({ x: 0, y: 0 }); }}
          className="rounded bg-white/10 p-2 text-xs font-bold text-white transition hover:bg-white/20"
        >
          Reset
        </button>
        <button
          onClick={() => setScale((s) => Math.min(5, s + 0.2))}
          className="rounded bg-white/10 p-2 text-xs font-bold text-white transition hover:bg-white/20"
        >
          Zoom In
        </button>
      </div>
      <img
        src={src}
        onMouseDown={handleMouseDown}
        className="max-w-none select-none object-contain cursor-move transition-transform duration-75"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          maxHeight: "90vh",
          maxWidth: "90vw",
        }}
        draggable={false}
      />
    </div>
  );
}
