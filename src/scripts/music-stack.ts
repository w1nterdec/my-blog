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
        const covered = cards.filter(card =>
          card.querySelector("[data-record-cover]")
        );
        const position = covered.indexOf(cards[index]);
        if (position >= 0) {
          const start = Math.floor(position / 4) * 4;
          const visible = covered.slice(start, start + 4);
          stack.style.setProperty("--record-count", String(visible.length));
          covered.forEach(card => {
            const cover = card.querySelector<HTMLButtonElement>(
              "[data-record-cover]"
            )!;
            const slot = visible.indexOf(card);
            cover.hidden = slot < 0;
            if (slot >= 0) {
              cover.style.setProperty("--record-index", String(slot));
              cover.style.setProperty(
                "--record-depth",
                String(visible.length - slot)
              );
            }
          });
        }
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
        // Focus must not reorder overlapping covers between pointerdown and
        // pointerup. Activate on click (including native Enter/Space) instead.
        cover.addEventListener("click", () => select(index), options);
      });
      stack.querySelectorAll<HTMLElement>("[data-lyric-card]").forEach(card => {
        const expand = card.querySelector<HTMLButtonElement>(
          "[data-lyric-expand]"
        );
        expand?.addEventListener(
          "click",
          () => {
            const expanded = expand.getAttribute("aria-expanded") !== "true";
            expand.setAttribute("aria-expanded", String(expanded));
            card.classList.toggle("is-expanded", expanded);
          },
          options
        );
        const rows = Array.from(
          card.querySelectorAll<HTMLButtonElement>("[data-lyric-line]")
        );
        const highlight = (row: HTMLButtonElement) =>
          rows.forEach(line =>
            line.setAttribute("aria-pressed", String(line === row))
          );
        rows.forEach(row =>
          row.addEventListener("click", () => highlight(row), options)
        );
        const scroller = card.querySelector<HTMLElement>("[data-lyric-lines]");
        scroller?.addEventListener(
          "scroll",
          () => {
            const center =
              scroller.getBoundingClientRect().top + scroller.clientHeight / 2;
            const nearest = rows.reduce<HTMLButtonElement | undefined>(
              (best, row) => {
                const distance = (el: HTMLElement) =>
                  Math.abs(
                    el.getBoundingClientRect().top +
                      el.offsetHeight / 2 -
                      center
                  );
                return !best || distance(row) < distance(best) ? row : best;
              },
              undefined
            );
            if (nearest) highlight(nearest);
          },
          { ...options, passive: true }
        );
        card.addEventListener(
          "keydown",
          event => {
            if (event.key === "Escape") {
              card.classList.remove("is-expanded");
              expand?.setAttribute("aria-expanded", "false");
            }
          },
          options
        );
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
