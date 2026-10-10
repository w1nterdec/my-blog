import {
  getCityWords,
  getXiaoheiWords,
  type XiaoheiTopic,
} from "@/data/xiaohei";
import { localize, currentLanguage } from "@/i18n/site";
import { drawXiaohei, type CatMood } from "./xiaohei-sprite";

const storageKey = "zhixing-xiaohei";
type Preferences = { quiet: boolean; following: boolean };
function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return { quiet: value.quiet === true, following: value.following === true };
  } catch {
    return { quiet: false, following: false };
  }
}

let teardown: (() => void) | undefined;
function setupXiaohei() {
  teardown?.();
  const locale = currentLanguage();
  const s = localize(locale);
  const xiaoheiWords = getXiaoheiWords(locale);
  const cityWords = getCityWords(locale);
  const rootElement = document.querySelector<HTMLElement>(
    "[data-xiaohei-root]"
  );
  const headerElement = document.querySelector<HTMLButtonElement>(
    "[data-xiaohei-header]"
  );
  const gardenElement = document.querySelector<HTMLElement>(
    "[data-xiaohei-garden]"
  );
  if (!rootElement || !headerElement || !gardenElement) return;
  const root: HTMLElement = rootElement;
  const header: HTMLButtonElement = headerElement;
  const garden: HTMLElement = gardenElement;
  const find = <T extends HTMLElement>(selector: string) =>
    document.querySelector<T>(selector)!;
  const meadow = find<HTMLElement>("[data-xiaohei-meadow]");
  const walker = find<HTMLButtonElement>("[data-xiaohei-walker]");
  const companion = find<HTMLElement>("[data-xiaohei-companion]");
  const companionCat = find<HTMLButtonElement>("[data-xiaohei-companion-cat]");
  const bubble = find<HTMLElement>("[data-xiaohei-bubble]");
  const message = find<HTMLElement>("[data-xiaohei-message]");
  const topicLabel = find<HTMLElement>("[data-xiaohei-topic]");
  const quietButton = find<HTMLButtonElement>("[data-xiaohei-quiet]");
  const followButton = find<HTMLButtonElement>("[data-xiaohei-follow]");
  const status = find<HTMLElement>("[data-xiaohei-status]");
  const announcement = find<HTMLElement>("[data-xiaohei-announcement]");
  const landscape = find<HTMLCanvasElement>("[data-xiaohei-landscape]");
  const landscapeCtx = landscape.getContext("2d");
  const sprites = [header, walker, companionCat].map(button => ({
    button,
    ctx: button.querySelector("canvas")!.getContext("2d"),
  }));
  if (sprites.some(sprite => !sprite.ctx) || !landscapeCtx) return;
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const preferences = readPreferences();
  let peeking = false;
  const isFollowing = () => preferences.following || peeking;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!signal.aborted) fn();
    }, ms);
    timers.add(id);
    return id;
  }
  function cancel(id: ReturnType<typeof setTimeout> | undefined) {
    if (id !== undefined) {
      clearTimeout(id);
      timers.delete(id);
    }
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      /* Private browsing can disable storage. */
    }
  }
  function baseTopic(): XiaoheiTopic {
    const path = location.pathname
      .replace(/^\/en(?=\/|$)/, "")
      .replace(/\/+$/, "");
    if (path.endsWith("/life")) return "music";
    if (path.endsWith("/island")) return "island";
    if (path.endsWith("/photography")) return "photos";
    if (path.endsWith("/about")) return "about";
    if (path.endsWith("/archives")) return "archives";
    if (path.endsWith("/tags") || path.includes("/tags/")) return "tags";
    if (path.endsWith("/search")) return "search";
    if (path.endsWith("/404") || document.title.startsWith("404"))
      return "lost";
    if (path.includes("/posts/"))
      return /^\/posts\/\d+$/.test(path) ? "posts" : "article";
    if (path.endsWith("/posts")) return "posts";
    return "home";
  }
  let topic = baseTopic();
  let mood: CatMood = "idle",
    moodUntil = 0;
  const rail = document.querySelector<HTMLElement>("[data-xiaohei-rail]")!;
  const headerState = {
    mood: "idle" as CatMood,
    until: 0,
    x: 0.12,
    target: 0.12,
    speed: 0,
    facing: 1,
    decision: performance.now() + 4000,
    phase: 17.4,
    lastActivity: performance.now(),
  };
  let gardenVisible = false,
    headerVisible = true,
    blocked = false;
  let frame = 0,
    lastTime = 0,
    lastDraw = 0,
    lastActivity = performance.now();
  let x = 0.28,
    target = 0.28,
    facing = 1,
    speed = 0,
    nextDecision = 0;
  let pointer = { x: -1000, y: -1000 },
    stageWidth = 600,
    stageHeight = 124;
  let safeLanes: [number, number][] = [[12, innerWidth - 100]];
  let laneAvailable = true;
  let lastFoot = 0,
    lastFootX = 0;
  let lastSpoke = -30000,
    autoCount = 0;
  let activeAnchor: HTMLElement = header;
  let dismissTimer: ReturnType<typeof setTimeout> | undefined;
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;
  let manualBubble = false,
    destroyed = false;
  let word = "",
    lastKeyTime = 0;
  const seen = new Set<string>();
  const lineIndex = new Map<XiaoheiTopic, number>();
  const footprints: { x: number; y: number; at: number; side: number }[] = [];
  let destination: { x: number; at: number } | undefined;
  let colors = { accent: "", muted: "", border: "", dark: false };
  function palette() {
    const styles = getComputedStyle(document.documentElement);
    colors = {
      accent: styles.getPropertyValue("--accent").trim(),
      muted: styles.getPropertyValue("--muted-foreground").trim(),
      border: styles.getPropertyValue("--border").trim(),
      dark: document.documentElement.dataset.theme === "dark",
    };
    render(performance.now());
  }
  function reflect() {
    companion.hidden = !isFollowing() || blocked || !laneAvailable;
    walker.hidden = isFollowing();
    quietButton.textContent = preferences.quiet
      ? s("可以说话了")
      : s("少说一点");
    quietButton.setAttribute("aria-pressed", String(preferences.quiet));
    followButton.textContent = isFollowing()
      ? s("回到小院")
      : s("陪我读一会儿");
    followButton.setAttribute("aria-pressed", String(isFollowing()));
    status.textContent = isFollowing()
      ? s("正在陪你读书")
      : reduced.matches
        ? s("安静地陪着你")
        : s("正在散步");
    bubble.dataset.quiet = String(preferences.quiet);
  }
  function restFocus() {
    if (bubble.contains(document.activeElement))
      activeAnchor.focus({ preventScroll: true });
  }
  function closeBubble(restore = false) {
    cancel(dismissTimer);
    dismissTimer = undefined;
    if (restore || bubble.contains(document.activeElement)) restFocus();
    bubble.hidden = true;
    manualBubble = false;
    [header, walker, companionCat].forEach(button =>
      button.setAttribute("aria-expanded", "false")
    );
  }
  function positionBubble() {
    if (bubble.hidden) return;
    const rect = activeAnchor.getBoundingClientRect();
    const width = Math.min(306, window.innerWidth - 24);
    const height = bubble.offsetHeight;
    const left = Math.min(
      window.innerWidth - width - 12,
      Math.max(12, rect.left + rect.width / 2 - width / 2)
    );
    const above = rect.bottom + height + 20 > window.innerHeight;
    const top = above
      ? Math.max(12, rect.top - height - 12)
      : Math.max(12, rect.bottom + 12);
    bubble.style.width = `${width}px`;
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.style.setProperty(
      "--bubble-tip",
      `${Math.max(20, Math.min(width - 20, rect.left + rect.width / 2 - left))}px`
    );
    bubble.dataset.side = above ? "above" : "below";
  }
  function pickLine(nextTopic: XiaoheiTopic) {
    let lines = xiaoheiWords[nextTopic].lines;
    if (nextTopic === "photos" && document.querySelector(".photo-work"))
      lines = lines.filter(
        line =>
          !line.includes(
            locale === "en" ? "photographs are on their way" : "还在路上"
          )
      );
    if (nextTopic === "posts" && document.querySelector("[data-pagefind-body]"))
      lines = [s("写下来的日子，会在这里慢慢聚起来。")];
    const index = lineIndex.get(nextTopic) ?? 0;
    lineIndex.set(nextTopic, index + 1);
    return lines[index % lines.length];
  }
  function speak(
    nextTopic = topic,
    text?: string,
    manual = false,
    anchor?: HTMLElement
  ) {
    if (
      blocked ||
      document.hidden ||
      (!manual &&
        (preferences.quiet ||
          !bubble.hidden ||
          performance.now() - lastSpoke < 28000 ||
          autoCount >= 2))
    )
      return;
    activeAnchor =
      anchor ??
      (isFollowing() ? companionCat : gardenVisible ? walker : header);
    if (activeAnchor.hidden || !activeAnchor.getClientRects().length)
      activeAnchor = header;
    manualBubble = manual;
    topicLabel.textContent = xiaoheiWords[nextTopic].label;
    message.textContent = text ?? pickLine(nextTopic);
    bubble.hidden = false;
    [header, walker, companionCat].forEach(button =>
      button.setAttribute("aria-expanded", String(button === activeAnchor))
    );
    positionBubble();
    lastSpoke = performance.now();
    if (!manual) autoCount++;
    else announcement.textContent = message.textContent;
    cancel(dismissTimer);
    dismissTimer = later(
      () => {
        if (
          !bubble.matches(":hover") &&
          !bubble.contains(document.activeElement)
        )
          closeBubble();
      },
      manual ? 16000 : 7000
    );
  }
  function react(
    nextMood: CatMood,
    seconds = 2.4,
    actor: HTMLElement = activeAnchor
  ) {
    if (actor === header) {
      headerState.mood = nextMood;
      headerState.until = performance.now() + seconds * 1000;
      headerState.lastActivity = performance.now();
      headerState.decision = headerState.until + 3000;
      headerState.speed = 0;
      render(performance.now());
      start();
      return;
    }
    lastActivity = performance.now();
    mood = nextMood;
    moodUntil = lastActivity + seconds * 1000;
    nextDecision = moodUntil + 1800;
    speed = 0;
    render(lastActivity);
    start();
  }
  function follow(value: boolean) {
    preferences.following = value;
    peeking = false;
    save();
    closeBubble();
    x = value ? 0.78 : 0.28;
    target = x;
    footprints.length = 0;
    destination = undefined;
    lastActivity = performance.now();
    nextDecision = lastActivity + 2600;
    reflect();
    updateSafeLane();
    react(value ? "happy" : "stretch", 2.4, value ? companionCat : walker);
    announcement.textContent = value
      ? s("小黑来陪你读书了。点击它可以互动，右侧按钮可以送它回小院。")
      : s("小黑回到页底的小院了。");
    if (value)
      later(
        () =>
          speak(topic, s("我来啦。你慢慢看，我就在这里。"), true, companionCat),
        450
      );
  }
  function changeTopic(next: XiaoheiTopic, text?: string) {
    topic = next;
    if ((isFollowing() || gardenVisible) && !seen.has(next)) {
      seen.add(next);
      speak(next, text);
    }
  }
  function safeBounds() {
    const width = isFollowing() ? window.innerWidth : stageWidth;
    if (isFollowing() && safeLanes.length) {
      const current = x * width;
      const lane = [...safeLanes].sort(
        (a, b) =>
          Math.max(a[0] - current, current - a[1], 0) -
          Math.max(b[0] - current, current - b[1], 0)
      )[0];
      return { width, min: lane[0] / width, max: lane[1] / width };
    }
    return { width, min: 12 / width, max: Math.max(0.1, (width - 84) / width) };
  }
  function updateSafeLane() {
    if (!isFollowing()) {
      laneAvailable = true;
      return;
    }
    const width = innerWidth;
    const controls = [
      ...document.querySelectorAll<HTMLElement>(
        "main button, main a, main input, main select, main textarea, footer a, footer button"
      ),
    ]
      .filter(element => !element.closest("[data-xiaohei-garden]"))
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0 && rect.height < 100);
    const viewport = window.visualViewport;
    const keyboardLift = viewport
      ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop)
      : 0;
    const base =
      parseFloat(getComputedStyle(companion).bottom) -
      parseFloat(companion.style.getPropertyValue("--xiaohei-lift") || "0");
    for (const lift of [keyboardLift, keyboardLift + 76, keyboardLift + 152]) {
      const bottom = innerHeight - base - lift;
      let ranges: [number, number][] = [[12, width - 100]];
      controls
        .filter(rect => rect.top < bottom + 8 && rect.bottom > bottom - 80)
        .forEach(rect => {
          const left = rect.left - 96,
            right = rect.right + 8;
          ranges = ranges.flatMap(([start, end]) => {
            if (right <= start || left >= end)
              return [[start, end] as [number, number]];
            const parts: [number, number][] = [];
            if (left - start > 4) parts.push([start, left]);
            if (end - right > 4) parts.push([right, end]);
            return parts;
          });
        });
      if (ranges.length) {
        safeLanes = ranges;
        laneAvailable = true;
        companion.style.setProperty("--xiaohei-lift", `${lift}px`);
        const bounds = safeBounds();
        x = Math.max(bounds.min, Math.min(bounds.max, x));
        target = Math.max(bounds.min, Math.min(bounds.max, target));
        reflect();
        return;
      }
    }
    laneAvailable = false;
    reflect();
    if (activeAnchor === companionCat) closeBubble();
  }
  function look(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    return {
      x: Math.max(
        -1.5,
        Math.min(1.5, (pointer.x - rect.left - rect.width / 2) / 180)
      ),
      y: Math.max(
        -1,
        Math.min(1, (pointer.y - rect.top - rect.height / 2) / 180)
      ),
    };
  }
  function render(now: number) {
    const bounds = safeBounds();
    x = Math.max(bounds.min, Math.min(bounds.max, x));
    const actor = isFollowing() ? companionCat : walker;
    const actorMood =
      now < moodUntil
        ? mood
        : Math.abs(speed) > 0.008
          ? "walk"
          : now - lastActivity > 22000
            ? "sleep"
            : "idle";
    walker.style.left = `${x * stageWidth}px`;
    companion.style.left = `${x * window.innerWidth}px`;
    const railWidth = rail.clientWidth;
    header.style.left = `${Math.max(0, Math.min(railWidth - header.offsetWidth, headerState.x * railWidth))}px`;
    sprites.forEach(({ button, ctx }) => {
      const eyes = look(button);
      const catMood =
        button === header
          ? now < headerState.until
            ? headerState.mood
            : Math.abs(headerState.speed) > 0.002
              ? "walk"
              : Math.abs(eyes.x) > 0.2
                ? "look"
                : "idle"
          : actorMood;
      if ((button === header && headerVisible) || button === actor)
        drawXiaohei(ctx!, {
          mood: catMood,
          time: now / 1000 + (button === header ? headerState.phase : 0),
          facing: button === header ? headerState.facing : facing,
          lookX: eyes.x,
          lookY: eyes.y,
          dark: colors.dark,
          reduced: reduced.matches,
        });
    });
    const label = {
      idle: s("正在张望"),
      look: s("正在看你"),
      walk: s("正在散步"),
      happy: s("摸摸收到啦"),
      stretch: s("伸个懒腰"),
      sleep: s("正在打盹"),
    }[actorMood];
    status.textContent = isFollowing()
      ? `${s("陪读中")} · ${label}`
      : reduced.matches
        ? s("安静地陪着你")
        : label;
    if (gardenVisible) drawLandscape(now);
    if (!bubble.hidden) positionBubble();
  }
  function drawLandscape(now: number) {
    const ctx = landscapeCtx!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, stageWidth, stageHeight);
    if (colors.dark) {
      ctx.fillStyle = colors.accent;
      for (let i = 0; i < 13; i++) {
        ctx.globalAlpha =
          0.16 +
          (reduced.matches ? 0.2 : (Math.sin(now / 1800 + i) + 1) * 0.15);
        ctx.fillRect(
          (i * 137 + 43) % stageWidth,
          16 + ((i * 19) % 45),
          i % 4 === 0 ? 2 : 1,
          2
        );
      }
    }
    const floor = stageHeight - 26;
    for (let i = footprints.length - 1; i >= 0; i--) {
      const mark = footprints[i];
      const age = now - mark.at;
      if (age > 4800) {
        footprints.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = (1 - age / 4800) * 0.22;
      ctx.fillStyle = colors.accent;
      ctx.fillRect(mark.x, floor - 2 + mark.side * 3, 3, 2);
      ctx.fillRect(mark.x + 1, floor - 4 + mark.side * 3, 1, 1);
    }
    if (destination && now - destination.at < 2400) {
      const progress = (now - destination.at) / 2400;
      ctx.globalAlpha = (1 - progress) * 0.65;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        destination.x * stageWidth + 32,
        floor + 2,
        7 + progress * 10,
        2 + progress * 4,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.fillStyle = colors.accent;
      ctx.fillRect(destination.x * stageWidth + 30, floor - 3, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
  function tick(now: number) {
    frame = 0;
    if (destroyed || document.hidden || blocked || reduced.matches) return;
    const dt = Math.min((now - (lastTime || now)) / 1000, 0.055);
    lastTime = now;
    const moving = gardenVisible || isFollowing();
    if (
      moving &&
      now > moodUntil &&
      !(manualBubble && activeAnchor !== header)
    ) {
      const bounds = safeBounds();
      if (now > nextDecision) {
        // Alternate strolls and pauses, rather than bouncing at a fixed speed.
        target = Math.max(
          bounds.min,
          Math.min(bounds.max, x + (Math.random() - 0.5) * 0.55)
        );
        nextDecision = now + 6000 + Math.random() * 5000;
        const rest = Math.random();
        if (rest < 0.35) {
          mood = rest < 0.12 ? "sleep" : "stretch";
          moodUntil = now + (mood === "sleep" ? 8000 : 1800);
          nextDecision = moodUntil + 2400;
          target = x;
          speed = 0;
        }
      }
      const delta = target - x;
      const desired =
        Math.abs(delta) > 0.006
          ? Math.sign(delta) * Math.min(0.09, Math.abs(delta) * 1.1)
          : 0;
      speed += (desired - speed) * Math.min(1, dt * 5);
      x = Math.max(bounds.min, Math.min(bounds.max, x + speed * dt));
      if (Math.abs(speed) > 0.008) {
        facing = speed > 0 ? 1 : -1;
        lastActivity = now;
      }
      if (
        !isFollowing() &&
        Math.abs(speed) > 0.008 &&
        now - lastFoot > 190 &&
        Math.abs(x * stageWidth - lastFootX) > 7
      ) {
        footprints.push({
          x: x * stageWidth + 31,
          y: 0,
          at: now,
          side: footprints.length % 2,
        });
        lastFoot = now;
        lastFootX = x * stageWidth;
      }
    } else speed = 0;
    if (
      headerVisible &&
      now > headerState.until &&
      !(manualBubble && activeAnchor === header) &&
      !header.matches(":hover, :focus-visible")
    ) {
      const max = Math.max(0, 1 - header.offsetWidth / rail.clientWidth);
      if (now > headerState.decision) {
        headerState.target = Math.max(
          0,
          Math.min(max, headerState.x + (Math.random() - 0.5) * 0.6)
        );
        headerState.decision = now + 7000 + Math.random() * 4000;
        if (Math.random() < 0.22) {
          headerState.mood = "stretch";
          headerState.until = now + 1900;
          headerState.target = headerState.x;
        }
      }
      const delta = headerState.target - headerState.x;
      const desired =
        Math.abs(delta) > 0.004
          ? Math.sign(delta) * Math.min(27 / rail.clientWidth, Math.abs(delta))
          : 0;
      headerState.speed += (desired - headerState.speed) * Math.min(1, dt * 6);
      headerState.x = Math.max(
        0,
        Math.min(max, headerState.x + headerState.speed * dt)
      );
      if (Math.abs(headerState.speed) > 0.002)
        headerState.facing = headerState.speed > 0 ? 1 : -1;
    } else headerState.speed = 0;
    if (now - lastDraw >= 40) {
      render(now);
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (
      !frame &&
      !document.hidden &&
      !blocked &&
      !reduced.matches &&
      (headerVisible || gardenVisible || isFollowing())
    ) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  function resize() {
    stageWidth = meadow.clientWidth;
    stageHeight = meadow.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    landscape.width = Math.round(stageWidth * dpr);
    landscape.height = Math.round(stageHeight * dpr);
    updateSafeLane();
    render(performance.now());
  }
  function open(button: HTMLButtonElement, nextTopic = topic) {
    if (!bubble.hidden && activeAnchor === button) {
      closeBubble();
      return;
    }
    react("happy", 1.4, button);
    speak(nextTopic, undefined, true, button);
  }
  header.hidden = false;
  garden.hidden = false;
  const keyboardFocus = (event: MouseEvent) => {
    if (event.detail === 0 && !bubble.hidden)
      find<HTMLButtonElement>("[data-xiaohei-close]").focus({
        preventScroll: true,
      });
  };
  header.addEventListener(
    "click",
    event => {
      open(header);
      keyboardFocus(event);
    },
    { signal }
  );
  walker.addEventListener(
    "click",
    event => {
      open(walker, "footer");
      keyboardFocus(event);
    },
    { signal }
  );
  companionCat.addEventListener(
    "click",
    event => {
      open(companionCat);
      keyboardFocus(event);
    },
    { signal }
  );
  header.addEventListener(
    "pointerenter",
    () => {
      if (finePointer.matches) {
        react("look", 1.2, header);
      }
    },
    { signal }
  );
  find<HTMLButtonElement>("[data-xiaohei-call]").addEventListener(
    "click",
    () => follow(true),
    { signal }
  );
  find<HTMLButtonElement>("[data-xiaohei-home]").addEventListener(
    "click",
    () => follow(false),
    { signal }
  );
  followButton.addEventListener("click", () => follow(!isFollowing()), {
    signal,
  });
  quietButton.addEventListener(
    "click",
    () => {
      preferences.quiet = !preferences.quiet;
      save();
      reflect();
      message.textContent = preferences.quiet
        ? s("好，我安静一点。想找我时，点点我就好。")
        : s("好呀。遇到有意思的地方，我会轻轻说一句。");
      announcement.textContent = message.textContent;
    },
    { signal }
  );
  find<HTMLButtonElement>("[data-xiaohei-pet]").addEventListener(
    "click",
    () => {
      react("happy", 2.8);
      const lines = [
        s("呼噜……摸摸收到啦。"),
        s("再摸一下，就陪你多走一段。"),
        s("喵，今天的温柔已签收。"),
      ];
      message.textContent = lines[Math.floor(Math.random() * lines.length)];
      announcement.textContent = message.textContent;
    },
    { signal }
  );
  find<HTMLButtonElement>("[data-xiaohei-close]").addEventListener(
    "click",
    () => closeBubble(true),
    { signal }
  );
  bubble.addEventListener("pointerenter", () => cancel(dismissTimer), {
    signal,
  });
  bubble.addEventListener(
    "pointerleave",
    () => {
      dismissTimer = later(() => {
        if (!bubble.contains(document.activeElement)) closeBubble();
      }, 6000);
    },
    { signal }
  );
  bubble.addEventListener("focusin", () => cancel(dismissTimer), { signal });
  bubble.addEventListener(
    "focusout",
    () => {
      dismissTimer = later(() => {
        if (!bubble.contains(document.activeElement)) closeBubble();
      }, 6000);
    },
    { signal }
  );
  document.addEventListener(
    "pointerdown",
    event => {
      if (
        !bubble.hidden &&
        event.target instanceof Node &&
        !bubble.contains(event.target) &&
        !activeAnchor.contains(event.target)
      )
        closeBubble();
    },
    { signal }
  );
  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeBubble(true);
        return;
      }
      const input =
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable], [role=textbox]"
        );
      if (
        input ||
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat ||
        event.key.length !== 1
      ) {
        word = "";
        return;
      }
      const now = performance.now();
      if (now - lastKeyTime > 1800) word = "";
      lastKeyTime = now;
      word = (word + event.key.toLowerCase()).slice(-7);
      if (word === "xiaohei") {
        word = "";
        follow(true);
      }
    },
    { signal }
  );
  [walker, companionCat].forEach(button =>
    button.addEventListener(
      "keydown",
      event => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        closeBubble();
        const bounds = safeBounds();
        target = Math.max(
          bounds.min,
          Math.min(bounds.max, x + (event.key === "ArrowRight" ? 0.12 : -0.12))
        );
        nextDecision = performance.now() + 5000;
        lastActivity = performance.now();
        if (reduced.matches) {
          x = target;
          render(lastActivity);
        }
      },
      { signal }
    )
  );
  meadow.addEventListener(
    "pointerdown",
    event => {
      if (
        (event.target instanceof Element && event.target.closest("button")) ||
        isFollowing()
      )
        return;
      closeBubble();
      const rect = meadow.getBoundingClientRect();
      const bounds = safeBounds();
      target = Math.max(
        bounds.min,
        Math.min(bounds.max, (event.clientX - rect.left - 32) / stageWidth)
      );
      destination = { x: target, at: performance.now() };
      nextDecision = performance.now() + 8000;
      moodUntil = 0;
      lastActivity = performance.now();
      if (reduced.matches) x = target;
      render(performance.now());
      start();
    },
    { signal }
  );
  window.addEventListener(
    "pointermove",
    event => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY };
      // Companion notices nearby visitors, without chasing across the reading area.
      if (
        isFollowing() &&
        event.clientY > innerHeight - 140 &&
        bubble.hidden &&
        performance.now() > moodUntil
      ) {
        const bounds = safeBounds();
        target = Math.max(
          bounds.min,
          Math.min(bounds.max, (event.clientX - 32) / innerWidth)
        );
        nextDecision = performance.now() + 4000;
      }
      if (reduced.matches) render(performance.now());
    },
    { passive: true, signal }
  );
  document.addEventListener(
    "click",
    event => {
      if (!(event.target instanceof Element)) return;
      const city = event.target.closest<HTMLButtonElement>("[data-city-index]");
      if (city) {
        const name = city.childNodes[0]?.textContent?.trim() ?? "";
        topic = "travel";
        if (isFollowing() && !preferences.quiet)
          later(() => speak("travel", cityWords[name], true), 250);
      }
      const filter = event.target.closest<HTMLButtonElement>(
        "[data-photo-filter]"
      );
      if (filter) {
        const nextTopic =
          filter.dataset.photoFilter === "猫犬"
            ? "pets"
            : filter.dataset.photoFilter === "人像"
              ? "portraits"
              : "photos";
        topic = nextTopic;
        if (isFollowing() && !preferences.quiet)
          speak(nextTopic, undefined, true);
      }
    },
    { signal }
  );
  const watched: [string, XiaoheiTopic][] = [
    [".home-photography", "photos"],
    [".music-shelf", "music"],
    [".writing-section", "posts"],
    [".status-panel", "status"],
    [".project-panel", "project"],
    [".globe-layout", "travel"],
    [".about-copy", "about"],
    [".photo-grid", "photos"],
  ];
  const topics = new Map<Element, XiaoheiTopic>();
  const sectionObserver = new IntersectionObserver(
    entries => {
      const entering = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (entering) changeTopic(topics.get(entering.target)!);
    },
    { threshold: [0.2, 0.55] }
  );
  watched.forEach(([selector, nextTopic]) =>
    document.querySelectorAll(selector).forEach(element => {
      topics.set(element, nextTopic);
      sectionObserver.observe(element);
    })
  );
  const visibilityObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.target === garden) {
          gardenVisible = entry.isIntersecting;
          if (gardenVisible && !isFollowing() && !seen.has("footer")) {
            seen.add("footer");
            cancel(releaseTimer);
            releaseTimer = later(() => {
              if (gardenVisible) speak("footer");
            }, 1800);
          }
          if (!gardenVisible && activeAnchor === walker) closeBubble();
        } else headerVisible = entry.isIntersecting;
      });
      if (!headerVisible && !gardenVisible && !isFollowing()) pause();
      else start();
      render(performance.now());
    },
    { threshold: 0.1 }
  );
  visibilityObserver.observe(header);
  visibilityObserver.observe(garden);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(meadow);
  resizeObserver.observe(rail);
  function checkOverlays() {
    blocked =
      !!document.querySelector(
        "dialog[open], [role=dialog][aria-modal=true]"
      ) || !!document.fullscreenElement;
    root.hidden = blocked;
    if (blocked) {
      closeBubble();
      pause();
    } else {
      reflect();
      start();
    }
  }
  const overlayObserver = new MutationObserver(checkOverlays);
  overlayObserver.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["open", "aria-modal"],
  });
  document.addEventListener("fullscreenchange", checkOverlays, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        pause();
        closeBubble();
      } else start();
    },
    { signal }
  );
  document.addEventListener("site:theme-change", palette, { signal });
  reduced.addEventListener(
    "change",
    () => {
      pause();
      speed = 0;
      footprints.length = 0;
      render(performance.now());
      start();
    },
    { signal }
  );
  window.addEventListener("resize", resize, { passive: true, signal });
  window.visualViewport?.addEventListener("resize", resize, {
    passive: true,
    signal,
  });
  window.addEventListener(
    "scroll",
    () => {
      updateSafeLane();
      if (
        scrollY > 420 &&
        !isFollowing() &&
        !reduced.matches &&
        finePointer.matches &&
        !preferences.quiet &&
        !blocked
      ) {
        let allowed = false;
        try {
          allowed = !sessionStorage.getItem("zhixing-cat-peek");
          if (allowed) sessionStorage.setItem("zhixing-cat-peek", "1");
        } catch {}
        if (allowed) {
          peeking = true;
          x = 0.88;
          target = 0.82;
          companion.classList.add("is-peeking");
          reflect();
          updateSafeLane();
          react("look", 2, companionCat);
          start();
          later(() => {
            peeking = false;
            companion.classList.remove("is-peeking");
            reflect();
            render(performance.now());
          }, 9000);
        }
      }
      if (reduced.matches) render(performance.now());
      if (!bubble.hidden) {
        if (!manualBubble) closeBubble();
        else positionBubble();
      }
    },
    { passive: true, signal }
  );
  window.addEventListener(
    "storage",
    event => {
      if (event.key !== storageKey) return;
      Object.assign(preferences, readPreferences());
      closeBubble();
      reflect();
      updateSafeLane();
      render(performance.now());
    },
    { signal }
  );
  palette();
  reflect();
  resize();
  checkOverlays();
  start();
  teardown = () => {
    destroyed = true;
    pause();
    controller.abort();
    timers.forEach(clearTimeout);
    timers.clear();
    sectionObserver.disconnect();
    visibilityObserver.disconnect();
    resizeObserver.disconnect();
    overlayObserver.disconnect();
  };
}

setupXiaohei();
document.addEventListener("astro:page-load", setupXiaohei);
document.addEventListener("astro:before-swap", () => teardown?.());
