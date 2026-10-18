/* The CMS itself maintains local recovery backups. Saving a draft commits it to
   a private editorial branch; only Publish merges it into the content main. */
/* Reuse the Markdown editor while allowing local README/Markdown imports. */
(function () {
  const h = window.h;
  const markdown = CMS.getWidget("markdown");
  const MarkdownFileControl = window.createClass({
    getInitialState() {
      return { message: "", editorKey: 0 };
    },
    async importFile(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      if (!/\.(md|markdown)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
        this.setState({
          message: "请选择不超过 5MB 的 .md 或 .markdown 文件。",
        });
        input.value = "";
        return;
      }
      try {
        const source = (await file.text()).replace(/^\uFEFF/, "");
        const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
        this.props.onChange(body);
        this.setState(state => ({
          message: `已导入 ${file.name}。文件中的 YAML 信息不写入正文，请核对上方标题和摘要。`,
          editorKey: state.editorKey + 1,
        }));
      } catch {
        this.setState({
          message: "文件读取失败，请重新选择或直接粘贴 Markdown。",
        });
      }
      input.value = "";
    },
    render() {
      return h(
        "div",
        null,
        h(
          "label",
          { className: "markdown-import" },
          "导入 README / Markdown",
          h("input", {
            type: "file",
            accept: ".md,.markdown,text/markdown,text/plain",
            onChange: this.importFile,
            "aria-label": "导入项目 Markdown 文件",
          })
        ),
        h(
          "p",
          { role: "status", className: "markdown-import-status" },
          this.state.message
        ),
        h(markdown.control, { ...this.props, key: this.state.editorKey })
      );
    },
  });
  CMS.registerWidget("markdown-file", MarkdownFileControl, markdown.preview);
})();
CMS.init();
CMS.registerPreviewStyle("/admin/preview.css");
CMS.registerEventListener({
  name: "postSave",
  handler: () => {
    document.querySelector(".admin-guide span").textContent =
      "已保存到私有仓库。发布后请等待构建成功。";
  },
});
