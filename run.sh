#!/bin/bash

checkDependencies() {
  mainShellPID="$$"
  printf "fzf\n" | while IFS= read -r program; do
    if ! [ -x "$(command -v "$program")" ]; then
      echo "Error: $program is not installed." >&2
      if [ "$program" = "fzf" ]; then
        echo "To install fzf follow the instructions from here:"
        echo "  - https://github.com/junegunn/fzf#using-git"
      fi
      kill -9 "$mainShellPID"
    fi
  done
}
checkDependencies

declare -A COMMANDS=(
  ["Start dev container"]="./compose.sh up server"
  ["Stop & delete dev container"]="./compose.sh down"
  ["Rebuild dev container"]="./compose.sh build --no-cache"
  ["Open shell in dev container"]="./compose.sh run --rm server bash"
  ["Build production image"]="docker build -t ivstiv/grap:latest -f .docker/prod.Dockerfile server"
  ["Push production image"]="docker push ivstiv/grap:latest"
  ["Build experimental image"]="docker build -t ivstiv/grap:experimental -f .docker/prod.Dockerfile server"
  ["Push experimental image"]="docker push ivstiv/grap:experimental"
)

choice=$(
  printf "%s\n" "${!COMMANDS[@]}" \
  | fzf \
    --color='hl:65,fg:252,header:65,fg+:252' \
    --border=bold \
    --height=12 \
    --reverse \
    --border-label=" Press Enter to execute " \
    --preview "\
      $(declare -p COMMANDS);
      echo Action:
      echo \"  - {}\";
      echo Command:
      echo \"  - \${COMMANDS[{}]}\"
    "
)

if [ -n "$choice" ];then
  echo "Executing: ${COMMANDS[$choice]}"
  eval "${COMMANDS[$choice]}"
fi