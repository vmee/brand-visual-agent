# M1 完成验收记录

- 日期：2026-10-18
- 状态：`complete-with-declared-blockers`
- 范围：单源 Skill、Schema、Mock CLI/Core/Provider、安装器、五平台证据、CI 门禁

## 本轮实现

- 新增独立 `@brand-visual/installer`，集中维护五个平台 adapter。
- 新增 `skill status/install/update/uninstall` 和 `--dry-run`。
- 安装清单记录源聚合哈希和逐文件哈希；更新/卸载拒绝用户修改、额外文件及非拥有目录。
- CLI 新增 `version --json` 和传统 `--version`。
- 新增 GitHub Actions CI、生成类型漂移检查、格式/类型/测试、密钥扫描、依赖审计和官方 Skill 校验。
- 更新 Skill reference、兼容文档、README 和 ADR-012。

## 本地执行命令与结果

| 命令                                                                      | 结果                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `pnpm install --frozen-lockfile=false`                                    | 通过；6 个 workspace project                          |
| `pnpm schema:types`                                                       | 通过；生成文件无协议漂移                              |
| `pnpm format:check`                                                       | 通过                                                  |
| `pnpm typecheck`                                                          | 通过                                                  |
| `pnpm test`                                                               | 通过；3 个测试文件、18 个测试                         |
| `pnpm secrets:scan`                                                       | 通过；未发现高置信凭据模式                            |
| `uvx --from skills-ref agentskills validate skills/brand-visual-designer` | 通过；`Valid skill`                                   |
| `pnpm audit --registry=https://registry.npmjs.org --audit-level high`     | 通过；无已知漏洞                                      |
| 五平台 `skill install/update/uninstall`                                   | 通过；最终源哈希一致，安全卸载                        |
| Codex 实际 Skill + fixture                                                | 通过；读取 reference，Mock generate/validate 协议一致 |

GitHub Actions workflow 已创建，但当前本地环境不能把“workflow 在 GitHub runner 上执行”记录为通过；首次推送后的远程 CI 状态仍需观察。

## M1 验收映射

| ID    | 状态                     | 证据                                                  |
| ----- | ------------------------ | ----------------------------------------------------- |
| M1-01 | 通过                     | `skills-ref` 校验 + 单源目录                          |
| M1-02 | 通过                     | 五个 adapter 的项目级复制安装与一致源哈希             |
| M1-03 | Codex 通过；其余 blocked | `compatibility/2026-10-18-matrix.md`                  |
| M1-04 | Codex 通过；其余 blocked | 同上；blocked 平台未伪装执行                          |
| M1-05 | 通过                     | installer 单元测试：重复安装 `changed=false`          |
| M1-06 | 通过                     | installer 单元测试：非拥有目录返回 `INSTALL_CONFLICT` |
| M1-07 | 通过                     | 缺失/受阻能力显式失败；CLI 不返回伪成功               |
| M1-08 | 通过                     | CLI 无效 JSON/schema 非零退出，无成品                 |
| M1-09 | 不适用/未启用            | M1 默认复制；除 Claude 文档外缺少逐平台链接证据       |
| M1-10 | 通过                     | 修改副本拒绝卸载；五平台完整副本实际卸载通过          |

## 未验证项

- Claude Code 需登录后复跑；Cursor 需安装客户端；Gemini CLI 需配置真实认证；OpenCode 需修复 Provider 配置。
- Windows/WSL/Linux 的实际路径、权限和链接行为。
- CLI 对外 npm 包名/分发方式（O-03）。
- GitHub-hosted runner 首次 CI 运行。
- 全部 OpenAI Images API 模型、端点、参数、账号能力与费用；这些属于 M2，仍为 `unverified`。
