export {};
let cleanup: (() => void) | undefined;

function setup() {
  cleanup?.();
  const controller = new AbortController();
  const options = { signal: controller.signal };
  document
    .querySelectorAll<HTMLElement>("[data-music-stack]")
    .forEach(stack => {
      const cards = Array.from(
        stack.querySelectorAll<HTMLElement>("[data-record]")
      );
      const selectors = Array.from(
        stack.querySelectorAll<HTMLButtonElement>("[data-record-select]")
      );
      const select = (index: number) => {
        cards.forEach((card, position) => {
          const active = position === index;
          card.dataset.active = String(active);
          card
            .querySelector("[data-record-cover]")
            ?.setAttribute("aria-pressed", String(active));
          selectors[position]?.setAttribute("aria-pressed", String(active));
        });
      };
      cards.forEach((card, index) => {
        const cover = card.querySelector<HTMLButtonElement>(
          "[data-record-cover]"
        );
        if (!cover) return;
        cover.addEventListener(
          "pointerenter",
          event => {
            if (event.pointerType === "mouse") select(index);
          },
          options
        );
        cover.addEventListener("focus", () => select(index), options);
        cover.addEventListener("click", () => select(index), options);
      });
      selectors.forEach((button, index) => {
        button.addEventListener("click", () => select(index), options);
        button.addEventListener(
          "keydown",
          event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? selectors.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      selectors.length) %
                    selectors.length;
            select(next);
            selectors[next]?.focus();
          },
          options
        );
      });
    });
  cleanup = () => controller.abort();
}
document.addEventListener("astro:page-load", setup);
document.addEventListener("astro:before-swap", () => cleanup?.());
setup();
