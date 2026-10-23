# 30 秒上手指南

这份指南面向第一次使用 Brand Visual Agent 的用户。它说明如何安装 Skill、如何发出第一条 Prompt，以及当前版本能验证什么。

## 先了解当前版本

当前仓库处于 M1：

- Skill、CLI、Schema 和安装器可以安装和验证。
- Mock Provider 可以验证任务协议、输出目录和质量报告。
- 真实图片 Provider 和完整确定性 Renderer 仍在后续里程碑中。
- Mock 产物带有 `provider.mock: true` 和 `needs_review`，不能作为生产级视觉交付物。

### 视频与动态视觉

支持将品牌视觉规范延展为短视频与动态视觉内容，适用于视频号、抖音、小红书等竖屏场景。可以围绕准确中文、品牌色、Logo 保真、字幕节奏和动态效果组织成片。

当前已验证一条 18 秒、1080×1920 的 H.264/AAC 竖屏视频示例，包含打字机文字动效与音画同步。该示例用于证明视频产出流程，不代表仓库已经提供独立的视频生成 Provider 或将该本地成片作为公开资源。

## 1. 前置条件

如果只想让 Agent 发现并使用这个 Skill，需要：

- 已安装 Codex 或 WorkBuddy 等目标 Agent
- Node.js 22.12 或更高版本
- pnpm 10

如果要运行本地 CLI、构建项目或执行测试，还需要在仓库目录执行 `pnpm install`。

## 2. 安装 Skill

### 推荐方式：使用 `skills` CLI

公开仓库用户不需要先克隆项目，直接在自己的项目目录中执行：

```bash
# 项目级安装：当前项目可以发现这个 Skill
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --yes
```

如果希望所有项目都可以使用：

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --global \
  --yes
```

如果需要指定 Codex：

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --agent codex \
  --yes
```

WorkBuddy 用户可以通过 WorkBuddy 的技能市场上传仓库中的 `skills/brand-visual-designer.zip`，也可以从源码手动安装：

```bash
git clone --depth 1 \
  https://github.com/vmee/brand-visual-agent.git \
  /tmp/brand-visual-agent

mkdir -p ~/.workbuddy/skills

cp -R \
  /tmp/brand-visual-agent/skills/brand-visual-designer \
  ~/.workbuddy/skills/brand-visual-designer
```

安装后重新打开 WorkBuddy。项目级安装时，将目标目录改为当前项目下的 `.workbuddy/skills/brand-visual-designer`。

当前 `skills` CLI 的有效 Agent 列表不包含 `workbuddy`，因此不要使用 `--agent workbuddy`。

`skills` CLI 的默认作用域是当前项目，`--global`（或 `-g`）才是用户级安装。安装完成后，重新打开目标 Agent。

该命令只安装 Skill 源目录，不会安装本仓库的开发依赖。内置的 `bin/cli.cjs` 已随 Skill 一起分发；只有要修改源码、运行测试或接入开发环境时，才需要克隆仓库并执行 `pnpm install`。

### 备用方式：使用仓库安装脚本

如果需要验证本仓库自己的安装器，或当前环境没有 `skills` CLI：

```bash
git clone https://github.com/vmee/brand-visual-agent.git
cd brand-visual-agent
./scripts/quick-install.sh codex
```

### 手动安装

```text
Codex:    ~/.codex/skills/brand-visual-designer
WorkBuddy: ~/.workbuddy/skills/brand-visual-designer
```

不要只复制 `SKILL.md`，因为 Skill 还可能引用 `references/` 和内置 CLI。

其他 Agent 的安装路径和当前验证状态见[跨 Agent 兼容说明](CROSS_AGENT_COMPATIBILITY.md)。

## 3. 验证安装

安装完成后，重新打开目标 Agent，发送：

```text
你现在可以使用哪些品牌视觉设计能力？
```

Agent 应该能够识别 `brand-visual-designer`，并说明它可以处理品牌档案、准确中文排版、Logo 保真、DesignSpec 和质量检查。

如果你在仓库内进行本地验证，可以运行：

```bash
pnpm install
pnpm build
pnpm exec brand-visual skill status \
  --agent codex \
  --scope project \
  --json
```

## 4. 安装后的首次交互示例

安装并重新打开 Agent 后，用户可能会看到这样的引导：

> 👋 你好！我是你的品牌视觉设计师，环境已就绪（CLI 正常，当前还没有加载任何品牌档案）。
>
> 无论是社媒封面、宣传海报还是品牌规范，我都能一站式为你制作。
>
> 请问你想制作什么类型？（回复数字即可）：
>
> 📕 小红书爆款封面（3:4 比例，吸睛大字，适合种草/干货）
> 📢 公众号头图 / 微信卡片（2.35:1 比例，大气排版）
> 🛍️ 电商促销 / 朋友圈海报（1:1 或 9:16 比例）
> 🏢 新建品牌规范（1 分钟对话，快速生成品牌色与 Logo 配置）
>
> 💡 新手提示：如果你还没准备品牌资产，直接告诉我「用示例品牌做一张小红书封面」，我们用 3 个小问题（品牌名、主营业务、想要的色调）快速建档，立即出图体验效果！

