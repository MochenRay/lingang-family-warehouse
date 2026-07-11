#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BOOTSTRAP_BIN="${PYTHON_BOOTSTRAP_BIN:-python3}"
VENV_DIR="${VENV_DIR:-$ROOT_DIR/backend/.venv}"

cd "$ROOT_DIR"

if ! command -v "$PYTHON_BOOTSTRAP_BIN" >/dev/null 2>&1; then
  echo "未找到 Python：$PYTHON_BOOTSTRAP_BIN" >&2
  echo "请安装 Python 3.12/3.13，或通过 PYTHON_BOOTSTRAP_BIN 指定解释器。" >&2
  exit 1
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  "$PYTHON_BOOTSTRAP_BIN" -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/python" -m pip install --upgrade pip
"$VENV_DIR/bin/python" -m pip install -r backend/requirements-dev.txt
npm ci

echo "本地依赖已就绪："
echo "- Python: $VENV_DIR/bin/python"
echo "- Node: $ROOT_DIR/node_modules"
