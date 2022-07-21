#!/bin/sh

checkDependencies() {
  mainShellPID="$$"
  printf "jq\nwget\n" | while IFS= read -r program; do
    if ! [ -x "$(command -v "$program")" ]; then
      echo "Error: $program is not installed." >&2
      kill -9 "$mainShellPID"
    fi
  done
}

checkDependencies

SUMMARY="coverage/coverage-summary.json"
coveragePct=$(jq '.total.statements.pct' "$SUMMARY")
coverageInt=$(printf "%.0f\n" "$coveragePct")
colour="red"

echo "Coverage: $coveragePct"

[ "$coverageInt" -gt 80 ] && colour="yellow"
[ "$coverageInt" -gt 90 ] && colour="brightgreen"

wget -O coverage/badge.svg "https://img.shields.io/badge/Coverage-$coveragePct%25-${colour}.svg?style=flat-square"