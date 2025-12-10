#!/bin/sh
set -euo pipefail

echo "▶️ [Caolorias] Iniciando Pre-Xcodebuild..."

# Raiz do repo
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "📁 Repo root: $REPO_ROOT"

cd "$REPO_ROOT"

echo "📦 Instalando dependências npm (se necessário)..."
if [ -f "package-lock.json" ]; then
  npm ci || npm install
else
  npm install
fi

echo "🔗 Rodando 'npx cap sync ios'..."
npx cap sync ios

echo "✅ [Caolorias] Pre-Xcodebuild finalizado (npm + cap sync ios)."
