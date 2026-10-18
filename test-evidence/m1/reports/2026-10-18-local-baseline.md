# M1 本地基线测试记录

- 日期：2026-10-18
- 环境：macOS，Node.js 24.2.0，pnpm 10.12.1
- 范围：Schema、Mock CLI、Core、Mock Provider、Skill 静态验证

## 已运行命令与结果

| 命令                                                                      | 结果                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm install`                                                            | 通过；5 个 workspace project，锁文件已生成                   |
| `pnpm schema:types`                                                       | 通过；从 4 个 JSON Schema 生成 TypeScript 类型               |
| `pnpm format:check`                                                       | 通过；Prettier 无差异                                        |
| `pnpm typecheck`                                                          | 通过；TypeScript project references 无错误                   |
| `pnpm test`                                                               | 通过；2 个测试文件、9 个测试                                 |
| `pnpm exec brand-visual doctor --json`                                    | 通过；单行 JSON，状态 `passed`                               |
| `pnpm exec brand-visual capabilities --json`                              | 通过；明确报告 `provider.id=mock`、`mock=true`、`edit=false` |
| `uvx --from skills-ref agentskills validate skills/brand-visual-designer` | 通过；`Valid skill`                                          |
| `pnpm audit --registry=https://registry.npmjs.org --audit-level high`     | 通过；无已知漏洞                                             |

## 已覆盖行为

- 仓库示例和 M1 fixture 通过 DesignSpec JSON Schema 2020-12 校验。
- CLI stdout 只返回单个 JSON 结果；失败使用非零退出码。
- Mock generate 输出两个独立 variant、各自 spec、manifest、quality report 和 run summary。
- Mock 产物明确标记为非真实交付，质量状态为 `needs_review`。
- 无效 JSON 不创建最终输出目录。
- 工作目录外的输出路径被拒绝。
- 修改产物后，`validate` 能以 `QUALITY_FAILED` 检出哈希不一致。
- 生成过程使用任务私有临时目录，完成后原子移动；测试覆盖正常路径，错误清理仍需后续注入测试扩展。

## 未验证/未完成

- 五个目标 Agent 的真实安装、发现、引用加载和 CLI 调用。
- Skill 安装、更新、状态和安全卸载命令。
- Windows/WSL、Linux 与符号链接行为。
- GitHub Actions CI、密钥扫描和发布包验证。
- CLI 对外 npm 包名和分发方式（O-03）。
- OpenAI 图片模型、API 参数和账号能力；这些属于 M2，当前仍为 `unverified`。

## 已知环境说明

第一次执行 `pnpm audit` 使用本机配置的 `registry.npmmirror.com`，因镜像未实现 audit endpoint 而失败；随后显式指定 npm 官方 registry 重跑并通过。没有把第一次基础设施失败记录为产品测试通过。
