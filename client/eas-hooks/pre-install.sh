#!/bin/bash
# EAS Build: 设置 pnpm workspace
set -e

echo "[pre-install] Setting up pnpm workspace for monorepo..."

# 复制 workspace 配置到当前目录
cp ../pnpm-workspace.yaml . 2>/dev/null || true
cp ../pnpm-lock.yaml . 2>/dev/null || true

echo "[pre-install] Done"
