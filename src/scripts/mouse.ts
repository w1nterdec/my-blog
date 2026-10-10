import { localize } from "@/i18n/site";
let cleanup: (() => void) | undefined;
function setupMouse() {
  cleanup?.();
  const mouse = document.querySelector<HTMLButtonElement>("[data-mouse]");
  const note = document.querySelector<HTMLElement>("[data-mouse-note]");
  if (!mouse || !note) return;
  const controller = new AbortController();
  const s = localize(document.documentElement.lang);
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
  };
}
setupMouse();
document.addEventListener("astro:page-load", setupMouse);
document.addEventListener("astro:before-swap", () => cleanup?.());
