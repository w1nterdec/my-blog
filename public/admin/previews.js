/* Editor-only previews. Draft text stays inside the authenticated CMS iframe. */
(function () {
  const h = window.h;
  const dataOf = entry => entry.get("data")?.toJS() ?? {};
  const list = value => (Array.isArray(value) ? value : []);
  const text = value => (typeof value === "string" ? value : "");
  const date = value => {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime())
      ? new Intl.DateTimeFormat("zh-CN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Shanghai",
        }).format(parsed)
      : "待填写时间";
  };
  const badge = (item, index) => {
    const scheduled =
      item.pubDatetime && Date.parse(item.pubDatetime) > Date.now();
    return h(
      "span",
      { className: "preview-badge", key: index },
      item.draft ? "暂不公开" : scheduled ? "排期待发布" : "发布后展示"
    );
  };
  const image = (path, alt, getAsset, entry, className) => {
    if (!path) return null;
    try {
      const uploaded = entry
        .get("mediaFiles")
        ?.find(asset => `/${asset.get("path")}` === path);
      const mediaPath = path.replace(/^\/media\//, "");
      const directory = mediaPath.includes("/")
        ? mediaPath.slice(0, mediaPath.lastIndexOf("/"))
        : "";
      const field = entry
        .get("data")
        .clear()
        .set("media_folder", `/media${directory ? `/${directory}` : ""}`);
      const source = path.startsWith("/media/")
        ? uploaded?.get("url") || String(getAsset(mediaPath, field))
        : path.startsWith("/") ||
            path.startsWith("https://") ||
            path.startsWith("blob:")
          ? path
          : `/${path}`;
      return h("img", { src: source, alt: alt || "展示图片", className });
    } catch {
      return h(
        "p",
        { className: "preview-help" },
        "图片正在载入，或尚未选择。"
      );
    }
  };
  const section = (title, children) =>
    h(
      "section",
      { className: "preview-section" },
      h("h2", null, title),
      children
    );
  function PostPreview({ entry, getAsset, widgetFor }) {
    const data = dataOf(entry);
    return h(
      "article",
      { className: "post-preview" },
      h("p", { className: "preview-eyebrow" }, "知行 · 随笔预览"),
      h(
        "div",
        { className: "preview-badges" },
        badge(data),
        data.featured &&
          h("span", { className: "preview-badge" }, "置顶 / 精选")
      ),
      h("h1", null, text(data.title) || "给这一篇，起个名字"),
      h(
        "p",
        { className: "preview-description" },
        text(data.description) || "摘要会出现在文章列表里。"
      ),
      h(
        "p",
        { className: "preview-help" },
        date(data.pubDatetime),
        " · ",
        text(data.author) || "w1nter"
      ),
      h(
        "div",
        { className: "preview-tags" },
        list(data.tags).map((tag, index) =>
          h("span", { key: index }, `# ${tag}`)
        )
      ),
      image(data.ogImage, data.title, getAsset, entry, "preview-cover"),
      h("div", { className: "preview-body" }, widgetFor("body")),
      h(
        "p",
        { className: "preview-help" },
        "这是编辑预览；保存草稿与发布是两个独立步骤。"
      )
    );
  }
  function JournalPreview({ entry, getAsset }) {
    const data = dataOf(entry);
    const personal = data.personal ?? {};
    return h(
      "div",
      { className: "journal-preview" },
      h("p", { className: "preview-eyebrow" }, "知行 · 生活与站点预览"),
      h(
        "header",
        { className: "preview-profile" },
        image(
          personal.avatar,
          personal.name,
          getAsset,
          entry,
          "preview-avatar"
        ),
        h(
          "div",
          null,
          h("h1", null, text(personal.name) || "w1nter"),
          h("p", null, text(personal.signature)),
          h("p", { className: "preview-help" }, text(personal.location))
        )
      ),
      section(
        "此刻",
        h("p", null, text(personal.status) || "近期状态，慢慢补上。")
      ),
      section(
        "正在做的项目",
        h(
          "div",
          { className: "preview-card" },
          h("h3", null, text(personal.project?.name)),
          h("p", null, text(personal.project?.description))
        )
      ),
      section(
        "映 · 摄影",
        list(data.photos).length
          ? h(
              "div",
              { className: "preview-grid" },
              list(data.photos).map((photo, index) =>
                h(
                  "article",
                  { className: "preview-card", key: index },
                  image(photo.src, photo.alt || photo.title, getAsset, entry),
                  badge(photo),
                  h("h3", null, text(photo.title)),
                  h(
                    "p",
                    { className: "preview-help" },
                    [photo.category, photo.date, photo.location, photo.camera]
                      .filter(Boolean)
                      .join(" · ")
                  ),
                  h("p", null, text(photo.story))
                )
              )
            )
          : h(
              "p",
              { className: "preview-help" },
              "还没有作品。上传精选展示图后会出现在这里。"
            )
      ),
      section(
        "聆 · 音乐",
        h(
          "div",
          { className: "preview-grid" },
          list(data.music).map((record, index) =>
            h(
              "article",
              { className: "preview-card", key: index },
              image(
                record.cover,
                record.title || record.artist,
                getAsset,
                entry
              ),
              badge(record),
              h("h3", null, text(record.title) || text(record.artist)),
              h("p", { className: "preview-help" }, text(record.artist)),
              h("p", null, text(record.thought)),
              record.lyricSong &&
                h("p", { className: "preview-help" }, text(record.lyricSong)),
              list(record.lyrics).length
                ? h(
                    "blockquote",
                    { className: "preview-lyrics" },
                    list(record.lyrics).map((line, lineIndex) =>
                      h("p", { key: lineIndex }, line)
                    )
                  )
                : h("p", { className: "preview-help" }, "歌词摘句待填写。")
            )
          )
        )
      ),
      section(
        "碎碎念与孤岛",
        list(data.notes).map((note, index) =>
          h(
            "article",
            { className: "preview-card", key: index },
            badge(note),
            h(
              "p",
              { className: "preview-help" },
              date(note.pubDatetime),
              note.island ? " · 孤岛（公开彩蛋）" : " · 日常"
            ),
            h("p", { className: "preview-note" }, text(note.body))
          )
        )
      ),
      section(
        "城市故事",
        list(data.places).map((place, index) =>
          h(
            "article",
            { className: "preview-card", key: index },
            h("h3", null, text(place.name)),
            h("p", null, text(place.description))
          )
        )
      ),
      section(
        "游 · 游戏",
        list(data.games).map((game, index) =>
          h(
            "article",
            { className: "preview-card", key: index },
            badge(game),
            h("h3", null, text(game.title)),
            h(
              "p",
              { className: "preview-help" },
              [
                game.platform,
                game.status,
                game.score == null ? null : `${game.score} / 10`,
              ]
                .filter(Boolean)
                .join(" · ")
            ),
            h("p", null, text(game.thought))
          )
        )
      ),
      h(
        "p",
        { className: "preview-help" },
        "预览包含你正在编辑的私有条目；发布器会排除暂不公开和未到发布时间的内容。"
      )
    );
  }
  CMS.registerPreviewTemplate("posts", PostPreview);
  CMS.registerPreviewTemplate("journal", JournalPreview);
})();
