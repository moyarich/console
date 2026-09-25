#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
code_command="${CODE_COMMAND:-code}"
if ! command -v "$code_command" >/dev/null 2>&1; then
  echo "Install the VS Code 'code' shell command or set CODE_COMMAND." >&2
  exit 1
fi
# Keep the macOS IPC socket path short and demo edits out of source files.
demo_dir="$(mktemp -d /tmp/css-colors-dev.XXXXXX)"
trap 'rm -rf "$demo_dir"' EXIT
mkdir -p "$demo_dir/workspace" "$demo_dir/extensions" "$demo_dir/user/User"
cp "$project_dir/demo/dev/fixtures/colors.css" "$demo_dir/workspace/colors.css"
printf '%s\n' '{"editor.colorDecorators":true,"telemetry.telemetryLevel":"off"}' > "$demo_dir/user/User/settings.json"
"$code_command" --new-window --wait --disable-extension=vscode.css-language-features \
  --extensionDevelopmentPath="$project_dir/dist/vscode-extension" \
  --user-data-dir="$demo_dir/user" \
  --extensions-dir="$demo_dir/extensions" \
  "$demo_dir/workspace" "$demo_dir/workspace/colors.css"
