# Brand Visual Agent 仓库说明

本仓库目标是开发 `brand-visual-designer`：一个遵循 Agent Skills 开放规范、可由多个 Agent 复用的企业品牌 AI 视觉设计 Skill。仓库中的 Skill、CLI、Core、Provider 和 Renderer 必须保持边界清晰。

## 按任务读取文档

- 改产品范围或用户流程：读 `docs/PROJECT_CONTEXT.md`、`docs/PRD.md`。
- 改模块边界、数据流或接口：读 `docs/ARCHITECTURE.md`、`docs/TECH_DECISIONS.md`。
- 改结构化输入输出：读 `docs/DESIGN_SPEC.md`。
- 改安装器或 Agent 适配：读 `docs/CROSS_AGENT_COMPATIBILITY.md`。
- 开始或结束里程碑：读 `docs/ROADMAP.md`、`docs/ACCEPTANCE_TESTS.md`。

不要要求每个小任务无条件读取全部文档；只读取与变更有关的来源。

## 不可破坏的架构约束

1. `skills/brand-visual-designer/SKILL.md` 是唯一维护的 Skill 源文件；各 Agent 的安装副本是构建产物，不得手工分叉。
2. Skill 只描述工作流和工具契约，不直接包含 OpenAI API 调用逻辑，也不依赖任何单一 Agent 的私有工具。
3. 所有 Agent 调用统一 TypeScript CLI；Core 不应知道调用方是哪个 Agent。
4. 图片 Provider 必须通过适配器接口接入。V1 首个 Provider 是 OpenAI Images API，但 Core 不得硬编码具体模型 ID。
5. 准确中文、Logo、合规标识和要求保真的原始素材必须优先使用确定性图层合成；不得依赖生成模型正确“画出”文字或重绘 Logo。
6. API 密钥只能从运行环境或秘密管理设施读取；示例文件中只能保留空值或变量名。
7. 所有失败必须显式返回失败；禁止用占位图片或不存在的文件路径假装任务成功。
8. MCP Server 和 REST API 属于 V1 后扩展，除非路线图经确认更新，否则不得让 M1–M4 依赖它们。

## 可变项核查门禁

以下内容会随产品版本、账号权限、地区或 SDK 变化，实施前必须查阅对应官方文档并把核查日期、来源、结论记录到变更说明或测试证据中：

- OpenAI 可用图片模型的具体 ID、端点、参数、尺寸、格式、编辑/遮罩/透明背景能力、费用和限流。
- Codex、Claude Code、Cursor、Gemini CLI、OpenCode 的 Skill 安装路径、发现规则、作用域、符号链接支持和命令权限。
- Agent Skills 规范的必填 frontmatter、命名限制和资源加载规则。
- Node.js、TypeScript、Sharp、Playwright 以及相关 SDK 的受支持版本。

不得把旧对话、博客、搜索摘要或示例模型名当成当前官方能力。模型名如未通过目标账号的实际 API 探测验证，状态必须为 `unverified`。

## 实施顺序

按 `docs/ROADMAP.md` 的 M1 → M2 → M3 → M4 顺序推进。M1 必须先以 Mock Provider 证明五个目标 Agent 能发现同一 Skill、调用同一 CLI 并获得相同协议的输出，再接入真实图片 Provider。

## 工程与测试约束

- 语言：TypeScript；结构化契约使用 JSON Schema，并生成或校验 TypeScript 类型。
- CLI 标准输出仅输出机器可读结果；诊断日志写入标准错误；非零退出码表示失败。
- 所有文件路径在进入 Core 前规范化并校验；不得越过允许的工作目录读取资产。
- 外部 API 测试默认使用 Mock；真实 API 端到端测试必须显式启用并设置成本上限。
- 图像回归优先检查尺寸、格式、图层边界、文本内容、资产哈希和感知差异阈值，不追求生成式图像像素完全一致。
- 变更完成时记录运行过的命令、结果和未验证项；不要声称未执行的测试已通过。

## 决策管理

- 已确认的产品/架构决策记录在 `docs/TECH_DECISIONS.md`。
- 新的重大决策应追加 ADR，说明背景、选择、替代方案、影响、状态和日期。
- 如果实现与文档冲突，先停止扩散冲突：说明差异并更新已批准的来源，不要让代码和文档各自演进。
