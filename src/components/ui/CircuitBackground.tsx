"use client";

import { useEffect, useRef } from "react";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes for ambient grid
    const particles: { x: number; y: number; vx: number; vy: number; radius: number; alpha: number }[] = [];
    const particleCount = Math.min(Math.floor(width / 30), 45);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    // Electrical pulses running through fixed circuit paths
    const pulses: { x: number; y: number; targetX: number; targetY: number; speed: number; progress: number }[] = [];
    
    const generatePulse = () => {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const isHorizontal = Math.random() > 0.5;
      const distance = Math.random() * 200 + 100;
      
      pulses.push({
        x: startX,
        y: startY,
        targetX: isHorizontal ? startX + (Math.random() > 0.5 ? distance : -distance) : startX,
        targetY: !isHorizontal ? startY + (Math.random() > 0.5 ? distance : -distance) : startY,
        speed: Math.random() * 0.015 + 0.005,
        progress: 0,
      });
    };

    for (let i = 0; i < 8; i++) {
      generatePulse();
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint circuit grid background
      ctx.strokeStyle = "rgba(0, 230, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 230, 255, ${p.alpha})`;
        ctx.fill();
      });

      // Update and draw circuit pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        pulse.progress += pulse.speed;

        const currentX = pulse.x + (pulse.targetX - pulse.x) * pulse.progress;
        const currentY = pulse.y + (pulse.targetY - pulse.y) * pulse.progress;

        // Trace line
        ctx.beginPath();
        ctx.moveTo(pulse.x, pulse.y);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = "rgba(0, 230, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pulse head glow
        ctx.beginPath();
        ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#00E6FF";
        ctx.shadowColor = "#00E6FF";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (pulse.progress >= 1) {
          pulses.splice(i, 1);
          generatePulse();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
