import { localize, currentLanguage } from "@/i18n/site";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { Place } from "@/data/personal";

export function initGlobes() {
  const s = localize(currentLanguage());
  document.querySelectorAll<HTMLElement>("[data-globe]").forEach(root => {
    if (root.dataset.bound) return;
    root.dataset.bound = "true";
    const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
    const status = root.querySelector<HTMLElement>(".globe-loading")!;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      status.textContent = s("当前浏览器不支持地球仪。");
      return;
    }
    const stage = root.querySelector<HTMLElement>(".globe-stage")!;
    const places: Pick<Place, "coordinates">[] = JSON.parse(
      root.dataset.places!
    );
    const markers = [
      ...root.querySelectorAll<HTMLButtonElement>("[data-globe-marker]"),
    ];
    const controller = new AbortController();
    const { signal } = controller;
    const projection = geoOrthographic().clipAngle(90).precision(0.4);
    const path = geoPath(projection, ctx);
    const grid = geoGraticule10();
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => style.getPropertyValue(name).trim();
    const colors = {
      water: color("--globe-water"),
      land: color("--globe-land"),
      grid: color("--globe-grid"),
      border: color("--border"),
    };
    let world: GeoPermissibleObjects | undefined;
    let loading = false;
    let rotation: [number, number, number] = [-108, -30, 0];
    let zoom = 1;
    let size = 400;
    let pointerId: number | undefined;
    let startX = 0;
    let startY = 0;
    let pointerRotation: [number, number, number] = [...rotation];
    let frame = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancelFocus = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    function focusPlace(index: number) {
      cancelFocus();
      markers.forEach((marker, i) =>
        marker.setAttribute("aria-pressed", String(i === index))
      );
      const from = [...rotation];
      const fromZoom = zoom;
      const [longitude, latitude] = places[index].coordinates;
      const longitudeDelta =
        ((((-longitude - from[0]) % 360) + 540) % 360) - 180;
      const start = performance.now();
      const animate = (now: number) => {
        const progress = reducedMotion.matches
          ? 1
          : Math.min((now - start) / 550, 1);
        const ease = 1 - (1 - progress) ** 3;
        rotation = [
          from[0] + longitudeDelta * ease,
          from[1] + (-latitude - from[1]) * ease,
          0,
        ];
        zoom = fromZoom + (1.08 - fromZoom) * ease;
        draw();
        frame = progress < 1 ? requestAnimationFrame(animate) : 0;
      };
      frame = requestAnimationFrame(animate);
    }
    markers.forEach((marker, index) =>
      marker.addEventListener("click", () => focusPlace(index), { signal })
    );

    function draw() {
      if (!world || !ctx) return;
      ctx.clearRect(0, 0, size, size);
      projection
        .translate([size / 2, size / 2])
        .scale(size * 0.44 * zoom)
        .rotate(rotation);
      ctx.beginPath();
      path({ type: "Sphere" });
      ctx.fillStyle = colors.water;
      ctx.fill();
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      path(world);
      ctx.fillStyle = colors.land;
      ctx.fill();
      ctx.strokeStyle = colors.water;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      path(grid);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      places.forEach((place, index) => {
        const marker = markers[index];
        marker.hidden =
          geoDistance(place.coordinates, [-rotation[0], -rotation[1]]) >
          Math.PI / 2;
        if (marker.hidden) return;
        const point = projection(place.coordinates);
        if (!point) return;
        marker.hidden = point.some(
          coordinate => coordinate < 0 || coordinate > size
        );
        marker.style.left = `${point[0]}px`;
        marker.style.top = `${point[1]}px`;
      });
    }
    function resize() {
      size = stage.clientWidth;
      if (!size) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    canvas.addEventListener(
      "pointerdown",
      event => {
        if (!event.isPrimary || event.button !== 0) return;
        cancelFocus();
        canvas.setPointerCapture(event.pointerId);
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        pointerRotation = [...rotation];
      },
      { signal }
    );
    canvas.addEventListener(
      "pointermove",
      event => {
        if (event.pointerId !== pointerId) return;
        const factor = 0.35 / zoom;
        rotation = [
          pointerRotation[0] + (event.clientX - startX) * factor,
          Math.max(
            -80,
            Math.min(80, pointerRotation[1] - (event.clientY - startY) * factor)
          ),
          0,
        ];
        draw();
      },
      { signal }
    );
    const stopDragging = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = undefined;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerup", stopDragging, { signal });
    canvas.addEventListener("pointercancel", stopDragging, { signal });
    canvas.addEventListener("lostpointercapture", stopDragging, { signal });
    canvas.addEventListener(
      "keydown",
      event => {
        if (
          ![
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "+",
            "=",
            "-",
          ].includes(event.key)
        )
          return;
        event.preventDefault();
        cancelFocus();
        if (event.key === "ArrowLeft") rotation[0] -= 6;
        if (event.key === "ArrowRight") rotation[0] += 6;
        if (event.key === "ArrowUp")
          rotation[1] = Math.min(80, rotation[1] + 6);
        if (event.key === "ArrowDown")
          rotation[1] = Math.max(-80, rotation[1] - 6);
        if (event.key === "+" || event.key === "=")
          zoom = Math.min(3, zoom + 0.2);
        if (event.key === "-") zoom = Math.max(0.8, zoom - 0.2);
        draw();
      },
      { signal }
    );
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const intersection = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting || loading) return;
        loading = true;
        fetch(root.dataset.worldUrl!, { signal })
          .then(response => {
            if (!response.ok) throw new Error("Map load failed");
            return response.json();
          })
          .then(data => {
            if (signal.aborted) return;
            world = data;
            status.remove();
            resize();
          })
          .catch(() => {
            if (!signal.aborted)
              status.textContent = s("地图暂未加载，请稍后刷新重试。");
          });
      },
      { threshold: 0.05 }
    );
    intersection.observe(stage);
    document.addEventListener(
      "astro:before-swap",
      () => {
        controller.abort();
        cancelFocus();
        intersection.disconnect();
        resizeObserver.disconnect();
      },
      { once: true, signal }
    );
  });
}
