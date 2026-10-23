# Brand Visual Agent / 品牌视觉智能体

A brand-guideline-driven visual design Skill for Codex, Claude Code, Cursor, Gemini CLI, OpenCode, and WorkBuddy.

[中文说明](README.md)

## Why not rely on direct AI image generation for brand visuals?

When a brand brief is sent directly to an image generation model, common problems include:

- Chinese headlines, brand names, and numbers may contain wrong or missing characters
- Logos, people, and product assets may be redrawn and lose fidelity or violate usage requirements
- Colors, typography, spacing, and composition can vary between generations, weakening brand consistency
- Changing one headline may require regenerating the entire image and changing parts that were already approved
- It is difficult to trace which assets were used, what transformations occurred, and which checks were completed
- The model may invent unverified prices, credentials, claims, contact details, or other brand facts

## What does Brand Visual Agent add?

The Skill separates generative visual atmosphere from deterministic brand composition:

- Render accurate Chinese copy, numbers, and brand names with deterministic text layers
- Protect logos, people, and product assets from arbitrary regeneration
- Record the canvas, layers, copy, assets, and allowed transformations in a DesignSpec
- Produce manifests, hashes, and quality reports for traceability and review
- Update a headline or layout layer without unnecessarily changing other approved content
- Report CLI, Schema, or quality-check failures explicitly instead of masking them with placeholder outputs

It is not a prompt that promises perfect model-generated images. It is a workflow that makes brand visuals more accurate, consistent, editable, and reviewable.

> M1 currently validates the Skill, CLI, Schema, installer, and Mock Provider. Real image Provider capabilities depend on the actual release and capability probe.

## What you get

- Organize visual design tasks around brand colors, logos, and protected assets
- Render accurate Chinese copy with deterministic text layers instead of relying on a generative model
- Protect logos, people, and product assets from unintended regeneration
- Produce separate images, DesignSpecs, manifests, and quality reports for each variant
- Run the same workflow through one CLI across different Agent hosts
- Return explicit failures when a capability is unavailable, a path escapes its allowed workspace, or a quality check fails

### Video and motion visuals

The workflow can extend brand guidelines to short-form video and motion visuals for WeChat Channels, Douyin, Xiaohongshu, and other vertical formats. It can organize exact Chinese copy, brand colors, logo fidelity, caption timing, and motion effects into a finished video.

A verified example is an 18-second, 1080×1920 vertical video encoded with H.264/AAC, using typewriter text animation synchronized with audio. This example demonstrates an existing video output workflow; it does not mean the repository currently provides a standalone video-generation Provider or distributes that local video asset.

## How to build your own brand guidelines

This Skill does not fine-tune a model with your brand. It turns brand rules into a structured brand profile that the Agent can read, apply, and validate for every design task. You can create a profile in three ways.

### Method 1: provide a website or landing page

Best for brands that already have an online presence. Provide the URL together with the original logo asset:

```text
Create a brand visual profile for me.

Website: https://example.com
Here is the original logo. Keep it exact.
Analyze the brand positioning, primary and secondary colors, typography direction,
spacing, and visual style. Return a draft for my approval before saving it.
```

### Method 2: upload previous designs and the logo

Best for an established brand. Provide 3–10 approved posters, social covers, or campaign images, together with a transparent PNG or SVG logo.

```text
Build a brand visual profile from the uploaded designs and logo.

Analyze:
1. Primary and secondary colors;
2. Heading, body, and numeric type hierarchy;
3. Common canvas ratios;
4. Logo position, size, and clear space;
5. Headline and subtitle layout;
6. Which elements must remain fixed and which can vary by topic.

Return a draft first and save it only after I approve it.
```

### Method 3: create a profile through a short Q&A

Best for a new brand without a website or previous designs. Prepare at least the brand name, business, target audience, desired feeling, preferred colors, styles to avoid, and main use cases.

```text
Create a brand visual profile.

Brand: Qinghe Maternity Care
Business: In-home maternity-nanny and postpartum care
Audience: New parents in major Chinese cities
Desired feeling: Warm, professional, reassuring
Preferred colors: Pale mint, teal green, and a small amount of warm orange
Avoid: Overly clinical visuals, neon colors, and complex decoration
Main use cases: Xiaohongshu covers, WeChat article headers, and social posters
Logo: I will upload a transparent PNG
```

### What the profile records

A brand profile can record:

