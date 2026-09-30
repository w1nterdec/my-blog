import { detectAgenticEnvironment } from "am-i-vibing";
function isRunByAgent() {
  try {
    return detectAgenticEnvironment().type === "agent";
  } catch {
    return false;
  }
}
function supportsAgentAutoBackgrounding(platform) {
  return platform !== "win32";
}
export {
  isRunByAgent,
  supportsAgentAutoBackgrounding
};
