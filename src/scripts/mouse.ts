import { localize } from "@/i18n/site";
let cleanup: (() => void) | undefined;
let currentPerch: HTMLElement | null = null;
function setupMouse() {
  const perch = document.querySelector<HTMLElement>("[data-hamster]");
  if (perch && currentPerch === perch) return;
  cleanup?.();
  const mouse = document.querySelector<HTMLButtonElement>("[data-mouse]");
  const note = document.querySelector<HTMLElement>("[data-mouse-note]");
  if (!mouse || !note || !perch) return;
  currentPerch = perch;
  const controller = new AbortController();
  const s = localize(document.documentElement.lang);
  const homes = [
    ".profile-panel",
    "main .section-heading",
    ".site-footer",
  ].flatMap(selector =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).flatMap(
      (host, index) =>
        (selector === ".site-footer" ? ["left", "right"] : ["right"]).map(
          side => ({ host, side, key: `${selector}:${index}:${side}` })
        )
    )
  );
  if (!homes.length) return;
  let previous = "";
  try {
    previous = sessionStorage.getItem("hamster-home") ?? "";
  } catch {}
  const different = homes.filter(home => home.key !== previous);
  const pool = different.length ? different : homes;
  const home = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem("hamster-home", home.key);
  } catch {}
  home.host.classList.add("hamster-home");
  home.host.append(perch);
  perch.dataset.home = home.key;
  perch.dataset.side = home.side;
  perch.hidden = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  const observer = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    perch.dataset.awake = String(visible && !document.hidden);
  });
  observer.observe(perch);
  document.addEventListener(
    "visibilitychange",
    () => {
      perch.dataset.awake = String(visible && !document.hidden);
    },
    { signal: controller.signal }
  );
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let poseTimer: ReturnType<typeof setTimeout> | undefined;
  const idle = () => {
    idleTimer = setTimeout(
      () => {
        if (
          visible &&
          !document.hidden &&
          note.hidden &&
          !reducedMotion.matches &&
          !perch.matches(":focus-within")
        ) {
          const pose = Math.random() < 0.65 ? "is-sniffing" : "is-shuffling";
          perch.classList.add(pose);
          poseTimer = setTimeout(() => perch.classList.remove(pose), 1800);
        }
        idle();
      },
      12000 + Math.random() * 10000
    );
  };
  idle();
  mouse.addEventListener(
    "pointermove",
    event => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      const rect = mouse.getBoundingClientRect();
      perch.style.setProperty(
        "--hamster-look-x",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 3}px`
      );
      perch.style.setProperty(
        "--hamster-look-y",
        `${((event.clientY - rect.top) / rect.height - 0.5) * 2}px`
      );
    },
    { signal: controller.signal }
  );
  mouse.addEventListener(
    "pointerleave",
    () => {
      perch.style.removeProperty("--hamster-look-x");
      perch.style.removeProperty("--hamster-look-y");
    },
    { signal: controller.signal }
  );
  let seeds = 0,
    timer: ReturnType<typeof setTimeout> | undefined;
  mouse.addEventListener(
    "click",
    () => {
      clearTimeout(timer);
      seeds = Math.min(3, seeds + 1);
      note.hidden = false;
      mouse.setAttribute("aria-expanded", "true");
      mouse.classList.remove("mouse-happy");
      void mouse.offsetWidth;
      mouse.classList.add("mouse-happy");
      note.querySelector<HTMLElement>("[data-mouse-message]")!.textContent = s(
        seeds < 3 ? "鼠鼠把一粒小种子留给了你。" : "三粒种子，换一座小岛。"
      );
      note.querySelector<HTMLAnchorElement>("[data-mouse-island]")!.hidden =
        seeds < 3;
      mouse.title = s(seeds < 3 ? "再给它一粒种子" : "去孤岛坐坐 ↗");
      timer = setTimeout(() => {
        note.hidden = true;
        mouse.setAttribute("aria-expanded", "false");
      }, 10000);
    },
    { signal: controller.signal }
  );
  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        note.hidden = true;
        mouse.setAttribute("aria-expanded", "false");
      }
    },
    { signal: controller.signal }
  );
  cleanup = () => {
    controller.abort();
    clearTimeout(timer);
    clearTimeout(idleTimer);
    clearTimeout(poseTimer);
    observer.disconnect();
    home.host.classList.remove("hamster-home");
    currentPerch = null;
  };
}
setupMouse();
document.addEventListener("astro:page-load", setupMouse);
document.addEventListener("astro:before-swap", () => cleanup?.());
