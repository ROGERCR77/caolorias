#!/bin/sh
set -euo pipefail

echo "▶️ [Caolorias] Iniciando Pre-Xcodebuild..."

# Descobre a raiz do repositório
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "📁 Repo root: \$REPO_ROOT"

# Vai para a pasta iOS do Capacitor
cd "\$REPO_ROOT/ios/App"
echo "📂 Diretório atual: \$(pwd)"

# Rodar Pods
if [ -f "Podfile" ]; then
  echo "📦 Rodando 'pod install'..."
  pod install
else
  echo "⚠️ Nenhum Podfile encontrado em \$(pwd)."
fi

echo "✅ [Caolorias] Pre-Xcodebuild finalizado com sucesso."