- Primary, secondary, surface, card, and text colors
- Heading, body, and fallback fonts
- Logos, people, products, and other assets with SHA-256 hashes
- Logo clear space, aspect-ratio, and recoloring rules
- Exact-copy, verified-fact, and marketing-claim constraints
- Asset rights status and manual review items

Use a transparent PNG or SVG for the logo whenever possible. Logos are normally marked `protection: exact`: proportional scaling and translation are allowed, while generative redraw, distortion, and unauthorized recoloring are not.

See [`brands/qinghe/brand.yaml`](brands/qinghe/brand.yaml) for an example profile and [`docs/DESIGN_SPEC.md`](docs/DESIGN_SPEC.md) for the DesignSpec structure.

### Use an approved brand profile

After the profile is approved, request a design directly:

```text
Use my brand profile to create a 3:4 Xiaohongshu cover.

Topic: postpartum care services
Headline: 3 details new mothers often overlook during confinement
Subtitle: A care guide for first-time mothers
Requirements:
- Use the brand primary and secondary colors;
- Keep the original logo;
- Render the Chinese copy exactly;
- Produce two separate variants;
- Tell me which items require human review.
```

For a targeted revision:

```text
Increase the main headline by 20%. Keep the logo, colors, and all other layers unchanged.
```

The Skill uses DesignSpec and stable layer IDs to record the revision scope. M1 currently validates the profile protocol, Schema, Mock CLI, and quality reports; website extraction, real Providers, and complete rendering depend on the actual release.

## Preview

These images are demonstration outputs from the repository. They show the output structure and deterministic layout behavior; they use demonstration brands or Mock flows and do not mean that the current release has a real image Provider connected.

| Example                                | Preview                                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Wanshun We The People elder-care cover | <img src="docs/assets/gallery/wswm-jinglaoyue-xhs-cover.png" width="240" alt="Wanshun We The People elder-care cover"> |
| Qinghe maternity-nanny pitfalls guide  | <img src="docs/assets/gallery/qinghe-xhs-pitfalls-cover.png" width="240" alt="Qinghe maternity-nanny pitfalls guide">  |

## Install in 30 seconds

### Recommended: use the `skills` CLI

From your project directory:

```bash
# Project-level installation
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --yes
```

To make the Skill available across projects, add `--global`:

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --global \
  --yes
```

To target Codex:

```bash
npx -y skills add vmee/brand-visual-agent \
  --skill brand-visual-designer \
  --agent codex \
  --yes
```

WorkBuddy users can upload `skills/brand-visual-designer.zip` through WorkBuddy's Skill marketplace, or install from source manually:

```bash
git clone --depth 1 \
  https://github.com/vmee/brand-visual-agent.git \
  /tmp/brand-visual-agent

mkdir -p ~/.workbuddy/skills

cp -R \
  /tmp/brand-visual-agent/skills/brand-visual-designer \
  ~/.workbuddy/skills/brand-visual-designer
```

Restart WorkBuddy after installation. For a project-level installation, use `.workbuddy/skills/brand-visual-designer` in the current project instead.

The current `skills` CLI does not list `workbuddy` as a valid Agent identifier, so do not use `--agent workbuddy`.

The `skills` CLI installs to the current project by default. `--global` (or `-g`) installs for the user. Restart the Agent after installation.

> This command installs `skills/brand-visual-designer/`, including `SKILL.md`, `references/`, and the embedded CLI. It does not install this repository's development dependencies. Run `pnpm install` only if you need to modify the source or run the local test suite.

### Alternative: install from source

Use the repository installer when you need to test the install lifecycle or when the `skills` CLI is unavailable:

```bash
git clone https://github.com/vmee/brand-visual-agent.git
cd brand-visual-agent

# Install for Codex
./scripts/quick-install.sh codex

