import { localize } from "@/i18n/site";
let cleanup: (() => void) | undefined;
let currentPerch: HTMLElement | null = null;
function setupMouse() {
  const perch = document.querySelector<HTMLElement>("[data-hamster]");
  if (perch && currentPerch === perch) return;
  cleanup?.();
  const mouse = document.querySelector<HTMLButtonElement>("[data-mouse]");
  const note = document.querySelector<HTMLElement>("[data-mouse-note]");
  if (!mouse || !note || !perch) return;
  currentPerch = perch;
  const controller = new AbortController();
  const s = localize(document.documentElement.lang);
  const homes = [
    ".profile-panel",
    "main .section-heading",
    ".site-footer",
  ].flatMap(selector =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).flatMap(
      (host, index) =>
        (selector === ".site-footer" ? ["left", "right"] : ["right"]).map(
          side => ({ host, side, key: `${selector}:${index}:${side}` })
        )
    )
  );
  if (!homes.length) return;
  let previous = "";
  try {
    previous = sessionStorage.getItem("hamster-home") ?? "";
  } catch {}
  const different = homes.filter(home => home.key !== previous);
  const pool = different.length ? different : homes;
  const home = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem("hamster-home", home.key);
  } catch {}
  home.host.classList.add("hamster-home");
  home.host.append(perch);
  perch.dataset.home = home.key;
  perch.dataset.side = home.side;
  perch.hidden = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let appeared = false;
  const observer = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    perch.dataset.awake = String(visible && !document.hidden);
    if (visible && !appeared) {
      appeared = true;
      perch.classList.add("is-arriving");
    }
  });
  observer.observe(perch);
  document.addEventListener(
    "visibilitychange",
    () => {
      perch.dataset.awake = String(visible && !document.hidden);
    },
    { signal: controller.signal }
  );
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let poseTimer: ReturnType<typeof setTimeout> | undefined;
  const idle = () => {
    idleTimer = setTimeout(
      () => {
        if (
          visible &&
          !document.hidden &&
          note.hidden &&
          !reducedMotion.matches &&
          !perch.matches(":focus-within")
        ) {
          const pose = Math.random() < 0.65 ? "is-sniffing" : "is-shuffling";
          perch.classList.add(pose);
          poseTimer = setTimeout(() => perch.classList.remove(pose), 1800);
        }
        idle();
      },
      12000 + Math.random() * 10000
    );
  };
  idle();
  mouse.addEventListener(
    "pointermove",
    event => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      const rect = mouse.getBoundingClientRect();
      perch.style.setProperty(
        "--hamster-look-x",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 3}px`
      );
      perch.style.setProperty(
        "--hamster-look-y",
        `${((event.clientY - rect.top) / rect.height - 0.5) * 2}px`
      );
    },
    { signal: controller.signal }
  );
  mouse.addEventListener(
    "pointerleave",
    () => {
      perch.style.removeProperty("--hamster-look-x");
      perch.style.removeProperty("--hamster-look-y");
    },
    { signal: controller.signal }
  );
  const pebble = document.querySelector<HTMLAnchorElement>(
    "[data-hamster-pebble]"
  );
  const announcement = document.querySelector<HTMLElement>(
    "[data-pebble-announcement]"
  );
  const offer = note.querySelector<HTMLButtonElement>("[data-mouse-offer]");
  let state = "searching";
  try {
    const saved = sessionStorage.getItem("hamster-pebble-state");
    if (saved === "carried" || saved === "unlocked") state = saved;
  } catch {}
  const stoneHomes = homes.filter(candidate => candidate.host !== home.host);
  const stoneHome = (stoneHomes.length ? stoneHomes : homes)[
    Math.floor(Math.random() * (stoneHomes.length || homes.length))
  ];
  if (pebble) {
    stoneHome.host.classList.add("pebble-home");
    pebble.classList.add("hamster-pebble");
    stoneHome.host.append(pebble);
    pebble.draggable = true;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  let announcementTimer: ReturnType<typeof setTimeout> | undefined;
  let thanksTimer: ReturnType<typeof setTimeout> | undefined;
  const update = () => {
    perch.dataset.quest = state;
    if (pebble) pebble.hidden = state !== "searching";
    if (offer) offer.hidden = state !== "carried";
    note.querySelector<HTMLAnchorElement>("[data-mouse-island]")!.hidden =
      state !== "unlocked";
    note.querySelector<HTMLElement>("[data-mouse-message]")!.textContent = s(
      state === "unlocked"
        ? "它把小石子举得高高的，帽子里掉出一张去孤岛的地图。"
        : state === "carried"
          ? "这颗石子正合它的心意。要交给它收藏吗？"
          : "它的帽子里，似乎藏着一张地图。找一颗散落在页面里的小石子，来和它交换吧。"
    );
    mouse.title = s(
      state === "carried" ? "把小石子交给鼠鼠" : "轻轻碰一下仓鼠"
    );
  };
  const save = () => {
    try {
      sessionStorage.setItem("hamster-pebble-state", state);
    } catch {}
    update();
  };
  const reveal = () => {
    clearTimeout(timer);
    perch.classList.toggle(
      "note-below",
      mouse.getBoundingClientRect().top < 200
    );
    note.hidden = false;
    mouse.setAttribute("aria-expanded", "true");
    update();
    timer = setTimeout(() => {
      if (note.matches(":focus-within")) return;
      note.hidden = true;
      mouse.setAttribute("aria-expanded", "false");
    }, 12000);
  };
  const celebrate = () => {
    mouse.classList.remove("mouse-happy");
    void mouse.offsetWidth;
    mouse.classList.add("mouse-happy");
  };
  const pickUp = () => {
    if (state !== "searching") return;
    state = "carried";
    save();
    if (announcement) {
      announcement.textContent = s(
        "拾到一颗小石子。去找那只戴帽子的仓鼠，把它交给它吧。"
      );
      announcement.hidden = false;
      clearTimeout(announcementTimer);
      announcementTimer = setTimeout(() => {
        announcement.hidden = true;
      }, 8000);
    }
    // Avoid leaving keyboard focus on the now-hidden stone.
    if (document.activeElement === pebble) mouse.focus({ preventScroll: true });
  };
  pebble?.addEventListener(
    "click",
    event => {
      event.preventDefault();
      pickUp();
    },
    { signal: controller.signal }
  );
  const dragKey = Math.random().toString(36).slice(2);
  pebble?.addEventListener(
    "dragstart",
    event => {
      event.dataTransfer?.setData("application/x-zhixing-pebble", dragKey);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      // Keep the drag source visible until drop or dragend.
    },
    { signal: controller.signal }
  );
  mouse.addEventListener(
    "dragover",
    event => {
      if (event.dataTransfer?.types.includes("application/x-zhixing-pebble")) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }
    },
    { signal: controller.signal }
  );
  const give = () => {
    if (state !== "carried") return;
    state = "unlocked";
    save();
    reveal();
    celebrate();
    clearTimeout(poseTimer);
    perch.classList.remove("is-sniffing", "is-shuffling");
    perch.classList.add("is-thanking");
    thanksTimer = setTimeout(() => perch.classList.remove("is-thanking"), 1600);
    if (announcement) announcement.hidden = true;
    // The action disappears after giving; return focus to the visible resident.
    if (document.activeElement === offer) mouse.focus({ preventScroll: true });
  };
  mouse.addEventListener(
    "drop",
    event => {
      if (
        event.dataTransfer?.getData("application/x-zhixing-pebble") !== dragKey
      )
        return;
      event.preventDefault();
      pickUp();
      give();
    },
    { signal: controller.signal }
  );
  offer?.addEventListener("click", give, { signal: controller.signal });
  update();
  mouse.addEventListener(
    "click",
    () => {
      reveal();
      celebrate();
    },
    { signal: controller.signal }
  );
  document.addEventListener(
    "pointerdown",
    event => {
      if (event.target instanceof Node && !perch.contains(event.target)) {
        note.hidden = true;
        mouse.setAttribute("aria-expanded", "false");
      }
    },
    { signal: controller.signal }
  );
  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        if (note.contains(document.activeElement))
          mouse.focus({ preventScroll: true });
        note.hidden = true;
        mouse.setAttribute("aria-expanded", "false");
      }
    },
    { signal: controller.signal }
  );
  cleanup = () => {
    controller.abort();
    clearTimeout(timer);
    clearTimeout(idleTimer);
    clearTimeout(poseTimer);
    clearTimeout(announcementTimer);
    clearTimeout(thanksTimer);
    observer.disconnect();
    home.host.classList.remove("hamster-home");
    stoneHome.host.classList.remove("pebble-home");
    currentPerch = null;
  };
}
setupMouse();
document.addEventListener("astro:page-load", setupMouse);
document.addEventListener("astro:before-swap", () => cleanup?.());
