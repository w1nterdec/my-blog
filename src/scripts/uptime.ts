import { getRunningDays } from "@/utils/getRunningDays";

let cleanup: (() => void) | undefined;
function setupUptime() {
  cleanup?.();
  const root = document.querySelector<HTMLElement>("[data-site-uptime]");
  const count = root?.querySelector<HTMLElement>("[data-running-days]");
  if (!root?.dataset.startedAt || !count) return;
  const startedAt = root.dataset.startedAt;
  const timeZone = root.dataset.timezone;
  const controller = new AbortController();
  const update = () => {
    if (document.hidden) return;
    const days = getRunningDays(startedAt, new Date(), timeZone);
    if (days !== null)
      count.textContent = days.toLocaleString(document.documentElement.lang);
  };
  update();
  const interval = setInterval(update, 60_000);
  document.addEventListener("visibilitychange", update, {
    signal: controller.signal,
  });
  cleanup = () => {
    clearInterval(interval);
    controller.abort();
  };
  document.addEventListener("astro:before-swap", cleanup, {
    once: true,
    signal: controller.signal,
  });
}
setupUptime();
document.addEventListener("astro:page-load", setupUptime);
