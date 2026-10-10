import { localize } from "@/i18n/site";
let cleanup: (() => void) | undefined;
function setupNavigation() {
  cleanup?.();
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  const button = document.querySelector<HTMLButtonElement>("#menu-btn");
  const nav = document.querySelector<HTMLElement>("#site-nav");
  const languages = document.querySelector<HTMLDetailsElement>(
    "[data-language-picker]"
  );
  if (!header || !button || !nav || !languages) return;
  const s = localize(document.documentElement.lang);
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  const setOpen = (open: boolean) => {
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", s(open ? "收起菜单" : "展开菜单"));
    nav.classList.toggle("is-open", open);
    header.dataset.menuOpen = String(open);
    if (open) languages.open = false;
  };
  const updateScroll = () => {
    frame = 0;
    if (scrollY > 96) header.classList.add("is-compact");
    else if (scrollY < 24) header.classList.remove("is-compact");
  };
  updateScroll();
  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = requestAnimationFrame(updateScroll);
    },
    { passive: true, signal }
  );
  button.addEventListener(
    "click",
    () => setOpen(button.getAttribute("aria-expanded") !== "true"),
    { signal }
  );
  languages.addEventListener(
    "toggle",
    () => {
      if (languages.open) setOpen(false);
    },
    { signal }
  );
  document.addEventListener(
    "pointerdown",
    event => {
      if (event.target instanceof Node && !languages.contains(event.target))
        languages.open = false;
    },
    { signal }
  );
  document.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape") return;
      if (languages.open) {
        languages.open = false;
        languages.querySelector("summary")?.focus();
      } else if (button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    },
    { signal }
  );
  nav
    .querySelectorAll("a")
    .forEach(link =>
      link.addEventListener("click", () => setOpen(false), { signal })
    );
  document
    .querySelectorAll<HTMLAnchorElement>("[data-language-switch]")
    .forEach(link => {
      const syncLocation = () => {
        const anchors: Record<string, string> = {
          关于我: "a-little-about-me",
          关于知行博客: "about-this-journal",
          联系我: "find-me",
          网站致谢: "a-little-thank-you",
        };
        let anchor = location.hash.slice(1);
        try {
          anchor = decodeURIComponent(anchor);
        } catch {
          // A malformed external hash must not prevent navigation from binding.
        }
        if (link.pathname.includes("/about")) {
          anchor =
            link.hreflang === "en"
              ? (anchors[anchor] ?? anchor)
              : (Object.entries(anchors).find(
                  ([, value]) => value === anchor
                )?.[0] ?? anchor);
        }
        link.href = `${link.pathname}${location.search}${anchor ? `#${encodeURIComponent(anchor)}` : ""}`;
      };
      syncLocation();
      link.addEventListener("pointerenter", syncLocation, { signal });
      link.addEventListener("focus", syncLocation, { signal });
      link.addEventListener(
        "click",
        () => {
          syncLocation();
          try {
            localStorage.setItem("zhixing-language", link.hreflang);
          } catch {}
        },
        { signal }
      );
    });
  document.querySelector<HTMLAnchorElement>(".skip-link")?.addEventListener(
    "click",
    () => {
      const main = document.getElementById("main-content");
      main?.setAttribute("tabindex", "-1");
      main?.focus();
      main?.addEventListener("blur", () => main.removeAttribute("tabindex"), {
        once: true,
        signal,
      });
    },
    { signal }
  );
  cleanup = () => {
    controller.abort();
    cancelAnimationFrame(frame);
  };
}
setupNavigation();
document.addEventListener("astro:page-load", setupNavigation);
document.addEventListener("astro:before-swap", () => cleanup?.());
