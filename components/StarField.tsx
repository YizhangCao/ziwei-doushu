'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * 星空背景（#57）：一片安静的星空，是“灵性”的底色。
 *
 * - 单色：夜里是白色星光，白天是极淡的墨色微尘——同一片天，不再一金一蓝。
 * - 慢：每颗星的明暗变化都很缓，像呼吸，不像闪烁。
 * - 尊重“减少动态效果”：只画一帧，不动。
 * - 高分屏按 devicePixelRatio 绘制，星点不发虚。
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLight = theme === 'light';
    // 星光颜色（canvas 无法读取 CSS 变量的值，这里是对应 --tx-0 的 RGB）
    const rgb = isLight ? '0, 0, 0' : '255, 255, 255';
    const count = isLight ? 90 : 180;

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type Particle = { x: number; y: number; r: number; alpha: number; alphaDir: number; speed: number };
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1 + 0.25,
      alpha: Math.random(),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      speed: Math.random() * 0.002 + 0.0008,
    }));

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha * (isLight ? 0.35 : 1)})`;
        ctx.fill();
      }
    };

    let animId = 0;
    const tick = () => {
      for (const p of particles) {
        p.alpha += p.alphaDir * p.speed;
        if (p.alpha >= 1) { p.alpha = 1; p.alphaDir = -1; }
        if (p.alpha <= 0.1) { p.alpha = 0.1; p.alphaDir = 1; }
      }
      paint();
      animId = requestAnimationFrame(tick);
    };

    const onResize = () => { resize(); paint(); };
    window.addEventListener('resize', onResize);
    if (reduceMotion) paint();
    else tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      // 透明度跟着 data-theme 走（CSS），服务端和浏览器一致
      style={{ opacity: 'var(--starfield-opacity)' }}
    />
  );
}
