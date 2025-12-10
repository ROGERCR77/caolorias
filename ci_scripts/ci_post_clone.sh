#!/bin/sh
set -e

echo ">>> [CI] Post-clone script running..."

# Vai pra raiz do repositório do Xcode Cloud
cd "$CI_WORKSPACE"

echo ">>> [CI] Current workspace: $(pwd)"

# Entra na pasta do projeto iOS
cd ios/App

echo ">>> [CI] Inside iOS folder: $(pwd)"
echo ">>> [CI] Running pod install..."

pod install --repo-update

echo ">>> [CI] pod install finished."
