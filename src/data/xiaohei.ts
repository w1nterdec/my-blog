export type XiaoheiTopic =
  | "home"
  | "photos"
  | "pets"
  | "portraits"
  | "about"
  | "travel"
  | "project"
  | "status"
  | "posts"
  | "article"
  | "archives"
  | "tags"
  | "search"
  | "lost"
  | "footer";

// Curated local lines: no API, fabricated stories, or requests to an AI service.
export const xiaoheiWords: Record<
  XiaoheiTopic,
  { label: string; lines: string[] }
> = {
  home: {
    label: "知行之间",
    lines: [
      "喵。这里有一些生活，也有一些慢慢长大的想法。",
      "不用急着往下滑。今天的片刻，也值得留下。",
      "你看文字，我看着你。",
    ],
  },
  photos: {
    label: "光影 · 映",
    lines: [
      "光落下来的时候，记得按一次快门。",
      "照片还在路上。我先替毛茸茸们站个位置。",
      "有些瞬间，不用说话也能记很久。",
    ],
  },
  pets: {
    label: "猫犬 · 毛茸茸",
    lines: [
      "这里有我的同类吗？耳朵已经竖起来了。",
      "拍猫的时候，耐心比快门更有用。",
      "我也可以当模特。不过，要先摸摸。",
    ],
  },
  portraits: {
    label: "人像 · 相遇",
    lines: [
      "比起摆好的姿势，我喜欢人放松下来的那一刻。",
      "留住一个人，也留住当时的光。",
    ],
  },
  about: {
    label: "认识 w1nter",
    lines: [
      "他在上学，也在把一些想法慢慢做出来。",
      "attention is all my need。我的注意力，大概都在你这里。",
    ],
  },
  travel: {
    label: "走过的地方",
    lines: [
      "地球转一转，下一站的故事还没开始。",
      "武汉、成都，还有路过的城市。记忆可以慢慢补。",
    ],
  },
  project: {
    label: "techrag-lab",
    lines: [
      "他在做中文技术知识的 AI 工程。我负责旁边趴着。",
      "数据、微调、RAG……听起来很忙。记得休息。",
    ],
  },
  status: {
    label: "生活正在发生",
    lines: ["上学、做项目，再留一点时间给自己。", "今天也可以只前进一点点。"],
  },
  posts: {
    label: "生活随笔",
    lines: [
      "文字还在路上。空白也可以是一个开始。",
      "等第一篇随笔来了，我想做第一个读者。",
    ],
  },
  article: {
    label: "陪你读一会儿",
    lines: [
      "这一段，慢慢读。我在旁边。",
      "看到喜欢的一句，可以停一下。",
      "读累了就歇会儿，文字不会跑掉。",
    ],
  },
  archives: {
    label: "时间的抽屉",
    lines: [
      "这里会把写过的日子，按时间收好。",
      "等日子多起来，回头看会很有意思。",
    ],
  },
  tags: {
    label: "一些线索",
    lines: [
      "顺着一个词，也许会遇到另一段日常。",
      "把零散的想法，轻轻放到一起。",
    ],
  },
  search: {
    label: "找一点什么",
    lines: ["想找什么？我陪你一起翻翻。", "有时换一个词，答案就近了一点。"],
  },
  lost: {
    label: "走错路也没关系",
    lines: ["这条路暂时没有东西。跟我回首页吧。"],
  },
  footer: {
    label: "小黑的小院",
    lines: [
      "你读到这里啦。我刚好散完一圈步。",
      "页面翻到底，今天还没有。去看看窗外吧。",
      "这里没有进度条。停一会儿，也很好。",
    ],
  },
};

export const cityWords: Record<string, string> = {
  武汉: "武汉，是现在生活和学习的地方。故事还在继续。",
  成都: "成都，曾经住过，也曾再去看看。熟悉的地方值得回望。",
  洛阳: "洛阳，旅行清单里的一站。等他来补上自己的故事。",
  合肥: "合肥，也留下了一点足迹。城市与人的故事，慢慢说。",
  安阳: "安阳，这次先留一个坐标。以后把回忆也放进来。",
};

