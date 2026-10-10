let cleanup: (() => void) | undefined;
let cached: Promise<{ requests: number; year: number } | null> | undefined;
function setupStats() {
  cleanup?.();
  const element = document.querySelector<HTMLElement>("[data-request-count]");
  if (!element) return;
  let cancelled = false;
  const observer = new IntersectionObserver(async entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    cached ??= fetch("/stats.json")
      .then(response => (response.ok ? response.json() : null))
      .catch(() => null);
    const stats = await cached;
    if (
      cancelled ||
      !stats ||
      !Number.isSafeInteger(stats.requests) ||
      stats.requests < 0
    )
      return;
    element.querySelector("[data-request-total]")!.textContent =
      `${stats.year} / ${stats.requests.toLocaleString(document.documentElement.lang)}`;
    element.hidden = false;
  });
  observer.observe(element.parentElement!);
  cleanup = () => {
    cancelled = true;
    observer.disconnect();
  };
}
setupStats();
document.addEventListener("astro:page-load", setupStats);
document.addEventListener("astro:before-swap", () => cleanup?.());
