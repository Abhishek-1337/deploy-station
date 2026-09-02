#!/bin/sh

echo "Cloning $GITHUB_URL..."
git clone "$GITHUB_URL" app
cd app

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Exporting build files..."

if [ -d "dist" ]; then
  cp -r dist/* /workspace/output/
elif [ -d "build" ]; then
  cp -r build/* /workspace/output/
else
  echo "Build failed: Neither 'dist' nor 'build' directory was found."
  exit 1
fi

echo "Build complete."