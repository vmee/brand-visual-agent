# 技术决策记录

## 状态定义

- `Accepted`：本轮已确认，实施默认遵守。
- `Proposed`：方向合理，但需在里程碑内验证后接受。
- `Open`：尚未决定。
- `Superseded`：已被后续 ADR 替代。

## 已确认决策

### ADR-001：使用 Agent Skills 开放规范

- 状态：Accepted
- 决策：用包含 frontmatter 的 `SKILL.md` 表达可移植工作流，并按需放置 references/scripts/assets。
- 原因：降低单一 Agent 绑定，并利用渐进式加载。
- 约束：实施前必须核查规范当前版本；若平台扩展字段不同，只能由安装适配层生成平台元数据，不能分叉核心流程。

### ADR-002：单源 Skill，多平台部署

- 状态：Accepted
- 决策：`skills/brand-visual-designer/` 是唯一源码。目标目录中的副本/链接是派生产物。
- 原因：防止五份文档漂移。
- 影响：需要安装器、源哈希和兼容性测试。

### ADR-003：统一 TypeScript CLI

- 状态：Accepted
- 决策：所有 Agent 通过 `brand-visual` CLI 使用稳定 JSON 协议；CLI 也可独立调用。
- 原因：把 Agent 的自然语言能力与可靠执行分开。
- 影响：标准输出、标准错误、退出码、版本协商必须可测试。

### ADR-004：Core 采用端口/适配器边界

- 状态：Accepted
- 决策：Core 通过接口依赖 Provider、Renderer、Storage；具体实现由组合根注入。
- 原因：支持 Mock、未来其他 Provider、MCP 和 REST。

### ADR-005：OpenAI Images API 是 V1 首个真实 Provider

- 状态：Accepted
- 决策：优先实现 OpenAI 适配器，但不在 Skill/Core 硬编码模型。
- 注意：此决策不等于确认任何具体模型 ID、参数或账号权限。

### ADR-006：生成与排版分离

- 状态：Accepted
- 决策：生成模型负责底图、纹理、氛围和受控编辑；Sharp + HTML/CSS + Playwright 负责最终画布、准确文字、Logo 和受保护资产。
- 原因：提高准确性、可修订性和追溯性。

### ADR-007：YAML 品牌配置，JSON 任务协议

- 状态：Accepted
- 决策：人维护的品牌档案使用 YAML；机器交换的 DesignSpec、manifest 和报告使用版本化 JSON Schema。
- 影响：禁止只有 TypeScript 类型而没有运行时校验。

### ADR-008：MCP/REST 延后到 V1 之后

- 状态：Accepted
- 决策：M1–M4 以本地 Skill + CLI 为主；为 MCP/REST 保留 Application Service 边界，不提前实现。

### ADR-009：配置注入模型 ID并启动时验证

- 状态：Accepted
- 决策：模型 ID来自环境或配置，启动时与能力探测结果对照；示例不提供看似权威的默认模型 ID。
- 原因：模型目录、权限与 API 能力会变化；历史讨论里的候选模型名不能作为事实。

### ADR-010：默认复制安装，开发模式可链接

- 状态：Proposed
- 决策：项目级安装默认复制经过打包的 Skill；仅在目标 OS/Agent 已验证时允许符号链接。
- 验证：M1 在 macOS、Windows/WSL、Linux 的可用环境上记录结果。

### ADR-011：M1 TypeScript 工程与 Schema 工具链

- 日期：2026-10-18
- 状态：Accepted
- 背景：M1 需要在不接入真实图片 API 的前提下建立可执行 CLI、运行时协议校验和离线测试。
- 决策：采用 Node.js 24 LTS 作为首要开发/CI 运行时，使用 pnpm workspace；TypeScript 使用严格模式；JSON Schema 2020-12 是结构化协议源，Ajv 负责运行时校验，`json-schema-to-typescript` 生成 TypeScript 类型；Vitest 负责单元与 CLI 集成测试。M1 不引入额外 Monorepo 编排器。
- 替代方案：npm workspace、Turborepo、从 TypeScript 类型反向生成 Schema、Zod-first。
- 影响：协议先于实现并可跨语言消费；生成类型不得手改。Node/依赖版本写入 manifest 与锁文件，升级时重新核查支持矩阵。
- 证据：`test-evidence/m1/specification/2026-10-18-baseline.md`。

## 可变项登记表

任何实现 PR 涉及下列事项时，必须记录 `verified_at`、官方来源、工具版本、账号/地区条件和实际探测结果：

| 可变项           | 不允许的做法       | 接受标准                             |
| ---------------- | ------------------ | ------------------------------------ |
| 图片模型 ID      | 从旧对话直接复制   | 官方模型列表 + 目标账号实际请求      |
| API 端点与参数   | 依赖非官方博客     | 官方 API 文档 + 合同测试             |
| 图片尺寸/格式    | 假设固定枚举       | capability snapshot + 负向测试       |
| Agent Skill 路径 | 把路径永久写死     | 当前官方文档 + 指定版本安装测试      |
| frontmatter 字段 | 只凭示例猜测       | 当前 Agent Skills specification 校验 |
| Node/库版本      | 使用“最新”浮动版本 | 兼容矩阵、锁文件、CI 通过            |

可作为核查入口、但不能替代实际验证的官方来源：

- Agent Skills specification：<https://agentskills.io/specification>
- OpenAI Skills 指南：<https://developers.openai.com/api/docs/guides/tools-skills>
- OpenAI 模型与 Images API 文档：<https://developers.openai.com/api/docs/models>、<https://platform.openai.com/docs/api-reference/images>
- Google Gemini CLI Agent Skills codelab（需再与当前产品文档交叉验证）：<https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli>

## 待决定事项

| ID   | 事项                                                   | 最晚决策点     | 需要证据                     |
| ---- | ------------------------------------------------------ | -------------- | ---------------------------- |
| O-01 | Node.js、包管理器、Monorepo 工具版本（ADR-011 已关闭） | M1 开始        | 目标 OS、依赖兼容、维护策略  |
| O-02 | JSON Schema 方言与验证库（ADR-011 已关闭）             | M1             | 类型生成、错误质量、性能     |
| O-03 | CLI npm 包名与分发方式                                 | M1             | 名称可用性、安装体验         |
| O-04 | 五个 Agent 的实际安装路径                              | M1             | 官方文档和逐平台测试         |
| O-05 | OpenAI SDK/REST 选择与模型 ID                          | M2             | 当前文档、账号 probe、能力表 |
| O-06 | 字体包和许可策略                                       | M3             | 商业授权、CJK 覆盖、包体积   |
| O-07 | 色彩空间和输出 metadata                                | M3             | 目标平台、视觉测试           |
| O-08 | 自动视觉评分是否进入发布门禁                           | M4             | 与人工评分的相关性           |
| O-09 | API 成本/超时/重试上限                                 | M2             | 真实基准和预算               |
| O-10 | 数据保留、遥测与隐私策略                               | 首个外部试用前 | 法务/安全要求                |

## ADR 新增模板

```markdown
### ADR-NNN：标题

- 日期：YYYY-MM-DD
- 状态：Proposed | Accepted | Superseded
- 背景：为什么现在需要决定？
- 决策：选择了什么？
- 替代方案：考虑过什么？
- 影响：成本、风险、兼容性和迁移路径。
- 证据：官方来源、实验和测试记录。
```
