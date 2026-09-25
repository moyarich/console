#!/usr/bin/env bash

set -euo pipefail

project_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
demo_runner="${project_directory}/demo/cli/run.mjs"
gif_creator="${project_directory}/demo/cli/create-gif.mjs"

record_demo() {
  npm --prefix "${project_directory}" run build
  node "${demo_runner}" --demo "$@"
}

create_demo_gifs() {
  npm --prefix "${project_directory}" run build
  node "${gif_creator}" "$@"
}

if [[ "$#" -gt 0 ]]; then
  cd "${project_directory}"
  record_demo "$@"
  exit
fi

is_command_present() {
  command -v "$1" >/dev/null 2>&1
}

install_fzf() {
  printf '\nChecking for fzf installation...\n'

  if is_command_present "fzf"; then
    printf 'fzf is already installed.\n'
    return
  fi

  printf 'Install fzf using your package manager, or use npm run demo:record -- --scenario=all.\n' >&2
  exit 1
}

list_scenarios() {
  printf '%s\n' "all"
  node "${demo_runner}" --list | sed -E 's/:.*$//'
}

install_fzf

selection="$({ list_scenarios; } | fzf \
  --multi \
  --height=80% \
  --layout=reverse \
  --border \
  --info=inline-right \
  --marker='✓ ' \
  --pointer='▶' \
  --prompt='Scenarios › ' \
  --bind='ctrl-a:select-all,ctrl-d:deselect-all' \
  --header='Tab: toggle  Ctrl+A: select all  Ctrl+D: clear  Enter: continue  Esc: cancel')" || exit 0

if [[ -z "${selection}" ]]; then
  printf 'No demo scenarios selected.\n'
  exit 0
fi

if printf '%s\n' "${selection}" | grep -qx 'all'; then
  scenario_argument="all"
else
  scenario_argument="$(printf '%s\n' "${selection}" | paste -sd, -)"
fi

action="$(printf '%s\n' \
  'Record new video, then create GIF' \
  'Record new video only' \
  'Create GIF from existing video (do not record)' |
  fzf \
    --height=40% \
    --layout=reverse \
    --border \
    --info=hidden \
    --pointer='▶' \
    --prompt='Action › ' \
    --header='↑/↓: choose  Enter: run  Esc: cancel')" || exit 0

if [[ -z "${action}" ]]; then
  printf 'No demo action selected.\n'
  exit 0
fi

cd "${project_directory}"

case "${action}" in
  'Record new video, then create GIF')
    printf '\nRecording new videos, then creating README GIFs: %s\n\n' \
      "${scenario_argument}"
    create_demo_gifs "--scenario=${scenario_argument}"
    ;;
  'Record new video only')
    printf '\nRecording new videos only: %s\n\n' "${scenario_argument}"
    record_demo "--scenario=${scenario_argument}"
    ;;
  'Create GIF from existing video (do not record)')
    printf '\nCreating README GIFs from existing videos without recording: %s\n\n' \
      "${scenario_argument}"
    create_demo_gifs "--scenario=${scenario_argument}" --no-record
    ;;
esac
