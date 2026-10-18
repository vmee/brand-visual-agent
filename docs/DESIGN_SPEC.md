# DesignSpec 与产物协议

## 1. 目的

DesignSpec 是 Agent、CLI、Core、Provider 与 Renderer 之间的稳定边界。它表达“要设计什么”和“哪些内容必须保持精确”，不暴露任一 Agent 的私有调用格式，也不直接镜像某个图片 API 的参数。

示例文件用于说明语义，不是已发布 schema。M1 应把它转为正式 JSON Schema，并使用 `$schema`、`schemaVersion` 和兼容性测试管理演进。

## 2. 顶层结构

```json
{
  "schemaVersion": "1.0.0-draft",
  "task": {},
  "brand": {},
  "canvas": {},
  "creative": {},
  "assets": [],
  "layers": [],
  "variants": [],
  "quality": {},
  "output": {}
}
```

### 2.1 `task`

- `id`：调用方提供或由 CLI 生成的稳定任务 ID。
- `intent`：如 `social-cover`、`poster`、`marketing-graphic`。
- `locale`：文案与排版区域，例如 `zh-CN`。
- `requestedBy`：可选，不应保存敏感身份信息。
- `revisionOf`：修订时指向父 manifest/spec。

### 2.2 `brand`

- `profile`：品牌 YAML 的相对路径或稳定 ID。
- `requiredRules`：本任务额外要求遵守的规则 ID。
- `facts`：已验证的品牌事实引用；未经验证的宣传信息不得放入。

### 2.3 `canvas`

- `width`、`height`：正整数像素。
- `pixelRatio`：默认 1；是否开放由 M3 决定。
- `background`：颜色或透明。
- `colorSpace`：M3 决定正式枚举；未支持时不得静默转换。

### 2.4 `creative`

表达生成式阶段：主题、氛围、构图、负面约束、参考资产 ID，以及需要的生成/编辑能力。模型 ID与 Provider 私有参数不进入核心 DesignSpec；它们属于执行配置和 capability snapshot。

### 2.5 `assets`

每个资产包含：

- `id`：供图层引用的稳定标识。
- `role`：`logo`、`subject`、`product`、`reference`、`background` 等。
- `source`：仓库内相对路径或受控输入引用。
- `sha256`：实施时必填，用于来源追溯。
- `protection`：`exact`、`crop-only`、`reference-only` 或 `generative-edit-allowed`。
- `rightsReview`：`approved`、`required`、`unknown`。

### 2.6 `layers`

通用字段：

- `id`、`type`、`zIndex`、`visible`。
- `frame`：`x`、`y`、`width`、`height`，统一使用画布像素。
- `opacity`、`rotation`、`blendMode`（正式枚举由 M3 固化）。
- `constraints`：安全边距、锁定比例、保护规则。

建议图层类型：

- `image`：引用资产或 Provider 结果。
- `text`：准确文案、字体、字重、字号、行高、颜色、对齐、溢出策略。
- `shape`：色块、渐变、边框、圆角。
- `group`：只组织与共同变换，不复制子内容。

### 2.7 `variants`

每个方案拥有稳定 ID，可覆盖 creative 或允许的图层字段。各方案必须独立输出，不能把多个方案拼到同一张“对比图”作为唯一交付物。

### 2.8 `quality`

- 必须通过的规则 ID。
- 需要人工审核的规则 ID。
- 允许的容差，如布局测量或感知差异阈值。

### 2.9 `output`

- 输出目录相对路径。
- 文件命名模板。
- 格式与压缩要求。
- 是否保留中间底图；默认不把它当最终交付物。

## 3. 保护规则

| protection                | 允许                               | 禁止                             |
| ------------------------- | ---------------------------------- | -------------------------------- |
| `exact`                   | 平移、按比例缩放、在明确允许时裁切 | 生成式重绘、变形、改色、局部修改 |
| `crop-only`               | 平移、缩放、裁切                   | 生成式编辑、改变主体             |
| `reference-only`          | 仅用作风格/构图参考                | 直接出现在成品中，除非另有授权   |
| `generative-edit-allowed` | 在能力和授权允许时编辑             | 超出用户说明的编辑               |

Logo 默认 `exact`。准确中文必须来自 `text` 图层，不把生成图里的可见文字当作合格最终文案。

## 4. 修订协议

修订应使用受限的 RFC 6902 类 patch 或领域命令，正式选择在 M1 决定。必须满足：

- 只能命中存在的稳定图层 ID。
- 保护级别、资产哈希和品牌事实不可由普通修订降低或覆盖。
- 修改前后保存 spec 版本和父子关系。
- 生成调用是否需要重跑必须可预测并写入计划。

示意：

```json
{
  "schemaVersion": "1.0.0-draft",
  "revisionOf": "task-001/rev-1",
  "operations": [
    {
      "op": "scaleText",
      "layerId": "headline",
      "factor": 1.2
    }
  ],
  "preserveUnchangedLayers": true
}
```

## 5. Manifest

`manifest.json` 至少记录：

- schema、CLI、Core、Renderer 和 Skill 版本。
- task/revision/variant ID及时间戳。
- 输入 spec、品牌配置、资产和输出的 SHA-256。
- Provider 名、已验证模型 ID、能力快照 ID；不得记录密钥。
- 渲染环境摘要：OS、Node、浏览器、字体清单版本。
- 每阶段状态、耗时、重试与最终状态。
- 指向质量报告和运行摘要的相对路径。

## 6. 质量报告

```json
{
  "schemaVersion": "1.0.0-draft",
  "status": "needs_review",
  "checks": [
    {
      "id": "text.exact",
      "status": "passed",
      "evidence": { "layerId": "headline" }
    },
    {
      "id": "rights.portrait",
      "status": "needs_review",
      "message": "需要确认人物素材授权"
    }
  ]
}
```

总状态聚合规则：任一 P0 检查 `failed` 则总状态 `failed`；无失败但存在需人工审核项则 `needs_review`；其余为 `passed`。自动美学评分只能作为建议，不能覆盖确定性失败。

## 7. 版本兼容

- `schemaVersion` 使用语义化版本。
- Patch：新增可选字段；Minor：新增兼容能力；Major：破坏性语义变化。
- CLI 读取不支持的 Major 版本必须失败。
- M1 以后每次 schema 变更应提供 fixture、兼容性测试和必要迁移器。
