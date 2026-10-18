# M1–M4 开发路线图

## 执行原则

- 每个里程碑只有在出口条件有可复现证据时才完成。
- 先证明跨 Agent 契约，再接入付费图片生成。
- 每个里程碑开始前关闭其阻塞型待决定事项。
- 不能访问某目标平台时，状态写为 `blocked/unverified`，不得以推测代替通过。

## M1：跨 Agent Skill 与 CLI 契约

状态（2026-10-18）：`complete-with-declared-blockers`。Codex 完整通过；Claude Code、Cursor、Gemini CLI、OpenCode 的外部环境阻塞已记录，解除后须复跑。证据见 `test-evidence/m1/reports/2026-10-18-completion.md`。

### 目标

五个目标 Agent 使用同一 Skill 源，通过 Mock CLI 完成相同任务协议。

### 可执行任务

1. 核查当前 Agent Skills specification 的 frontmatter 和目录规则，保存来源与日期。
2. 逐一核查 Codex、Claude Code、Cursor、Gemini CLI、OpenCode 当前版本的 Skill 发现机制、路径、作用域、权限和链接行为。
3. 确定 Node.js、包管理器、Monorepo、测试框架和 JSON Schema 工具。
4. 建立 `schemas`、`core`、`cli`、`providers/mock` 包骨架。
5. 实现 `doctor`、`capabilities`、Mock `generate`、`validate` 的 JSON 契约和退出码。
6. 完成单源 Skill 的最小 references，并实现幂等安装/卸载/状态检查。
7. 创建五个平台的发现测试和同一 fixture 的 CLI 冒烟测试。
8. 建立 CI、格式检查、类型检查、单元测试、密钥扫描和产物 schema 校验。

### 交付物

- 可打包的单源 Skill。
- 可执行的 Mock CLI。
- 安装器与兼容矩阵证据。
- 版本化 DesignSpec/结果/错误 schema 的初版。

### 出口条件

- 每个标记为“支持”的目标 Agent 都能发现 Skill、读取引用、调用 CLI。
- 同一 fixture 在各平台返回相同 schema 版本、状态与目录结构。
- 安装重复执行不制造漂移；卸载不删除用户自有文件。
- 无 API Key 也能运行全部 M1 测试。
- 路径/版本不确定项已被证据关闭或明确阻塞。

## M2：OpenAI Provider 与生成/编辑

### 目标

在保持 Provider 解耦的前提下，完成真实图片生成和编辑。

### 可执行任务

1. 从当前官方文档和目标账号核查可用图片模型、API 入口、参数、限制、费用和数据政策。
2. 实现 `probe()` 和 capability snapshot；配置只引用经验证的模型 ID。
3. 实现 OpenAI Adapter 的生成、编辑、超时、取消、重试、限流和错误规范化。
4. 确保请求/响应日志脱敏，不写入密钥或不必要的 base64。
5. 实现输出下载/解码、MIME/尺寸/哈希校验与临时文件原子处理。
6. 建立 Mock 合同测试、录制型 fixture 策略（不得包含敏感素材）和 opt-in 真实 API 测试。
7. 记录每次真实测试的模型、参数、能力快照、用量和成本（若 API 提供）。

### 交付物

- OpenAI Provider Adapter。
- `capabilities` 输出和缓存策略。
- 生成/编辑示例与错误处理证据。

### 出口条件

- 至少一个当前可用模型通过生成测试；只有在能力支持时才要求编辑/遮罩/透明背景。
- 未支持能力返回 `CAPABILITY_UNSUPPORTED`，不静默改变请求。
- 缺密钥、错误密钥、网络失败、超时、限流和无效输入均有确定错误。
- Core 的单元测试无需联网；Provider contract tests 通过。

## M3：品牌管理、DesignSpec 与确定性排版

### 目标

生产准确中文、原始 Logo、受保护素材和可局部修订的企业品牌图。

### 可执行任务

1. 固化 BrandProfile 与 DesignSpec schema、迁移策略和示例。
2. 实现品牌 YAML 验证、资产 ID/哈希、相对路径解析和越界防护。
3. 实现字体加载/授权元数据、缺字体失败策略和 CJK 字符覆盖测试。
4. 建立 HTML/CSS 布局模板、Playwright 测量/截图流程和 Sharp 合成管线。
5. 实现 fit/fill/crop、透明、圆角、阴影、安全边距、z-index 和文本溢出检测。
6. 实现最终画布与 Provider 原生尺寸分离。
7. 实现 revision patch；验证“标题放大 20%，其他图层不变”。
8. 建立 golden fixtures 和跨 OS 容差；记录字体/浏览器版本。

### 交付物

- Brand Manager、Renderer、DesignSpec V1。
- 至少一套虚构品牌 fixture 和多尺寸样例。
- 确定性渲染与精确修订证据。

### 出口条件

- 中文文案与结构化输入逐字一致；无截断或溢出。
- Logo 来源哈希与品牌资产匹配，未被生成式重绘。
- 受保护资产仅发生允许变换。
- 同一环境重复渲染的确定性部分一致；跨环境差异在批准阈值内。
- 局部修订不重新调用 Provider，且未命中图层哈希不变。

## M4：质量门禁、端到端与 V1 发布

### 目标

把功能组合成可发布、可审计、可失败恢复的 V1。

### 可执行任务

1. 实现质量规则引擎与 `passed/failed/needs_review` 汇总。
2. 检查尺寸、格式、文案、Logo 哈希、品牌色、安全边距、溢出、缺失文件和 manifest 完整性。
3. 对肖像/版权/资质/广告承诺建立人工复核条目，不伪装自动裁决。
4. 运行五 Agent 端到端测试、安装升级/回滚测试和错误注入测试。
5. 运行性能、并发、临时文件清理、磁盘不足和中断恢复测试。
6. 生成 SBOM/许可证清单、发布说明、迁移指南和安全检查结果。
7. 进行人工视觉评审并处理阻塞问题。

### 交付物

- 完整质量报告和 manifest。
- 跨 Agent 兼容性报告。
- V1 发布候选包和可复现验收证据。

### 出口条件

- `docs/ACCEPTANCE_TESTS.md` 中所有 P0 自动用例通过。
- 五个平台的状态均有证据；所有限制在 README 中透明说明。
- 没有真实密钥、客户敏感素材或未授权字体进入发布包。
- 失败任务不会留下看似成功的最终产物。
- 发布清单经产品、工程和品牌审核负责人签字/确认。

## V1 后路线

1. MCP Server：把 Core 用例暴露为受控工具，服务不方便运行本地 CLI 的 Agent。
2. REST API：加入认证、队列、对象存储、回调和限流。
3. 更多 Provider：以合同测试接入，不改变 DesignSpec 的核心语义。
4. 批量模板、资产管理、审批流、团队权限和可视化编辑器。
