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

安装器读取 adapter registry，解析目标 Agent 当前版本的安装位置，然后复制或在验证后链接该目录。安装副本包含源版本和内容哈希；CI 检查所有打包产物均来自唯一源。

禁止：

- 在 `.claude/`、`.cursor/` 等目录手工维护不同的 `SKILL.md`。
- 在核心 Skill 中使用只能由某个 Agent 理解的必需私有命令。
- 因某平台缺少能力而偷偷降低品牌/质量要求。

## 3. 路径不是永久常量

历史讨论曾给出诸如 `.agents/skills/`、`.claude/skills/` 等路径。它们只能作为调查候选，不是本项目的已确认常量。Agent 产品会更新，项目级、用户级、工作区级和插件级安装方式也可能不同。

安装器应使用类似以下注册表语义，而非把路径散落在业务代码中：

```yaml
agent: gemini-cli
detection:
  commands: []
installScopes:
  project:
    status: unverified
    pathTemplate: null
  user:
    status: unverified
    pathTemplate: null
verifiedAgainst: null
verifiedAt: null
officialSource: null
```

M1 实时核查后才填写真实值，并用版本范围和测试证据约束。

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

截至本初始化包生成时，可确认的方向性事实包括：开放 Agent Skills 使用 `SKILL.md` 作为入口；OpenAI 当前文档说明 Skills 与开放规范兼容；Google 的 Gemini CLI codelab 展示过项目内 `.agents/skills/<name>/SKILL.md`。这些信息只能作为 M1 调查起点，仍需针对实际安装版本核查。

官方核查入口：

- Agent Skills：<https://agentskills.io/specification>
- OpenAI Skills：<https://developers.openai.com/api/docs/guides/tools-skills>
- Gemini CLI codelab：<https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli>
- 其他平台：M1 必须从其当前官方文档入口重新定位，不能依赖本包写死的深层 URL。

本包未宣称已在任何平台完成真实安装测试。

## 6. 安装器行为

建议命令（仍待实现）：

```text
brand-visual skill status --agent <id>
brand-visual skill install --agent <id> --scope project
brand-visual skill update --agent <id> --scope project
brand-visual skill uninstall --agent <id> --scope project
```

安全规则：

- 先探测后写入，打印将要使用的精确目标。
- 默认项目级，不根据当前目录盲目向上寻找系统范围路径。
- 记录安装清单：源哈希、目标文件、时间、Agent/安装器版本。
- 已存在且非本安装器拥有的目录不能覆盖。
- 卸载只删除清单中、且当前哈希仍匹配的文件；用户修改过的内容保留并报告。
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

## 9. 兼容矩阵模板

| Agent       | 版本   | OS   | Skill 规范 | 项目路径 | 用户路径 | 发现 | CLI  | 链接 | 状态       | 证据日期 |
| ----------- | ------ | ---- | ---------- | -------- | -------- | ---- | ---- | ---- | ---------- | -------- |
| Codex       | 待核查 | 待测 | 待核查     | 待核查   | 待核查   | 未测 | 未测 | 未测 | unverified | —        |
| Claude Code | 待核查 | 待测 | 待核查     | 待核查   | 待核查   | 未测 | 未测 | 未测 | unverified | —        |
| Cursor      | 待核查 | 待测 | 待核查     | 待核查   | 待核查   | 未测 | 未测 | 未测 | unverified | —        |
| Gemini CLI  | 待核查 | 待测 | 待核查     | 待核查   | 待核查   | 未测 | 未测 | 未测 | unverified | —        |
| OpenCode    | 待核查 | 待测 | 待核查     | 待核查   | 待核查   | 未测 | 未测 | 未测 | unverified | —        |
