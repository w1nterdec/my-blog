export function initTypewriters() {
  document.querySelectorAll<HTMLElement>("[data-typewriter]").forEach(root => {
    if (root.dataset.bound) return;
    root.dataset.bound = "true";
    const output = root.querySelector<HTMLElement>("[data-typewriter-output]")!;
    const text = root.dataset.typewriter ?? "";
    const characters = Array.from(text);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    let deleting = false;
    const stop = () => {
      clearTimeout(timer);
      timer = undefined;
      root.classList.remove("is-typing");
      output.textContent = text;
    };
    const tick = () => {
      if (signal.aborted || document.hidden || reducedMotion.matches) return;
      count += deleting ? -1 : 1;
      output.textContent = characters.slice(0, count).join("");
      let delay = deleting ? 70 : 150;
      if (count === characters.length) {
        deleting = true;
        delay = 1800;
      } else if (count === 0) {
        deleting = false;
        delay = 600;
      }
      timer = setTimeout(tick, delay);
    };
    const sync = () => {
      stop();
      if (!characters.length || document.hidden || reducedMotion.matches)
        return;
      count = 0;
      deleting = false;
      output.textContent = "";
      root.classList.add("is-typing");
      timer = setTimeout(tick, 350);
    };
    reducedMotion.addEventListener("change", sync, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
    document.addEventListener(
      "astro:before-swap",
      () => {
        stop();
        controller.abort();
      },
      { once: true, signal }
    );
    sync();
  });
}
