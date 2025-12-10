#!/bin/sh
set -euo pipefail

echo "▶️ [Caolorias] Iniciando Post-Xcodebuild..."

echo "📌 Scheme: ${CI_XCODE_SCHEME:-desconhecido}"
echo "📌 Configuração: ${CI_XCODE_CONFIGURATION:-desconhecida}"
echo "📌 Caminho do Archive: ${CI_ARCHIVE_PATH:-não informado}"

# Se quiser inspecionar os produtos gerados:
if [ -n "${CI_ARCHIVE_PATH:-}" ] && [ -d "$CI_ARCHIVE_PATH/Products" ]; then
  echo "📂 Listando arquivos em \$CI_ARCHIVE_PATH/Products:"
  ls -R "$CI_ARCHIVE_PATH/Products"
else
  echo "⚠️ Nenhum diretório Products encontrado em \$CI_ARCHIVE_PATH."
fi

echo "✅ [Caolorias] Post-Xcodebuild finalizado."
