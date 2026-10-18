---
name: brand-visual-designer
description: >
  创建、编辑和验证符合品牌规范的视觉设计，包括社交媒体封面、宣传海报、营销图片、参考图改版和精确排版。用户要求使用品牌资料、Logo、人物或商品素材，或要求准确中文、多个设计方案、局部修改和质量检查时使用。
---

# Brand Visual Designer

## 目标

通过统一的 `brand-visual` CLI 创建可追溯、可修订的品牌视觉作品。Skill 负责工作流；CLI 和 Core 负责执行。不要直接调用图片 Provider，也不要依赖某一 Agent 的专有工具作为必要步骤。

## 前置检查

1. 运行 `brand-visual doctor --json`。
2. 运行 `brand-visual capabilities --json`。
3. 如果 CLI 缺失、版本不兼容或所需能力不可用，明确报告并停止；不要声称已经生成。
4. 不要请求用户在聊天中粘贴 API 密钥。密钥应由执行环境安全提供。

## 工作流

1. 理解目标画布、用途、数量、文案、品牌、素材和修改范围。
2. 确认必须精确保留的 Logo、人物、商品、文案和品牌事实。
3. 检查资产存在、授权状态和品牌档案；缺少必需信息时只询问会改变结果的关键问题。
4. 把生成式背景与确定性文字/Logo/受保护资产分开规划。
5. 创建版本化 DesignSpec，并在调用前校验。
6. 使用 CLI 执行 generate/render/revise；每个设计方案独立输出。微调文字或样式时，优先使用 `revise` 避免重新生图。
7. 运行 validate，读取 manifest 和 quality report。
8. 只有在产物实际存在且质量状态明确时，才把文件和复核项返回给用户。

## 强制规则

- 不让生成模型重绘要求精确保留的 Logo。
- 准确中文必须用确定性文本图层渲染。
- 受保护素材只允许 DesignSpec 明示的变换。
- 不发明品牌事实、资质、价格、承诺、联系方式或授权状态。
- 不把美学评分当作事实，也不让它覆盖尺寸、文案或资产来源失败。
- 精确局部修订优先改 DesignSpec 并重渲染；非必要不重新生成底图。
- 不把多个方案只拼成一张图；保留各自 PNG、spec 和质量报告。
- 不在命令、日志、文档或产物中写出密钥。
- 具体模型 ID、API 参数和 Agent 安装路径必须来自当前能力探测/配置，不能从此 Skill 猜测。

## CLI 契约

使用 [CLI 契约](references/cli-reference.md) 中的命令和结果判断规则。

### 真实生成底图策略（宿主 Agent 优先）

- 如果当前宿主 Agent（Codex、WorkBuddy 等）支持在其对话或内置环境中直接生成图片，Agent 应当先利用其自身的生成能力产出纯净背景图暂存（如 `temp-bg.png`）。
- 然后将该底图传入 CLI 执行确定性图层合成与品牌验收：
  ```bash
  brand-visual generate --spec <spec-path> --base-image <temp-bg-path> --json
  ```
- 这样能直接使用当前宿主选中的模型，无需在 CLI 中配置额外的第三方生图 API 密钥。
- 若未使用 `--base-image`，CLI 将回退使用内部 Provider。在 Mock 模式下遇到 `provider.mock: true` 产物仅用于协议与安装验证。

## 返回结果

向用户说明：

- 生成了哪些独立方案和文件。
- 总质量状态是 `passed`、`failed` 还是 `needs_review`。
- 需要人工确认的授权、肖像、资质或审美问题。
- 哪些能力因当前 Provider/Agent 限制未执行。
