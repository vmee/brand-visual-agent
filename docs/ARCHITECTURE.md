# 系统架构

## 1. 架构原则

- Agent 与执行引擎解耦。
- Skill 与实现解耦。
- Core 与图片 Provider 解耦。
- 创意生成与确定性排版解耦。
- 配置与能力探测优先于硬编码。
- 失败显式、产物可追溯、修订尽量局部。

## 2. 分层结构

```text
Codex / Claude Code / Cursor / Gemini CLI / OpenCode
                         │
                         ▼
          single-source Agent Skill (SKILL.md)
                         │ JSON/CLI
                         ▼
              brand-visual TypeScript CLI
                         │
                         ▼
┌──────────────────── Visual Design Core ────────────────────┐
│ Task Orchestrator │ Brand Manager │ Planner │ Quality Gate │
└───────────┬──────────────────┬───────────────────┬─────────┘
            │                  │                   │
            ▼                  ▼                   ▼
   Image Provider Port   Layout Renderer Port   Storage Port
            │                  │                   │
     OpenAI Adapter     Sharp + Playwright    Local filesystem
            │
     Mock Provider (tests)
```

未来的 MCP Server 和 REST API 只调用 Core 的公共用例，不复制 CLI 业务逻辑。

## 3. 模块职责

| 模块            | 负责                                       | 不负责                                       |
| --------------- | ------------------------------------------ | -------------------------------------------- |
| Skill           | 触发条件、工作流、CLI 契约、结果核查       | API 请求、图像处理、硬编码安装路径           |
| CLI             | 参数解析、配置加载、调用用例、机器可读输出 | 业务规则散落、Agent 专有分支                 |
| Installer       | Agent adapter、Skill 复制、所有权/哈希清单 | 视觉任务执行、Core 业务规则、Skill 分叉      |
| Core            | 任务状态机、用例编排、策略和端口           | 直接依赖 OpenAI SDK、Playwright 或具体 Agent |
| Schemas         | DesignSpec、manifest、报告和错误协议       | 业务执行                                     |
| Brand Manager   | 品牌配置验证、资产解析、哈希和规则         | 创意生成                                     |
| Provider Port   | 统一生成/编辑能力契约                      | 假设所有 Provider 能力相同                   |
| OpenAI Adapter  | API 映射、能力快照、错误规范化             | 排版和品牌规则                               |
| Renderer        | 确定性图层布局、合成和导出                 | 远程图片生成                                 |
| Quality Checker | 确定性检查与人工复核标记                   | 声称自动解决法律/审美判断                    |
| Export Manager  | 原子写入、manifest、文件哈希               | 修改源资产                                   |

## 4. 建议 Monorepo

```text
skills/brand-visual-designer/
packages/cli/
packages/installer/
packages/core/
packages/providers/
packages/renderer/
packages/schemas/
apps/mcp-server/          # V1 后
apps/rest-api/            # V1 后
brands/
config/
examples/
tests/{unit,integration,e2e,compatibility}/
docs/
```

包依赖方向应为：视觉任务走 `cli -> core -> schemas/ports`，Skill 生命周期走 `cli -> installer`，`providers/renderer -> core ports`。Installer 与 Core 互不依赖；Core 不反向依赖 CLI 或任何适配器。可使用依赖注入在组合根绑定实现。

## 5. 主流程

### 5.1 Generate

1. Agent 根据用户要求和品牌材料建立 DesignSpec 草稿。
2. CLI 用 JSON Schema 校验输入，解析路径并建立 task ID。
3. Brand Manager 校验品牌配置、资产存在性与哈希。
4. Planner 将任务分成“需生成内容”和“确定性图层”。
5. Provider Adapter 先通过 capability snapshot 验证请求，再生成/编辑底图。
6. Renderer 测量中文布局，将 Logo、文字和受保护资产合成到最终画布。
7. Quality Checker 运行机器规则并生成 `passed/failed/needs_review`。
8. Export Manager 以临时目录生成全部产物，成功后原子移动到最终目录。
9. CLI 输出一个符合 schema 的结果对象；失败时返回非零状态。

### 5.2 Revise

1. 读取原 DesignSpec、manifest 和 revision patch。
2. 验证 patch 只修改允许字段，计算受影响图层。
3. 如果只改文字或布局，复用底图和未变资产。
4. 若修改需要调用 Provider，先返回影响与成本预估（实现策略待定）。
5. 生成新 revision，保留父版本 ID，不覆盖原始产物。

## 6. Provider 端口

概念接口：

```ts
interface ImageProvider {
  probe(): Promise<ProviderCapabilities>;
  generate(request: GenerateImageRequest): Promise<GeneratedImage>;
  edit(request: EditImageRequest): Promise<GeneratedImage>;
}
```

`ProviderCapabilities` 至少记录经实际探测或官方核查的：模型 ID、生成/编辑、输入图数量、遮罩、透明背景、输出格式、尺寸/质量选项、已核查时间和来源。Core 根据能力拒绝不受支持的请求，适配器不得静默降级。

## 7. 渲染策略

- Playwright 页面负责字体加载、换行与布局测量，等待字体和图片资源完全就绪后截图透明图层或画布。
- Sharp 统一解码资产、处理 EXIF 方向、缩放、裁切、颜色空间并合成。
- 字体必须明确来源与授权；缺字体时默认失败，不静默换成可能破坏版式的字体。
- SVG Logo 可原样光栅化或合成；禁止生成模型重绘。
- 颜色管理、像素密度和透明通道策略在 M3 用 golden fixtures 固化。

## 8. 状态、幂等与并发

建议任务状态：`created -> validated -> generating -> rendering -> checking -> completed|failed|needs_review`。

- 用户提供 task ID 时，重复请求不能覆盖已完成任务。
- 同一输出目录使用锁或唯一运行 ID，防止并发写入。
- 临时文件位于任务私有临时目录；失败后按数据保留策略清理。
- Provider 重试只针对可重试错误，遵循服务返回的等待信息，并设置次数/成本上限。

## 9. 错误协议

```json
{
  "ok": false,
  "error": {
    "code": "ASSET_MISSING",
    "message": "必需 Logo 资产不存在",
    "retryable": false,
    "details": { "assetId": "logo-primary" }
  }
}
```

错误类别至少包括：`CONFIG_INVALID`、`SCHEMA_INVALID`、`ASSET_MISSING`、`CAPABILITY_UNSUPPORTED`、`AUTH_FAILED`、`RATE_LIMITED`、`PROVIDER_ERROR`、`RENDER_FAILED`、`QUALITY_FAILED`、`IO_ERROR`。错误详情不得泄露密钥或完整敏感请求。

## 10. 安全与信任边界

- 用户提示、参考图元数据、远程响应和 Skill 安装目标均为不可信输入。
- 配置中路径只能落在批准根目录内；解析符号链接后再次检查边界。
- 远程 URL 下载设协议、主机、大小、类型和超时限制，并防止访问本机/内网地址。
- HTML 模板不执行用户脚本；文本必须转义；浏览器禁用不必要的外联。
- 日志默认不保存 base64 图片和完整提示中的敏感信息。

## 11. 扩展边界

MCP/REST 通过 Application Service 调用同样的用例和 schema。认证、队列、对象存储、多租户与计费属于部署层，不进入 Core。添加第二个 Provider 时必须通过 Provider contract tests，以验证架构确实解耦。
