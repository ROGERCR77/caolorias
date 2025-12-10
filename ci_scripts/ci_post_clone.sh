#!/bin/sh
set -e

echo ">>> [CI] Post-clone script running..."

cd "$CI_WORKSPACE"

echo ">>> [CI] Current workspace: $(pwd)"

cd ios/App

echo ">>> [CI] Inside iOS folder: $(pwd)"
echo ">>> [CI] Running pod install..."

pod install --repo-update

echo ">>> [CI] pod install finished."
