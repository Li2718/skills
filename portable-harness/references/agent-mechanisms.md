# Agent 机制

## 默认项目结构

项目没有既有 skill 结构时，使用以下默认布局：

```text
<project>/
├── .ai/skills/<skill>/SKILL.md
├── .agents/skills/<skill>/SKILL.md
└── .claude/skills/<skill>/SKILL.md
```

- `.ai/skills/<skill>/` 保存唯一 canonical body，以及该 skill 实际需要的 references、scripts 或 assets。
- `.agents/skills/<skill>/SKILL.md` 是 Codex discovery adapter。
- `.claude/skills/<skill>/SKILL.md` 是 Claude discovery adapter。
- 两个 adapter 只保留各自 discovery 所需的 metadata，以及加载 `.ai/skills/<skill>/SKILL.md` 的指令。

项目已有明确结构时，沿用既有结构，但保持相同 ownership 边界。人工文档的位置和名称遵循项目自己的文档规范。

## 选择机制

对于 Codex 和 Claude：

1. 使用该 agent 当前的项目本地指令和 skill discovery 机制。
2. 优先使用原生 import 或 load 语义，不依赖文件系统链接。
3. 创建该机制允许的最小 adapter。
4. 确认 adapter 能够解析并加载完整 canonical body。

默认布局仍需用当前 Codex 和 Claude 版本验证。若某个 agent 的项目本地机制不再支持对应 adapter，先说明具体差异并与用户讨论，不静默改用复制正文或文件系统链接。

## Adapter 契约

adapter 可以包含：

- discovery 所需的 frontmatter 或 metadata；
- 加载 canonical skill 的简短工具原生指令；
- 无法避免的工具专属调用控制，并明确标注为工具专属。

adapter 不能成为第二份工作流正文。如果工具无法通过 thin adapter 加载 canonical body，记录该能力不受支持或未知，并与用户讨论项目专属取舍。

## 安装边界

可复用 skill package 与安装 adapter 保持独立。安装到目标项目时，生成或维护 Codex 和 Claude 的 discovery 入口。

用户全局安装可以辅助单个开发者，但不算项目本地 harness 能力。
