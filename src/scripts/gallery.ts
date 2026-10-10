export function initGallery() {
  const gallery = document.querySelector<HTMLElement>(".photo-gallery");
  if (!gallery || gallery.dataset.bound) return;
  gallery.dataset.bound = "true";
  const dialog = gallery.querySelector<HTMLDialogElement>("dialog");
  if (!dialog) return;
  const all = Array.from(
    gallery.querySelectorAll<HTMLButtonElement>("[data-photo-index]")
  );
  let visible = all;
  let index = 0;
  let trigger: HTMLButtonElement | undefined;
  const large = dialog.querySelector<HTMLImageElement>("[data-photo-large]")!;
  function show(next: number) {
    if (!visible.length) return;
    index = (next + visible.length) % visible.length;
    const photo = visible[index];
    large.src = photo.dataset.photoSrc!;
    large.alt = photo.dataset.photoAlt ?? "";
    dialog!.querySelector("[data-photo-description]")!.textContent = [
      photo.dataset.photoTitle,
      photo.dataset.photoDetails,
      photo.dataset.photoStory,
    ]
      .filter(Boolean)
      .join("\n");
    dialog!.querySelector("[data-photo-counter]")!.textContent =
      `${index + 1} / ${visible.length}`;
  }
  all.forEach(photo =>
    photo.addEventListener("click", () => {
      trigger = photo;
      show(visible.indexOf(photo));
      dialog.showModal();
      document.body.style.overflow = "hidden";
    })
  );
  gallery
    .querySelectorAll<HTMLButtonElement>("[data-photo-filter]")
    .forEach(button =>
      button.addEventListener("click", () => {
        const category = button.dataset.photoFilter;
        all.forEach(photo => {
          photo.hidden =
            category !== "全部" && photo.dataset.category !== category;
        });
        visible = all.filter(photo => !photo.hidden);
        gallery
          .querySelectorAll("[data-photo-filter]")
          .forEach(item =>
            item.setAttribute("aria-pressed", String(item === button))
          );
      })
    );
  dialog
    .querySelector("[data-photo-close]")
    ?.addEventListener("click", () => dialog.close());
  dialog
    .querySelector("[data-photo-prev]")
    ?.addEventListener("click", () => show(index - 1));
  dialog
    .querySelector("[data-photo-next]")
    ?.addEventListener("click", () => show(index + 1));
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    trigger?.focus();
  });
  let touchX = 0;
  large.addEventListener(
    "touchstart",
    event => {
      touchX = event.touches.length === 1 ? event.touches[0].clientX : NaN;
    },
    { passive: true }
  );
  large.addEventListener(
    "touchend",
    event => {
      if (event.touches.length || !Number.isFinite(touchX)) return;
      const delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 70) show(index + (delta < 0 ? 1 : -1));
    },
    { passive: true }
  );
  document.addEventListener(
    "astro:before-swap",
    () => {
      if (dialog.open) dialog.close();
    },
    { once: true }
  );
}
