---
name: portable-harness
description: 审计、设计、迁移、维护和验证项目本地 AI 开发 harness，使其可由 Codex 和 Claude 在 Windows、macOS、Linux 上使用。适用于创建或修改共享 agent 指令、skill、discovery adapter、跨平台 harness 自动化、harness 检查的 CI 或 hook 集成，以及面向人的 AI 工具约定。
---

# Portable Harness

根据目标项目自身的约定构建 harness。保持可复用工作流只有一个 canonical body，可供 Codex 和 Claude 使用，并且不包含平台特化自动化。

## 必读参考资料

规划或修改 harness 前，阅读：

- [core-contract.md](references/core-contract.md)：ownership、canonical source、文档和自动化规则。
- [safety-boundaries.md](references/safety-boundaries.md)：运行命令或编辑文件前的边界。

进入对应阶段时，阅读：

- [audit-checklist.md](references/audit-checklist.md)：discovery 和审计。
- [agent-mechanisms.md](references/agent-mechanisms.md)：选择或验证 discovery adapter。
- [verification.md](references/verification.md)：定义支持范围、验证和交付结论。
- [cases.md](references/cases.md)：处理有歧义的迁移或 ownership 情况。

## 工作流

1. **发现**：了解项目结构、仓库规则、现有指令和 skill、自动化 runtime、包或构建系统、CI、测试、hook 和文档约定。
2. **审计**：检查 ownership、重复规则、canonical source、Codex 和 Claude discovery adapter、平台耦合和验证覆盖。
3. **规划**：明确文件改动、迁移处理、验证方式和重大取舍。
4. **讨论**：遇到重大取舍、项目能力缺失、破坏性迁移、ownership 不清晰，或需要改变既有项目约定时，由用户决定后继续。
5. **实施**：只实施已批准的范围，保留无关改动和用户的并发改动。
6. **验证**：检查结构、真实的 agent discovery 和 canonical body 加载，以及目标项目要求的验证入口。
7. **报告**：说明修改文件、验证命令及结果、剩余平台耦合和未解决风险。

## 执行规则

- 从项目中推导 CI 名称和关系，不强加固定的 CI 或 hook 模型。
- 根据证据确定项目结构和拓扑，不强加 runtime、服务、数据、容器或包管理模型。
- 共享工作流只保留一个 canonical body。每个工具的 adapter 仅包含原生 discovery metadata 和加载指令。
- 优先项目本地交付。只安装到用户环境不算项目 harness 支持。
- checker 是可选项。优先复用项目已有的等效验证；确需新增时，遵循项目的 runtime、命名和 CI 约定。
- 支持 Windows、macOS 和 Linux，不承诺具体发行版。
- 支持 Codex 和 Claude。除非用户明确扩展范围，否则其他 agent 不在范围内。
- harness 自动化不得包含 `.ps1`、`.bat`、`.cmd`、`.sh` 等平台特化入口。除非用户明确扩展任务，否则项目已有的平台特化产品脚本不在范围内。
- 通过静态平台耦合检查和项目已有的相关验证来确认可移植性，具体执行 [verification.md](references/verification.md)。
