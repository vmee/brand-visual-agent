# 跨 Agent 兼容性

## 1. 兼容目标

目标平台为 Codex、Claude Code、Cursor、Gemini CLI、OpenCode。兼容的定义不是“能复制一个 Markdown 文件”，而是同时满足：

1. 当前版本能发现 Skill。
2. 能读取同一 `SKILL.md` 与引用资源。
3. 能在权限允许时执行 `brand-visual` CLI。
4. 输入、输出、错误和质量协议一致。
5. 安装、升级、卸载可追溯且不破坏用户文件。

## 2. 单源策略

唯一源：

```text
skills/brand-visual-designer/
├── SKILL.md
└── references/
```

安装器读取 `packages/installer` 中的 adapter registry，解析目标 Agent 当前版本的安装位置，然后复制该目录。安装副本包含源哈希、逐文件哈希、时间、Agent 和作用域。M1 未开放链接模式。

禁止：

- 在 `.claude/`、`.cursor/` 等目录手工维护不同的 `SKILL.md`。
- 在核心 Skill 中使用只能由某个 Agent 理解的必需私有命令。
- 因某平台缺少能力而偷偷降低品牌/质量要求。

## 3. 路径不是永久常量

Agent 产品会更新，项目级、用户级、工作区级和插件级安装方式也可能不同。M1 在 2026-10-18 依据各平台官方文档核查路径，并集中放入 adapter registry；每次升级目标 Agent 时必须重新核查。

安装器应使用类似以下注册表语义，而非把路径散落在业务代码中：

```yaml
agent: gemini-cli
detection:
  command: gemini skills list
installScopes:
  project:
    status: docs-verified
    pathTemplate: .gemini/skills/<name>
  user:
    status: docs-verified
    pathTemplate: ~/.gemini/skills/<name>
verifiedAgainst: 0.64.0
verifiedAt: 2026-10-18
officialSource: https://geminicli.com/docs/cli/using-agent-skills/
```

替代兼容目录（例如 `.agents/skills`）不是本安装器的默认目标，避免同一项目产生重复发现和优先级歧义。

## 4. 每个平台的核查清单

对每个 Agent 分别核查：

- 官方产品名、版本和安装方式。
- 是否支持开放 Agent Skills；如果支持，规范版本或兼容声明是什么。
- `SKILL.md` frontmatter 的必填/扩展字段。
- 项目级和用户级目录、目录查找优先级、冲突规则。
- 是否支持 references/scripts/assets 以及懒加载方式。
- 是否跟随符号链接；Windows/WSL/容器行为。
- 如何列出、刷新或触发 Skill。
- 是否能执行本地命令；默认审批和沙箱限制。
- 环境变量、工作目录、网络和文件权限如何传递。
- 如何自动化冒烟测试，怎样保存证据。

## 5. 当前证据与限制

核查日期：2026-10-18。所有路径来自当日官方文档；实际运行结果另见兼容矩阵和 `test-evidence/m1/compatibility/`。

官方核查入口：

- Agent Skills：<https://agentskills.io/specification>
- OpenAI Skills 与 Codex：<https://developers.openai.com/api/docs/guides/tools-skills>、<https://developers.openai.com/blog/eval-skills>
- Claude Code：<https://code.claude.com/docs/en/skills>
- Cursor：<https://cursor.com/help/customization/skills>
- Gemini CLI：<https://geminicli.com/docs/cli/using-agent-skills/>
- OpenCode：<https://opencode.ai/docs/skills>

结论：五个平台均由官方文档确认支持 `SKILL.md`。本机仅 Codex 完成了“发现、读取 reference、调用 Mock CLI、生成并校验 fixture”的完整运行验证；其余平台的实际执行限制明确记录为 blocked，不计为兼容通过。

## 6. 安装器行为

已实现命令：

```text
brand-visual skill status --agent <id> --scope project --json
brand-visual skill install --agent <id> --scope project --json
brand-visual skill update --agent <id> --scope project --json
brand-visual skill uninstall --agent <id> --scope project --json
```

安全规则：

- `status`/`--dry-run` 先检查并返回精确目标。
- 默认项目级，不根据当前目录盲目向上寻找系统范围路径。
- 记录安装清单：源哈希、目标文件、时间、Agent/安装器版本。
- 已存在且非本安装器拥有的目录不能覆盖。
- 更新和卸载要求目录文件集合与清单逐项哈希完全匹配；用户修改或添加过内容时拒绝操作。
- 支持 `--dry-run`；自动化模式的所有选择必须显式参数化。

## 7. 能力降级策略

| 情况                                 | 行为                                     |
| ------------------------------------ | ---------------------------------------- |
| Agent 支持 Skill + CLI               | 完整本地流程                             |
| Agent 支持 Skill，但不能执行命令     | 报告受限；V1 不伪装支持，未来用 MCP/REST |
| Agent 不支持标准 Skill，但能执行命令 | 可直接用 CLI，不计为“Skill 兼容通过”     |
| Agent 只能调用 MCP/HTTP              | V1 后适配，不复制 Core                   |
| Agent 无网络但可本地渲染             | 只支持 render/validate，生成请求明确失败 |

## 8. 版本协商

- Skill frontmatter/参考文档声明兼容的 CLI Major 版本。
- CLI 提供 `--version` 和机器可读 `capabilities`。
- Major 不兼容时停止并给出升级路径。
- Adapter registry 与 Skill 源独立版本化，但发布包固定二者组合。

## 9. M1 兼容矩阵

环境：macOS 27.0.1 / Darwin 27.0.0；日期：2026-10-18。`文档通过` 表示官方路径已核查，不等于本机运行通过。

| Agent       | 实测版本       | 项目路径            | 用户路径                    | 项目安装 | 发现/reference/CLI | 链接     | M1 状态                        |
| ----------- | -------------- | ------------------- | --------------------------- | -------- | ------------------ | -------- | ------------------------------ |
| Codex       | 0.163.0        | `.codex/skills`     | `~/.codex/skills`           | 通过     | 通过               | 未测     | supported                      |
| Claude Code | 2.1.302        | `.claude/skills`    | `~/.claude/skills`          | 通过     | 未登录，未执行     | 文档支持 | blocked/auth                   |
| Cursor      | 客户端不存在   | `.cursor/skills`    | `~/.cursor/skills`          | 通过     | 无客户端           | 未测     | blocked/client-unavailable     |
| Gemini CLI  | 0.64.0（临时） | `.gemini/skills`    | `~/.gemini/skills`          | 通过     | 信任后要求认证     | 未测     | blocked/auth                   |
| OpenCode    | 2.0.11         | `.opencode/skills`  | `~/.config/opencode/skills` | 通过     | Provider 404       | 未测     | blocked/provider-configuration |
| WorkBuddy   | 桌面端         | `.workbuddy/skills` | `~/.workbuddy/skills`       | 通过     | 规范兼容           | 未测     | supported/path-verified        |

这里的“项目安装通过”指同一源码经安装器复制后哈希一致。只有 Codex 被标记为 `supported`，因此 M1 出口条件“每个标记支持的平台均发现并调用 CLI”已满足；不能据此宣称五个平台全部兼容通过。
