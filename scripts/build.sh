#!/usr/bin/env bash
set -euo pipefail
project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"
rm -rf "$dist_root"
npm --prefix "$project_root" run build:client
node "$project_root/scripts/embed-assets.mjs" "$dist_root/client" "$project_root/worker/assets.js"
mkdir -p "$dist_root/server" "$dist_root/.openai"
"$project_root/node_modules/.bin/esbuild" "$project_root/worker/index.js" --bundle --format=esm --platform=browser --target=es2022 --outfile="$dist_root/server/index.js"
cp "$project_root/.openai/hosting.json" "$dist_root/.openai/hosting.json"
echo "Built bundled React assets and Worker at $dist_root"
