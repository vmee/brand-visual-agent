# Brand Visual Agent / 品牌视觉智能体

一个由品牌规范驱动的视觉设计 Skill，支持 Codex、Claude Code、Cursor、Gemini CLI、OpenCode 和 WorkBuddy 等 Agent。

[English README](README.en.md)

## 为什么不能只靠 AI 直接生成品牌图片？

直接把品牌需求交给图像生成模型，通常会遇到这些问题：

- 中文标题、品牌名和数字容易出现错字、漏字或不可控变形
- Logo、人物和商品素材可能被模型重绘，导致失真或不符合授权要求
- 不同批次的颜色、字体、留白和构图不稳定，难以形成统一品牌识别
- 修改一个标题可能需要重新生成整张图，原有满意的部分也会发生变化
- 很难追溯图片使用了哪些资产、发生了哪些变换，以及哪些检查已经完成
- 模型可能生成未经确认的价格、资质、功效、联系方式或其他品牌事实

## Brand Visual Agent 能做什么？

这个 Skill 把“生成视觉氛围”和“品牌确定性排版”拆开处理：

- 用确定性文本图层渲染准确中文、数字和品牌名称
- 对 Logo、人物和商品设置保真保护，避免被生成模型随意重绘
- 用 DesignSpec 记录画布、图层、文案、资产和允许的变换
- 输出 manifest、哈希和质量报告，方便追溯和复核
- 修改标题或布局时，尽量只更新对应图层，不破坏其他已确认内容
- 在 CLI、Schema 或质量检查失败时明确报告，不用占位图伪装成功

它不是保证模型永远生成完美图片的提示词，而是一套让品牌图片更准确、更稳定、更容易修改和验收的工作流。

> 当前 M1 主要验证 Skill、CLI、Schema、安装器和 Mock Provider。真实图片 Provider 的能力仍以实际版本和能力探测结果为准。

## 你可以得到什么

- 使用品牌颜色、Logo 和受保护资产组织视觉设计任务
- 使用确定性文本图层渲染准确中文，不依赖生成模型改写文案
- 防止 Logo、人物和商品素材被意外重绘
- 为每个方案输出独立图片、DesignSpec、manifest 和质量报告
- 通过一个 CLI 在不同 Agent 中执行相同工作流
- 在能力不可用、路径越界或质量检查失败时显式返回失败

### 视频与动态视觉

支持将品牌视觉规范延展为短视频与动态视觉内容，适用于视频号、抖音、小红书等竖屏场景。可以围绕准确中文、品牌色、Logo 保真、字幕节奏和动态效果组织成片。

当前已验证一条 18 秒、1080×1920 的 H.264/AAC 竖屏视频示例，包含打字机文字动效与音画同步。该示例用于证明视频产出流程，不代表仓库已经提供独立的视频生成 Provider 或将该本地成片作为公开资源。

## 如何打造自己的品牌规范

这个 Skill 不会把品牌“训练”进模型，而是把品牌规则沉淀为 Agent 每次都能读取、执行和检查的结构化品牌档案。你可以用以下三种方式建档。

### 方式一：提供官网或落地页

适合已经有官网的品牌。请同时提供官网地址和 Logo 原图：

```text
帮我建立品牌视觉规范。

这是我的官网：https://example.com
这是我的 Logo 原图，请使用原始文件并保持精确。
请分析品牌定位、主色、辅助色、字体倾向、留白和视觉风格，
输出一份品牌规范草案，确认后再保存为品牌档案。
```

### 方式二：上传历史设计作品和 Logo

这是最适合已有品牌的方式。建议提供 3–10 张满意的海报、社交媒体封面或宣传图，以及透明底 PNG 或 SVG Logo。

```text
请根据我上传的历史海报和 Logo，建立品牌视觉规范。

请分析：
1. 主色和辅助色；
2. 标题、正文和数字的字体层级；
3. 常用画布比例；
4. Logo 的位置、尺寸和安全距离；
5. 标题和副标题的排版方式；
6. 哪些元素必须保持不变，哪些元素可以随主题变化。

请先输出规范草案，等我确认后再保存。
```

### 方式三：通过问答快速建档

适合刚成立、还没有官网或历史作品的品牌。至少准备以下信息：品牌名称、主营业务、目标用户、希望传达的感觉、偏好颜色、避免的风格和主要使用场景。

