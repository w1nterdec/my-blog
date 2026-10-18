import { drawXiaohei } from "./xiaohei-sprite";

let cleanup: (() => void) | undefined;
function setupXiaohei() {
  cleanup?.();
  const cat = document.querySelector<HTMLElement>("[data-xiaohei-header]");
  const rail = document.querySelector<HTMLElement>("[data-xiaohei-rail]");
  const canvas = cat?.querySelector("canvas");
  const ctx = canvas?.getContext("2d");
  if (!cat || !rail || !ctx) return;
  const element = cat;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0,
    visible = true,
    x = 16,
    target = 16,
    facing = 1;
  let last = 0,
    lastDraw = 0,
    nextMove = performance.now() + 3500,
    stride = 0,
    turn = 0;
  const limit = () => Math.max(0, rail.clientWidth - cat.offsetWidth);
  function draw(now: number, walking: boolean) {
    element.style.transform = `translateX(${x}px)`;
    drawXiaohei(ctx!, {
      mood: walking ? "walk" : "idle",
      time: now / 1000,
      facing,
      reduced: reduced.matches,
      stride,
      turn,
    });
  }
  function tick(now: number) {
    frame = 0;
    if (signal.aborted || document.hidden || !visible) return;
    const delta = Math.min(50, now - (last || now));
    last = now;
    if (now >= nextMove) {
      target = Math.random() * limit();
      nextMove = now + 6000 + Math.random() * 5000;
    }
    x = Math.min(x, limit());
    target = Math.min(target, limit());
    const distance = target - x;
    const walking = Math.abs(distance) > 0.5;
    if (walking) {
      facing = Math.sign(distance);
      const step = Math.min(Math.abs(distance), delta * 0.018);
      x += facing * step;
      stride += step * 0.28;
    }
    turn += ((walking ? 1 : 0) - turn) * Math.min(1, delta / 180);
    if (now - lastDraw > 40) {
      draw(now, walking);
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (reduced.matches) {
      draw(0, false);
      return;
    }
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    resume();
  });
  observer.observe(rail);
  document.addEventListener("visibilitychange", resume, { signal });
  reduced.addEventListener("change", resume, { signal });
  const resize = new ResizeObserver(() => {
    x = Math.min(x, limit());
    draw(performance.now(), false);
  });
  resize.observe(rail);
  draw(0, false);
  cleanup = () => {
    controller.abort();
    cancelAnimationFrame(frame);
    observer.disconnect();
    resize.disconnect();
  };
  document.addEventListener("astro:before-swap", cleanup, {
    once: true,
    signal,
  });
}
setupXiaohei();
document.addEventListener("astro:page-load", setupXiaohei);
