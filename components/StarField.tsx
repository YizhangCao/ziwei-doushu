'use client';
import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * 星空背景（#57，overdrive）：众星拱北辰。
 *
 * - 星空绕首屏的北辰标记（[data-pole-star]）缓缓转动。标记随页面滚走时，旋转中心跟着它
 *   移出屏幕上方，星点就划出长曝光星轨那样的弧线。
 * - 滚过首屏时转速加快、拖出星轨；过了首屏又慢回平静的速度，不打扰阅读。
 * - 这是全站唯一不只动透明度和描边的运动（DESIGN.md「转动的夜空」规则），始终在内容之下。
 * - 单色：夜里是白色星光，白天是极淡的墨色微尘。星轨靠把画布逐帧淡回透明来做，两种主题通用。
 * - 尊重“减少动态效果”：只画一帧，不转。
 * - 高分屏按 devicePixelRatio 绘制（上限 2），页面在后台时浏览器会暂停 requestAnimationFrame。
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
    // 星光颜色对应 --tx-0 的 RGB
    const rgb = isLight ? '0, 0, 0' : '255, 255, 255';
    const strength = isLight ? 0.35 : 1;

    let width = 0;
    let height = 0;
    type Star = { r: number; a: number; size: number; alpha: number };
    let stars: Star[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Stars on a disc wide enough to cover the screen from any centre we turn around;
      // fewer on small screens and in day mode, where they are only faint dust.
      const reach = Math.hypot(width, height) * 1.6;
      const count = Math.round(Math.min(900, (width * height) / (isLight ? 3200 : 1600)));
      stars = Array.from({ length: count }, () => ({
        r: Math.sqrt(Math.random()) * reach,
        a: Math.random() * Math.PI * 2,
        size: Math.random() < 0.9 ? 0.8 : 1.5,
        alpha: 0.2 + Math.random() * 0.8,
      }));
    };

    /** The pole star's position on screen; falls back to the upper right on pages without one. */
    const pole = () => {
      const mark = document.querySelector('[data-pole-star]');
      if (mark) {
        const box = mark.getBoundingClientRect();
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      }
      return { x: width * 0.75, y: height * 0.3 };
    };

    /** 0 at the top of the page, 1 at the end of the first screen. */
    const progress = () => window.scrollY / Math.max(window.innerHeight * 0.92, 1);

    let angle = 0;
    const paint = (dt: number, fresh: boolean) => {
      const p = progress();
      // Speed rises while the first screen scrolls away, then falls back to a calm turn.
      const boost = p <= 1 ? Math.max(p, 0) : Math.max(0, 1 - (p - 1) * 2);
      angle += (0.006 + boost * boost * 0.3) * dt;
      if (fresh) {
        ctx.clearRect(0, 0, width, height);
      } else {
        // Fade what is already drawn toward transparent: short trails at rest, longer while turning fast.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.06, 0.4 - boost * 0.34)})`;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }
      const { x: cx, y: cy } = pole();
      for (const star of stars) {
        const x = cx + star.r * Math.cos(star.a + angle);
        const y = cy + star.r * Math.sin(star.a + angle);
        if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue;
        ctx.fillStyle = `rgba(${rgb}, ${star.alpha * strength})`;
        ctx.fillRect(x, y, star.size, star.size);
      }
    };

    let animId = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      paint(dt, false);
      animId = requestAnimationFrame(tick);
    };

    const onResize = () => { resize(); paint(0, true); };
    window.addEventListener('resize', onResize);
    resize();
    paint(0, true);
    if (!reduceMotion) animId = requestAnimationFrame(tick);

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
