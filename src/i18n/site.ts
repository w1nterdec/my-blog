// Shared interface copy. Article bodies remain in their original language.
const english: Record<string, string> = {
  页面请求记录: "Page requests",
  "包括机器人访问，不代表独立访客":
    "Includes bots; this is not a unique visitor count",
  日常: "Life",
  "记录生活中的片刻，分享日常的感受与思考。":
    "Small moments, everyday feelings, and thoughts worth keeping.",
  首页: "Home",
  随笔: "Journal",
  关于: "About",
  归档: "Archive",
  搜索: "Search",
  主导航: "Main navigation",
  跳转到正文: "Skip to content",
  展开菜单: "Open menu",
  收起菜单: "Close menu",
  选择语言: "Choose language",
  "记录生活中的片刻，": "Small moments,",
  "分享日常的感受与思考。": "lasting thoughts.",
  "订阅 RSS": "Subscribe via RSS",
  生活随笔: "Journal",
  精选文章: "Featured entries",
  "文字还在路上。": "The words are on their way.",
  "这里将慢慢装下生活中的片刻、感受与思考。":
    "A place for moments, feelings, and thoughts, gathered over time.",
  "中国 · 武汉": "Wuhan, China",
  关于我: "About me",
  "最近在上学，也在做个人 AI 工程项目。":
    "Currently studying and building a personal AI engineering project.",
  "面向中文技术知识的 AI 工程系统，涵盖数据集工程、微调、RAG 与部署。":
    "An AI engineering system for Chinese technical knowledge, spanning dataset engineering, fine-tuning, RAG, and deployment.",
  留在地图上的记忆: "Memories on the map",
  走过的地方: "Places along the way",
  中国: "China",
  座城市: "cities",
  我是: "I’m",
  个人介绍: "About w1nter",
  全部: "All",
  "PLACES / 留在地图上的记忆": "PLACES / MEMORIES ON THE MAP",
  "足迹地球仪。拖动或使用方向键旋转，加减键缩放，点击标记查看地点。":
    "A globe of visited places. Drag or use arrow keys to rotate, plus and minus to zoom, and select a marker to view the place.",
  本页目录: "On this page",
  "地球正在展开…": "Unfolding the world…",
  居住: "Lived in",
  旅行: "Visited",
  现居: "Home now",
  曾居: "Former home",
  武汉: "Wuhan",
  成都: "Chengdu",
  洛阳: "Luoyang",
  合肥: "Hefei",
  安阳: "Anyang",
  "如今生活与学习的地方，也是旅途中到过的一站。":
    "Where I live and study now, and a place I have visited along the way.",
  "曾经生活过的城市，也留下过旅行的足迹。":
    "A city I once called home, and one I have returned to as a visitor.",
  "旅途中到过的一站，关于这座城的故事，留待慢慢记录。":
    "A stop along the way. Its story is still waiting to be written.",
  "曾在旅途中停留，记忆将在这里慢慢展开。":
    "A place I stopped on my travels. Its memories will unfold here over time.",
  "旅行足迹中的一座城，期待再把记忆写下来。":
    "A city on my travel map, with memories to return to in writing.",
  "当前浏览器不支持地球仪。": "Your browser cannot display the globe.",
  "地图暂未加载，请稍后刷新重试。":
    "The map could not load. Please refresh and try again later.",
  "还没有发表文章，文字正在慢慢积累。":
    "No entries yet. The words are gathering, slowly.",
  "还没有归档，期待第一段记录。":
    "No entries to archive yet. A first memory will find its way here.",
  "第一篇文章发表后，标签会出现在这里。":
    "Tags will appear here when the first entry is published.",
  "还没有可搜索的文章，发表后就可以在这里查找。":
    "There are no entries to search yet. Published entries will appear here.",
  "开发模式提示：请至少构建一次项目，生成搜索索引。文章更新后需要重新构建。":
    "Development preview: build the site once to generate its search index. Rebuild after changing entries.",
  "记录 · 思考 · 实践": "NOTES / IDEAS / PRACTICE",
  "你好，我是": "Hi, I'm",
  "把想法写下来，把学到的东西用起来。":
    "Write ideas down. Put what I learn into practice.",
  "记录学习中的发现、实践中的经验，以及日常的思考。":
    "Notes on learning, building, and everyday life.",
  文章: "Writing",
  所有文章: "All entries",
  最近更新: "Latest entries",
  此刻: "NOW",
  我写的文章: "Things I write",
  "标签：": "Tags:",
  按标签浏览文章: "Browse entries by tag",
  "还没有发表文章。": "No entries yet.",
  查看所有文章: "View all entries",
  已运行: "Running for",
  天: "days",
  运行起始日期: "Running since",
  项目: "Projects",
  返回项目: "Back to projects",
  "个人项目与开源实践。": "Personal projects and open-source work.",
  "项目正在整理中。": "Projects are being collected.",
  网站致谢: "Site credits",
  足迹: "Places",
};

export function localize(locale?: string) {
  return (text: string): string =>
    locale === "en" ? (english[text] ?? text) : text;
}
export function currentLanguage() {
  return document.documentElement.lang === "en" ? "en" : "zh-CN";
}
