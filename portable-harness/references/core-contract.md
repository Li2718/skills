# 核心契约

## 先推导，再设计

提出布局前，记录目标仓库中的事实：

- 项目和仓库结构；
- 现有指令、skill 和文档的 ownership；
- 自动化 runtime 和支持的脚本入口；
- CI、测试、构建、hook、发布和部署约定；
- 项目已经使用的 Codex 和 Claude discovery 位置。

harness 支持 Codex 和 Claude 在 Windows、macOS 和 Linux 上运行。仅当工作流 ownership 不清晰，或请求范围会改变既有项目约定时，才询问用户。

## 分离职责

使用以下 ownership 边界：

| 事项 | Owner |
| --- | --- |
| 可复用的 agent 工作流 | 一个 canonical skill body |
| 工具 discovery | 该工具的最小原生 adapter |
| 始终适用的项目事实 | 共享项目指令文件 |
| 工具专属指令 | 该工具的原生指令或 import 层 |
| 人工维护的约定 | 项目已有的文档系统 |
| 机械化约束 | 现有 checker，或确有必要时新增项目原生 checker |

除非目标工具明确要求，否则不要让项目指令文件承担 skill discovery。不要把 skill 规则复制到项目指令中。

项目没有既有指令约定时，使用以下默认职责：

- `AGENTS.md` 只保存始终适用的项目事实和规则，不引用 skill，也不重复 skill 规则。
- `CLAUDE.md` 只导入 `AGENTS.md`，不重复其中内容。
- 面向人的维护说明放入项目已有的文档系统，目录和文件名遵循项目规范。

## 保持唯一 canonical body

工作流语义只存储一次。adapter 只能重复原生 discovery 所需的 metadata，以及加载 canonical body 所需的指令。

除非项目明确拥有另一套契约，否则以下情况属于 canonical source 违规：

- 复制或生成工作流正文镜像；
- adapter 中包含额外行为规则；
- adapter 没有对应的 canonical target；
- 默认依赖 symlink 或 junction 完成 discovery。

无法跨工具表达的高级行为可以保留为工具专属能力。明确标注其范围，并放在共享核心之外。

## 适配项目

- 遵循项目的 CI 入口和依赖关系，不规定 CI 层级或名称。
- 新增可执行自动化时，遵循项目的 runtime 和命名约定。
- 使用可在 Windows、macOS 和 Linux 上工作的 runtime 和 API。不要新增 `.ps1`、`.bat`、`.cmd` 或 `.sh` harness 入口。
- 不假设特定的项目拓扑、runtime、服务、数据、容器或 worktree 模型。
- 除非用户明确纳入，否则项目现有的平台特化产品自动化不属于 harness 迁移范围。

## 保持验证可维护

项目已有验证能够覆盖契约时，无需新增 checker。确需 checker 时：

- 使用项目支持的跨平台 runtime；
- 接受显式的仓库根目录或 fixture 根目录；
- 只在隔离的临时 fixture 中运行负向测试；
- 按项目 CI 约定集成；
- 将契约和规则到测试的覆盖关系保存在项目已有文档、canonical 维护章节、测试或配置中。

不要求固定的 checker 文件名或文档路径。
