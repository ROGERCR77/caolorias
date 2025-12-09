#!/bin/sh
set -e

echo ">> [CI] Rodando pod install para o projeto iOS..."

cd ios/App
pod install

echo ">> [CI] pod install concluído."
