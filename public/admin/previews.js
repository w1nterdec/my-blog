/* Previews stay inside the authenticated editor. */
(function () {
  const h = window.h;
  const dataOf = entry => entry.get("data")?.toJS() ?? {};
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
      return h("img", { src: source, alt: alt || "图片预览", className });
    } catch {
      return h("p", { className: "preview-help" }, "图片正在载入。");
    }
  };
  function PostPreview({ entry, getAsset, widgetFor }) {
    const data = dataOf(entry);
    const scheduled =
      data.pubDatetime && Date.parse(data.pubDatetime) > Date.now();
    return h(
      "article",
      { className: "post-preview" },
      h("p", { className: "preview-eyebrow" }, "w1nter · 文章预览"),
      h(
        "span",
        { className: "preview-badge" },
        data.draft ? "暂不公开" : scheduled ? "排期待发布" : "发布后展示"
      ),
      data.featured && h("span", { className: "preview-badge" }, "精选"),
      h("h1", null, text(data.title) || "文章标题"),
      h("p", { className: "preview-description" }, text(data.description)),
      h(
        "p",
        { className: "preview-help" },
        date(data.pubDatetime),
        " · ",
        text(data.author) || "w1nter"
      ),
      h(
        "p",
        { className: "preview-tags" },
        (Array.isArray(data.tags) ? data.tags : [])
          .map(tag => `#${tag}`)
          .join("  ")
      ),
      image(data.ogImage, data.title, getAsset, entry, "preview-cover"),
      h("div", { className: "preview-body" }, widgetFor("body")),
      h(
        "p",
        { className: "preview-help" },
        "保存草稿后，点击发布才会更新网站。"
      )
    );
  }
  function JournalPreview({ entry, getAsset }) {
    const data = dataOf(entry);
    const personal = data.personal ?? {};
    const places = Array.isArray(data.places) ? data.places : [];
    return h(
      "article",
      null,
      h("p", { className: "preview-eyebrow" }, "w1nter · 个人资料与旅行足迹"),
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
          h("h1", null, text(personal.name)),
          h("p", null, text(personal.signature))
        )
      ),

      places.length > 0 &&
        h(
          "section",
          { className: "preview-section" },
          h("h2", null, "旅行足迹"),
          ...places.map((place, index) =>
            h(
              "div",
              { className: "preview-place", key: index },
              h("h3", null, text(place.name)),
              h(
                "p",
                { className: "preview-help" },
                [place.residence, place.visited ? "旅行" : ""]
                  .filter(Boolean)
                  .join(" · ")
              ),
              h("p", null, text(place.description))
            )
          )
        )
    );
  }
  CMS.registerPreviewTemplate("posts", PostPreview);
  CMS.registerPreviewTemplate("projects", ({ entry, widgetFor }) => {
    const data = dataOf(entry);
    return h(
      "article",
      { className: "post-preview" },
      h("p", { className: "preview-eyebrow" }, "w1nter · 项目文档预览"),
      h("h1", null, text(data.title) || "项目标题"),
      h("p", { className: "preview-description" }, text(data.description)),
      h("div", { className: "preview-body" }, widgetFor("body"))
    );
  });
  CMS.registerPreviewTemplate("journal", JournalPreview);
})();