# Or install for WorkBuddy
./scripts/quick-install.sh workbuddy
```

### Manual installation

Copy the entire directory to the target Agent's Skill directory. Do not copy only `SKILL.md`:

```text
skills/brand-visual-designer/
```

Common locations:

| Agent       | Project scope                             | User scope                                        |
| ----------- | ----------------------------------------- | ------------------------------------------------- |
| Codex       | `.codex/skills/brand-visual-designer`     | `~/.codex/skills/brand-visual-designer`           |
| Claude Code | `.claude/skills/brand-visual-designer`    | `~/.claude/skills/brand-visual-designer`          |
| Cursor      | `.cursor/skills/brand-visual-designer`    | `~/.cursor/skills/brand-visual-designer`          |
| Gemini CLI  | `.gemini/skills/brand-visual-designer`    | `~/.gemini/skills/brand-visual-designer`          |
| OpenCode    | `.opencode/skills/brand-visual-designer`  | `~/.config/opencode/skills/brand-visual-designer` |
| WorkBuddy   | `.workbuddy/skills/brand-visual-designer` | `~/.workbuddy/skills/brand-visual-designer`       |

Paths and compatibility status can change with Agent releases. See [cross-Agent compatibility](docs/CROSS_AGENT_COMPATIBILITY.md) before installing manually.

## Your first prompt

After restarting the Agent, try any of these prompts:

```text
Create a 3:4 Xiaohongshu cover for a spring coffee product launch using the default demo brand.
```

```text
Here is my logo and brand material. First create a brand profile, then make a WeChat article header. Use the original logo asset and do not let the generative model redraw it.
```

```text
Increase the first version's main headline by 20%. Keep the subtitle and logo unchanged, and tell me which layers changed.
```

The Agent should:

1. Confirm the canvas size, purpose, and exact copy.
2. Check the brand profile, logo, and other protected assets.
3. Create and validate a versioned DesignSpec.
4. Call the `brand-visual` CLI.
5. Run quality checks and read the manifest, quality report, and summary.
6. Return the artifact status and any authorization, brand, or aesthetic issues that require human review.

See the [quick start guide](docs/QUICK_START.md) for the non-technical walkthrough.

## Example onboarding experience

After installation and restarting the Agent, users may see an onboarding message like this:

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

## Local development and verification

To run the CLI, modify the source, or run tests:

```bash
pnpm install
pnpm build
pnpm exec brand-visual doctor --json
pnpm exec brand-visual capabilities --json
pnpm exec brand-visual generate --spec tests/fixtures/m1/design-spec.json --json
pnpm exec brand-visual validate --task outputs/m1-mock-task --json
pnpm test
```

Check Skill installation status:

```bash
pnpm exec brand-visual skill status \
  --agent codex \
  --scope project \
  --json
```

Standard output is machine-readable JSON. Diagnostics go to standard error, and failures use a non-zero exit code. See the [CLI contract](skills/brand-visual-designer/references/cli-reference.md) for the full command reference.

## Output structure

A task directory typically contains:

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

| File           | Purpose                                        |
| -------------- | ---------------------------------------------- |
| PNG            | Visual or demonstration output                 |
| DesignSpec     | Editable structured design description         |
| manifest       | Asset sources, hashes, and task records        |
| quality report | Dimension, text, logo, and other check results |
| summary        | Result summary for the Agent and user          |

## Current capability boundaries

### Verified in M1

- Single-source `SKILL.md` and Agent Skills format validation
- Unified TypeScript CLI
- JSON Schema and generated types
- Mock Provider
- Skill installation, update, status, and safe uninstall
- Failure exit codes, path-boundary checks, artifact hashes, and secret scanning
- Complete Skill discovery, reference loading, and Mock CLI fixture flow on Codex

### Not yet promised

- Available models, endpoints, or pricing for a real image Provider
- Actual OpenAI Images API account capabilities
- End-to-end execution on every target Agent
- Actual Windows, Linux, or WSL compatibility
- Production-grade visual delivery for real commercial projects

The Mock Provider returns `provider.mock: true` and `needs_review`. Do not present Mock outputs as real image-generation results or commercial deliverables.

## Documentation

- [Quick start](docs/QUICK_START.md)
- [Installation and Agent compatibility](docs/CROSS_AGENT_COMPATIBILITY.md)
- [CLI reference](skills/brand-visual-designer/references/cli-reference.md)
- [DesignSpec format](docs/DESIGN_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Acceptance tests and evidence](docs/ACCEPTANCE_TESTS.md)
- [Roadmap](docs/ROADMAP.md)
- [Project context](docs/PROJECT_CONTEXT.md)
- [Technical decisions](docs/TECH_DECISIONS.md)
- [中文说明](README.md)

## Repository structure

```text
brand-visual-agent/
├── skills/brand-visual-designer/     # The only maintained Skill source
├── packages/                         # CLI, Core, Installer, Provider, Schema
├── brands/                           # Brand profiles and demo assets
├── config/                           # Provider configuration examples
├── examples/                         # DesignSpec and task examples
├── outputs/                          # Demonstration outputs
├── tests/                            # Automated tests and fixtures
└── docs/                             # Product, architecture, compatibility, and acceptance docs
```

## Contributing

Before opening an Issue or Pull Request, read [AGENTS.md](AGENTS.md) and run the checks relevant to your change. Do not commit API keys, real customer assets, or unauthorized logos.
