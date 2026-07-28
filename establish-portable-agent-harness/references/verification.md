# 验证

支持范围固定为：

- 操作系统：Windows、macOS、Linux；
- agent：Codex、Claude。

不要创建 OS 版本、发行版或 OS × agent 验证矩阵。

## 验证契约

1. **Canonical workflow：**共享行为只有一个 canonical body，adapter 不包含重复的工作流规则。
2. **Agent discovery：**Codex 和 Claude 的项目本地 adapter 使用各自的原生 discovery 机制，并加载完整 canonical body。
3. **平台中立性：**harness 自动化不包含 `.ps1`、`.bat`、`.cmd`、`.sh` 入口，也不包含依赖 shell 的 quoting、硬编码路径分隔符、可执行位假设、链接要求或 OS 专属进程控制。
4. **项目验证：**运行项目已有的相关检查、测试、构建或 hook，其影响必须处于已批准的任务范围内。

Agent discovery 与操作系统可移植性分开检查。不要在每个操作系统上重复每个 agent 检查。

## 报告

报告以下内容：

- Codex 和 Claude adapter 是否能够 discovery 并加载 canonical workflow；
- 剩余的平台特化 harness 文件或假设；
- 相关项目验证命令及结果；
- 无法检查的具体项目。
