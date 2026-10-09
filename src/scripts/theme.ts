type Preference = "light" | "dark" | "system";
const media = window.matchMedia("(prefers-color-scheme: dark)");
function readPreference(): Preference {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}
let preference = readPreference();
const resolve = () =>
  preference === "system" ? (media.matches ? "dark" : "light") : preference;
function reflect() {
  const root = document.documentElement;
  const theme = resolve();
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  const select = document.querySelector<HTMLSelectElement>("#theme-select");
  if (select) select.value = preference;
  document
    .querySelector("meta[name=theme-color]")
    ?.setAttribute(
      "content",
      getComputedStyle(root).getPropertyValue("--background").trim()
    );
  document.dispatchEvent(new CustomEvent("site:theme-change"));
}
function setup() {
  reflect();
  const select = document.querySelector<HTMLSelectElement>("#theme-select");
  if (!select || select.dataset.bound) return;
  select.dataset.bound = "true";
  select.addEventListener("change", () => {
    preference = select.value as Preference;
    try {
      localStorage.setItem("theme", preference);
    } catch {
      /* Theme works without storage. */
    }
    reflect();
  });
}
setup();
document.addEventListener("astro:after-swap", setup);
document.addEventListener("astro:before-swap", event => {
  const incoming = (event as unknown as { newDocument: Document }).newDocument;
  incoming.documentElement.dataset.theme = resolve();
  incoming.documentElement.classList.toggle("dark", resolve() === "dark");
  incoming.documentElement.style.colorScheme = resolve();
});
media.addEventListener("change", () => {
  if (preference === "system") reflect();
});
window.addEventListener("storage", event => {
  if (event.key === "theme") {
    preference = readPreference();
    reflect();
  }
});
