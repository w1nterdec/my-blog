/* The CMS itself maintains local recovery backups. Saving a draft commits it to
   a private editorial branch; only Publish merges it into the content main. */
CMS.init();
CMS.registerPreviewStyle("/admin/preview.css");
CMS.registerEventListener({
  name: "postSave",
  handler: () => {
    document.querySelector(".admin-guide span").textContent =
      "已保存到私有仓库。发布后请等待构建成功。";
  },
});