## 5. 打造自己的品牌规范

这个 Skill 不是把品牌永久训练进模型，而是把规则保存为可重复读取的结构化品牌档案。你可以选择以下方式之一：

### 官网建档

```text
这是我的官网：https://example.com
这是我的 Logo 原图。请分析品牌定位、主色、辅助色、字体倾向、留白和视觉风格，先输出品牌规范草案，确认后再保存。
```

### 历史作品建档

上传 3–10 张满意的海报或社媒封面，以及透明底 PNG 或 SVG Logo，然后说：

```text
请根据这些历史作品和 Logo 建立品牌视觉规范，分析颜色、字体层级、画布比例、Logo 安全距离、排版方式，以及哪些元素必须保持不变。请先输出草案，等我确认后再保存。
```

### 问答建档

如果还没有官网或历史作品，至少告诉 Agent：品牌名称、主营业务、目标用户、希望传达的感觉、偏好颜色、避免的风格和主要使用场景。

```text
帮我建立品牌视觉规范。
品牌名称：青禾母婴
主营业务：月嫂到家和产后护理
目标用户：新手父母
希望传达的感觉：温和、专业、安心
偏好颜色：浅薄荷绿、青绿色、少量暖橙色
主要场景：小红书封面、公众号头图、朋友圈海报
Logo：我会上传透明底 PNG
```

品牌档案会记录颜色、字体、Logo 和其他资产哈希、Logo 保真规则、准确文案约束、品牌事实和授权复核项。Logo 默认使用 `protection: exact`，允许按比例缩放和平移，不允许生成式重绘、拉伸变形或未经允许的改色。

品牌档案确认后，可以这样使用：

```text
使用我的品牌档案，制作一张小红书 3:4 封面。
主题：产后护理服务介绍
主标题：月子期间最容易忽略的 3 个细节
副标题：新手妈妈护理指南
要求：保留原始 Logo，中文逐字准确，输出两个独立方案，并列出需要人工审核的内容。
```

品牌档案示例见 [`brands/qinghe/brand.yaml`](../brands/qinghe/brand.yaml)。

## 6. 发送第一条 Prompt

直接复制下面任意一条：

### 新手体验

```text
用默认演示品牌做一张小红书 3:4 封面，主题是“春季咖啡新品上线”。请保留准确中文，并输出一个可供我选择的方案。
```

### 使用自己的品牌

```text
这是我的 Logo 和品牌资料。请先建立品牌规范，再制作一张公众号文章头图。Logo 必须使用原始素材，不要让生成模型重绘。
```

### 修改已有方案

```text
把第一版主标题放大 20%，副标题和 Logo 不变，并告诉我哪些图层发生了变化。
```

## 7. Agent 会做什么

一次设计任务通常包含以下步骤：

1. 确认画布尺寸、用途和准确文案。
2. 检查品牌档案、Logo 和其他受保护素材。
3. 创建并校验 DesignSpec。
4. 调用 `brand-visual` CLI。
5. 执行尺寸、文本、资产和品牌检查。
6. 返回图片、任务状态、质量报告和需要人工确认的问题。

## 8. 查看示例效果

仓库提供了公开演示图片，可以先查看输出效果：

- [万顺为民敬老服务封面](../docs/assets/gallery/wswm-jinglaoyue-xhs-cover.png)
- [青禾月嫂避坑指南](../docs/assets/gallery/qinghe-xhs-pitfalls-cover.png)

这些图片的用途是演示。发布前请根据当前版本的 Provider 状态判断是否可以用于真实视觉交付，不要把 Mock 产物描述成真实 AI 生图结果。

## 9. 输出文件

任务通常会写入：

```text
outputs/<task-id>/
├── variants/
│   └── <variant>.png
├── raw-backgrounds/
├── design-spec.json
├── manifest.json
├── quality-report.json
└── summary.json
```

- `PNG`：视觉产物或演示产物
- `DesignSpec`：可修改的结构化设计描述
- `manifest`：资产来源、哈希和任务记录
- `quality-report`：自动检查和人工检查状态
- `summary`：给 Agent 和用户阅读的结果摘要

## 10. 常见问题

### 没有 Logo 可以使用吗？

可以先使用规范文字排版，但如果需要保留真实品牌识别，建议提供透明底 PNG 或 SVG Logo。没有原始 Logo 时，不应声称输出包含官方 Logo。

### 为什么结果是 `needs_review`？

这表示任务可能完成了协议或自动检查，但仍需要人工确认品牌合规、素材授权、审美或真实 Provider 状态。`needs_review` 不是“全部质量检查通过”。

### 为什么没有真实图片？

M1 默认使用 Mock Provider，主要用于验证 Skill、CLI 和输出协议。真实图片 Provider 属于后续里程碑，缺失能力时 Skill 必须明确报告失败或限制，不会用占位图伪装成功。
