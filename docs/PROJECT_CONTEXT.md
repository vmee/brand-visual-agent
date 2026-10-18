# 项目上下文

## 1. 项目定义

- 产品名：Brand Visual Agent
- Skill 名：`brand-visual-designer`
- CLI 计划名：`brand-visual`
- 阶段：M1 进行中；Mock CLI 最小纵向链路已实现，跨 Agent 安装与发现测试尚未完成
- 目标用户：需要反复产出品牌宣传图的企业团队、设计运营人员，以及代表用户执行设计任务的 AI Agent

本项目不是“只在 Codex 中运行的图片脚本”，而是一套跨 Agent 可复用的视觉设计能力。Agent 负责理解请求、建立结构化设计计划并调用工具；确定性的 TypeScript 程序负责生成、合成、验证和导出。

## 2. 问题背景

纯文本提示词直接生图难以稳定满足企业场景：

- 中文容易错字、变形或缺字。
- Logo、认证标识和品牌色不能被随意重绘。
- 人物、商品和原始素材可能要求精确保留。
- 一次生成后的局部修改容易导致整张图漂移。
- 不同 Agent 的 Skill 目录、权限和执行方式不同。
- 图片 API 的模型、参数和支持能力会变化。

因此需要把“创意生成”和“确定性排版”分开，并用稳定协议连接 Agent 与执行引擎。

## 3. 已确认的最终方向

1. 基于开放 Agent Skills 规范，维护单一 `SKILL.md` 源码。
2. 首批目标 Agent：Codex、Claude Code、Cursor、Gemini CLI、OpenCode。
3. 所有 Agent 通过同一个 TypeScript CLI 执行，核心逻辑与 Agent 解耦。
4. Core 与图片模型解耦，Provider Adapter 负责远程 API。
5. V1 的首个 Provider 为 OpenAI Images API。
6. Sharp 负责图像读写、缩放和合成；HTML/CSS + Playwright 负责复杂中文排版和可复现渲染。
7. Logo、准确中文、合规文案和受保护素材采用程序化合成。
8. 品牌规范使用 YAML + 本地资产表达；任务与结果使用 JSON/JSON Schema。
9. 输出至少包含最终 PNG、DesignSpec、manifest 和质量报告。
10. M1–M4 顺序执行；MCP Server 和 REST API 延后。

## 4. 明确未确认或需实时核查的内容

下列内容不能从历史讨论直接继承为事实：

- 任何具体图片模型 ID，包括旧对话里出现过的候选名称。
- 各 Agent 当前版本的精确安装目录、用户级/项目级作用域和符号链接行为。
- OpenAI Images API 当前支持的尺寸、透明背景、遮罩、编辑输入数量、输出格式和限额。
- Node.js、SDK、Sharp、Playwright 的具体版本号。
- npm 包名、许可证、发布方式、预算、SLA、数据保留策略。

这些事项在 M1/M2 对照官方文档和目标账号做能力探测后决定。

## 5. 产品边界

V1 是“本地可运行的跨 Agent Skill + CLI”，不是在线 SaaS，也不是完整设计软件。它不会取代人工品牌审核，不承诺生成内容天然合规，也不自动获得素材版权或肖像授权。

## 6. 关键术语

- Skill：Agent 可发现的工作流说明和参考资源。
- CLI：稳定的本地命令接口，面向 Agent 和开发者。
- Core：编排品牌加载、规划、Provider、渲染、质检和导出的业务核心。
- Provider：图片生成/编辑服务的适配层。
- DesignSpec：与 Agent 和具体模型无关的结构化设计描述。
- Protected asset：必须保持原始内容、仅允许受控变换的 Logo、人物、商品或标识。
- Evidence：可复现的测试记录、日志、产物哈希与核查来源。

## 7. 文档优先级

发生冲突时，采用以下顺序：用户当次明确要求 > 已批准 ADR > `TECH_DECISIONS.md` > `PRD.md` / `ARCHITECTURE.md` > 示例配置。示例仅用于解释协议，不构成生产默认值。
