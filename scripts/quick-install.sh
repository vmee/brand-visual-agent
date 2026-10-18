#!/usr/bin/env bash
set -e

# ==============================================================================
# Brand Visual Designer - 一键安装脚本
# 适用目标：Codex, Tencent WorkBuddy 等
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_AGENT="${1:-workbuddy}"

echo "🚀 [Brand Visual] 正在为你安装视觉设计 Skill..."
echo "📂 源目录: ${PROJECT_ROOT}"
echo "🤖 目标 Agent: ${TARGET_AGENT}"

# 1. 确保构建完成
if [ ! -f "${PROJECT_ROOT}/packages/cli/dist/index.js" ]; then
  echo "📦 检测到未编译，正在执行自动构建..."
  (cd "${PROJECT_ROOT}" && pnpm run build)
fi

# 2. 查询当前安装状态
STATUS_JSON=$(node "${PROJECT_ROOT}/packages/cli/dist/index.js" skill status --agent "${TARGET_AGENT}" --scope user --json 2>/dev/null || true)

if echo "${STATUS_JSON}" | grep -q '"update_available"'; then
  echo "🔄 检测到现有版本，正在更新..."
  node "${PROJECT_ROOT}/packages/cli/dist/index.js" skill update --agent "${TARGET_AGENT}" --scope user --json > /dev/null
elif echo "${STATUS_JSON}" | grep -q '"not_installed"'; then
  echo "📥 正在全新安装..."
  node "${PROJECT_ROOT}/packages/cli/dist/index.js" skill install --agent "${TARGET_AGENT}" --scope user --json > /dev/null
else
  echo "✅ 已处于最新状态，无需重复安装。"
fi

echo ""
echo "🎉 安装成功！"
echo "👉 如何在 ${TARGET_AGENT} 中使用："
echo "   1. 打开 ${TARGET_AGENT} 聊天框"
echo "   2. 输入任意一句话，例如：「我想做一张小红书封面」"
echo "   3. 助手会自动列出选项并引导你完成设计！"
