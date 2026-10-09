import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://chenzhixing.bbroot.com/",
    title: "知行博客",
    description: "记录生活中的片刻，分享日常的感受与思考。",
    author: "w1nter",
    profile: "https://chenzhixing.bbroot.com/about/",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/w1nterdec",
      linkTitle: "w1nter 的 GitHub",
    },
    {
      name: "x",
      url: "https://x.com/chencz08",
      linkTitle: "w1nter 的 X：@chencz08",
    },
    {
      name: "mail",
      url: "mailto:zhixing0810cz@gmail.com",
      linkTitle: "给 w1nter 发邮件",
    },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    {
      name: "mail",
      url: "mailto:?subject=%E5%88%86%E4%BA%AB%E4%B8%80%E7%AF%87%E6%96%87%E7%AB%A0&body=",
    },
  ],
});
