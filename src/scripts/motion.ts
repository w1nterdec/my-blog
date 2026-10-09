let observer: IntersectionObserver | undefined;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function setupMotion() {
  observer?.disconnect();
  const elements = document.querySelectorAll<HTMLElement>(".reveal");
  if (reduceMotion.matches) {
    elements.forEach(element => element.classList.add("is-visible"));
    return;
  }
  observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  elements.forEach((element, index) => {
    element.style.setProperty(
      "--reveal-delay",
      `${Math.min(index % 4, 3) * 90}ms`
    );
    observer!.observe(element);
  });
}
document.documentElement.classList.add("motion-ready");
setupMotion();
document.addEventListener("astro:page-load", setupMotion);
document.addEventListener("astro:before-swap", () => observer?.disconnect());
reduceMotion.addEventListener("change", setupMotion);
