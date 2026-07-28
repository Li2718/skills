# 审计清单

## 发现

- 从目标路径向上查找适用的仓库指令。
- 规划修改前检查仓库状态。
- 盘点共享和工具专属指令、skill、adapter、脚本、CI、测试、hook 和人工文档。
- 确认项目支持的自动化 runtime 和入口命名。
- 定位 Codex 和 Claude 的项目本地 discovery adapter。
- 识别仅限本地、自动生成、已忽略、敏感和工具管理的路径。

## 审计 ownership

- 找出每个共享工作流的 canonical body。
- 比较 adapter 及其 canonical target。
- 找出复制镜像、孤立 adapter、只存在于 adapter 的行为和失效加载路径。
- 检查项目指令是否重复 skill，或在工具没有要求时承担 discovery 路由。
- 检查面向人的约定是否位于项目文档系统中。
- 确认工具专属扩展已明确标注，并与可移植核心分离。

## 审计自动化

- 按 runtime 和平台支持情况检查新旧 harness 自动化。
- 查找 `.sh`、`.ps1`、batch、依赖 shell 的 quoting、硬编码路径分隔符、可执行位假设、symlink/junction 要求和 OS 专属进程控制。
- 区分 harness 自动化与范围外的产品或运维脚本。
- 提议新增 checker 前，先查找项目已有的等效检查。
- 检查 CI 和 hook，不预设名称、层级或 ownership。

## 审计验证

- 确认两个 adapter 都能加载完整 canonical body。
- 项目已有的相关验证，其影响处于任务范围内时直接运行。
- 记录无法执行的具体检查。

## 停止条件

出现以下情况时，实施前先讨论：

- canonical ownership 或迁移方向不明确；
- Codex 或 Claude 缺少可用的项目本地 discovery 机制；
- 修改会改变既有 CI、hook、构建或文档约定；
- 迁移具有破坏性或会覆盖用户内容；
- 验证需要执行范围外的破坏性、外部、凭据相关或生产操作；
- 项目 runtime 无法以跨平台方式表达所需自动化。
