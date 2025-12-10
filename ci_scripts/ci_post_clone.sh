#!/bin/sh
set -e

# Ir para a raiz do repositório clonado pelo Xcode Cloud
cd "$CI_WORKSPACE"

# 1) Instalar dependências Node (onde fica @capacitor/ios)
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# 2) Ir para o projeto iOS e instalar os Pods
cd iOS/App
pod install
#!/bin/sh
set -e

# Ir para a raiz do repositório clonado pelo Xcode Cloud
cd "$CI_WORKSPACE"

# 1) Instalar dependências Node (onde fica @capacitor/ios)
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# 2) Ir para o projeto iOS e instalar os Pods
cd iOS/App
pod install
#!/bin/sh
set -e

# Ir para a raiz do repositório clonado pelo Xcode Cloud
cd "$CI_WORKSPACE"

# 1) Instalar dependências Node (Capacitor precisa disso para gerar os headers)
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# 2) Ir para o projeto iOS e instalar os Pods
cd iOS/App
pod install
