# Brand Visual Designer

让 Codex、Claude Code、Cursor、Gemini CLI、OpenCode 和 WorkBuddy 等 Agent，按照统一的品牌规范创建、编辑和验证视觉设计。

> 当前版本状态：`M1 complete`。Skill、CLI、Schema、安装器和 Mock Provider 已完成；真实图片 Provider 与完整确定性 Renderer 仍在后续里程碑中。仓库中的 Mock 产物用于验证协议和输出结构，不应当作生产级视觉交付物。

## 你可以得到什么

- 使用品牌颜色、Logo 和资产规范组织视觉设计任务
- 用确定性文本图层渲染准确中文，避免生成模型改写文案
- 对 Logo、人物和商品素材设置保真保护
- 为每个方案输出独立的图片、DesignSpec、manifest 和质量报告
- 通过统一 CLI 在不同 Agent 中执行相同的工作流
- 在能力不可用、文件越界或质量检查失败时显式返回失败

## 效果预览

以下图片是仓库中的演示产物，用于展示输出结构和确定性排版效果。它们使用演示品牌或 Mock 流程，不能代表当前版本已经接入真实图片 Provider。

| 示例             | 预览                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| 清爽社交媒体封面 | ![清爽社交媒体封面](outputs/example-social-cover-001/variants/clean-modern.png) |
| 暖色编辑版       | ![暖色编辑版](outputs/example-social-cover-001/variants/warm-editorial.png)     |
| 青禾 SOP 封面    | ![青禾 SOP 封面](outputs/qinghe-sop-cover-001/variants/sop-cover.png)           |

示例任务的输入可以参考：

- [`examples/qinghe-sop-cover.json`](examples/qinghe-sop-cover.json)
- [`examples/design-spec.example.json`](examples/design-spec.example.json)
- [`outputs/example-social-cover-001/`](outputs/example-social-cover-001/)

## 30 秒安装

### 推荐方式：使用 `skills` CLI

这是公开仓库用户最简单的安装方式。在你的项目目录中执行：

```bash
# 安装到当前项目，Agent 只在这个项目中发现 Skill
npx -y skills add vmee/brand-visual-agent --skill brand-visual-designer --yes
```

如果希望在所有项目中使用，增加 `-g`：

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --global \
  --yes
```

也可以显式指定目标 Agent：

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --agent codex \
  --yes
```

`skills` CLI 默认安装到当前项目；`--global`（或 `-g`）才是用户级安装。安装完成后，重新打开 Agent。

> 这个命令安装的是 `skills/brand-visual-designer/`，其中包含 `SKILL.md`、`references/` 和内置 CLI。它不会安装本仓库的开发依赖；只有要运行本地测试或修改源码时，才需要执行 `pnpm install`。

### 备用方式：从源码安装

如果你需要使用仓库中的安装器、验证安装生命周期，或者当前环境没有 `skills` CLI，可以执行：

```bash
git clone https://github.com/vmee/brand-visual-agent.git
cd brand-visual-agent

# 安装到 Codex 用户级 Skill 目录
./scripts/quick-install.sh codex

# 或安装到 WorkBuddy 用户级 Skill 目录
./scripts/quick-install.sh workbuddy
```

安装脚本会在需要时构建 CLI，并把唯一源目录 `skills/brand-visual-designer/` 安装到目标 Agent。

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

Agent 的路径和兼容状态可能随版本变化。安装前请查看[跨 Agent 兼容说明](docs/CROSS_AGENT_COMPATIBILITY.md)。

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

Agent 应当按照以下流程工作：

1. 确认画布尺寸、用途和准确文案。
2. 检查品牌档案、Logo 和其他受保护素材。
3. 创建并校验版本化 DesignSpec。
4. 调用 `brand-visual` CLI。
5. 执行质量检查并读取 manifest、quality report 和 summary。
6. 返回产物状态以及需要人工确认的授权、品牌或审美问题。

更多面向非技术用户的说明见[快速开始](docs/QUICK_START.md)。

## 本地开发与验证

如果你要运行 CLI、修改代码或执行测试：

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
- JSON Schema 和类型生成
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
