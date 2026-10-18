export function initAboutOutline() {
  const nav = document.querySelector<HTMLElement>("[data-about-outline]");
  if (!nav || nav.dataset.bound) return;
  nav.dataset.bound = "true";
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
  const entries = links.flatMap(link => {
    const target = document.getElementById(
      decodeURIComponent(link.hash.slice(1))
    );
    return target ? [{ link, target }] : [];
  });
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  const update = () => {
    frame = 0;
    let active = entries[0];
    entries.forEach(entry => {
      if (entry.target.getBoundingClientRect().top <= window.innerHeight * 0.35)
        active = entry;
    });
    entries.forEach(entry => {
      if (entry === active) entry.link.setAttribute("aria-current", "location");
      else entry.link.removeAttribute("aria-current");
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { signal });
  update();
  document.addEventListener(
    "astro:before-swap",
    () => {
      controller.abort();
      cancelAnimationFrame(frame);
    },
    { once: true, signal }
  );
}