const englishWords: typeof xiaoheiWords = {
  home: {
    label: "Between knowing and doing",
    lines: [
      "Meow. A little everyday life, and a few ideas growing slowly.",
      "There is no hurry. Today’s small moments are worth keeping too.",
      "You watch the words. I’ll watch over you.",
    ],
  },
  photos: {
    label: "Through My Lens",
    lines: [
      "When the light finds its way in, remember to take a photograph.",
      "The photographs are on their way. I’ll save a spot for the furry ones.",
      "Some moments stay with us without a single word.",
    ],
  },
  pets: {
    label: "Cats & dogs",
    lines: [
      "Any fellow cats here? My ears are already listening.",
      "When photographing cats, patience matters more than the shutter.",
      "I can be your model too. A pet first, though.",
    ],
  },
  portraits: {
    label: "Portraits · Encounters",
    lines: [
      "My favorite portraits catch someone feeling at ease.",
      "Keep a little of the person, and a little of the light.",
    ],
  },
  about: {
    label: "Meet w1nter",
    lines: [
      "He is studying, and slowly turning a few ideas into real things.",
      "attention is all my need. Mine is mostly here with you.",
    ],
  },
  travel: {
    label: "Places along the way",
    lines: [
      "A turn of the globe, and a story that has yet to begin.",
      "Wuhan, Chengdu, and places along the way. The memories can take their time.",
    ],
  },
  project: {
    label: "techrag-lab",
    lines: [
      "He is building an AI system for Chinese technical knowledge. I supervise by lying nearby.",
      "Data, fine-tuning, RAG… sounds busy. Remember to rest.",
    ],
  },
  status: {
    label: "Life, in progress",
    lines: [
      "Studying, building, and leaving a little time for yourself.",
      "A small step is enough for today.",
    ],
  },
  posts: {
    label: "Everyday notes",
    lines: [
      "The words are on their way. An empty page is a beginning too.",
      "When the first entry arrives, I would like to be its first reader.",
    ],
  },
  article: {
    label: "Reading with you",
    lines: [
      "Take this part slowly. I’ll be right here.",
      "A favorite sentence is a lovely place to pause.",
      "Rest if you need to. The words will wait.",
    ],
  },
  archives: {
    label: "A drawer of days",
    lines: [
      "A place to keep the days we write about, in order.",
      "There will be something lovely to look back on.",
    ],
  },
  tags: {
    label: "A few little clues",
    lines: [
      "Follow a word. You might find another little piece of life.",
      "Gathering a few scattered thoughts, gently.",
    ],
  },
  search: {
    label: "Looking for something",
    lines: [
      "What are you looking for? I’ll help you look around.",
      "Sometimes another word brings an answer a little closer.",
    ],
  },
  lost: {
    label: "A little detour",
    lines: ["Nothing on this path just yet. Shall we head home?"],
  },
  footer: {
    label: "Xiaohei’s little garden",
    lines: [
      "You made it here. I’ve just finished a little walk.",
      "The page ends here, but the day doesn’t. Take a look outside.",
      "No progress bar here. Staying a little is lovely too.",
    ],
  },
};
const englishCities: Record<string, string> = {
  Wuhan:
    "Wuhan is home for now, and where he studies. Its story is still unfolding.",
  Chengdu:
    "Chengdu was once home, and a place to return to. Familiar places are worth remembering.",
  Luoyang:
    "Luoyang is a stop on the travel map. Its own story will find its way here.",
  Hefei:
    "Hefei left a small mark on the map. City stories can take their time.",
  Anyang: "A coordinate for now, with memories to come. Hello, Anyang.",
};
export function getXiaoheiWords(locale: string) {
  return locale === "en" ? englishWords : xiaoheiWords;
}
export function getCityWords(locale: string) {
  return locale === "en" ? englishCities : cityWords;
}
