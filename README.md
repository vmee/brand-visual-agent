# Brand Visual Agent / `brand-visual-designer`

这是 Brand Visual Designer V1 的跨 Agent 企业品牌 AI 视觉设计仓库。M1 已完成：具备单源 `SKILL.md`、正式 JSON Schema、统一 TypeScript CLI、离线 Mock Provider、五平台安装适配器、CI 与验收证据；真实图片 Provider 与确定性 Renderer 尚未接入。

## 项目目标

用一份遵循 Agent Skills 开放规范的 `SKILL.md`，指导 Codex、Claude Code、Cursor、Gemini CLI、OpenCode 等 Agent 调用同一个 TypeScript CLI。CLI 再调用独立 Core、图片 Provider 和本地排版引擎，输出符合品牌规范、文字准确、可追溯和可修改的视觉作品。

V1 的首个远程图片 Provider 是 OpenAI Images API；准确中文、原始 Logo 和需要保护的人物/商品图由 Sharp 与 HTML/CSS + Playwright 做确定性合成。未来可在不重写 Core 的前提下增加 MCP Server 和 REST API。

## M1 本地使用

```bash
pnpm install
pnpm build
pnpm exec brand-visual doctor --json
pnpm exec brand-visual capabilities --json
pnpm exec brand-visual generate --spec tests/fixtures/m1/design-spec.json --json
pnpm exec brand-visual validate --task outputs/m1-mock-task --json
pnpm exec brand-visual skill install --agent codex --scope project --dry-run --json
pnpm test
```

Mock Provider 产物会明确返回 `provider.mock: true` 和 `needs_review`，只用于验证协议，不是视觉交付物。真实 API 测试必须等 M2 完成能力核查后显式启用。

## 文件导航

| 文件                                    | 用途                                 |
| --------------------------------------- | ------------------------------------ |
| `AGENTS.md`                             | 仓库级 Agent 工作约束与文档路由      |
| `docs/PROJECT_CONTEXT.md`               | 背景、目标、已决策与待决定事项       |
| `docs/PRD.md`                           | V1 产品范围、用户故事和成功指标      |
| `docs/ARCHITECTURE.md`                  | 分层架构、模块边界、数据流和错误语义 |
| `docs/TECH_DECISIONS.md`                | 已确认技术决策与决策记录规则         |
| `docs/ROADMAP.md`                       | M1–M4 可执行任务、出口条件和依赖     |
| `docs/DESIGN_SPEC.md`                   | 稳定输入协议、图层模型、产物协议     |
| `docs/ACCEPTANCE_TESTS.md`              | 自动化、跨 Agent 和人工验收清单      |
| `docs/CROSS_AGENT_COMPATIBILITY.md`     | 单源 Skill 安装策略与实时核查门禁    |
| `skills/brand-visual-designer/SKILL.md` | 可移植 Skill 的唯一源文件骨架        |
| `config/provider.example.yaml`          | 不锁定模型 ID 的 Provider 示例       |
| `brands/example/brand.yaml`             | 虚构品牌配置示例                     |
| `examples/design-spec.example.json`     | DesignSpec 示例输入                  |
| `.env.example`                          | 空白环境变量模板；不含真实密钥       |

## 仓库结构

```text
brand-visual-agent/
├── AGENTS.md
├── README.md
├── skills/brand-visual-designer/     # 单一源码
├── packages/
│   ├── cli/
│   ├── core/
│   ├── installer/
│   ├── providers/mock/
│   └── schemas/
├── apps/
│   ├── mcp-server/                   # V1 后
│   └── rest-api/                     # V1 后
├── brands/
├── config/
├── examples/
├── tests/
└── docs/
```

## 当前状态

状态：`M1-complete / supported: codex / blocked: claude-code,cursor,gemini-cli,opencode`。

当前已验证 Schema、Mock CLI、失败退出码、路径边界、产物哈希、Skill 静态格式和安全安装生命周期。五个平台都完成了官方路径核查和项目级复制安装；Codex 完成真实发现/reference/Mock CLI fixture 全流程。Claude Code 缺少登录、Cursor 客户端不存在、Gemini CLI 缺少认证、OpenCode Provider 配置返回 404，均按路线图明确为 blocked，未宣称兼容通过。OpenAI API、任何图片模型 ID 和真实视觉输出仍属 M2+，状态为 `unverified`。
