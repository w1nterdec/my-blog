# 部署与维护

当前采用本地 Markdown、同仓库图片、GitHub Actions 构建与 VPS 静态部署。后台、OAuth 和私有内容导出已移除。

完整流程统一维护在 [README](../README.md)：本地写作、图片规则、检查、Git 推送、旧内容迁移、服务器初始化、Actions Secrets、故障排查、回滚和备份。

VPS 配置位于 `infrastructure/nginx-vps.conf`；初始化运行 `setup-server.sh`，发布使用 `activate-release.sh`，回滚使用 `rollback-release.sh`。旧私有仓库的发布工作流需单独禁用，以免覆盖新版本。