```text
帮我建立品牌视觉规范。

品牌名称：青禾母婴
主营业务：月嫂到家和产后护理
目标用户：一二线城市的新手父母
希望传达的感觉：温和、专业、安心
偏好颜色：浅薄荷绿、青绿色、少量暖橙色
避免风格：过度医疗化、强烈霓虹色、复杂装饰
主要场景：小红书封面、公众号头图、朋友圈海报
Logo：我会上传透明底 PNG
```

### 建档后会得到什么

品牌档案会记录：

- 主色、辅助色、背景色、卡片色和文字色
- 标题、正文和备用字体
- Logo、人物、商品等资产及其 SHA-256 哈希
- Logo 最小留白、比例和是否允许改色
- 准确中文、品牌事实和营销承诺的约束
- 资产授权状态和人工复核项

Logo 建议使用透明底 PNG 或 SVG。默认会标记为 `protection: exact`：允许按比例缩放和平移，不允许生成式重绘、拉伸变形或未经允许的改色。

品牌档案示例见 [`brands/qinghe/brand.yaml`](brands/qinghe/brand.yaml)，DesignSpec 结构见 [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md)。

### 使用已确认的品牌档案

建档并确认后，可以直接提出设计任务：

```text
使用我的品牌档案，制作一张小红书 3:4 封面。

主题：产后护理服务介绍
主标题：月子期间最容易忽略的 3 个细节
副标题：新手妈妈护理指南
要求：
- 使用品牌主色和辅助色；
- 保留原始 Logo；
- 中文必须逐字准确；
- 输出两个独立方案；
- 告诉我哪些内容需要人工审核。
```

后续修改可以只针对指定内容：

```text
把主标题放大 20%，Logo、颜色和其他图层保持不变。
```

Skill 会通过 DesignSpec 和图层 ID记录修改范围。当前 M1 主要验证建档协议、Schema、Mock CLI 和质量报告；官网自动分析、真实 Provider 和完整渲染能力仍以实际版本为准。

## 效果预览

以下图片是仓库中的演示产物，用于展示输出结构和确定性排版效果。它们使用演示品牌或 Mock 流程，不代表当前版本已经接入真实图片 Provider。

| 示例                 | 预览                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| 万顺为民敬老服务封面 | <img src="docs/assets/gallery/wswm-jinglaoyue-xhs-cover.png" width="240" alt="万顺为民敬老服务封面"> |
| 青禾月嫂避坑指南     | <img src="docs/assets/gallery/qinghe-xhs-pitfalls-cover.png" width="240" alt="青禾月嫂避坑指南">     |

## 30 秒安装

### 推荐方式：使用 `skills` CLI

在你的项目目录中执行：

```bash
# 项目级安装
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --yes
```

如果希望所有项目都可以使用，增加 `--global`：

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

`skills` CLI 默认安装到当前项目；`--global` 或 `-g` 才是用户级安装。安装完成后，请重新打开 Agent。

> 这个命令安装的是 `skills/brand-visual-designer/`，其中包含 `SKILL.md`、`references/` 和内置 CLI。它不会安装本仓库的开发依赖；只有需要修改源码或运行本地测试时，才需要执行 `pnpm install`。

### 备用方式：从源码安装

如果需要验证仓库安装器，或当前环境没有 `skills` CLI：

```bash
git clone https://github.com/vmee/brand-visual-agent.git
cd brand-visual-agent

# 安装到 Codex
./scripts/quick-install.sh codex

# 或安装到 WorkBuddy
./scripts/quick-install.sh workbuddy
```

### 手动安装

将整个目录复制到目标 Agent 的 Skill 目录，不要只复制 `SKILL.md`：

```text
skills/brand-visual-designer/
```

常用目录如下：

| Agent       | 项目级目录                                | 用户级目录                                        |
| ----------- | ----------------------------------------- | ------------------------------------------------- |
| Codex       | `.codex/skills/brand-visual-designer`     | `~/.codex/skills/brand-visual-designer`           |
| Claude Code | `.claude/skills/brand-visual-designer`    | `~/.claude/skills/brand-visual-designer`          |
| Cursor      | `.cursor/skills/brand-visual-designer`    | `~/.cursor/skills/brand-visual-designer`          |
| Gemini CLI  | `.gemini/skills/brand-visual-designer`    | `~/.gemini/skills/brand-visual-designer`          |
| OpenCode    | `.opencode/skills/brand-visual-designer`  | `~/.config/opencode/skills/brand-visual-designer` |
| WorkBuddy   | `.workbuddy/skills/brand-visual-designer` | `~/.workbuddy/skills/brand-visual-designer`       |

