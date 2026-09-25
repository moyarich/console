#!/usr/bin/env bash
set -euo pipefail
project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_directory"
# Export OVSX_PAT before running. This script publishes to Open VSX only.
exec npm run publish:openvsx
