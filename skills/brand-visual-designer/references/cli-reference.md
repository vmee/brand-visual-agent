# CLI 契约

M1 已实现 Mock 模式下的 `doctor`、`capabilities`、`generate` 和 `validate`。`render` 与 `revise` 仍是 M3 计划接口；真实 Provider 从 M2 开始接入。

```text
brand-visual doctor --json
brand-visual capabilities --json
brand-visual generate --spec <path> --json
brand-visual validate --task <path> --json
```

计划接口：

```text
brand-visual render --spec <path> --json
brand-visual revise --spec <path> --patch <path> --json
```

规则：

- 标准输出必须是单个可解析 JSON 结果；人类诊断写到标准错误。
- `ok: true` 只表示命令成功完成，不等于所有人工审核通过。
- 命令失败时退出码非零，返回稳定 `error.code`。
- 最终结果必须包含 task ID、状态、产物相对路径和 quality report 路径。
- 不要解析非结构化日志来判断成功。
- 模型 ID和 Provider 私有参数来自配置/能力快照，不应由 Agent 任意拼接。
- `provider.mock: true` 的产物只用于协议与安装测试，不得作为真实视觉作品交付。