Agent 路径和兼容状态可能随版本变化。手动安装前请查看[跨 Agent 兼容说明](docs/CROSS_AGENT_COMPATIBILITY.md)。

## 第一次使用

重新打开 Agent 后，直接发送下面任意一条 Prompt：

```text
用默认演示品牌做一张小红书 3:4 封面，主题是“春季咖啡新品上线”。
```

```text
这是我的 Logo 和品牌资料。请先建立品牌规范，再制作一张公众号文章头图。Logo 必须使用原始素材，不要让生成模型重绘。
```

```text
把第一版主标题放大 20%，副标题和 Logo 不变，并告诉我哪些图层发生了变化。
```

Agent 应当：

1. 确认画布尺寸、用途和准确文案。
2. 检查品牌档案、Logo 和其他受保护资产。
3. 创建并校验版本化 DesignSpec。
4. 调用 `brand-visual` CLI。
5. 执行质量检查并读取 manifest、quality report 和 summary。
6. 返回产物状态，以及需要人工复核的授权、品牌或审美问题。

更多面向非技术用户的说明见[快速开始](docs/QUICK_START.md)。

## 安装后的首次交互示例

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

## 本地开发与验证

如果要运行 CLI、修改源码或执行测试：

```bash
pnpm install
pnpm build
pnpm exec brand-visual doctor --json
pnpm exec brand-visual capabilities --json
pnpm exec brand-visual generate --spec tests/fixtures/m1/design-spec.json --json
pnpm exec brand-visual validate --task outputs/m1-mock-task --json
pnpm test
```

查看 Skill 安装状态：

```bash
pnpm exec brand-visual skill status \
  --agent codex \
  --scope project \
  --json
```

标准输出是机器可读 JSON；诊断信息写入标准错误；失败使用非零退出码。完整命令见 [CLI 契约](skills/brand-visual-designer/references/cli-reference.md)。

## 输出结构

一个任务目录通常包含：

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

| 文件           | 用途                        |
| -------------- | --------------------------- |
| PNG            | 视觉产物或演示产物          |
| DesignSpec     | 可修改的结构化设计描述      |
| manifest       | 资产来源、哈希和任务记录    |
| quality report | 尺寸、文本、Logo 等检查结果 |
| summary        | 面向 Agent 和用户的结果摘要 |

## 当前能力边界

### M1 已验证

- 单一源 `SKILL.md` 和 Agent Skills 格式校验
- 统一 TypeScript CLI
- JSON Schema 和生成类型
- Mock Provider
- Skill 安装、更新、状态检查和安全卸载
- 失败退出码、路径边界、产物哈希和密钥扫描
- Codex 的 Skill 发现、reference 读取和 Mock CLI fixture 全流程

### 当前尚未承诺

- 真实图片 Provider 的可用模型、端点和费用
- OpenAI Images API 的实际账号能力
- 所有目标 Agent 的端到端运行通过
- Windows、Linux 和 WSL 的实际兼容性
- 真实商业项目的生产级视觉交付

Mock Provider 返回 `provider.mock: true` 和 `needs_review`。不要把 Mock 产物当作真实生图结果或商业交付物。

## 文档导航

- [30 秒快速开始](docs/QUICK_START.md)
- [安装与 Agent 兼容性](docs/CROSS_AGENT_COMPATIBILITY.md)
- [CLI 命令参考](skills/brand-visual-designer/references/cli-reference.md)
- [DesignSpec 输入格式](docs/DESIGN_SPEC.md)
- [架构说明](docs/ARCHITECTURE.md)
- [验收测试与证据](docs/ACCEPTANCE_TESTS.md)
- [路线图](docs/ROADMAP.md)
- [项目背景](docs/PROJECT_CONTEXT.md)
- [技术决策](docs/TECH_DECISIONS.md)
- [English README](README.en.md)

## 仓库结构

```text
brand-visual-agent/
├── skills/brand-visual-designer/     # 唯一维护的 Skill 源文件
├── packages/                         # CLI、Core、Installer、Provider、Schema
├── brands/                           # 品牌档案和演示素材
├── config/                           # Provider 配置示例
├── examples/                         # DesignSpec 和任务示例
├── outputs/                          # 演示输出
├── tests/                            # 自动化测试和 fixtures
└── docs/                             # 产品、架构、兼容性和验收文档
```

## 贡献

提交 Issue 或 Pull Request 前，请先阅读仓库中的 [AGENTS.md](AGENTS.md)，并确保修改后运行与变更相关的格式检查、类型检查和测试。不要提交 API 密钥、真实客户素材或未授权的 Logo。
