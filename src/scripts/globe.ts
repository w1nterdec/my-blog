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
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      root.querySelector(".globe-loading")!.textContent = s(
        "当前浏览器不支持地球仪，可使用右侧城市列表。"
      );
      return;
    }
    const stage = root.querySelector<HTMLElement>(".globe-stage")!;
    const places: Place[] = JSON.parse(root.dataset.places!);
    const controller = new AbortController();
    const { signal } = controller;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projection = geoOrthographic().clipAngle(90).precision(0.4);
    const path = geoPath(projection, ctx);
    const grid = geoGraticule10();
    let world: GeoPermissibleObjects | undefined;
    let visible = false,
      loading = false,
      frame = 0,
      last = 0,
      selected = 0;
    let rotation: [number, number, number] = [-108, -30, 0];
    let zoom = 1,
      size = 400,
      playing = !reducedMotion.matches;
    let velocity = 0,
      dragging = false,
      moved = false,
      startX = 0,
      startY = 0;
    let pointerRotation: [number, number, number] = [...rotation];
    let previousX = 0,
      freeTouch = false;
    let transition:
      | {
          from: [number, number, number];
          to: [number, number, number];
          fromZoom: number;
          toZoom: number;
          start: number;
        }
      | undefined;
    let colors = {
      water: "",
      land: "",
      grid: "",
      border: "",
      accent: "",
      travel: "",
      text: "",
    };
    const playButton =
      root.querySelector<HTMLButtonElement>("[data-globe-play]")!;
    function readColors() {
      const style = getComputedStyle(document.documentElement);
      const get = (name: string) => style.getPropertyValue(name).trim();
      colors = {
        water: get("--globe-water"),
        land: get("--globe-land"),
        grid: get("--globe-grid"),
        border: get("--border"),
        accent: get("--accent"),
        travel: get("--travel"),
        text: get("--foreground"),
      };
      draw();
    }
    function draw() {
      if (!world || !ctx) return;
      ctx.clearRect(0, 0, size, size);
      projection
        .translate([size / 2, size / 2])
        .scale(size * 0.4 * zoom)
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
        if (
          geoDistance(place.coordinates, [-rotation[0], -rotation[1]]) >
          Math.PI / 2
        )
          return;
        const point = projection(place.coordinates);
        if (!point) return;
        const [x, y] = point;
        ctx.beginPath();
        ctx.arc(x, y, index === selected ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = place.residence ? colors.accent : colors.travel;
        ctx.fill();
        if (place.residence && place.visited) {
          ctx.strokeStyle = colors.travel;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (index === selected) {
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.font = "600 13px system-ui";
          ctx.fillStyle = colors.text;
          ctx.fillText(place.name, x + 15, y + 5);
        }
      });
    }
    function resize() {
      size = Math.max(240, stage.clientWidth);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.height = `${size}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden || signal.aborted) return;
      const delta = Math.min(now - (last || now), 50);
      last = now;
      if (transition) {
        const t = reducedMotion.matches
          ? 1
          : Math.min((now - transition.start) / 1100, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        rotation = transition.from.map(
          (value, i) => value + (transition!.to[i] - value) * ease
        ) as [number, number, number];
        zoom =
          transition.fromZoom +
          (transition.toZoom - transition.fromZoom) * ease;
        if (t === 1) transition = undefined;
      } else if (!dragging && !reducedMotion.matches) {
        rotation[0] += (velocity * delta) / 16.7;
        velocity *= Math.pow(0.94, delta / 16.7);
        if (playing && zoom < 1.2) rotation[0] += delta * 0.002;
      }
      draw();
      if (
        transition ||
        dragging ||
        Math.abs(velocity) > 0.005 ||
        (playing && !reducedMotion.matches && zoom < 1.2)
      )
        frame = requestAnimationFrame(tick);
    }
    function schedule() {
      if (!frame && visible && !document.hidden && world && !signal.aborted) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }
    function setPlaying(value: boolean) {
      playing = value;
      playButton.setAttribute("aria-pressed", String(value));
      playButton.textContent = value ? s("暂停旋转") : s("开始旋转");
      if (value && zoom > 1.2) animateTo(rotation, 1);
      schedule();
    }
    function animateTo(target: [number, number, number], targetZoom: number) {
      const from: [number, number, number] = [...rotation];
      target[0] = from[0] + (((target[0] - from[0] + 540) % 360) - 180);
      transition = {
        from,
        to: target,
        fromZoom: zoom,
        toZoom: targetZoom,
        start: performance.now(),
      };
      velocity = 0;
      schedule();
    }
    function selectCity(index: number) {
      selected = index;
      const place = places[index];
      root.querySelector("[data-city-name]")!.textContent = place.name;
      root.querySelector("[data-city-description]")!.textContent =
        place.description;
      root.querySelector("[data-city-kinds]")!.textContent = [
        place.residence,
        place.visited ? s("旅行") : "",
      ]
        .filter(Boolean)
        .join(" · ");
      root.querySelector(".globe-coordinate")!.textContent =
        `${place.coordinates[1].toFixed(2)}° N / ${place.coordinates[0].toFixed(2)}° E`;
      root
        .querySelectorAll("[data-city-index]")
        .forEach((button, i) =>
          button.setAttribute("aria-pressed", String(i === index))
        );
      setPlaying(false);
      animateTo([-place.coordinates[0], -place.coordinates[1], 0], 2.3);
    }
    root
      .querySelectorAll<HTMLButtonElement>("[data-city-index]")
      .forEach(button =>
        button.addEventListener(
          "click",
          () => selectCity(Number(button.dataset.cityIndex)),
          { signal }
        )
      );
    playButton.addEventListener("click", () => setPlaying(!playing), {
      signal,
    });
    root.querySelector("[data-globe-reset]")!.addEventListener(
      "click",
      () => {
        animateTo([-108, -30, 0], 1);
      },
      { signal }
    );
    root.querySelector("[data-globe-touch]")!.addEventListener(
      "click",
      event => {
        freeTouch = !freeTouch;
        (event.currentTarget as HTMLButtonElement).setAttribute(
          "aria-pressed",
          String(freeTouch)
        );
        (event.currentTarget as HTMLButtonElement).textContent = freeTouch
          ? s("恢复页面滚动")
          : s("自由拖动");
        canvas.style.touchAction = freeTouch ? "none" : "pan-y";
      },
      { signal }
    );
    canvas.addEventListener(
      "pointerdown",
      event => {
        if (!event.isPrimary || event.button !== 0) return;
        canvas.setPointerCapture(event.pointerId);
        dragging = true;
        moved = false;
        startX = previousX = event.clientX;
        startY = event.clientY;
        pointerRotation = [...rotation];
        transition = undefined;
        velocity = 0;
        setPlaying(false);
      },
      { signal }
    );
    canvas.addEventListener(
      "pointermove",
      event => {
        if (!dragging) return;
        const factor = 0.35 / zoom;
        rotation = [
          pointerRotation[0] + (event.clientX - startX) * factor,
          Math.max(
            -80,
            Math.min(80, pointerRotation[1] - (event.clientY - startY) * factor)
          ),
          0,
        ];
        velocity = (event.clientX - previousX) * factor;
        previousX = event.clientX;
        moved ||=
          Math.abs(event.clientX - startX) + Math.abs(event.clientY - startY) >
          5;
        draw();
      },
      { signal }
    );
    canvas.addEventListener(
      "pointerup",
      event => {
        if (!dragging) return;
        dragging = false;
        if (!moved) {
          const rect = canvas.getBoundingClientRect();
          let nearest = -1,
            distance = 22;
          places.forEach((place, index) => {
            if (
              geoDistance(place.coordinates, [-rotation[0], -rotation[1]]) >
              Math.PI / 2
            )
              return;
            const p = projection(place.coordinates);
            if (!p) return;
            const d = Math.hypot(
              p[0] - (event.clientX - rect.left),
              p[1] - (event.clientY - rect.top)
            );
            if (d < distance) {
              nearest = index;
              distance = d;
            }
          });
          if (nearest >= 0) selectCity(nearest);
        }
        schedule();
      },
      { signal }
    );
    canvas.addEventListener(
      "pointercancel",
      () => {
        dragging = false;
        velocity = 0;
      },
      { signal }
    );
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
        transition = undefined;
        setPlaying(false);
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
        visible = entries[0].isIntersecting;
        if (visible && !loading) {
          loading = true;
          fetch(root.dataset.worldUrl!, { signal })
            .then(response => {
              if (!response.ok) throw new Error("Map load failed");
              return response.json();
            })
            .then(data => {
              world = data;
              root.querySelector(".globe-loading")!.remove();
              readColors();
              resize();
              schedule();
            })
            .catch(() => {
              if (!signal.aborted)
                root.querySelector(".globe-loading")!.textContent =
                  s("地图暂未加载，可继续查看城市记录。");
            });
        }
        if (visible) schedule();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.05 }
    );
    intersection.observe(stage);
    document.addEventListener("site:theme-change", readColors, { signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else schedule();
      },
      { signal }
    );
    reducedMotion.addEventListener(
      "change",
      () => {
        if (reducedMotion.matches) {
          velocity = 0;
          setPlaying(false);
        }
      },
      { signal }
    );
    setPlaying(playing);
    document.addEventListener(
      "astro:before-swap",
      () => {
        controller.abort();
        cancelAnimationFrame(frame);
        intersection.disconnect();
        resizeObserver.disconnect();
      },
      { once: true, signal }
    );
  });
}
